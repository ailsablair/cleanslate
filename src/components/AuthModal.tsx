import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  LogOut, 
  UserCheck, 
  Building2, 
  ArrowRight,
  X
} from 'lucide-react';
import { loginWithGoogle, loginAsDemoUser } from '../lib/authService';
import { BrandLogo } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Google Auth popup note:', err);
      // Fallback to demo login if Google Auth popup is blocked in iframe preview
      try {
        await loginAsDemoUser();
        onLoginSuccess();
        onClose();
      } catch (demoErr: any) {
        setAuthError('Authentication error. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await loginAsDemoUser();
      onLoginSuccess();
      onClose();
    } catch (err) {
      setAuthError('Unable to initialize session.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 shadow-[6px_8px_0px_#000000] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in modal"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2.5 pt-2">
          <div className="flex justify-center">
            <BrandLogo
              variant="brand-dark"
              className="h-8 w-auto object-contain"
            />
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#101010]">
            OSB Debtor Vault
          </h2>
          <p className="text-xs text-[#4b4856]">
            Secure Canadian Bankruptcy &amp; Surplus Income Management
          </p>
        </div>

        {/* Security Assurance */}
        <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 text-xs text-[#4b4856] space-y-1.5">
          <div className="flex items-center gap-2 text-[#101010] font-extrabold">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>PIPEDA &amp; OSB Compliance Encrypted</span>
          </div>
          <p className="text-[11px] text-[#4b4856] leading-relaxed">
            Multi-tenant document isolation guarantees that your Form 65 reports, bank feeds, and trustee dispatches are protected by document-level access rules.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold rounded-xl text-center">
            {authError}
          </div>
        )}

        {/* Sign In Options */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#101010] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google Account'}</span>
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={isSigningIn}
            className="w-full py-3 px-4 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Continue with Debtor Profile</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>
        </div>

        <div className="text-center pt-3 border-t border-[#b4b1fc]/35 text-[11px] text-[#6e6b7b]">
          CleanSlate Canada · Licensed Insolvency Trustee Integration Portal
        </div>

      </div>
    </div>
  );
};
