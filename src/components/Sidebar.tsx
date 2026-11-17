import React from 'react';
import {
  HomeIcon,
  ClipboardIcon,
  BankIcon,
  CopyIcon,
  ShapesIcon,
  InfoCircleIcon,
  MailIcon,
  TrophyIcon,
  SparklesIcon,
  LockIcon,
  ShieldCheckeredIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { UserProfile } from '../types';
import { BrandLogo } from './BrandLogo';

export type NavTab = 
  | 'dashboard' 
  | 'monthly-reports' 
  | 'discharge-pathway'
  | 'simulator'
  | 'spending-trends'
  | 'bank-accounts' 
  | 'receipts' 
  | 'categorize' 
  | 'user-profile' 
  | 'support'
  | 'litbot';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  onOpenEmailLog: () => void;
  onLogout?: () => void;
  onOpenCompliance?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  profile,
  onOpenEmailLog,
  onLogout,
  onOpenCompliance
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: HomeIcon },
    { id: 'monthly-reports' as NavTab, label: 'Monthly Report(s)', icon: ClipboardIcon },
    { id: 'discharge-pathway' as NavTab, label: 'Pathway to Discharge', icon: TrophyIcon },
    { id: 'bank-accounts' as NavTab, label: 'Bank Account(s)', icon: BankIcon },
    { id: 'receipts' as NavTab, label: 'Receipts', icon: CopyIcon },
    { id: 'categorize' as NavTab, label: 'Categorize', icon: ShapesIcon }
  ];

  return (
    <aside className="hidden lg:flex lg:sticky lg:top-0 lg:self-start w-64 shrink-0 h-screen overflow-hidden bg-[#242031] text-white flex-col justify-between gap-4 p-6 select-none border-r border-[#2d283c]">
      {/* Pinned Brand Logo (always visible at top of side nav) */}
      <div className="shrink-0 px-1 pt-1 pb-3">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b6b3ff] rounded-lg cursor-pointer transition-opacity hover:opacity-90"
          aria-label="CleanSlate Dashboard"
          title="Return to Dashboard"
        >
          <BrandLogo
            variant="brand-white"
            className="h-8 w-auto max-w-full object-contain"
          />
        </button>
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
        {/* Section: MAIN MENU */}
        <div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2.5">
            MAIN MENU
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#AEBBFD] text-[#3B3B3B] font-bold border-[1.5px] border-[#010101] shadow-[2px_3px_0px_#010101]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium border-[1.5px] border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3B3B3B]' : 'text-slate-400'}`} />
                  <span className={`truncate ${isActive ? 'font-bold' : 'font-normal'}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: HELP & SUPPORT */}
        <div>
          <div 
            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-3"
            style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
          >
            HELP & SUPPORT
          </div>
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => onSelectTab('support')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                currentTab === 'support'
                  ? 'bg-[#AEBBFD] text-[#3B3B3B] font-bold border-[1.5px] border-[#010101] shadow-[2px_3px_0px_#010101]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium border-[1.5px] border-transparent'
              }`}
            >
              <InfoCircleIcon className={`w-4 h-4 shrink-0 ${currentTab === 'support' ? 'text-[#3B3B3B]' : 'text-slate-400'}`} />
              <span>Support</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('litbot')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                currentTab === 'litbot'
                  ? 'bg-[#AEBBFD] text-[#3B3B3B] font-bold border-[1.5px] border-[#010101] shadow-[2px_3px_0px_#010101]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium border-[1.5px] border-transparent'
              }`}
            >
              <SparklesIcon className={`w-4 h-4 shrink-0 ${currentTab === 'litbot' ? 'text-[#3B3B3B]' : 'text-[#F9F45D]'}`} />
              <div className="flex items-center justify-between w-full">
                <span>LITbot</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F9F45D] text-[#3B3B3B] border border-[#010101]">
                  AI
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer: Trustee Direct Link & Log Out */}
      <div className="shrink-0 pt-4 border-t border-white/10 space-y-3">
        <button
          type="button"
          onClick={onOpenEmailLog}
          className="w-full text-left bg-[#1d1a28] hover:bg-[#1a1724] border border-white/10 rounded-xl p-3 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-[10px] font-semibold tracking-wider text-[#AEBBFD] uppercase flex items-center gap-1.5 truncate">
              <MailIcon className="w-3.5 h-3.5 text-[#AEBBFD] shrink-0" />
              <span className="truncate whitespace-nowrap">Your Advocate</span>
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 shrink-0" />
          </div>
          <div className="text-xs font-normal text-white truncate whitespace-nowrap">
            {profile.litName || 'Sarah Jenkins, LIT'}
          </div>
          <div className="text-[11px] text-slate-400 truncate whitespace-nowrap">
            {profile.litFirm || 'BDO Canada Limited'}
          </div>
          <div 
            className="mt-2 text-[10px] underline decoration-slate-500 truncate whitespace-nowrap"
            style={{ color: '#FF6BBC' }}
          >
            View Trustee Email Log &rarr;
          </div>
        </button>

        {/* Security & Log Out controls */}
        <div className="flex items-center gap-2 pt-1">
          {onOpenCompliance && (
            <CleanSlateButton
              variant="dark-periwinkle"
              size="xs"
              leftIcon={ShieldCheckeredIcon}
              onClick={onOpenCompliance}
              className="flex-1"
              title="View Canadian PIPEDA & OSB Compliance Safeguards"
            >
              <span>PIPEDA</span>
            </CleanSlateButton>
          )}

          {onLogout && (
            <CleanSlateButton
              variant="dark"
              size="xs"
              leftIcon={LockIcon}
              onClick={onLogout}
              title="Log out of CleanSlate"
            >
              <span>Log Out</span>
            </CleanSlateButton>
          )}
        </div>
      </div>
    </aside>
  );
};
