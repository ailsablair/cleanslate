import React, { useState } from 'react';
import { 
  Bell, 
  RefreshCw, 
  MailCheck, 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Receipt as ReceiptIcon, 
  Shapes, 
  UserCircle2, 
  Headphones, 
  Award, 
  ChevronRight,
  Download,
  ChevronDown
} from 'lucide-react';
import { UserProfile } from '../types';
import { NavTab } from './Sidebar';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

interface HeaderProps {
  title: string;
  profile: UserProfile;
  unreadDispatchesCount: number;
  onOpenEmailLog: () => void;
  onSyncBankAccounts?: () => void;
  isSyncing?: boolean;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onDownloadReport?: () => void;
  onExportAuditPacket?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  profile,
  unreadDispatchesCount,
  onOpenEmailLog,
  onSyncBankAccounts,
  isSyncing = false,
  currentTab,
  onSelectTab,
  onDownloadReport,
  onExportAuditPacket
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownMenuItems: DropdownMenuItem[] = [
    {
      id: 'download-report',
      label: 'Download Report',
      icon: Download,
      onClick: () => {
        if (onDownloadReport) onDownloadReport();
        else onSelectTab('monthly-reports');
      }
    },
    {
      id: 'export-audit',
      label: 'Export Audit Packet',
      icon: FileText,
      onClick: () => {
        if (onExportAuditPacket) onExportAuditPacket();
        else onSelectTab('receipts');
      }
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      icon: UserCircle2,
      hasDividerAbove: true,
      onClick: () => onSelectTab('user-profile')
    }
  ];

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monthly-reports' as NavTab, label: 'Monthly Report(s)', icon: FileText },
    { id: 'discharge-pathway' as NavTab, label: 'Pathway to Discharge', icon: Award },
    { id: 'bank-accounts' as NavTab, label: 'Bank Account(s)', icon: Building2 },
    { id: 'receipts' as NavTab, label: 'Receipts', icon: ReceiptIcon },
    { id: 'categorize' as NavTab, label: 'Categorize', icon: Shapes },
    { id: 'user-profile' as NavTab, label: 'User Profile', icon: UserCircle2 },
    { id: 'support' as NavTab, label: 'Support & LIT Contact', icon: Headphones },
  ];

  const handleSelectMobileTab = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-4">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Hamburger Button (Visible on mobile/tablet < lg) + Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#2e293f] hover:bg-[#38324d] text-white border border-white/10 transition flex items-center justify-center cursor-pointer shadow-xs"
            aria-label="Toggle navigation menu"
            title="Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[#fbf050]" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>

          <div>
            <div className="lg:hidden flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black tracking-wider text-[#b6b3ff] uppercase">
                CleanSlate
              </span>
              <span className="w-1 h-1 rounded-full bg-[#fbf050]" />
              <span className="text-[10px] text-slate-400 font-light truncate max-w-[120px]">
                {profile.litName?.split(',')[0] || 'LIT'}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold tracking-wide text-white uppercase whitespace-nowrap">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Action Controls & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onSyncBankAccounts && (
            <button
              onClick={onSyncBankAccounts}
              disabled={isSyncing}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition border border-white/10 cursor-pointer active:scale-95"
              title="Sync connected bank accounts now via API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#b6b3ff]' : 'text-slate-300'}`} />
              <span className="hidden sm:inline font-normal">{isSyncing ? 'Syncing...' : 'Sync bank'}</span>
            </button>
          )}

          {/* LIT Dispatch Indicator */}
          <button
            onClick={onOpenEmailLog}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2e293f] hover:bg-[#38324d] text-white text-xs font-medium border border-white/10 transition group cursor-pointer active:scale-95"
            title="View emails dispatched to your Licensed Insolvency Trustee"
          >
            <MailCheck className="w-4 h-4 text-[#b6b3ff]" />
            <span className="hidden sm:inline text-slate-300">LIT:</span>
            <span className="text-white font-normal truncate max-w-[100px] sm:max-w-[140px]">
              {profile.litName?.split(',')[0] || 'Trustee'}
            </span>
            {unreadDispatchesCount > 0 && (
              <span className="bg-[#fbf050] text-[#242031] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadDispatchesCount}
              </span>
            )}
          </button>

          {/* Notification Button */}
          <button 
            onClick={onOpenEmailLog}
            className="w-9 h-9 rounded-xl bg-[#2e293f] hover:bg-[#38324d] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition relative cursor-pointer active:scale-95"
            title="LIT Status & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#fbf050]" />
          </button>

          {/* Quick Actions Dropdown Menu matching dropdown_29fce253.png */}
          <DropdownMenu
            trigger={
              <button 
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2e293f] hover:bg-[#38324d] text-white text-xs font-semibold border border-white/10 transition cursor-pointer active:scale-95 shadow-xs"
                title="Quick Actions Menu"
              >
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#b6b3ff]" />
              </button>
            }
            items={dropdownMenuItems}
            align="right"
          />
        </div>
      </div>

      {/* Characteristic gradient line */}
      <div className="mt-4 h-[3px] w-full rounded-full bg-gradient-to-r from-[#e76192] via-[#b6b3ff] to-[#45b7d1] opacity-90" />

      {/* Tablet & Mobile Dropdown Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Dropdown Card */}
          <div className="absolute left-4 right-4 top-full mt-2 bg-[#1e1b29] text-white border border-white/15 rounded-3xl p-5 shadow-2xl z-50 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#b6b3ff] uppercase tracking-wider">
                  Menu Navigation
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {profile.firstName} {profile.lastName}
              </span>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMobileTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#b6b3ff] text-[#242031] font-bold shadow-xs'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#242031]' : 'text-[#b6b3ff]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-[#242031]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom LIT Status bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300 truncate">
                  Trustee: {profile.litName || 'Sarah Jenkins, LIT'}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenEmailLog();
                }}
                className="text-[11px] text-[#fbf050] underline font-semibold hover:text-white transition shrink-0 ml-2"
              >
                Trustee Log &rarr;
              </button>
            </div>

          </div>
        </>
      )}

    </header>
  );
};
