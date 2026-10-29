import React from 'react';
import { Bell, RefreshCw, MailCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  title: string;
  profile: UserProfile;
  unreadDispatchesCount: number;
  onOpenEmailLog: () => void;
  onSyncBankAccounts?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  profile,
  unreadDispatchesCount,
  onOpenEmailLog,
  onSyncBankAccounts,
  isSyncing = false
}) => {
  return (
    <header className="relative px-8 pt-8 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase">
            {title}
          </h1>
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-3">
          {onSyncBankAccounts && (
            <button
              onClick={onSyncBankAccounts}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition border border-white/10"
              title="Sync connected bank accounts now via API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#b6b3ff]' : 'text-slate-300'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Bank API'}</span>
            </button>
          )}

          {/* LIT Dispatch Indicator */}
          <button
            onClick={onOpenEmailLog}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2e293f] hover:bg-[#38324d] text-white text-xs font-medium border border-white/10 transition group"
            title="View emails dispatched to your Licensed Insolvency Trustee"
          >
            <MailCheck className="w-4 h-4 text-[#b6b3ff]" />
            <span className="hidden sm:inline text-slate-300">LIT:</span>
            <span className="text-white font-semibold truncate max-w-[140px]">
              {profile.litName?.split(',')[0] || 'Trustee'}
            </span>
            {unreadDispatchesCount > 0 && (
              <span className="bg-[#fbf050] text-[#242031] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadDispatchesCount}
              </span>
            )}
          </button>

          {/* Notification Button 1 */}
          <button 
            onClick={onOpenEmailLog}
            className="w-10 h-10 rounded-xl bg-[#2e293f] hover:bg-[#38324d] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition relative"
            title="LIT Status & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#fbf050]" />
          </button>

          {/* Notification Button 2 (as seen in screenshots with dual bells) */}
          <button 
            onClick={onOpenEmailLog}
            className="w-10 h-10 rounded-xl bg-[#2e293f] hover:bg-[#38324d] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition relative"
            title="Statutory Deadlines"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Characteristic gradient line seen in design screenshots */}
      <div className="mt-4 h-[3px] w-full rounded-full bg-gradient-to-r from-[#e76192] via-[#b6b3ff] to-[#45b7d1] opacity-90" />
    </header>
  );
};
