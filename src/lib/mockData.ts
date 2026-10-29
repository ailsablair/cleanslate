import { UserProfile, MonthlyReport, BankAccount, Transaction, Receipt } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  uid: 'demo-user-chad-001',
  firstName: 'Chad',
  lastName: 'Johnson',
  email: 'chad.johnson@example.com',
  phone: '(234) 999-0044',
  addressLine1: '123 Cleveland Street',
  addressLine2: 'Apt 4B',
  province: 'British Columbia',
  postalCode: 'V6G 1W4',
  currentTitle: 'Project Manager',
  company: 'Company ABD Ltd.',
  monthlySalary: 5200,
  payFrequency: 'Semi-Monthly',
  companyAddressLine1: '800 West Pender Street',
  companyAddressLine2: 'Suite 900',
  companyProvince: 'British Columbia',
  companyPostalCode: 'V6C 2V6',
  litId: 'lit-bdo-001',
  litName: 'Sarah Jenkins, CPA, CIRP, LIT',
  litFirm: 'BDO Canada Limited',
  litEmail: 'sjenkins@bdo.ca',
  litPhone: '(604) 688-5421',
  maritalStatus: 'Married',
  spouseName: 'Jane Johnson',
  householdSize: 2,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  employmentContractFileName: 'Employment_Contract_Chad_Johnson.pdf',
  updatedAt: new Date().toISOString()
};

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-neo-1',
    userId: 'demo-user-chad-001',
    institution: 'Neo Financial',
    name: 'NEO CHEQUING',
    accountMask: '******1234',
    accountType: 'Chequing',
    balance: 4621.94,
    currency: 'CAD',
    lastSyncedAt: 'Today, 8:45 AM',
    status: 'connected',
    trendDirection: 'up'
  },
  {
    id: 'bank-neo-2',
    userId: 'demo-user-chad-001',
    institution: 'Neo Financial',
    name: 'NEO SAVINGS',
    accountMask: '******1234',
    accountType: 'Savings',
    balance: 574.11,
    currency: 'CAD',
    lastSyncedAt: 'Today, 8:45 AM',
    status: 'connected',
    trendDirection: 'down'
  },
  {
    id: 'bank-neo-3',
    userId: 'demo-user-chad-001',
    institution: 'Neo Financial',
    name: 'NEO RENT SAVINGS',
    accountMask: '******1234',
    accountType: 'Rent Savings',
    balance: 34.00,
    currency: 'CAD',
    lastSyncedAt: 'Today, 8:45 AM',
    status: 'connected',
    trendDirection: 'down'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1359874830',
    userId: 'demo-user-chad-001',
    company: 'McDonalds',
    date: 'Sep 01, 2022',
    amount: 18.26,
    category: 'Food & Dining',
    form65Category: 'Food & Grocery',
    isCategorized: true,
    status: 'cleared'
  },
  {
    id: '1357902468',
    userId: 'demo-user-chad-001',
    company: 'ACN Properties',
    date: 'Aug 30, 2022',
    amount: 2800.01,
    category: 'Housing',
    form65Category: 'Rent or Mortgage Payments',
    isCategorized: true,
    status: 'cleared'
  },
  {
    id: '3525893010',
    userId: 'demo-user-chad-001',
    company: 'Midas Mechanics',
    date: 'Aug 29, 2022',
    amount: 800.34,
    category: 'Transportation',
    form65Category: 'Repair, Maintenance & Gas',
    isCategorized: true,
    status: 'cleared'
  },
  {
    id: '2983649020',
    userId: 'demo-user-chad-001',
    company: 'Dropbox',
    date: 'Aug 29, 2022',
    amount: 70.16,
    category: 'Software & Subscriptions',
    form65Category: 'Telephone & Digital Utilities',
    isCategorized: true,
    status: 'cleared'
  },
  {
    id: '4829103948',
    userId: 'demo-user-chad-001',
    company: 'Shoppers Drug Mart',
    date: 'Aug 26, 2022',
    amount: 142.50,
    category: 'Healthcare',
    form65Category: 'Medical Condition Expenses',
    isCategorized: false,
    status: 'cleared'
  },
  {
    id: '5029182390',
    userId: 'demo-user-chad-001',
    company: 'BC Hydro',
    date: 'Aug 24, 2022',
    amount: 98.40,
    category: 'Utilities',
    form65Category: 'Hydro',
    isCategorized: true,
    status: 'cleared'
  },
  {
    id: '6829102834',
    userId: 'demo-user-chad-001',
    company: 'Save-On-Foods',
    date: 'Aug 21, 2022',
    amount: 215.80,
    category: 'Groceries',
    form65Category: 'Food & Grocery',
    isCategorized: true,
    status: 'cleared'
  }
];

