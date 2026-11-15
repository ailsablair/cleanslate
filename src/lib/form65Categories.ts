export interface Form65OptionDef {
  value: string;
  label: string;
}

export interface Form65SectionDef {
  group: string;
  shortGroup: string;
  options: Form65OptionDef[];
}

export const FORM_65_SECTIONED_CATEGORIES: Form65SectionDef[] = [
  {
    group: 'FAMILY INCOME (NET)',
    shortGroup: 'Family Income (Net)',
    options: [
      { value: 'Employment Income', label: 'Employment Income' },
      { value: 'Pension/Annuities', label: 'Pension/Annuities' },
      { value: 'Child Support', label: 'Child Support' },
      { value: 'Spousal Support', label: 'Spousal Support' },
      { value: 'Employment Insurance Benefits', label: 'Employment Insurance Benefits' },
      { value: 'Social Assistance', label: 'Social Assistance' },
      { value: 'Self-Employment Income', label: 'Self-Employment Income' },
      { value: 'Child Tax Benefit', label: 'Child Tax Benefit' },
      { value: 'Other Net Income', label: 'Other Net Income' }
    ]
  },
  {
    group: 'FAMILY NON-DISCRETIONARY EXPENSES',
    shortGroup: 'Family Non-Discretionary Expenses',
    options: [
      { value: 'Child Support Payments', label: 'Child Support Payments' },
      { value: 'Spousal Support Payments', label: 'Spousal Support' },
      { value: 'Child Care', label: 'Child Care' },
      { value: 'Medical Condition Expenses', label: 'Medical Condition Expenses' },
      { value: 'Court Mandated Fines/Penalties', label: 'Court Mandated Fines/Penalties' },
      { value: 'Employment Expenses', label: 'Employment Expenses' },
      { value: 'Debts (Stay Lifted)', label: 'Debts (Stay Lifted)' },
      { value: 'Other Non-Discretionary Expenses', label: 'Other Expenses' }
    ]
  },
  {
    group: 'HOUSING EXPENSES',
    shortGroup: 'Housing Expenses',
    options: [
      { value: 'Rent/Mortgage', label: 'Rent/Mortgage' },
      { value: 'Property Taxes/Condo Fees', label: 'Property Taxes/Condo Fees' },
      { value: 'Heating/Gas/Oil', label: 'Heating/Gas/Oil' },
      { value: 'Telephone', label: 'Telephone' },
      { value: 'Cable', label: 'Cable' },
      { value: 'Hydro', label: 'Hydro' },
      { value: 'Water', label: 'Water' },
      { value: 'Furniture', label: 'Furniture' },
      { value: 'Other Housing Expenses', label: 'Other Expenses' }
    ]
  },
  {
    group: 'PERSONAL EXPENSES',
    shortGroup: 'Personal Expenses',
    options: [
      { value: 'Smoking', label: 'Smoking' },
      { value: 'Alcohol', label: 'Alcohol' },
      { value: 'Dining/Lunches/Restaurants', label: 'Dining/Lunches/Restaurants' },
      { value: 'Entertainment/Sports', label: 'Entertainment/Sports' },
      { value: 'Gifts & Charitable Donations', label: 'Gifts & Charitable Donations' },
      { value: 'Allowances', label: 'Allowances' },
      { value: 'Other Personal Expenses', label: 'Other Expenses' }
    ]
  },
  {
    group: 'LIVING EXPENSES',
    shortGroup: 'Living Expenses',
    options: [
      { value: 'Food/Grocery', label: 'Food/Grocery' },
      { value: 'Laundry & Dry Cleaning', label: 'Laundry & Dry Cleaning' },
      { value: 'Grooming & Toiletries', label: 'Grooming & Toiletries' },
      { value: 'Clothing', label: 'Clothing' },
      { value: 'Other Living Expenses', label: 'Other Living Expenses' }
    ]
  },
  {
    group: 'TRANSPORTATION EXPENSES',
    shortGroup: 'Transportation Expenses',
    options: [
      { value: 'Repair/Maintenance/Gas', label: 'Repair/Maintenance/Gas' },
      { value: 'Public Transportation', label: 'Public Transportation' },
      { value: 'Other Transportation Expenses', label: 'Other Transportation Expenses' }
    ]
  },
  {
    group: 'INSURANCE EXPENSES',
    shortGroup: 'Insurance Expenses',
    options: [
      { value: 'Vehicle', label: 'Vehicle' },
      { value: 'House', label: 'House' },
      { value: 'Furniture & Contents', label: 'Furniture & Contents' },
      { value: 'Life Insurance', label: 'Life Insurance' },
      { value: 'Other Insurance Expenses', label: 'Other Insurance Expenses' }
    ]
  },
  {
    group: 'NON-RECOVERABLE MEDICAL EXPENSES',
    shortGroup: 'Non-Recoverable Medical Expenses',
    options: [
      { value: 'Prescriptions', label: 'Prescriptions' },
      { value: 'Dental', label: 'Dental' },
      { value: 'Other Non-Recoverable Medical Expenses', label: 'Other Non-Recoverable Medical Expenses' }
    ]
  },
  {
    group: 'PAYMENTS',
    shortGroup: 'Payments',
    options: [
      { value: 'To The Estate', label: 'To The Estate' },
      { value: 'To Secured Creditor', label: 'To Secured Creditor' },
      { value: 'Other Than Mortgage or Vehicle', label: 'Other Than Mortgage or Vehicle' },
      { value: 'Other Payments', label: 'Other Payments' }
    ]
  }
];

