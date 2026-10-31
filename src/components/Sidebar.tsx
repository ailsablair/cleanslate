import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp,
  Building2, 
  Receipt as ReceiptIcon, 
  Shapes, 
  UserCircle2, 
  Headphones,
  MailCheck
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'monthly-reports' 
  | 'spending-trends'
  | 'bank-accounts' 
  | 'receipts' 
  | 'categorize' 
  | 'user-profile' 
  | 'support';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  onOpenEmailLog: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  profile,
  onOpenEmailLog
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monthly-reports' as NavTab, label: 'Monthly Report(s)', icon: FileText },
    { id: 'spending-trends' as NavTab, label: 'Spending Trends', icon: TrendingUp },
    { id: 'bank-accounts' as NavTab, label: 'Bank Account(s)', icon: Building2 },
    { id: 'receipts' as NavTab, label: 'Receipts', icon: ReceiptIcon },
    { id: 'categorize' as NavTab, label: 'Categorize', icon: Shapes },
    { id: 'user-profile' as NavTab, label: 'User Profile', icon: UserCircle2 },
  ];

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-[#242031] text-white flex flex-col justify-between p-6 select-none border-r border-[#2d283c]">
      <div>
        {/* Brand Logo matching the Figma / attachment */}
        <div className="mb-10 px-2 pt-1 flex items-center">
          <img 
            src="/assets/aistudio/type_logo-brand-white_4fdd6b68.png" 
            alt="CleanSlate" 
            className="h-9 object-contain"
            onError={(e) => {
              // fallback if asset path shifts
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Section: MAIN MENU */}
        <div className="mb-8">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-3">
            MAIN MENU
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#b6b3ff] text-[#242031] shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#242031]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: HELP & SUPPORT */}
        <div>
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-3">
            HELP & SUPPORT
          </div>
          <nav className="space-y-1.5">
            <button
              onClick={() => onSelectTab('support')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 ${
                currentTab === 'support'
                  ? 'bg-[#b6b3ff] text-[#242031] shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones className={`w-5 h-5 shrink-0 ${currentTab === 'support' ? 'text-[#242031]' : 'text-slate-400'}`} />
              <span>Support</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer: Trustee Direct Link info card */}
      <div className="pt-6 border-t border-white/10">
        <button
          onClick={onOpenEmailLog}
          className="w-full text-left bg-[#1d1a28] hover:bg-[#1a1724] border border-white/5 rounded-xl p-3 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold tracking-wider text-[#b6b3ff] uppercase flex items-center gap-1.5">
              <MailCheck className="w-3.5 h-3.5 text-[#b6b3ff]" />
              LIT Auto-Dispatch
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          </div>
          <div className="text-xs font-bold text-white truncate">
            {profile.litName || 'Sarah Jenkins, LIT'}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {profile.litFirm || 'BDO Canada Limited'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 underline decoration-slate-500 group-hover:text-slate-300">
            View Trustee Email Log &rarr;
          </div>
        </button>
      </div>
    </aside>
  );
};