export const INITIAL_RECENT_ACTIVITY = [
  { id: 'act-1', company: 'Microsoft', ref: '3485930572', time: '1 Sep 5: 40 am', icon: 'microsoft' },
  { id: 'act-2', company: 'TCS Services', ref: '8478290103', time: '30 Aug 6: 45 pm', icon: 'tcs' },
  { id: 'act-3', company: 'Infosys', ref: '78549031111', time: '28 Aug 8: 20 pm', icon: 'infosys' },
  { id: 'act-4', company: 'IBM', ref: '4523352070', time: '27 Aug 7: 30 pm', icon: 'ibm' },
  { id: 'act-5', company: 'SAP', ref: '1359874830', time: '27 Aug 5:45 am', icon: 'sap' },
  { id: 'act-6', company: 'William Hill', ref: '1352044867', time: '27 Aug 4:15 am', icon: 'williamhill' },
  { id: 'act-7', company: 'Adobe', ref: '2839562904', time: '26 Aug 1:21 pm', icon: 'adobe' },
  { id: 'act-8', company: 'Canva', ref: '0386037703', time: '26 Aug 1:05 pm', icon: 'canva' },
  { id: 'act-9', company: 'Github.com', ref: '0398573959', time: '25 Aug 11:45 am', icon: 'github' }
];

