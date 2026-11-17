import React, { useState } from 'react';
import {
  SyncIcon,
  MailIcon,
  BarChartBoxIcon,
  CloseIcon,
  HomeIcon,
  ClipboardIcon,
  BankIcon,
  CopyIcon,
  ShapesIcon,
  UserCircleIcon,
  InfoCircleIcon,
  TrophyIcon,
  ChevronRightIcon,
  DownloadIcon,
  ChevronDownIcon,
  SendIcon,
  LockIcon,
  ShieldCheckeredIcon,
  PlusIcon,
  UploadIcon,
  ArrowRightIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { UserProfile } from '../types';
import { NavTab } from './Sidebar';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';
import { BrandLogo } from './BrandLogo';

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
  onLogout?: () => void;
  onOpenCompliance?: () => void;
  onNewTransaction?: () => void;
  onUploadReceipt?: () => void;
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
  onExportAuditPacket,
  onLogout,
  onOpenCompliance,
  onNewTransaction,
  onUploadReceipt
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownMenuItems: DropdownMenuItem[] = [
    {
      id: 'message-trustee',
      label: 'Message Trustee',
      icon: SendIcon,
      onClick: () => {
        onOpenEmailLog();
      }
    },
    {
      id: 'download-reports',
      label: 'Download All Reports',
      icon: DownloadIcon,
      onClick: () => {
        if (onDownloadReport) onDownloadReport();
        else onSelectTab('monthly-reports');
      }
    },
    {
      id: 'export-audit',
      label: 'Export Audit Packet',
      icon: ClipboardIcon,
      onClick: () => {
        if (onExportAuditPacket) onExportAuditPacket();
        else onSelectTab('receipts');
      }
    },
    {
      id: 'compliance-safeguards',
      label: 'Security & PIPEDA Privacy',
      icon: ShieldCheckeredIcon,
      onClick: () => {
        if (onOpenCompliance) onOpenCompliance();
      }
    },
    {
      id: 'user-profile',
      label: 'User Profile',
      icon: UserCircleIcon,
      hasDividerAbove: true,
      onClick: () => onSelectTab('user-profile')
    },
    {
      id: 'log-out',
      label: 'Log Out of App',
      icon: LockIcon,
      hasDividerAbove: true,
      onClick: () => {
        if (onLogout) onLogout();
      }
    }
  ];

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: HomeIcon },
    { id: 'monthly-reports' as NavTab, label: 'Monthly Report(s)', icon: ClipboardIcon },
    { id: 'discharge-pathway' as NavTab, label: 'Pathway to Discharge', icon: TrophyIcon },
    { id: 'bank-accounts' as NavTab, label: 'Bank Account(s)', icon: BankIcon },
    { id: 'receipts' as NavTab, label: 'Receipts', icon: CopyIcon },
    { id: 'categorize' as NavTab, label: 'Categorize', icon: ShapesIcon },
    { id: 'user-profile' as NavTab, label: 'User Profile', icon: UserCircleIcon },
    { id: 'support' as NavTab, label: 'Support & LIT Contact', icon: InfoCircleIcon }
  ];

  const handleSelectMobileTab = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#242031]/95 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none px-4 sm:px-8 pt-3.5 sm:pt-6 lg:pt-8 pb-3 sm:pb-4">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Hamburger Button (Visible on mobile/tablet < lg) + CleanSlate Logo (< lg) + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <CleanSlateButton
            variant={isMobileMenuOpen ? 'dark-yellow' : 'dark'}
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden shrink-0"
            aria-label="Toggle navigation menu"
            title="Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="w-5 h-5" />
            ) : (
              <BarChartBoxIcon className="w-5 h-5" />
            )}
          </CleanSlateButton>

          <div className="min-w-0">
            <div className="lg:hidden flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center focus:outline-none cursor-pointer"
                aria-label="CleanSlate Dashboard"
              >
                <BrandLogo
                  variant="brand-white"
                  className="h-5 sm:h-6 w-auto object-contain"
                />
              </button>
              <span className="text-slate-500 text-xs" aria-hidden="true">·</span>
              <span className="text-[10px] text-slate-400 font-light truncate max-w-[110px]">
                {profile.litName?.split(',')[0] || 'LIT'}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold tracking-wide text-white uppercase truncate max-w-[175px] sm:max-w-none">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Action Controls & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onNewTransaction && (
            <CleanSlateButton
              variant="yellow"
              size="sm"
              leftIcon={PlusIcon}
              onClick={onNewTransaction}
              title="Add a manual ledger transaction"
            >
              <span>New Transaction</span>
            </CleanSlateButton>
          )}

          {onUploadReceipt && (
            <CleanSlateButton
              variant="yellow"
              size="sm"
              leftIcon={UploadIcon}
              onClick={onUploadReceipt}
              title="Upload or scan a statutory receipt"
            >
              <span>Upload Receipt</span>
            </CleanSlateButton>
          )}

          {onSyncBankAccounts && (
            <CleanSlateButton
              variant="dark-periwinkle"
              size="sm"
              onClick={onSyncBankAccounts}
              disabled={isSyncing}
              title="Sync connected bank accounts now via API"
            >
              <SyncIcon className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync bank'}</span>
            </CleanSlateButton>
          )}

          {/* LIT Dispatch Indicator */}
          <CleanSlateButton
            variant="dark"
            size="sm"
            onClick={onOpenEmailLog}
            title="View emails dispatched to your Licensed Insolvency Trustee"
          >
            <MailIcon className="w-4 h-4 text-[#AEBBFD]" />
            <span className="hidden sm:inline text-slate-300 font-normal">LIT:</span>
            <span className="text-white truncate max-w-[100px] sm:max-w-[140px]">
              {profile.litName?.split(',')[0] || 'Trustee'}
            </span>
            {unreadDispatchesCount > 0 && (
              <span className="bg-[#F9F45D] text-[#3B3B3B] text-[10px] font-black px-1.5 py-0.5 rounded-md border border-[#010101]">
                {unreadDispatchesCount}
              </span>
            )}
          </CleanSlateButton>

          {/* Quick Actions Dropdown Menu */}
          <DropdownMenu
            trigger={
              <CleanSlateButton
                variant="periwinkle"
                size="sm"
                rightIcon={ChevronDownIcon}
                title="Quick Actions Menu"
              >
                <span>Actions</span>
              </CleanSlateButton>
            }
            items={dropdownMenuItems}
            align="right"
          />
        </div>
      </div>

      {/* Characteristic gradient line */}
      <div className="mt-3 sm:mt-4 h-[3px] w-full rounded-full bg-gradient-to-r from-[#e76192] via-[#b6b3ff] to-[#45b7d1] opacity-90" />

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
              <div className="flex items-center gap-2.5">
                <BrandLogo
                  variant="brand-white"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                {profile.firstName} {profile.lastName}
              </span>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <CleanSlateButton
                    key={item.id}
                    variant={isActive ? 'periwinkle' : 'dark'}
                    size="sm"
                    fullWidth
                    onClick={() => handleSelectMobileTab(item.id)}
                    className="!justify-between !py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRightIcon className="w-3.5 h-3.5 opacity-70" />
                  </CleanSlateButton>
                );
              })}
            </div>

            {/* Bottom LIT Status bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">
                  Trustee: {profile.litName || 'Sarah Jenkins, LIT'}
                </span>
              </div>
              <CleanSlateButton
                variant="dark-yellow"
                size="xs"
                rightIcon={ArrowRightIcon}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenEmailLog();
                }}
                className="shrink-0"
              >
                Trustee Log
              </CleanSlateButton>
            </div>

          </div>
        </>
      )}

    </header>
  );
};
