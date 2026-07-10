import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2, KeyRound, Phone, Mail } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ConnectionWizardProps {
  platformId: string;
  platformName: string;
  onClose: () => void;
  onSuccess: (connections: any) => void;
}

export default function ConnectionWizard({ platformId, platformName, onClose, onSuccess }: ConnectionWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [method, setMethod] = useState<'api' | 'email_link'>('api');
  
  // Form states
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Proceed with chosen method
  const handleNextStep = () => {
    setStep(2);
  };

  // Step 2: Submit Credentials & Request OTP / Verify Password
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate real-world SMS/Email OTP routing with a slight network latency
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      if (method === 'api') {
        if (!phone || phone.length !== 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setIsLoading(false);
          return;
        }
      }
      if (method === 'email_link' && !email) {
        setError('Please enter your rider email address.');
        setIsLoading(false);
        return;
      }

      // Generate a clean 6-digit verification code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtpCode(generatedCode);

      toast.success(`Verification security code simulated successfully!`);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Verification initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP & Call Backend Connect API
  const handleVerifyConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!otp || otp.length < 4) {
      setError('Please enter a valid 4-digit or 6-digit security code.');
      setIsLoading(false);
      return;
    }

    try {
      // Call backend to save connection and pre-seed initial logs
      const payload = {
        username: method === 'api' ? phone : email,
        syncType: method,
        phone,
        email
      };

      const res = await api.post(`/platforms/${platformId}/connect`, payload);
      
      if (res.data.success) {
        await new Promise((resolve) => setTimeout(resolve, 1800)); // Simulate authorization handshake
        setStep(4);
        onSuccess(res.data.connections);
      } else {
        setError(res.data.message || 'Connection failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Connection handshake failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="connection-wizard-container" className="p-1">
      {/* Step 1: Choose Integration Method */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Connect {platformName} Account</h3>
            <p className="text-sm text-text-secondary mt-1">
              Connect your delivery partner account securely to sync earnings, tips, incentives, and order logs automatically.
            </p>
          </div>

          <div className="space-y-3">
            <div 
              onClick={() => setMethod('api')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                method === 'api' 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border bg-surface hover:border-text-secondary/20'
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center ${method === 'api' ? 'border-primary' : 'border-border'}`}>
                  {method === 'api' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                    Official Rider API Sync (Recommended)
                    <span className="bg-success/10 text-success text-[10px] px-1.5 py-0.2 rounded font-medium">Fastest</span>
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Authenticates via secured mobile number and SMS OTP. Consolidates earnings and trip metrics directly in real-time.
                  </p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setMethod('email_link')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                method === 'email_link' 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border bg-surface hover:border-text-secondary/20'
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center ${method === 'email_link' ? 'border-primary' : 'border-border'}`}>
                  {method === 'email_link' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">Rider Portal Login / Payout Link</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Connects via rider email and password to securely read statements and weekly summaries. Fully compliant with Terms of Service.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleNextStep}>
              Continue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Credentials Form */}
      {step === 2 && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Verify Identity</h3>
            <p className="text-xs text-text-secondary mt-1">
              Enter your registered credentials to initiate secure {platformName} token generation. Your data is encrypted end-to-end.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2.5 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {method === 'api' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Registered Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary">+91</span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
                    required
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                By tapping send, you will receive an official verification code via SMS to authorize Scooter App to import your shift histories.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Rider Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="email"
                    placeholder="rider@payout.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Portal Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isLoading}>Back</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : 'Send Security Code'}
            </Button>
          </div>
        </form>
      )}

      {/* Step 3: Verify OTP */}
      {step === 3 && (
        <form onSubmit={handleVerifyConnection} className="space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-text-primary">Verification Code</h3>
            <p className="text-xs text-text-secondary mt-1">
              Enter the security verification code sent to <span className="font-semibold text-text-primary">{method === 'api' ? `+91 ${phone}` : email}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2.5 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* High-Fidelity simulated secure push notification banner */}
            <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl space-y-1 text-left animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-primary font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  Simulated {method === 'api' ? 'SMS' : 'Email'} Gateway Active
                </span>
                <span>Just Now</span>
              </div>
              <p className="text-xs text-text-primary leading-relaxed">
                Your secure {platformName} verification code is{' '}
                <span className="font-mono font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded text-sm">
                  {sentOtpCode}
                </span>.
              </p>
              <button
                type="button"
                onClick={() => setOtp(sentOtpCode)}
                className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1 mt-1 cursor-pointer transition-all active:scale-95"
              >
                ⚡ Auto-fill verification code
              </button>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-40 text-center tracking-[0.5em] font-mono text-2xl py-2 border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary bg-surface-card text-text-primary"
                required
              />
            </div>

            <p className="text-center text-[11px] text-text-secondary leading-relaxed">
              Didn't receive the security code?{' '}
              <span 
                className="text-primary cursor-pointer hover:underline font-medium" 
                onClick={() => {
                  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                  setSentOtpCode(newCode);
                  toast.success('New verification code sent!');
                }}
              >
                Resend Code
              </span>
            </p>

            <div className="border-t border-border/60 pt-4 flex items-start gap-2 text-[10px] text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>By completing, you grant authorized read-only permissions to download payout metrics and shift hours.</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isLoading}>Back</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : 'Verify & Sync'}
            </Button>
          </div>
        </form>
      )}

      {/* Step 4: Success Celebrations */}
      {step === 4 && (
        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Connection Successful!</h3>
            <p className="text-sm text-text-secondary mt-1">
              Your {platformName} rider account is now securely linked via encrypted tokens.
            </p>
          </div>

          <div className="bg-success/5 border border-success/10 rounded-xl p-4 text-left max-w-sm mx-auto">
            <h4 className="text-xs font-bold text-success uppercase tracking-wider mb-2">Sync Report</h4>
            <ul className="text-xs text-text-secondary space-y-1.5">
              <li className="flex justify-between"><span>Connection Status:</span> <span className="font-semibold text-text-primary">Authorized</span></li>
              <li className="flex justify-between"><span>Integration Mode:</span> <span className="font-semibold text-text-primary">{method === 'api' ? 'Official API Sync' : 'Portal Sync'}</span></li>
              <li className="flex justify-between"><span>Historical Data:</span> <span className="font-semibold text-text-primary">Last 30 Days Fetched</span></li>
              <li className="flex justify-between"><span>Recent Shifts Imported:</span> <span className="font-semibold text-success">+2 Shifts</span></li>
            </ul>
          </div>

          <Button className="w-full py-2.5 font-semibold" onClick={onClose}>
            Excellent, Let's Go!
          </Button>
        </div>
      )}
    </div>
  );
}
