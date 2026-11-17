import React, { useState, useEffect, useRef } from 'react';
import {
  UserCircleIcon,
  PencilIcon,
  UploadIcon,
  FilterIcon,
  BankIcon,
  MailIcon,
  IdBadgeIcon,
  MapPinIcon,
  CheckIcon,
  ChevronDownIcon,
  CancelIcon,
  ShieldCheckeredIcon,
  SaveIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton, getCleanSlateButtonClass } from './ui/CleanSlateButton';
import { UserProfile, LIT } from '../types';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';
import { getMailtoUrl, formatCurrency } from '../lib/formatters';

interface UserProfileViewProps {
  profile: UserProfile;
  lits: LIT[];
  onSaveProfile: (updatedProfile: UserProfile) => Promise<void>;
  onCancel: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  lits,
  onSaveProfile,
  onCancel
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [sendHistoryToLIT, setSendHistoryToLIT] = useState<boolean>(false);

  // LIT Search and Dropdown State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [provinceFilter, setProvinceFilter] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtered LITs based on user search and province
  const filteredLITs = lits.filter(lit => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      lit.name.toLowerCase().includes(q) ||
      lit.firm.toLowerCase().includes(q) ||
      lit.province.toLowerCase().includes(q) ||
      lit.city.toLowerCase().includes(q) ||
      lit.licenseNumber.toLowerCase().includes(q);
    
    const matchesProvince = provinceFilter === 'All' || lit.province.toLowerCase().includes(provinceFilter.toLowerCase());
    return matchesQuery && matchesProvince;
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLIT = (lit: LIT) => {
    setFormData(prev => ({
      ...prev,
      litId: lit.id,
      litName: lit.name,
      litFirm: lit.firm,
      litEmail: lit.email,
      litPhone: lit.phone
    }));
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        employmentContractFileName: file.name
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        avatarUrl: url
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLitObj = lits.find(l => l.id === formData.litId);

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Main Profile Card */}
        <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-8">
          
          {/* Header & Avatar Area */}
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#8c93fc]/25">
              <UserCircleIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
                USER PROFILE
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-[1.5px] border-[#101010] bg-white flex items-center justify-center shadow-[2px_3px_0px_#a5a7fb]">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-16 h-16 text-[#6e6b7b]" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[#F9F45D] text-[#3B3B3B] rounded-full border-[1.5px] border-[#010101] shadow-[1px_2px_0px_#010101] flex items-center justify-center cursor-pointer hover:brightness-105 transition"
                  title="Change Avatar"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <div>
                <div className="text-lg font-extrabold text-[#101010]">
                  {formData.firstName} {formData.lastName}
                </div>
                <div className="text-xs text-[#6e6b7b] font-medium tabular-nums">
                  Estate File Ref: CS-2022-BC-9104 · Canadian Personal Bankruptcy
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: CONTACT INFORMATION */}
          <div className="space-y-4 pt-2 border-t border-[#8c93fc]/25">
            <div className="text-xs font-extrabold tracking-wide uppercase text-[#101010]">
              CONTACT INFORMATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="First Name"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <FloatingInput
                label="Last Name"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <FloatingInput
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <FloatingInput
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="pt-2 text-xs font-bold text-slate-600">
              Address
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="Address Line 1"
                value={formData.addressLine1}
                onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                required
              />
              <FloatingInput
                label="Address Line 2 (Optional)"
                value={formData.addressLine2 || ''}
                onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
              />
              <FloatingInput
                label="Province / Territory"
                value={formData.province}
                onChange={e => setFormData({ ...formData, province: e.target.value })}
                required
              />
              <FloatingInput
                label="Postal Code"
                value={formData.postalCode}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                required
              />
            </div>
          </div>

          {/* SECTION 2: EMPLOYMENT INFORMATION */}
          <div className="space-y-4 pt-4 border-t border-[#8c93fc]/25">
            <div className="text-xs font-extrabold tracking-wide uppercase text-[#101010]">
              EMPLOYMENT INFORMATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="Current Title"
                value={formData.currentTitle}
                onChange={e => setFormData({ ...formData, currentTitle: e.target.value })}
                required
              />
              <FloatingInput
                label="Company"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            {/* Salary, Frequency & Contract Upload Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4">
                <FloatingInput
                  type="number"
                  step="0.01"
                  label="Monthly Gross Salary ($)"
                  value={formData.monthlySalary || ''}
                  onChange={e => setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="sm:col-span-4">
                <FloatingSelect
                  label="Pay Frequency"
                  value={formData.payFrequency}
                  onChange={e => setFormData({ ...formData, payFrequency: e.target.value as any })}
                  options={[
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Bi-Weekly', label: 'Bi-Weekly (Every 2 weeks)' },
                    { value: 'Semi-Monthly', label: 'Semi-Monthly (Twice a month)' },
                    { value: 'Weekly', label: 'Weekly' }
                  ]}
                />
              </div>

              {/* Upload Contract Button matching mockup */}
              <div className="sm:col-span-4">
                <label 
                  htmlFor="contract-upload"
                  className={getCleanSlateButtonClass('white', 'lg', true, 'min-h-[52px]')}
                >
                  <UploadIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {formData.employmentContractFileName || 'Upload Employment Contract'}
                  </span>
                  <input
                    id="contract-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                    onChange={handleContractUpload}
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-slate-600">
              Company Address
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="Address Line 1"
                value={formData.companyAddressLine1}
                onChange={e => setFormData({ ...formData, companyAddressLine1: e.target.value })}
              />
              <FloatingInput
                label="Address Line 2 (Optional)"
                value={formData.companyAddressLine2 || ''}
                onChange={e => setFormData({ ...formData, companyAddressLine2: e.target.value })}
              />
              <FloatingInput
                label="Province / State"
                value={formData.companyProvince}
                onChange={e => setFormData({ ...formData, companyProvince: e.target.value })}
              />
              <FloatingInput
                label="Postal Code"
                value={formData.companyPostalCode}
                onChange={e => setFormData({ ...formData, companyPostalCode: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 3: LICENSED INSOLVENCY TRUSTEE (LIT) DATABASE INTEGRATION */}
          <div className="space-y-4 pt-4 border-t border-[#8c93fc]/25">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold tracking-wide uppercase text-[#101010] flex items-center gap-2">
                  <ShieldCheckeredIcon className="w-4 h-4 text-[#8c93fc]" />
                  LICENSED INSOLVENCY TRUSTEE (LIT) ASSIGNMENT
                </div>
                <p className="text-xs text-[#4b4856] mt-0.5">
                  Search and select the Licensed Insolvency Trustee overseeing your statutory bankruptcy estate.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#6e6b7b] uppercase tracking-widest hidden sm:inline">
                Connected to LIT Registry
              </span>
            </div>

            {/* Currently Selected LIT Card */}
            {selectedLitObj && (
              <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-[#101010]">{selectedLitObj.name}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[10px] font-bold border border-[#101010]/15">
                      Active Trustee
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#4b4856] flex items-center gap-1.5">
                    <BankIcon className="w-3.5 h-3.5 text-[#8c93fc]" />
                    <span>{selectedLitObj.firm}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-[#6e6b7b] text-[11px]">{selectedLitObj.licenseNumber}</span>
                  </div>
                  <div className="text-xs text-[#6e6b7b] flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1">
                      <MailIcon className="w-3.5 h-3.5 text-[#8c93fc]" />
                      <a
                        href={getMailtoUrl(selectedLitObj.email)}
                        className="font-semibold text-[#101010] underline hover:text-[#6366f1] transition"
                        title="Send email to LIT"
                      >
                        {selectedLitObj.email}
                      </a>
                    </span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <IdBadgeIcon className="w-3.5 h-3.5 text-[#8c93fc]" />
                      <span>{selectedLitObj.phone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 text-[#8c93fc]" />
                      <span>{selectedLitObj.city}, {selectedLitObj.province}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 bg-[#fbf9f5] border border-[#d8d9f8] rounded-xl p-3 text-center sm:text-right text-[11px] text-[#4b4856]">
                  <span className="block text-[#6e6b7b] text-[10px] uppercase font-bold">Auto-Dispatch Target</span>
                  <a
                    href={getMailtoUrl(selectedLitObj.email)}
                    className="font-semibold text-[#101010] underline hover:text-[#6366f1] transition"
                    title="Send email to Auto-Dispatch Target"
                  >
                    {selectedLitObj.email}
                  </a>
                </div>
              </div>
            )}

            {/* Searchable Predefined Dropdown connected to database */}
            <div className="relative" ref={dropdownRef}>
              <div
                className="w-full bg-white border border-[#767676] rounded-xl px-4 py-3.5 min-h-[44px] text-xs flex items-center justify-between cursor-pointer hover:border-[#101010] shadow-[2px_3px_0px_#a5a7fb] transition"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-2.5 text-[#101010] truncate">
                  <FilterIcon className="w-4 h-4 text-[#8c93fc] shrink-0" />
                  <span className="font-medium truncate text-[#4b4856]">
                    {formData.litName ? `Change LIT: ${formData.litName} (${formData.litFirm})` : 'Search & select Licensed Insolvency Trustee from database...'}
                  </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-[#4b4856] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border-[1.5px] border-[#101010] rounded-2xl shadow-[5px_6px_0px_#000000] z-30 p-3 space-y-2.5 animate-in fade-in duration-150">
                  <div className="relative">
                    <FilterIcon className="w-4 h-4 text-[#6e6b7b] absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="Type trustee name, firm (e.g. BDO, MNP, Sands), city, or license #..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-[#fbf9f5] border border-[#d8d9f8] rounded-xl pl-9 pr-4 py-3 min-h-[44px] text-xs text-[#101010] placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#a5a7fb]"
                      autoFocus
                    />
                  </div>

                  {/* Province Quick Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#4b4856] pb-2 border-b border-[#d8d9f8]/70">
                    <span className="text-[10px] text-[#6e6b7b] font-bold uppercase mr-1">Province:</span>
                    {['All', 'British Columbia', 'Alberta', 'Ontario', 'Quebec', 'Manitoba', 'Saskatchewan', 'Nova Scotia'].map((prov) => (
                      <CleanSlateButton
                        key={prov}
                        variant={provinceFilter === prov ? 'dark' : 'white'}
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProvinceFilter(prov);
                        }}
                      >
                        {prov === 'British Columbia' ? 'BC' : prov === 'Alberta' ? 'AB' : prov === 'Ontario' ? 'ON' : prov === 'Quebec' ? 'QC' : prov === 'Manitoba' ? 'MB' : prov === 'Saskatchewan' ? 'SK' : prov === 'Nova Scotia' ? 'NS' : 'All Canada'}
                      </CleanSlateButton>
                    ))}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {filteredLITs.length > 0 ? (
                      filteredLITs.map(lit => {
                        const isSelected = lit.id === formData.litId;
                        return (
                          <div
                            key={lit.id}
                            onClick={() => handleSelectLIT(lit)}
                            className={`p-3 rounded-xl transition cursor-pointer text-xs flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#f7f4eb] border border-[#101010]'
                                : 'hover:bg-[#fbf9f5] border border-transparent'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-extrabold text-[#101010] flex items-center gap-1.5">
                                <span>{lit.name}</span>
                                {isSelected && <CheckIcon className="w-3.5 h-3.5 text-emerald-700" />}
                              </div>
                              <div className="text-[#4b4856] font-semibold">{lit.firm}</div>
                              <div className="text-[11px] text-[#6e6b7b] flex items-center gap-2 flex-wrap">
                                <span>{lit.city}, {lit.province}</span>
                                <span>·</span>
                                <span className="font-mono">{lit.licenseNumber}</span>
                                <span>·</span>
                                <span className="text-[#4b4856]">{lit.email}</span>
                              </div>
                            </div>
                            <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[#101010] text-[#101010]">
                              {isSelected ? 'Active' : 'Select'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-[#6e6b7b]">
                        No Licensed Insolvency Trustees found matching &ldquo;{searchQuery}&rdquo; in {provinceFilter}.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Explicit Opt-In Toggle for LIT Historical Data Transmission */}
          <div className="bg-white border border-[#d8d9f8] rounded-2xl p-4 text-xs text-[#4b4856] space-y-2.5">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="sendHistoryCheckbox"
                checked={sendHistoryToLIT}
                onChange={e => setSendHistoryToLIT(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#767676] text-[#101010] focus:ring-[#a5a7fb] cursor-pointer accent-[#46e3a5]"
              />
              <label htmlFor="sendHistoryCheckbox" className="cursor-pointer space-y-1 select-none">
                <div className="font-bold text-[#101010] text-xs">
                  Transmit past bankruptcy filing reports and document history to newly assigned LIT upon saving
                </div>
                <p className="text-[11px] text-[#6e6b7b] leading-relaxed">
                  Defaulting to sending all history may result in spamming trustees during exploration. Keep this unchecked unless you are officially transferring your active bankruptcy estate to{' '}
                  <a href={getMailtoUrl(formData.litEmail)} className="underline font-semibold text-[#101010] hover:text-[#6366f1] transition" title="Send email to trustee">
                    {formData.litEmail || 'the selected trustee'}
                  </a>.
                </p>
              </label>
            </div>

            {sendHistoryToLIT && (
              <div className="p-2.5 bg-[#fbf050]/30 border border-[#101010]/20 rounded-xl text-[11px] text-[#101010] font-medium flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-[#101010] shrink-0" />
                <span>
                  <strong>Transmission target:</strong>{' '}
                  <a href={getMailtoUrl(formData.litEmail)} className="underline hover:opacity-80 transition">{formData.litEmail}</a> will receive full estate history upon clicking Save.
                </span>
              </div>
            )}

            {saveSuccess && (
              <span className="inline-flex bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20 font-bold px-3 py-1 rounded-xl text-xs items-center gap-1.5 animate-in fade-in">
                <CheckIcon className="w-3.5 h-3.5" />
                Profile saved {sendHistoryToLIT ? `and data dispatched to ${formData.litEmail}` : 'without sending historical reports to LIT.'}
              </span>
            )}
          </div>

          {/* Action Buttons: Cancel (white) and Save (yellow) */}
          <div className="flex items-center justify-between pt-4 border-t border-[#8c93fc]/25">
            <CleanSlateButton
              variant="white"
              size="md"
              leftIcon={CancelIcon}
              onClick={onCancel}
            >
              Cancel
            </CleanSlateButton>

            <CleanSlateButton
              type="submit"
              variant="yellow"
              size="md"
              leftIcon={SaveIcon}
              disabled={isSaving}
            >
              {isSaving ? 'Dispatching to LIT...' : 'Save'}
            </CleanSlateButton>
          </div>
        </div>
      </form>
    </div>
  );
};
