import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Simple in-memory cache to store translations: "text:lang" -> translatedText
const translationCache = new Map<string, string>();

// Simple in-memory rate limiting map: ip -> requests in last window
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30; // Max requests per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitInfo = requestCounts.get(ip);

  if (!limitInfo || now > limitInfo.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  limitInfo.count++;
  if (limitInfo.count > MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  return false;
}

// Map language codes to clear language names
const languageNames: Record<string, string> = {
  en: 'English',
  ta: 'Tamil',
  hi: 'Hindi',
  te: 'Telugu',
  ml: 'Malayalam'
};

export const translateText = async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many translation requests. Please try again in a minute.'
    });
  }

  try {
    const { text, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text parameter is required.'
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Target language parameter is required.'
      });
    }

    // Resolve target language code to full name
    const langName = languageNames[targetLanguage.toLowerCase()] || targetLanguage;

    // Check if target language is English and input is already English
    if (targetLanguage.toLowerCase() === 'en') {
      // Return original text directly
      return res.status(200).json({
        success: true,
        translatedText: text
      });
    }

    // Check cache
    const cacheKey = `${text}:${targetLanguage.toLowerCase()}`;
    if (translationCache.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        translatedText: translationCache.get(cacheKey),
        cached: true
      });
    }

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing. Falling back to original text.');
      return res.status(200).json({
        success: true,
        translatedText: text,
        fallback: true,
        message: 'Gemini API Key missing'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Request translation from Gemini
    const prompt = `Translate the following text into ${langName}. 
    Preserve all numbers, proper names (like Swiggy, Zomato, Rapido, Uber, Zepto, Blinkit, BigBasket), currencies, and emojis exactly.
    Return ONLY the translated text. Do not wrap the translation in quotes or add any conversational prefaces or explanations.

    Text to translate:
    ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    let translated = response.text?.trim() || text;

    // Remove any accidental wrapping quotes that LLMs sometimes add
    if (translated.startsWith('"') && translated.endsWith('"')) {
      translated = translated.substring(1, translated.length - 1);
    }
    if (translated.startsWith("'") && translated.endsWith("'")) {
      translated = translated.substring(1, translated.length - 1);
    }

    // Cache the result
    translationCache.set(cacheKey, translated);

    res.status(200).json({
      success: true,
      translatedText: translated,
      cached: false
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    // Graceful fallback to original text if API fails (as required by prompt)
    res.status(200).json({
      success: true,
      translatedText: req.body.text || '',
      fallback: true,
      error: error.message || 'Gemini Translation failed'
    });
  }
};