export const INITIAL_MONTHLY_REPORTS: MonthlyReport[] = [
  {
    id: 'rep-sep-2022',
    userId: 'demo-user-chad-001',
    month: 'September',
    year: 2022,
    status: 'Draft',
    lastEditDate: '24 July 2022',
    income: {
      debtor: {
        employmentIncome: 3850,
        pensionAnnuities: 0,
        childSupport: 0,
        spousalSupport: 0,
        employmentIncomeBenefits: 0,
        socialAssistance: 0,
        selfEmploymentIncome: 0,
        childTaxBenefit: 0,
        otherNetIncome: 150
      },
      spouse: {
        employmentIncome: 2400,
        pensionAnnuities: 0,
        childSupport: 0,
        spousalSupport: 0,
        employmentIncomeBenefits: 0,
        socialAssistance: 0,
        selfEmploymentIncome: 0,
        childTaxBenefit: 280,
        otherNetIncome: 0
      }
    },
    nonDiscretionary: {
      childSupportPayments: 0,
      spousalSupportPayments: 0,
      childCare: 350,
      medicalConditionExpenses: 210,
      finesPenaltiesCourt: 0,
      expensesConditionEmployment: 75,
      debtsStayLifted: 0,
      attachments: {
        medicalConditionExpenses: ['rec-med-1'],
        childCare: ['rec-cc-1']
      }
    },
    discretionary: {
      housing: {
        rentOrMortgage: 1850,
        propertyTaxesCondo: 0,
        heatingGasOil: 85,
        telephone: 70,
        cable: 45,
        hydro: 95,
        water: 30,
        furniture: 0,
        other: 0
      },
      personal: {
        smoking: 0,
        alcohol: 25,
        heatingGasOil: 0,
        rentOrMortgage: 0,
        cable: 0,
        hydro: 0,
        water: 0,
        furniture: 0,
        other: 0
      },
      medical: {
        prescriptions: 80,
        dental: 0,
        other: 0
      },
      dayToDay: {
        foodGrocery: 750,
        laundryDryCleaning: 40,
        groomingToiletries: 60,
        clothing: 80,
        other: 35
      },
      transportation: {
        repairMaintenanceGas: 220,
        publicTransportation: 110,
        other: 0
      },
      insurance: {
        vehicle: 145,
        house: 40,
        furnitureContents: 0,
        lifeInsurance: 55,
        other: 0
      },
      payments: {
        toEstate: 159,
        toSecuredCreditor: 0,
        otherThanMortgageOrVehicle: 0,
        groomingToiletries: 0,
        other: 0
      }
    }
  },
  {
    id: 'rep-aug-2022',
    userId: 'demo-user-chad-001',
    month: 'August',
    year: 2022,
    status: 'Draft',
    lastEditDate: '22 July 2022',
    income: {
      debtor: {
        employmentIncome: 3850,
        pensionAnnuities: 0,
        childSupport: 0,
        spousalSupport: 0,
        employmentIncomeBenefits: 0,
        socialAssistance: 0,
        selfEmploymentIncome: 0,
        childTaxBenefit: 0,
        otherNetIncome: 0
      },
      spouse: {
        employmentIncome: 2400,
        pensionAnnuities: 0,
        childSupport: 0,
        spousalSupport: 0,
        employmentIncomeBenefits: 0,
        socialAssistance: 0,
        selfEmploymentIncome: 0,
        childTaxBenefit: 280,
        otherNetIncome: 0
      }
    },
    nonDiscretionary: {
      childSupportPayments: 0,
      spousalSupportPayments: 0,
      childCare: 350,
      medicalConditionExpenses: 180,
      finesPenaltiesCourt: 0,
      expensesConditionEmployment: 50,
      debtsStayLifted: 0
    },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 70, telephone: 70, cable: 45, hydro: 90, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 20, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 60, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 720, laundryDryCleaning: 40, groomingToiletries: 55, clothing: 60, other: 25 },
      transportation: { repairMaintenanceGas: 210, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-jul-2022',
    userId: 'demo-user-chad-001',
    month: 'July',
    year: 2022,
    status: 'Overdue',
    lastEditDate: 'Due 15 Aug 2022',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 150, finesPenaltiesCourt: 0, expensesConditionEmployment: 40, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 65, telephone: 70, cable: 45, hydro: 85, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 15, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 45, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 700, laundryDryCleaning: 35, groomingToiletries: 50, clothing: 50, other: 20 },
      transportation: { repairMaintenanceGas: 190, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-jun-2022',
    userId: 'demo-user-chad-001',
    month: 'June',
    year: 2022,
    status: 'Submitted',
    lastEditDate: 'Submitted on 30 July 2022',
    submittedAt: '2022-07-30T14:32:00Z',
    sentToLitEmail: 'sjenkins@bdo.ca',
    sentToLitName: 'Sarah Jenkins, CPA, CIRP, LIT',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 195, finesPenaltiesCourt: 0, expensesConditionEmployment: 40, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 65, telephone: 70, cable: 45, hydro: 85, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 20, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 75, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 680, laundryDryCleaning: 40, groomingToiletries: 50, clothing: 40, other: 20 },
      transportation: { repairMaintenanceGas: 180, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-may-2022',
    userId: 'demo-user-chad-001',
    month: 'May',
    year: 2022,
    status: 'Submitted',
    lastEditDate: 'Submitted on 7 June 2022',
    submittedAt: '2022-06-07T11:15:00Z',
    sentToLitEmail: 'sjenkins@bdo.ca',
    sentToLitName: 'Sarah Jenkins, CPA, CIRP, LIT',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 140, finesPenaltiesCourt: 0, expensesConditionEmployment: 30, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 65, telephone: 70, cable: 45, hydro: 85, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 10, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 40, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 670, laundryDryCleaning: 35, groomingToiletries: 45, clothing: 30, other: 15 },
      transportation: { repairMaintenanceGas: 170, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-apr-2022',
    userId: 'demo-user-chad-001',
    month: 'April',
    year: 2022,
    status: 'Overdue',
    lastEditDate: 'Due 15 May 2022',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 120, finesPenaltiesCourt: 0, expensesConditionEmployment: 30, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 70, telephone: 70, cable: 45, hydro: 85, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 10, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 35, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 650, laundryDryCleaning: 30, groomingToiletries: 40, clothing: 30, other: 15 },
      transportation: { repairMaintenanceGas: 160, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-mar-2022',
    userId: 'demo-user-chad-001',
    month: 'March',
    year: 2022,
    status: 'Submitted',
    lastEditDate: 'Submitted on 17 May 2022',
    submittedAt: '2022-05-17T09:40:00Z',
    sentToLitEmail: 'sjenkins@bdo.ca',
    sentToLitName: 'Sarah Jenkins, CPA, CIRP, LIT',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 110, finesPenaltiesCourt: 0, expensesConditionEmployment: 30, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 80, telephone: 70, cable: 45, hydro: 90, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 10, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 30, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 640, laundryDryCleaning: 30, groomingToiletries: 40, clothing: 20, other: 10 },
      transportation: { repairMaintenanceGas: 150, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-feb-2022',
    userId: 'demo-user-chad-001',
    month: 'February',
    year: 2022,
    status: 'Submitted',
    lastEditDate: 'Submitted on 10 April 2022',
    submittedAt: '2022-04-10T16:05:00Z',
    sentToLitEmail: 'sjenkins@bdo.ca',
    sentToLitName: 'Sarah Jenkins, CPA, CIRP, LIT',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 90, finesPenaltiesCourt: 0, expensesConditionEmployment: 25, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 95, telephone: 70, cable: 45, hydro: 95, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 10, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 30, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 630, laundryDryCleaning: 30, groomingToiletries: 35, clothing: 20, other: 10 },
      transportation: { repairMaintenanceGas: 150, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  },
  {
    id: 'rep-jan-2022',
    userId: 'demo-user-chad-001',
    month: 'January',
    year: 2022,
    status: 'Submitted',
    lastEditDate: 'Submitted on 2 February 2022',
    submittedAt: '2022-02-02T13:20:00Z',
    sentToLitEmail: 'sjenkins@bdo.ca',
    sentToLitName: 'Sarah Jenkins, CPA, CIRP, LIT',
    income: {
      debtor: { employmentIncome: 3850, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 0, otherNetIncome: 0 },
      spouse: { employmentIncome: 2400, pensionAnnuities: 0, childSupport: 0, spousalSupport: 0, employmentIncomeBenefits: 0, socialAssistance: 0, selfEmploymentIncome: 0, childTaxBenefit: 280, otherNetIncome: 0 }
    },
    nonDiscretionary: { childSupportPayments: 0, spousalSupportPayments: 0, childCare: 350, medicalConditionExpenses: 90, finesPenaltiesCourt: 0, expensesConditionEmployment: 25, debtsStayLifted: 0 },
    discretionary: {
      housing: { rentOrMortgage: 1850, propertyTaxesCondo: 0, heatingGasOil: 110, telephone: 70, cable: 45, hydro: 100, water: 30, furniture: 0, other: 0 },
      personal: { smoking: 0, alcohol: 15, heatingGasOil: 0, rentOrMortgage: 0, cable: 0, hydro: 0, water: 0, furniture: 0, other: 0 },
      medical: { prescriptions: 25, dental: 0, other: 0 },
      dayToDay: { foodGrocery: 620, laundryDryCleaning: 30, groomingToiletries: 35, clothing: 20, other: 10 },
      transportation: { repairMaintenanceGas: 140, publicTransportation: 110, other: 0 },
      insurance: { vehicle: 145, house: 40, furnitureContents: 0, lifeInsurance: 55, other: 0 },
      payments: { toEstate: 159, toSecuredCreditor: 0, otherThanMortgageOrVehicle: 0, groomingToiletries: 0, other: 0 }
    }
  }
];