export const LEGACY_FORM65_CATEGORY_MAP: Record<string, string> = {
  'Employment Income Benefits': 'Employment Insurance Benefits',
  'Fines / Penalties Imposed by Court': 'Court Mandated Fines/Penalties',
  'Employment-Related Mandatory Expenses': 'Employment Expenses',
  'Expenses as a condition of employment': 'Employment Expenses',
  'Expenses as Condition of Employment': 'Employment Expenses',
  'Other Non-Discretionary Deductions': 'Other Non-Discretionary Expenses',
  'Rent or Mortgage Payments': 'Rent/Mortgage',
  'Housing & Utilities': 'Rent/Mortgage',
  'Property Taxes': 'Property Taxes/Condo Fees',
  'Heating / Gas / Oil': 'Heating/Gas/Oil',
  'Water & Sewer': 'Water',
  'Telephone & Digital Utilities': 'Telephone',
  'Cable / Internet': 'Cable',
  'Home Maintenance / Repairs': 'Other Housing Expenses',
  'Smoking & Personal': 'Smoking',
  'Dining Out / Takeout': 'Dining/Lunches/Restaurants',
  'Entertainment & Recreation': 'Entertainment/Sports',
  'Hobbies & Subscriptions': 'Other Personal Expenses',
  'Non-Recoverable Prescriptions': 'Prescriptions',
  'Dental & Optical Care': 'Dental',
  'Medical Supplies & Health Care': 'Other Non-Recoverable Medical Expenses',
  'Food & Grocery': 'Food/Grocery',
  'Household Sundries & Supplies': 'Other Living Expenses',
  'Child & School Expenses': 'Other Living Expenses',
  'Repair, Maintenance & Gas': 'Repair/Maintenance/Gas',
  'Transportation': 'Repair/Maintenance/Gas',
  'Vehicle Financing / Lease': 'Other Transportation Expenses',
  'Public Transit & Commuting': 'Public Transportation',
  'Auto Insurance & Licensing': 'Vehicle',
  'Life & Health Insurance': 'Life Insurance',
  'Legal & Professional Fees': 'Other Payments',
  'To The Estate Dividend': 'To The Estate',
  'Spousal / Child Support': 'Child Support Payments'
};

export function normalizeForm65Category(category?: string): string {
  if (!category) return '';
  return LEGACY_FORM65_CATEGORY_MAP[category] || category;
}
