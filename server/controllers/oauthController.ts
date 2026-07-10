import { Request, Response } from 'express';
import axios from 'axios';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

// Helper to sanitize and obtain APP_URL
const getAppUrl = (req: Request): string => {
  if (process.env.APP_URL) {
    let url = process.env.APP_URL;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  const host = req.get('host') || '';
  const protocol = req.headers['x-forwarded-proto'] as string || req.protocol || 'http';
  
  // If the host is not localhost/127.0.0.1, always force https protocol for OAuth callbacks
  const finalProtocol = host.includes('localhost') || host.includes('127.0.0.1') ? protocol : 'https';
  
  return `${finalProtocol}://${host}`;
};

// Common login or create social user logic
const loginOrCreateSocialUser = async (
  provider: string,
  providerId: string,
  email: string,
  fullName: string,
  profileImage: string
) => {
  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  const updateData = {
    authProvider: provider,
    providerId: providerId,
    lastLoginAt: new Date(),
    profileImage: user?.profileImage || profileImage || '',
  };

  if (user) {
    // Prevent duplicate accounts by linking users with same verified email address
    user = await User.findByIdAndUpdate(user._id, { $set: updateData }, { new: true });
  } else {
    // Create new account on first login
    user = await User.create({
      fullName,
      email: normalizedEmail,
      authProvider: provider,
      providerId,
      profileImage: profileImage || '',
      lastLoginAt: new Date(),
      // Optional defaults for our scooter application
      vehicleType: '',
      preferredPlatform: '',
      connectedAccounts: '{}',
      theme: 'dark',
      language: 'en',
      goals: '[]',
      budgets: '[]'
    });
  }

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      vehicleType: user.vehicleType || '',
      preferredPlatform: user.preferredPlatform || '',
      profileImage: user.profileImage || '',
      theme: user.theme || 'dark',
      language: user.language || 'en',
      goals: user.goals || '[]',
      budgets: user.budgets || '[]',
      authProvider: user.authProvider,
      providerId: user.providerId,
      lastLoginAt: user.lastLoginAt,
    },
    token
  };
};

// GET Google Auth URL
export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const appUrl = getAppUrl(req);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (clientId) {
    const redirectUri = `${appUrl}/api/auth/callback/google`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent('openid profile email')}&prompt=select_account`;
    return res.json({ success: true, url: authUrl, mode: 'real' });
  }

  // Fallback to beautiful Sandbox Mode
  const sandboxUrl = `${appUrl}/api/auth/sandbox?provider=google`;
  return res.json({ success: true, url: sandboxUrl, mode: 'sandbox' });
};

// GET Facebook Auth URL
export const getFacebookAuthUrl = (req: Request, res: Response) => {
  const appUrl = getAppUrl(req);
  const appId = process.env.FACEBOOK_APP_ID;

  if (appId) {
    const redirectUri = `${appUrl}/api/auth/callback/facebook`;
    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=email,public_profile`;
    return res.json({ success: true, url: authUrl, mode: 'real' });
  }

  // Fallback to beautiful Sandbox Mode
  const sandboxUrl = `${appUrl}/api/auth/sandbox?provider=facebook`;
  return res.json({ success: true, url: sandboxUrl, mode: 'sandbox' });
};

// Real Google OAuth Callback
export const handleGoogleCallback = async (req: Request, res: Response) => {
  const appUrl = getAppUrl(req);
  const { code, error } = req.query;

  if (error) {
    return renderErrorHtml(res, `Google Auth Error: ${error}`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/callback/google`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;

    // Fetch user details from Google profile API
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { sub: providerId, email, name, picture } = userResponse.data;

    if (!email) {
      throw new Error('Google did not return an email address. A verified email is required.');
    }

    const { user, token } = await loginOrCreateSocialUser(
      'google',
      providerId,
      email,
      name || 'Google User',
      picture || ''
    );

    return renderSuccessHtml(res, token, user);
  } catch (err: any) {
    console.error('Google OAuth Exchange Failed:', err);
    return renderErrorHtml(res, err.response?.data?.error_description || err.message || 'Failed to authenticate with Google');
  }
};

// Real Facebook OAuth Callback
export const handleFacebookCallback = async (req: Request, res: Response) => {
  const appUrl = getAppUrl(req);
  const { code, error } = req.query;

  if (error) {
    return renderErrorHtml(res, `Facebook Auth Error: ${error}`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/callback/facebook`;
    const appId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

    // Exchange authorization code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
      params: {
        client_id: appId,
        redirect_uri: redirectUri,
        client_secret: clientSecret,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Fetch user details from Facebook Graph API
    const userResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture.type(large)',
        access_token
      }
    });

    const { id: providerId, email, name, picture } = userResponse.data;

    if (!email) {
      throw new Error('Facebook did not return an email address or email permission was declined.');
    }

    const profileImage = picture?.data?.url || '';

    const { user, token } = await loginOrCreateSocialUser(
      'facebook',
      providerId,
      email,
      name || 'Facebook User',
      profileImage
    );

    return renderSuccessHtml(res, token, user);
  } catch (err: any) {
    console.error('Facebook OAuth Exchange Failed:', err);
    return renderErrorHtml(res, err.response?.data?.error?.message || err.message || 'Failed to authenticate with Facebook');
  }
};

