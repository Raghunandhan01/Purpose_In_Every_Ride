import React, { useState, useRef } from 'react';
import { Camera, Check, Loader2, Phone, User, Car, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || '');
  const [preferredPlatform, setPreferredPlatform] = useState(user?.preferredPlatform || 'swiggy');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfileImage(reader.result);
          toast.success('Photo uploaded locally! Save to persist.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full Name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      await updateUser({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        vehicleType: vehicleType.trim(),
        preferredPlatform,
        profileImage,
      });
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate initials fallback
  const nameParts = fullName.trim().split(' ') || ['User'];
  const initials = nameParts.length > 1 
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() 
    : (nameParts[0]?.[0] || 'U').toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Image Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-secondary block">Profile Photo</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 border border-border flex items-center justify-center text-2xl text-primary font-bold shadow-md">
                {profileImage ? (
                  <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-slate-950 rounded-lg flex items-center justify-center hover:bg-primary-light transition-colors shadow"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Presets Grid */}
            <div className="flex-1">
              <span className="text-xs text-text-secondary block mb-1.5">Choose a preset or upload yours</span>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((avatar, idx) => {
                  const isSelected = profileImage === avatar;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileImage(avatar)}
                      className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img src={avatar} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Name Input */}
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<User className="w-4 h-4" />}
          placeholder="e.g., Alex Doe"
          required
        />

        {/* Phone Number */}
        <Input
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          icon={<Phone className="w-4 h-4" />}
          placeholder="e.g., +91 98765 43210"
        />

        {/* Vehicle */}
        <Input
          label="Vehicle Type & Model"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          icon={<Car className="w-4 h-4" />}
          placeholder="e.g., Honda Activa 6G, Electric Scooter"
        />

        {/* Preferred Platform Dropdown */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary block">Preferred Platform</label>
          <div className="relative flex items-center">
            <Zap className="w-4 h-4 text-text-secondary absolute left-3 pointer-events-none" />
            <select
              value={preferredPlatform}
              onChange={(e) => setPreferredPlatform(e.target.value)}
              className="block w-full rounded-xl border border-border bg-surface-card pl-10 pr-4 py-2.5 text-text-primary shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              <option value="swiggy">Swiggy</option>
              <option value="zomato">Zomato</option>
              <option value="uber">Uber</option>
              <option value="rapido">Rapido</option>
              <option value="blinkit">Blinkit</option>
              <option value="zepto">Zepto</option>
              <option value="porter">Porter</option>
              <option value="shadowfax">Shadowfax</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
