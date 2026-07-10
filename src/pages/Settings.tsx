import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Laptop, Globe, Bell, LogOut, Sparkles, Check, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme, LanguageCode, ThemeMode } from '../context/LanguageThemeContext';
import { languages } from '../lib/translations';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, theme, setLanguage, setTheme, t, translateDynamicText, isTranslating } = useLanguageTheme();
  
  const [notifications, setNotifications] = useState(true);
  
  // Playground Sandbox State
  const [playgroundText, setPlaygroundText] = useState(
    'Delivered Swiggy order in high traffic. Customer tipped 50 rupees and left a 5-star rating!'
  );
  const [translatedPlaygroundText, setTranslatedPlaygroundText] = useState('');
  const [sandboxLanguage, setSandboxLanguage] = useState<LanguageCode>(language);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setTheme(mode);
    toast.success(t('toast_theme_changed', 'Theme updated successfully!'));
  };

  const handleLanguageChange = async (code: LanguageCode) => {
    await setLanguage(code);
    setSandboxLanguage(code);
    toast.success(t('toast_lang_changed', 'Language updated successfully!'));
  };

  const handlePlaygroundTranslate = async () => {
    if (!playgroundText.trim()) {
      toast.error('Please enter some text to translate');
      return;
    }
    try {
      const result = await translateDynamicText(playgroundText);
      setTranslatedPlaygroundText(result);
      toast.success('Translated successfully with Gemini!');
    } catch (err) {
      toast.error('Translation failed. Please try again.');
    }
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    if (!notifications) {
      toast.success('Notifications enabled');
    } else {
      toast.success('Notifications disabled');
    }
  };

  // Sample prompt buttons for playground
  const samples = [
    'Heavy rain near Swiggy hub. Delayed by 10 mins but food is kept warm.',
    'Zomato delivery completed. Received cash tip from customer.',
    'Scooter battery charging level is 85%. Estimated range: 60 km.'
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          {t('app_settings', 'App Settings')}
        </h1>
        <p className="text-text-secondary text-base">
          {t('configure_preferences', 'Configure your app preferences.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Preferences Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Preferences Settings Block */}
          <Card className="shadow-md border border-border/40">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" />
                {t('preferences', 'Preferences')}
              </CardTitle>
              <p className="text-sm text-text-secondary">
                Customize app theme and localization settings.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Theme Management Selector */}
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-text-primary text-base flex items-center gap-2">
                    <Sun className="w-4 h-4 text-primary" />
                    {t('theme', 'Theme Mode')}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {t('theme_desc', 'Select your preferred visual theme')}
                  </p>
                </div>
                
                {/* Visual Segments */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      theme === 'light'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                        : 'border-border bg-surface hover:bg-surface-card text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span>{t('theme_light', 'Light Mode')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                        : 'border-border bg-surface hover:bg-surface-card text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span>{t('theme_dark', 'Dark Mode')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      theme === 'system'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                        : 'border-border bg-surface hover:bg-surface-card text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Laptop className="w-5 h-5" />
                    <span>{t('theme_system', 'System Default')}</span>
                  </button>
                </div>
              </div>

              {/* Language Management Selector */}
              <div className="space-y-3 border-t border-border/40 pt-6">
                <div>
                  <p className="font-semibold text-text-primary text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    {t('language', 'Language')}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {t('language_desc', 'Select your preferred language')}
                  </p>
                </div>

                {/* Language Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code as LanguageCode)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        language === lang.code
                          ? 'border-primary bg-primary/10 text-text-primary shadow-sm'
                          : 'border-border bg-surface hover:bg-surface-card text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-text-primary">{lang.native}</span>
                        <span className="text-xs text-text-secondary">{lang.name}</span>
                      </div>
                      {language === lang.code && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Controls (Notifications & Default Currency) */}
              <div className="border-t border-border/40 pt-6 space-y-5">
                
                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface rounded-xl border border-border/30">
                      <Bell className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{t('notifications_title', 'Notifications')}</p>
                      <p className="text-xs text-text-secondary">{t('notifications_desc', 'Receive daily earning summaries')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications} onChange={toggleNotifications} />
                    <div className="w-11 h-6 bg-border/40 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Danger Zone Block */}
          <Card className="border-danger/30 shadow-sm bg-danger/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
              <div>
                <p className="font-bold text-text-primary text-base flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-danger" />
                  {t('danger_zone', 'Danger Zone')}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t('sign_out_desc', 'Sign out from your account')}
                </p>
              </div>
              <Button variant="danger" className="gap-2 shrink-0 w-full sm:w-auto cursor-pointer" onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> {t('logout', 'Logout')}
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Gemini API Interactive Translate Playground Column */}
        <div className="space-y-6">
          <Card className="shadow-md border border-primary/20 bg-surface-card/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Live Gemini Translator
              </CardTitle>
              <p className="text-xs text-text-secondary">
                Test the context-aware dynamic translation feature powered by Google Gemini 3.5.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  Original Dynamic Message (English)
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-surface border border-border/40 rounded-xl p-3 text-text-primary text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
                  value={playgroundText}
                  onChange={(e) => setPlaygroundText(e.target.value)}
                  placeholder="Type any custom delivery message..."
                />
              </div>

              {/* Sample prompts */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-text-secondary">Try sample inputs:</p>
                <div className="flex flex-col gap-1.5">
                  {samples.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPlaygroundText(sample);
                        setTranslatedPlaygroundText('');
                      }}
                      className="text-left text-xs bg-surface hover:bg-surface-card border border-border/20 rounded-lg p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer truncate"
                      title={sample}
                    >
                      "{sample}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Translate Action */}
              <Button
                variant="primary"
                className="w-full gap-2 justify-center py-2.5 cursor-pointer font-semibold"
                onClick={handlePlaygroundTranslate}
                isLoading={isTranslating}
              >
                <Sparkles className="w-4 h-4" />
                Translate to {languages.find(l => l.code === language)?.native || 'Target Language'}
              </Button>

              {/* Translation Output */}
              {translatedPlaygroundText && (
                <div className="mt-4 p-4 rounded-xl bg-surface border border-primary/10 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {languages.find(l => l.code === sandboxLanguage)?.native} Translation
                    </span>
                    <span className="text-[10px] text-text-secondary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                      Cached / Powered by Gemini
                    </span>
                  </div>
                  <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                    {translatedPlaygroundText}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