// Render Interactive Sandbox for Preview environments
export const renderSandbox = (req: Request, res: Response) => {
  const provider = (req.query.provider as string) || 'google';
  const appUrl = getAppUrl(req);

  const isGoogle = provider === 'google';
  const brandName = isGoogle ? 'Google' : 'Facebook';
  const brandColor = isGoogle ? '#4285F4' : '#1877F2';
  const brandIcon = isGoogle 
    ? `<svg class="w-6 h-6 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-5.29-4.53z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`
    : `<svg class="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24" style="color: #1877F2;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${brandName} OAuth Simulator - Scooter Application</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                brand: '${brandColor}',
                darkbg: '#0F172A',
                darkcard: '#1E293B',
              }
            }
          }
        }
      </script>
    </head>
    <body class="bg-darkbg text-slate-100 flex items-center justify-center min-h-screen p-4">
      <div class="bg-darkcard border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
        <!-- Brand Header -->
        <div class="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div class="flex items-center">
            ${brandIcon}
            <span class="text-xl font-bold font-sans">${brandName} Sign-In</span>
          </div>
          <span class="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-mono border border-blue-500/20">Sandbox Simulator</span>
        </div>

        <div class="space-y-4">
          <p class="text-xs text-slate-400 leading-relaxed">
            This simulator allows you to experience the fully functional social authentication integration within AI Studio without configuring production cloud API credentials.
          </p>

          <!-- Predefined test partner accounts -->
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wider text-slate-400">Choose a Simulated Gig Worker Account:</label>
            
            <div onclick="selectProfile('Raghu Varma', 'raghu.varma@scooterpartner.in', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 'google_10293847')" 
                 class="profile-card flex items-center p-3 rounded-xl border border-slate-700 hover:border-brand hover:bg-brand/5 cursor-pointer transition-all duration-150">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Raghu" class="w-10 h-10 rounded-full object-cover border-2 border-brand/20 mr-3">
              <div class="text-left">
                <p class="text-sm font-semibold">Raghu Varma</p>
                <p class="text-xs text-slate-400">raghu.varma@scooterpartner.in</p>
              </div>
            </div>

            <div onclick="selectProfile('Simran Kaur', 'simran.kaur@scooterpartner.in', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', 'google_56473829')" 
                 class="profile-card flex items-center p-3 rounded-xl border border-slate-700 hover:border-brand hover:bg-brand/5 cursor-pointer transition-all duration-150">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" alt="Simran" class="w-10 h-10 rounded-full object-cover border-2 border-brand/20 mr-3">
              <div class="text-left">
                <p class="text-sm font-semibold">Simran Kaur</p>
                <p class="text-xs text-slate-400">simran.kaur@scooterpartner.in</p>
              </div>
            </div>
          </div>

          <!-- Custom input divider -->
          <div class="relative flex py-2 items-center">
            <div class="flex-grow border-t border-slate-700/50"></div>
            <span class="flex-shrink mx-4 text-xs text-slate-500 font-semibold uppercase">Or Enter Custom Details</span>
            <div class="flex-grow border-t border-slate-700/50"></div>
          </div>

          <!-- Custom Account Form -->
          <form id="sandboxForm" action="${appUrl}/api/auth/sandbox-login" method="POST" class="space-y-3">
            <input type="hidden" name="provider" value="${provider}">
            <input type="hidden" id="providerId" name="providerId" value="sandbox_${Date.now()}">
            
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1" for="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" required placeholder="e.g. Anand Kumar" 
                     class="w-full bg-slate-800 border border-slate-700 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none transition">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1" for="email">Email Address</label>
              <input type="email" id="email" name="email" required placeholder="e.g. anand.kumar@gmail.com" 
                     class="w-full bg-slate-800 border border-slate-700 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none transition">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1" for="profileImage">Profile Image URL (Optional)</label>
              <input type="url" id="profileImage" name="profileImage" placeholder="https://images.unsplash.com/..." 
                     class="w-full bg-slate-800 border border-slate-700 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none transition">
            </div>

            <button type="submit" class="w-full bg-brand hover:bg-brand/90 text-white text-sm font-semibold py-3 rounded-xl shadow-lg transition duration-150 flex items-center justify-center">
              Authorize & Simulate Secure Login
            </button>
          </form>
        </div>

        <!-- Credentials setup info box -->
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 space-y-2 text-left">
          <p class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">🛠️ Real Production Setup Steps:</p>
          <ol class="list-decimal list-inside text-[11px] text-slate-400 space-y-1 pl-1">
            <li>Configure environment variables in your AI Studio secrets.</li>
            <li>Define <code class="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono">GOOGLE_CLIENT_ID</code> & <code class="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono">GOOGLE_CLIENT_SECRET</code>.</li>
            <li>Define <code class="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono">FACEBOOK_APP_ID</code> & <code class="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono">FACEBOOK_CLIENT_SECRET</code>.</li>
            <li>Add this Authorized Redirect URI: <br><code class="break-all bg-slate-900 p-1 rounded text-emerald-400 block mt-1 font-mono">${appUrl}/api/auth/callback/${provider}</code></li>
          </ol>
        </div>
      </div>

      <script>
        function selectProfile(name, email, img, id) {
          document.getElementById('fullName').value = name;
          document.getElementById('email').value = email;
          document.getElementById('profileImage').value = img;
          document.getElementById('providerId').value = id;
          
          // Visual highlight
          const cards = document.querySelectorAll('.profile-card');
          cards.forEach(c => c.classList.remove('border-brand', 'bg-brand/5'));
          event.currentTarget.classList.add('border-brand', 'bg-brand/5');
        }
      </script>
    </body>
    </html>
  `);
};