export const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rec-med-1',
    userId: 'demo-user-chad-001',
    title: 'Dr. Harrison - Medical Prescription (Chronic Pain & Therapy)',
    category: 'Medical Condition Expenses',
    amount: 142.50,
    date: 'Aug 26, 2022',
    fileName: 'Medical_Prescription_Receipt_Aug2022.pdf',
    linkedLineItem: 'medicalConditionExpenses',
    reportMonth: 'September 2022'
  },
  {
    id: 'rec-cc-1',
    userId: 'demo-user-chad-001',
    title: 'Sunrise Montessori Child Care Center Monthly Invoice',
    category: 'Child Care',
    amount: 350.00,
    date: 'Aug 15, 2022',
    fileName: 'Childcare_Receipt_Aug_2022.pdf',
    linkedLineItem: 'childCare',
    reportMonth: 'September 2022'
  },
  {
    id: 'rec-emp-1',
    userId: 'demo-user-chad-001',
    title: 'Mandatory Safety Gear & Boots (Employer Required Condition)',
    category: 'Expenses as a condition of employment',
    amount: 75.00,
    date: 'Aug 10, 2022',
    fileName: 'Work_Safety_Boots_Receipt.pdf',
    linkedLineItem: 'expensesConditionEmployment',
    reportMonth: 'September 2022'
  }
];
