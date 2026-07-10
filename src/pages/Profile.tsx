import React, { useRef, useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, Car, Shield, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import EditProfileModal from '../components/profile/EditProfileModal';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { register: registerPersonal, handleSubmit: handleSubmitPersonal, reset: resetPersonal } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    }
  });

  const { register: registerVehicle, handleSubmit: handleSubmitVehicle, reset: resetVehicle } = useForm({
    defaultValues: {
      vehicleType: user?.vehicleType || '',
    }
  });

  // Keep forms synced when user profile is updated from anywhere (like the modal)
  useEffect(() => {
    resetPersonal({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    });
    resetVehicle({
      vehicleType: user?.vehicleType || '',
    });
  }, [user, resetPersonal, resetVehicle]);

  const [isLoading, setIsLoading] = useState(false);

  const onPersonalSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await updateUser({ fullName: data.fullName, phoneNumber: data.phoneNumber });
      toast.success('Personal details updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update details');
    } finally {
      setIsLoading(false);
    }
  };

  const onVehicleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await updateUser({ vehicleType: data.vehicleType });
      toast.success('Vehicle details updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
      if (res.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const nameParts = user?.fullName?.split(' ') || ['User'];
  const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() : (nameParts[0]?.[0] || 'U').toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
        <p className="text-text-secondary mt-1">Manage your personal and vehicle information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit text-center flex flex-col items-center pt-8">
          <div 
            className="relative mb-4 group cursor-pointer"
            onClick={() => setIsEditModalOpen(true)}
            title="Edit Profile"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-3xl text-slate-950 font-bold shadow-lg overflow-hidden border border-border/20 group-hover:scale-105 transition-all duration-300">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover animate-fade-in" />
              ) : (
                initials
              )}
            </div>
            <button 
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-slate-950 border border-border/20 rounded-xl flex items-center justify-center hover:bg-primary-light transition-colors cursor-pointer shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              title="Change Photo & Profile"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h2 
            className="text-xl font-bold text-text-primary cursor-pointer hover:text-primary transition-colors duration-200"
            onClick={() => setIsEditModalOpen(true)}
          >
            {user?.fullName || 'User'}
          </h2>
          <p className="text-text-secondary text-sm capitalize">{user?.vehicleType || user?.preferredPlatform || 'Pro Rider'}</p>
          
          <div className="w-full mt-6 px-4 space-y-3 text-left">
            <div className="flex justify-between items-center text-sm border-t border-border/30 pt-3">
              <span className="text-text-secondary">Joined</span>
              <span className="font-medium text-text-primary">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}</span>
            </div>
            {user?.authProvider && user.authProvider !== 'email' && (
              <div className="flex justify-between items-center text-sm border-t border-border/30 pt-3">
                <span className="text-text-secondary">Auth Provider</span>
                <span className="font-semibold text-primary capitalize flex items-center gap-1.5">
                  {user.authProvider === 'google' ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-5.29-4.53z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current text-blue-500" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  {user.authProvider}
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPersonal(onPersonalSubmit)} className="space-y-4">
                <Input label="Full Name" {...registerPersonal('fullName')} />
                <Input label="Email Address" icon={<Mail className="w-4 h-4" />} {...registerPersonal('email')} disabled />
                <Input label="Phone Number" icon={<Phone className="w-4 h-4" />} {...registerPersonal('phoneNumber')} />
                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={isLoading}>Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitVehicle(onVehicleSubmit)} className="space-y-4">
                <Input label="Make & Model" {...registerVehicle('vehicleType')} />
                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={isLoading}>Update Vehicle</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Security
              </CardTitle>
            </CardHeader>
            {user?.authProvider && user.authProvider !== 'email' ? (
              <CardContent className="space-y-2 text-center py-8 text-text-secondary text-sm">
                <Shield className="w-10 h-10 text-primary/70 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Social Login Active</p>
                <p class="max-w-xs mx-auto">Your account is secured via your <strong>{user.authProvider === 'google' ? 'Google' : 'Facebook'}</strong> profile. Password changes are handled directly on their platforms.</p>
              </CardContent>
            ) : (
              <CardContent className="space-y-4">
                <Input 
                  type="password" 
                  label="Current Password" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    type="password" 
                    label="New Password" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    label="Confirm Password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={onPasswordChange}>Change Password</Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </div>
  );
}

