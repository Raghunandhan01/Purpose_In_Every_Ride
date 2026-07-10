import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { staticTranslations } from '../lib/translations';
import api from '../lib/api';
import toast from 'react-hot-toast';

export type LanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'ml';
export type ThemeMode = 'light' | 'dark' | 'system';

interface LanguageThemeContextType {
  language: LanguageCode;
  theme: ThemeMode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  t: (key: string, defaultText?: string) => string;
  translateDynamicText: (text: string) => Promise<string>;
  isTranslating: boolean;
}

const LanguageThemeContext = createContext<LanguageThemeContextType | undefined>(undefined);

// Persistent Client Cache of Gemini dynamic translations in localStorage
let initialCache: Record<string, string> = {};
try {
  const saved = localStorage.getItem('scooter_dynamic_translations_cache');
  if (saved) {
    initialCache = JSON.parse(saved);
  }
} catch (e) {
  console.error('Failed to parse translation cache:', e);
}

export function LanguageThemeProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  
  // Initialize state from logged in user profile, localStorage, or fallback
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (user?.language) return user.language as LanguageCode;
    const local = localStorage.getItem('scooter_language');
    if (local && ['en', 'ta', 'hi', 'te', 'ml'].includes(local)) return local as LanguageCode;
    return 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (user?.theme) return user.theme as ThemeMode;
    const local = localStorage.getItem('scooter_theme');
    if (local && ['light', 'dark', 'system'].includes(local)) return local as ThemeMode;
    return 'dark'; // Dark is original default for this dashboard app
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [dynamicCache, setDynamicCache] = useState<Record<string, string>>(initialCache);

  // Sync state with user profile if user loads later
  useEffect(() => {
    if (user) {
      if (user.language && user.language !== language) {
        setLanguageState(user.language as LanguageCode);
      }
      if (user.theme && user.theme !== theme) {
        setThemeState(user.theme as ThemeMode);
      }
    }
  }, [user]);

  // Apply the theme classes on document.documentElement
  const applyTheme = (mode: ThemeMode) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
  };

  // Sync theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('scooter_theme', theme);

    // Watch for system preference changes when system mode is selected
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Sync language changes in local storage
  useEffect(() => {
    localStorage.setItem('scooter_language', language);
  }, [language]);

  // Update Theme Preference (Database + local state)
  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (user) {
      try {
        await updateUser({ theme: newTheme });
      } catch (err) {
        console.error('Failed to save theme in profile:', err);
      }
    }
  };

  // Update Language Preference (Database + local state)
  const setLanguage = async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    if (user) {
      try {
        await updateUser({ language: newLang });
      } catch (err) {
        console.error('Failed to save language in profile:', err);
      }
    }
  };

  // Predefined translation translation function
  const t = (key: string, defaultText?: string): string => {
    const translationSet = staticTranslations[language] || staticTranslations['en'];
    const text = translationSet[key] || staticTranslations['en'][key];
    return text || defaultText || key;
  };

  // Intelligent dynamic content translation via Gemini with offline fallback and client-side caching
  const translateDynamicText = async (text: string): Promise<string> => {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return '';

    // If target language is English, return original directly (assuming original is English)
    if (language === 'en') return trimmed;

    const cacheKey = `${trimmed}:${language}`;
    if (dynamicCache[cacheKey]) {
      return dynamicCache[cacheKey];
    }

    setIsTranslating(true);
    try {
      // Trigger our server-side secure translation proxy
      const response = await api.post('/translate', {
        text: trimmed,
        targetLanguage: language
      });

      if (response.data && response.data.translatedText) {
        const translated = response.data.translatedText;
        
        // Update local state cache
        const updatedCache = { ...dynamicCache, [cacheKey]: translated };
        setDynamicCache(updatedCache);
        localStorage.setItem('scooter_dynamic_translations_cache', JSON.stringify(updatedCache));
        
        setIsTranslating(false);
        return translated;
      }
    } catch (err) {
      console.error('Dynamic Gemini translation request failed:', err);
    }

    setIsTranslating(false);
    return trimmed; // Graceful fallback
  };

  return (
    <LanguageThemeContext.Provider value={{
      language,
      theme,
      setLanguage,
      setTheme,
      t,
      translateDynamicText,
      isTranslating
    }}>
      {children}
    </LanguageThemeContext.Provider>
  );
}

export function useLanguageTheme() {
  const context = useContext(LanguageThemeContext);
  if (context === undefined) {
    throw new Error('useLanguageTheme must be used within a LanguageThemeProvider');
  }
  return context;
}
