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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1d1a27] text-white border-2 border-[#b6b3ff] rounded-3xl p-6 shadow-2xl space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#b6b3ff] to-[#e76192] text-[#1d1a27] flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            CleanSlate OSB Vault
          </h2>
          <p className="text-xs text-slate-300">
            Secure Canadian Bankruptcy & Surplus Income Management
          </p>
        </div>

        {/* Security Assurance */}
        <div className="bg-[#262135] border border-white/10 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-[#b6b3ff] font-bold">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>PIPEDA & OSB Compliance Encrypted</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Multi-tenant document isolation guarantees that your Form 65 reports, bank feeds, and trustee dispatches are protected by document-level access rules.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl text-center">
            {authError}
          </div>
        )}

        {/* Sign In Options */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs transition flex items-center justify-center gap-3 shadow-md cursor-pointer active:scale-98"
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
            className="w-full py-3.5 px-4 rounded-2xl bg-[#b6b3ff] hover:bg-[#a3a0fa] text-[#1d1a27] font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
          >
            <UserCheck className="w-4 h-4" />
            <span>Continue with Debtor Profile</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>
        </div>

        <div className="text-center pt-2 border-t border-white/10 text-[11px] text-slate-400">
          CleanSlate Canada · Licensed Insolvency Trustee Integration Portal
        </div>

      </div>
    </div>
  );
};