// Handle submission of sandbox form, logging the simulated user into actual database
export const handleSandboxLogin = async (req: Request, res: Response) => {
  const { provider, providerId, email, fullName, profileImage } = req.body;

  if (!email || !fullName) {
    return renderErrorHtml(res, 'Missing required sandbox fields.');
  }

  try {
    const { user, token } = await loginOrCreateSocialUser(
      provider || 'google',
      providerId || `sandbox_${Date.now()}`,
      email,
      fullName,
      profileImage || ''
    );

    return renderSuccessHtml(res, token, user);
  } catch (err: any) {
    console.error('Sandbox Auth Error:', err);
    return renderErrorHtml(res, err.message || 'Simulated registration failed.');
  }
};

// HTML rendering functions for the popups to send postMessage and close
const renderSuccessHtml = (res: Response, token: string, user: any) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Authentication Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0F172A;
          color: #F8FAFC;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border-left-color: #10B981;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h2 { margin: 0 0 12px 0; font-size: 24px; color: #10B981; }
        p { color: #94A3B8; margin: 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <h2>Login Successful!</h2>
      <p>Synchronizing your session. This window will close automatically...</p>
      <script>
        try {
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              payload: {
                token: ${JSON.stringify(token)},
                user: ${JSON.stringify(user)}
              }
            }, '*');
            setTimeout(function() {
              window.close();
            }, 800);
          } else {
            // Fallback for redirect flow testing
            window.location.href = '/';
          }
        } catch (e) {
          console.error('Error sending message:', e);
          document.body.innerHTML = '<h2>Error completing authentication</h2><p>Please close this tab and try again.</p>';
        }
      </script>
    </body>
    </html>
  `);
};

const renderErrorHtml = (res: Response, message: string) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Authentication Failed</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0F172A;
          color: #F8FAFC;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
          padding: 24px;
        }
        .error-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 32px;
          font-weight: bold;
        }
        h2 { margin: 0 0 12px 0; font-size: 24px; color: #EF4444; }
        p { color: #94A3B8; margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; max-width: 400px; }
        button {
          background: #EF4444;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.15s;
        }
        button:hover {
          background: #DC2626;
        }
      </style>
    </head>
    <body>
      <div class="error-icon">!</div>
      <h2>Authentication Failed</h2>
      <p>${message}</p>
      <button onclick="window.close()">Close Window</button>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_FAILURE',
            payload: {
              message: ${JSON.stringify(message)}
            }
          }, '*');
        }
      </script>
    </body>
    </html>
  `);
};
