import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCircle2, 
  Pencil, 
  Upload, 
  Search, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Check, 
  ChevronDown, 
  X, 
  ShieldCheck, 
  Save,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { UserProfile, LIT } from '../types';

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

  // LIT Search and Dropdown State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtered LITs based on user search
  const filteredLITs = lits.filter(lit => {
    const q = searchQuery.toLowerCase();
    return (
      lit.name.toLowerCase().includes(q) ||
      lit.firm.toLowerCase().includes(q) ||
      lit.province.toLowerCase().includes(q) ||
      lit.city.toLowerCase().includes(q) ||
      lit.licenseNumber.toLowerCase().includes(q)
    );
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
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Main Profile Card (Off-white / cream `#fbf9f5`) matching screenshot */}
        <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Header & Avatar Area */}
          <div>
            <h2 className="text-base font-extrabold tracking-wider uppercase text-slate-900 mb-6">
              USER PROFILE
            </h2>

            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-200 flex items-center justify-center shadow-xs">
                  {formData.avatarUrl ? (
                    <img 
                      src={formData.avatarUrl} 
                      alt="User avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <UserCircle2 className="w-16 h-16 text-slate-400" />
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition shadow-xs text-slate-700"
                  title="Change Avatar"
                >
                  <Pencil className="w-3.5 h-3.5" />
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
                <div className="text-lg font-black text-slate-900">
                  {formData.firstName} {formData.lastName}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Estate File Ref: CS-2022-BC-9104 · Canadian Personal Bankruptcy
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: CONTACT INFORMATION */}
          <div className="space-y-4">
            <div className="text-xs font-extrabold tracking-wider uppercase text-slate-900">
              CONTACT INFORMATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
            </div>

            <div className="pt-2 text-xs font-bold text-slate-600">
              Address
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={formData.addressLine1}
                  onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={formData.addressLine2 || ''}
                  onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Province / State"
                  value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={formData.postalCode}
                  onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: EMPLOYMENT INFORMATION */}
          <div className="space-y-4">
            <div className="text-xs font-extrabold tracking-wider uppercase text-slate-900">
              EMPLOYMENT INFORMATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Current Title"
                  value={formData.currentTitle}
                  onChange={e => setFormData({ ...formData, currentTitle: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Company"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
            </div>

            {/* Salary, Frequency & Contract Upload Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4 relative">
                <span className="absolute left-4 top-3 text-xs text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  placeholder="Monthly Gross Salary"
                  value={formData.monthlySalary || ''}
                  onChange={e => setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={formData.payFrequency}
                  onChange={e => setFormData({ ...formData, payFrequency: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium appearance-none"
                >
                  <option value="Select...">Select Pay Frequency...</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Weekly">Bi-Weekly (Every 2 weeks)</option>
                  <option value="Semi-Monthly">Semi-Monthly (Twice a month)</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              {/* Upload Contract Button matching mockup */}
              <div className="sm:col-span-4">
                <label 
                  htmlFor="contract-upload"
                  className="w-full py-3 px-4 rounded-xl border border-slate-800 bg-white hover:bg-slate-50 text-slate-900 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4 text-slate-800" />
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
              <div>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={formData.companyAddressLine1}
                  onChange={e => setFormData({ ...formData, companyAddressLine1: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={formData.companyAddressLine2 || ''}
                  onChange={e => setFormData({ ...formData, companyAddressLine2: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Province / State"
                  value={formData.companyProvince}
                  onChange={e => setFormData({ ...formData, companyProvince: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={formData.companyPostalCode}
                  onChange={e => setFormData({ ...formData, companyPostalCode: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: LICENSED INSOLVENCY TRUSTEE (LIT) DATABASE INTEGRATION */}
          {/* Specifically required by user prompt */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold tracking-wider uppercase text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  LICENSED INSOLVENCY TRUSTEE (LIT) ASSIGNMENT
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search and select the Licensed Insolvency Trustee overseeing your statutory bankruptcy estate.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                Connected to LIT Registry Database
              </span>
            </div>

            {/* Currently Selected LIT Card */}
            {selectedLitObj && (
              <div className="bg-white border-2 border-[#b4b1fc] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{selectedLitObj.name}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active Trustee
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLitObj.firm}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500 text-[11px]">{selectedLitObj.licenseNumber}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-700">{selectedLitObj.email}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedLitObj.phone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedLitObj.city}, {selectedLitObj.province}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center sm:text-right text-[11px] text-slate-600">
                  <span className="block text-slate-400 text-[10px] uppercase font-bold">Auto-Dispatch Target</span>
                  <span className="font-bold text-slate-800">{selectedLitObj.email}</span>
                </div>
              </div>
            )}

            {/* Searchable Predefined Dropdown connected to database */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs flex items-center justify-between cursor-pointer hover:border-slate-400 transition"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-2.5 text-slate-700 truncate">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={formData.litName ? 'font-bold text-slate-900' : 'text-slate-400'}>
                    {formData.litName ? `Change LIT: ${formData.litName} (${formData.litFirm})` : 'Search & select Licensed Insolvency Trustee from database...'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-3 space-y-2 animate-in fade-in duration-150">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type trustee name, firm (e.g. BDO, MNP, Sands), city, or license #..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc]"
                      autoFocus
                    />
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
                                ? 'bg-[#b4b1fc]/20 border border-[#b4b1fc]'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{lit.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <div className="text-slate-600 font-semibold">{lit.firm}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>{lit.city}, {lit.province}</span>
                                <span>·</span>
                                <span className="font-mono">{lit.licenseNumber}</span>
                                <span>·</span>
                                <span className="text-slate-600">{lit.email}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                            >
                              Select
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No Licensed Insolvency Trustees found matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Automated LIT Email Dispatch Notice */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-600 shrink-0" />
              <span>
                <strong>Automated Trustee Sync:</strong> When you click <span className="font-bold text-slate-900">Save</span>, all updated contact, address, and employment details will automatically be transmitted to <strong className="text-slate-900">{formData.litEmail || 'your LIT'}</strong>.
              </span>
            </div>
            {saveSuccess && (
              <span className="shrink-0 bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dispatched to LIT!
              </span>
            )}
          </div>

          {/* Action Buttons matching screenshot: Cancel (border) and Save (yellow) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-2xl border border-slate-800 hover:bg-slate-100 text-slate-900 text-xs font-black transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-10 py-3.5 rounded-2xl bg-[#fbf050] hover:bg-[#eade41] text-[#1d1a27] text-xs font-black transition shadow-sm flex items-center gap-2"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Dispatching to LIT...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
