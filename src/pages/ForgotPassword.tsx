import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Mail, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Password reset link sent to your email!');
    setIsLoading(false);
  };

  return (
    <Card className="shadow-xl shadow-primary/5">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2 text-center">Reset Password</h2>
        <p className="text-sm text-text-secondary mb-6 text-center">Enter your email address and we'll send you a link to reset your password.</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            error={errors.email?.message as string}
          />
          
          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
