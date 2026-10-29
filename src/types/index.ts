export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  province: string;
  postalCode: string;
  currentTitle: string;
  company: string;
  monthlySalary: number;
  payFrequency: 'Monthly' | 'Bi-Weekly' | 'Semi-Monthly' | 'Weekly' | 'Select...';
  companyAddressLine1: string;
  companyAddressLine2?: string;
  companyProvince: string;
  companyPostalCode: string;
  litId?: string;
  litName?: string;
  litFirm?: string;
  litEmail?: string;
  litPhone?: string;
  maritalStatus: string;
  spouseName?: string;
  householdSize: number;
  avatarUrl?: string;
  employmentContractFileName?: string;
  updatedAt?: string;
}

export interface LIT {
  id: string;
  name: string;
  firm: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  licenseNumber: string;
  address: string;
}

export interface Form65Income {
  debtor: {
    employmentIncome: number;
    pensionAnnuities: number;
    childSupport: number;
    spousalSupport: number;
    employmentIncomeBenefits: number;
    socialAssistance: number;
    selfEmploymentIncome: number;
    childTaxBenefit: number;
    otherNetIncome: number;
  };
  spouse: {
    employmentIncome: number;
    pensionAnnuities: number;
    childSupport: number;
    spousalSupport: number;
    employmentIncomeBenefits: number;
    socialAssistance: number;
    selfEmploymentIncome: number;
    childTaxBenefit: number;
    otherNetIncome: number;
  };
}

export interface Form65NonDiscretionary {
  childSupportPayments: number;
  spousalSupportPayments: number;
  childCare: number;
  medicalConditionExpenses: number;
  finesPenaltiesCourt: number;
  expensesConditionEmployment: number;
  debtsStayLifted: number;
  attachments?: {
    [key: string]: string[]; // lineItemKey -> array of receipt IDs
  };
}

export interface Form65Discretionary {
  housing: {
    rentOrMortgage: number;
    propertyTaxesCondo: number;
    heatingGasOil: number;
    telephone: number;
    cable: number;
    hydro: number;
    water: number;
    furniture: number;
    other: number;
  };
  personal: {
    smoking: number;
    alcohol: number;
    heatingGasOil: number;
    rentOrMortgage: number;
    cable: number;
    hydro: number;
    water: number;
    furniture: number;
    other: number;
  };
  medical: {
    prescriptions: number;
    dental: number;
    other: number;
  };
  dayToDay: {
    foodGrocery: number;
    laundryDryCleaning: number;
    groomingToiletries: number;
    clothing: number;
    other: number;
  };
  transportation: {
    repairMaintenanceGas: number;
    publicTransportation: number;
    other: number;
  };
  insurance: {
    vehicle: number;
    house: number;
    furnitureContents: number;
    lifeInsurance: number;
    other: number;
  };
  payments: {
    toEstate: number;
    toSecuredCreditor: number;
    otherThanMortgageOrVehicle: number;
    groomingToiletries: number;
    other: number;
  };
}

export interface MonthlyReport {
  id: string;
  userId: string;
  month: string;
  year: number;
  status: 'Draft' | 'Submitted' | 'Overdue';
  lastEditDate: string;
  submittedAt?: string;
  sentToLitEmail?: string;
  sentToLitName?: string;
  income: Form65Income;
  nonDiscretionary: Form65NonDiscretionary;
  discretionary: Form65Discretionary;
  totalIncome?: number;
  totalNonDiscretionary?: number;
  totalDiscretionary?: number;
  netMonthlyIncome?: number;
  surplusIncomePayment?: number;
}

export interface BankAccount {
  id: string;
  userId: string;
  institution: string;
  name: string;
  accountMask: string;
  accountType: 'Chequing' | 'Savings' | 'Credit Card' | 'Rent Savings' | 'Tax Buffer';
  balance: number;
  currency: string;
  lastSyncedAt: string;
  status: 'connected' | 'syncing' | 'error';
  trendDirection?: 'up' | 'down';
}

export interface Transaction {
  id: string;
  userId: string;
  accountId?: string;
  company: string;
  date: string;
  amount: number;
  category: string;
  form65Category?: string;
  isCategorized: boolean;
  status?: 'cleared' | 'pending';
}

export interface Receipt {
  id: string;
  userId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  fileUrl?: string;
  fileName?: string;
  linkedLineItem?: string;
  reportMonth?: string;
}

export interface EmailDispatch {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  eventType: 'PROFILE_UPDATED' | 'MONTHLY_REPORT_SUBMITTED' | 'RECEIPT_BATCH_FILED';
  body: string;
  sentAt: string;
  status: 'Delivered' | 'Pending';
  details?: {
    reportMonth?: string;
    surplusPayment?: number;
    fieldsUpdated?: string[];
  };
}
