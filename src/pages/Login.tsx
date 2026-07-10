import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, socialLogin } = useAuth();

  // Load saved credentials from localStorage if any, falling back to Raghu@gmail.com / qwertyuiop
  const savedEmail = localStorage.getItem('scooter_saved_email') || 'Raghu@gmail.com';
  const savedPassword = localStorage.getItem('scooter_saved_password') || 'qwertyuiop';
  const savedRememberMe = localStorage.getItem('scooter_remember_me') !== 'false';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: savedEmail,
      password: savedPassword,
      rememberMe: savedRememberMe
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, !!data.rememberMe);
      
      if (data.rememberMe) {
        localStorage.setItem('scooter_saved_email', data.email);
        localStorage.setItem('scooter_saved_password', data.password);
        localStorage.setItem('scooter_remember_me', 'true');
      } else {
        localStorage.removeItem('scooter_saved_email');
        localStorage.removeItem('scooter_saved_password');
        localStorage.setItem('scooter_remember_me', 'false');
      }

      toast.success('Login Successful.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsSocialLoading(provider);
    try {
      await socialLogin(provider);
      toast.success(`${provider === 'google' ? 'Google' : 'Facebook'} Sign-In Successful.`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <Card className="shadow-xl shadow-primary/5">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">Welcome back</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            placeholder="name@example.com"
            icon={<Mail className="w-4 h-4" />}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
                message: 'Invalid email format'
              }
            })}
            error={errors.email?.message as string}
          />
          
          <div className="relative">
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              error={errors.password?.message as string}
            />
            <button 
              type="button"
              className="absolute right-3 top-[34px] text-text-secondary hover:text-text-primary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                {...register('rememberMe')}
                className="rounded border-border text-primary focus:ring-primary/20 bg-surface" 
              />
              <span className="text-sm text-text-secondary">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark">Forgot password?</Link>
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={isLoading || !!isSocialLoading}>
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1e293b] px-2 text-text-secondary">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={isLoading || !!isSocialLoading}
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-150 shadow-sm text-sm disabled:opacity-50 cursor-pointer"
          >
            {isSocialLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-5.29-4.53z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

