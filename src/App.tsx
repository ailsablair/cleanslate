/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { UserProfileView } from './components/UserProfileView';
import { BankAccountsView } from './components/BankAccountsView';
import { ReceiptsView } from './components/ReceiptsView';
import { CategorizeView } from './components/CategorizeView';
import { SupportView } from './components/SupportView';
import { EmailDispatchModal } from './components/EmailDispatchModal';

import { 
  UserProfile, 
  MonthlyReport, 
  BankAccount, 
  Transaction, 
  Receipt, 
  LIT, 
  EmailDispatch 
} from './types';

import { 
  INITIAL_USER_PROFILE, 
  INITIAL_BANK_ACCOUNTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_MONTHLY_REPORTS, 
  INITIAL_RECEIPTS 
} from './lib/mockData';

import { fetchLITs, INITIAL_LITS } from './lib/litDatabase';
import { 
  sendProfileUpdateEmail, 
  sendMonthlyReportEmail, 
  fetchRecentEmailDispatches 
} from './lib/emailService';

import { db } from './lib/firebase';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { MailCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  
  // Core application states
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('cleanslate_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('cleanslate_banks');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cleanslate_txs');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>(() => {
    const saved = localStorage.getItem('cleanslate_reports');
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_REPORTS;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('cleanslate_receipts');
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });

  const [lits, setLits] = useState<LIT[]>(INITIAL_LITS);
  const [currentReportId, setCurrentReportId] = useState<string>('rep-sep-2022');
  const [isSyncingBanks, setIsSyncingBanks] = useState<boolean>(false);

  // Email Dispatches State & Toast
  const [emailDispatches, setEmailDispatches] = useState<EmailDispatch[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [activeDispatchForModal, setActiveDispatchForModal] = useState<EmailDispatch | null>(null);
  const [latestDispatchToast, setLatestDispatchToast] = useState<EmailDispatch | null>(null);

  // Initialize and load database on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Test connection to Firestore
        await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
          // Normal if 'test/connection' doc does not exist yet
        });

        // Load LIT database
        const loadedLits = await fetchLITs();
        if (loadedLits && loadedLits.length > 0) {
          setLits(loadedLits);
        }

        // Load recent email dispatches
        const dispatches = await fetchRecentEmailDispatches();
        if (dispatches && dispatches.length > 0) {
          setEmailDispatches(dispatches);
        }

        // Check for user profile in Firestore
        const userDoc = await getDoc(doc(db, 'users', profile.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } catch (err) {
        console.warn('Firestore initial boot note:', err);
      }
    }
    loadData();
  }, []);

  // Save changes locally to guarantee instant persistence
  useEffect(() => {
    localStorage.setItem('cleanslate_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('cleanslate_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('cleanslate_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('cleanslate_reports', JSON.stringify(monthlyReports));
  }, [monthlyReports]);

  useEffect(() => {
    localStorage.setItem('cleanslate_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Handler: Save User Profile + Automatic Email to LIT
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', updatedProfile.uid), updatedProfile);
    } catch (e) {
      console.warn('Firestore user save failed silently:', e);
    }

    // Automatically email the LIT directly
    const dispatch = await sendProfileUpdateEmail(updatedProfile);
    setEmailDispatches(prev => [dispatch, ...prev]);
    setLatestDispatchToast(dispatch);
    setTimeout(() => setLatestDispatchToast(null), 6000);
  };

  // Handler: Submit Monthly Report + Automatic Email to LIT
  const handleSubmitMonthlyReport = async (reportToSubmit: MonthlyReport) => {
    const updated = {
      ...reportToSubmit,
      status: 'Submitted' as const,
      submittedAt: new Date().toISOString(),
      sentToLitEmail: profile.litEmail,
      sentToLitName: profile.litName,
      lastEditDate: `Submitted on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
    };

    setMonthlyReports(prev => prev.map(r => r.id === updated.id ? updated : r));

    // Save to Firestore
    try {
      await setDoc(doc(db, 'monthlyReports', updated.id), updated);
    } catch (e) {
      console.warn('Firestore report save note:', e);
    }

    // Automatically email the LIT directly
    const dispatch = await sendMonthlyReportEmail(profile, updated);
    setEmailDispatches(prev => [dispatch, ...prev]);
    setLatestDispatchToast(dispatch);
    setTimeout(() => setLatestDispatchToast(null), 6000);
  };

  const handleUpdateReport = (updated: MonthlyReport) => {
    setMonthlyReports(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  // Bank Account API Integration Handlers
  const handleAddBankAccount = (newAccount: Omit<BankAccount, 'id'>) => {
    const created: BankAccount = {
      ...newAccount,
      id: `bank-${Date.now()}`
    };
    setBankAccounts(prev => [...prev, created]);
  };

  const handleUpdateBankAccount = (updated: BankAccount) => {
    setBankAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleDeleteBankAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(a => a.id !== id));
  };

  // On-demand Bank API Sync
  const handleSyncAllBanks = () => {
    setIsSyncingBanks(true);
    setTimeout(() => {
      setBankAccounts(prev => prev.map(acc => ({
        ...acc,
        balance: Math.max(10, acc.balance + (Math.random() * 40 - 20)),
        lastSyncedAt: 'Just now',
        status: 'connected'
      })));
      setIsSyncingBanks(false);
    }, 1200);
  };

  // Receipt Handlers
  const handleAddReceipt = (rec: Omit<Receipt, 'id'>) => {
    const created: Receipt = {
      ...rec,
      id: `rec-${Date.now()}`
    };
    setReceipts(prev => [created, ...prev]);
  };

  const handleDeleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  // Transaction Category Update
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  // Dynamic Page Title
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'DASHBOARD';
      case 'monthly-reports': return 'MONTHLY REPORT(S)';
      case 'bank-accounts': return 'BANK ACCOUNT(S)';
      case 'receipts': return 'RECEIPTS';
      case 'categorize': return 'CATEGORIZE';
      case 'user-profile': return 'USER PROFILE';
      case 'support': return 'SUPPORT';
      default: return 'DASHBOARD';
    }
  };

  return (
    <div className="min-h-screen bg-[#242031] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        onOpenEmailLog={() => setIsEmailModalOpen(true)}
      />

      {/* Main App Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#242031] pb-12 overflow-y-auto">
        <Header
          title={getPageTitle()}
          profile={profile}
          unreadDispatchesCount={emailDispatches.length}
          onOpenEmailLog={() => setIsEmailModalOpen(true)}
          onSyncBankAccounts={currentTab === 'dashboard' || currentTab === 'bank-accounts' ? handleSyncAllBanks : undefined}
          isSyncing={isSyncingBanks}
        />

        {/* View Routing */}
        <div className="flex-1">
          {currentTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              bankAccounts={bankAccounts}
              transactions={transactions}
              monthlyReports={monthlyReports}
              onNavigateToReports={() => setCurrentTab('monthly-reports')}
              onNavigateToBankAccounts={() => setCurrentTab('bank-accounts')}
              onNavigateToCategorize={() => setCurrentTab('categorize')}
              onSyncBankAccounts={handleSyncAllBanks}
              isSyncing={isSyncingBanks}
            />
          )}

          {currentTab === 'monthly-reports' && (
            <MonthlyReportView
              reports={monthlyReports}
              currentReportId={currentReportId}
              onSelectReport={setCurrentReportId}
              profile={profile}
              receipts={receipts}
              onUpdateReport={handleUpdateReport}
              onSubmitReportToLIT={handleSubmitMonthlyReport}
              onNavigateToProfile={() => setCurrentTab('user-profile')}
            />
          )}

          {currentTab === 'bank-accounts' && (
            <BankAccountsView
              bankAccounts={bankAccounts}
              onAddAccount={handleAddBankAccount}
              onUpdateAccount={handleUpdateBankAccount}
              onDeleteAccount={handleDeleteBankAccount}
              onSyncAll={handleSyncAllBanks}
              isSyncing={isSyncingBanks}
            />
          )}

          {currentTab === 'receipts' && (
            <ReceiptsView
              receipts={receipts}
              onAddReceipt={handleAddReceipt}
              onDeleteReceipt={handleDeleteReceipt}
            />
          )}

          {currentTab === 'categorize' && (
            <CategorizeView
              transactions={transactions}
              onUpdateTransaction={handleUpdateTransaction}
            />
          )}

          {currentTab === 'user-profile' && (
            <UserProfileView
              profile={profile}
              lits={lits}
              onSaveProfile={handleSaveProfile}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'support' && (
            <SupportView
              profile={profile}
            />
          )}
        </div>
      </main>

      {/* Automated LIT Email Dispatch Toast Notification */}
      {latestDispatchToast && (
        <div 
          onClick={() => {
            setActiveDispatchForModal(latestDispatchToast);
            setIsEmailModalOpen(true);
            setLatestDispatchToast(null);
          }}
          className="fixed bottom-6 right-6 max-w-md bg-[#1d1a27] text-white border-2 border-[#b6b3ff] rounded-2xl p-4 shadow-2xl z-50 cursor-pointer animate-in slide-in-from-bottom duration-300 flex items-start gap-3.5 hover:bg-[#282436] transition"
        >
          <div className="w-9 h-9 rounded-xl bg-[#b6b3ff] text-[#242031] flex items-center justify-center shrink-0">
            <MailCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase text-[#b6b3ff] tracking-wider">
                Automated LIT Dispatch Sent
              </span>
              <span className="text-[10px] text-slate-400">Just now</span>
            </div>
            <div className="text-xs font-bold text-white truncate">
              {latestDispatchToast.subject}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 truncate">
              Delivered to: {latestDispatchToast.recipientEmail} ({latestDispatchToast.recipientName?.split(',')[0]})
            </div>
            <div className="text-[10px] text-[#fbf050] font-bold mt-1.5 underline">
              Click to view transmission record &rarr;
            </div>
          </div>
        </div>
      )}

      {/* LIT Email Dispatch History & Inspector Modal */}
      <EmailDispatchModal
        dispatches={emailDispatches}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        activeDispatch={activeDispatchForModal}
      />
    </div>
  );
}
