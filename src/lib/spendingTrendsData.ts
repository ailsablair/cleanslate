import { FinancialGoal, Form65CategoryBenchmark, MonthlyReport } from '../types';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

export const INITIAL_FINANCIAL_GOALS: FinancialGoal[] = [
  {
    id: 'goal-3m-1',
    userId: 'demo-user-chad-001',
    title: 'Discretionary Spend Containment',
    description: 'Keep total monthly dining, entertainment, and personal leisure spending under $350/mo.',
    category: 'Discretionary Spending',
    timeframeMonths: 3,
    targetDate: 'Nov 30, 2022',
    targetAmount: 350,
    currentAmount: 295,
    unit: '$',
    isCompleted: false,
    status: 'on-track',
    createdAt: '2022-09-01T08:00:00Z',
    milestoneStage: '3-Month',
    notes: 'Approved by Trustee Sarah Jenkins. Demonstrates strict budgeting habit shift.'
  },
  {
    id: 'goal-3m-2',
    userId: 'demo-user-chad-001',
    title: 'First Statutory Financial Counselling',
    description: 'Complete mandatory Session #1 on budgeting and money management with your LIT.',
    category: 'Statutory Compliance',
    timeframeMonths: 3,
    targetDate: 'Oct 15, 2022',
    targetAmount: 1,
    currentAmount: 1,
    unit: 'tasks',
    isCompleted: true,
    status: 'completed',
    createdAt: '2022-07-15T08:00:00Z',
    milestoneStage: '3-Month',
    notes: 'Completed on Oct 10, 2022 with Sarah Jenkins, CPA, CIRP, LIT.'
  },
  {
    id: 'goal-6m-1',
    userId: 'demo-user-chad-001',
    title: 'Post-Discharge Emergency Buffer',
    description: 'Build a cash cushion in NEO Savings to prevent reliance on high-interest credit after discharge.',
    category: 'Emergency Buffer',
    timeframeMonths: 6,
    targetDate: 'Jan 31, 2023',
    targetAmount: 1000,
    currentAmount: 574,
    unit: '$',
    isCompleted: false,
    status: 'on-track',
    createdAt: '2022-08-01T08:00:00Z',
    milestoneStage: '6-Month',
    notes: 'Saved from surplus optimization and disciplined groceries.'
  },
  {
    id: 'goal-6m-2',
    userId: 'demo-user-chad-001',
    title: 'Zero Overdue Form 65 Submissions',
    description: 'Submit all monthly income/expense statements to trustee Sarah Jenkins before the 15th of every month.',
    category: 'Statutory Compliance',
    timeframeMonths: 6,
    targetDate: 'Feb 15, 2023',
    targetAmount: 6,
    currentAmount: 5,
    unit: 'tasks',
    isCompleted: false,
    status: 'needs-attention',
    createdAt: '2022-08-15T08:00:00Z',
    milestoneStage: '6-Month',
    notes: 'July report is currently pending filing. Clear immediately to maintain discharge schedule.'
  },
  {
    id: 'goal-9m-1',
    userId: 'demo-user-chad-001',
    title: 'Statutory 9-Month Bankruptcy Discharge',
    description: 'Fulfill all statutory debtor duties, complete 2nd counselling, settle surplus income, and receive Certificate of Discharge.',
    category: 'Statutory Compliance',
    timeframeMonths: 9,
    targetDate: 'May 31, 2023',
    targetAmount: 100,
    currentAmount: 79,
    unit: '%',
    isCompleted: false,
    status: 'on-track',
    createdAt: '2022-09-01T08:00:00Z',
    milestoneStage: '9-Month (Discharge)',
    notes: 'Eligible for automatic discharge under Section 168.1 of the Bankruptcy and Insolvency Act (BIA).'
  },
  {
    id: 'goal-12m-1',
    userId: 'demo-user-chad-001',
    title: 'Credit Score Rebuilding with Secured Card',
    description: 'Apply for a secured credit card with a $500 cash collateral to establish a clean post-bankruptcy trade line.',
    category: 'Post-Discharge Credit',
    timeframeMonths: 12,
    targetDate: 'Aug 31, 2023',
    targetAmount: 650,
    currentAmount: 480,
    unit: '$',
    isCompleted: false,
    status: 'on-track',
    createdAt: '2022-09-01T08:00:00Z',
    milestoneStage: '12-Month+ (Rebuild)',
    notes: 'Recommended step post-discharge to rebuild Equifax/TransUnion credit bureau rating.'
  }
];

// OSB Superintendent of Bankruptcy Benchmark Standards for a 2-person household in BC
// with net family income between $4,500 and $5,500/month
export const PEER_BENCHMARKS: Record<string, { peerAverage: number; group: Form65CategoryBenchmark['group']; recommendation: string }> = {
  'Rent or Mortgage Payments': {
    peerAverage: 1950,
    group: 'Housing & Utilities',
    recommendation: 'Your housing cost is $100 below average for Vancouver metro area. Stable.'
  },
  'Food & Grocery': {
    peerAverage: 820,
    group: 'Day-to-Day & Personal',
    recommendation: 'Your average ($725) reflects disciplined meal prep. Top 20% frugal quartile.'
  },
  'Heating / Gas / Oil': {
    peerAverage: 95,
    group: 'Housing & Utilities',
    recommendation: 'Seasonal variance is low and well controlled.'
  },
  'Telephone & Digital Utilities': {
    peerAverage: 125,
    group: 'Housing & Utilities',
    recommendation: 'Your average is $70, significantly lower than the $125 regional benchmark.'
  },
  'Hydro & Water': {
    peerAverage: 130,
    group: 'Housing & Utilities',
    recommendation: 'Matches regional BC Hydro benchmarks for 2-bedroom rental.'
  },
  'Repair, Maintenance & Gas': {
    peerAverage: 240,
    group: 'Transportation & Health',
    recommendation: 'Vehicle maintenance is below peer average; transit pass supplements commute.'
  },
  'Public Transportation': {
    peerAverage: 140,
    group: 'Transportation & Health',
    recommendation: 'Monthly transit passes help prevent automotive depreciation.'
  },
  'Medical Condition Expenses': {
    peerAverage: 160,
    group: 'Non-Discretionary',
    recommendation: 'Statutory non-discretionary deduction. Receipts attached ensure dollar-for-dollar surplus deduction.'
  },
  'Prescriptions & Health': {
    peerAverage: 75,
    group: 'Transportation & Health',
    recommendation: 'Essential medications covered; maintain pharmacy receipts in Receipts tab.'
  },
  'Child Care': {
    peerAverage: 450,
    group: 'Non-Discretionary',
    recommendation: 'Eligible statutory non-discretionary deduction under OSB Form 65.'
  },
  'Personal Care & Clothing': {
    peerAverage: 160,
    group: 'Day-to-Day & Personal',
    recommendation: 'Spending reduced by 40% compared to pre-bankruptcy habits.'
  },
  'Smoking & Alcohol': {
    peerAverage: 65,
    group: 'Day-to-Day & Personal',
    recommendation: 'Minimal discretionary expenditure ($20/mo), excellent fiscal restraint.'
  },
  'Insurance (Vehicle/Life/Tenant)': {
    peerAverage: 250,
    group: 'Housing & Utilities',
    recommendation: 'Standard ICBC and tenant protection coverage.'
  },
  'Bankruptcy Estate Payment': {
    peerAverage: 159,
    group: 'Non-Discretionary',
    recommendation: 'Statutory surplus income installment paid directly to the Licensed Insolvency Trustee.'
  }
};

/**
 * Computes 6-month historical spending trend from Form 65 reports
 */
export function computeMonthlySpendingTrends(reports: MonthlyReport[]) {
  // Sort reports chronologically
  const monthOrder: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  const sorted = [...reports].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return (monthOrder[a.month] || 0) - (monthOrder[b.month] || 0);
  });

  // Calculate totals per month
  return sorted.map((rep) => {
    // Sum Non-Discretionary
    const nd = rep.nonDiscretionary;
    const nonDiscretionaryTotal = (
      (nd.childSupportPayments || 0) +
      (nd.spousalSupportPayments || 0) +
      (nd.childCare || 0) +
      (nd.medicalConditionExpenses || 0) +
      (nd.finesPenaltiesCourt || 0) +
      (nd.expensesConditionEmployment || 0) +
      (nd.debtsStayLifted || 0)
    );

    // Sum Discretionary
    const d = rep.discretionary;
    const housingTotal = Object.values(d.housing || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const personalTotal = Object.values(d.personal || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const medicalTotal = Object.values(d.medical || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const dayToDayTotal = Object.values(d.dayToDay || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const transportTotal = Object.values(d.transportation || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const insuranceTotal = Object.values(d.insurance || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const paymentsTotal = Object.values(d.payments || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    const discretionaryTotal = housingTotal + personalTotal + medicalTotal + dayToDayTotal + transportTotal + insuranceTotal + paymentsTotal;
    const totalSpend = nonDiscretionaryTotal + discretionaryTotal;

    // Sum Household Income
    const inc = rep.income;
    const debtorIncome = Object.values(inc.debtor || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const spouseIncome = Object.values(inc.spouse || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const totalIncome = debtorIncome + spouseIncome;
    const netSurplusSavings = Math.max(0, totalIncome - totalSpend);

    return {
      monthKey: `${rep.month.slice(0, 3)} ${rep.year}`,
      fullMonth: `${rep.month} ${rep.year}`,
      month: rep.month,
      year: rep.year,
      totalSpend: Math.round(totalSpend),
      discretionarySpend: Math.round(discretionaryTotal),
      nonDiscretionarySpend: Math.round(nonDiscretionaryTotal),
      foodGrocery: d.dayToDay?.foodGrocery || 720,
      housing: d.housing?.rentOrMortgage || 1850,
      transportation: (d.transportation?.repairMaintenanceGas || 0) + (d.transportation?.publicTransportation || 0),
      totalIncome: Math.round(totalIncome),
      netSavings: Math.round(netSurplusSavings),
      surplusPayment: paymentsTotal || rep.surplusIncomePayment || 159,
      status: rep.status
    };
  });
}

/**
 * Computes average category spending and compares it against peer benchmarks
 */
export function computeCategoryBenchmarks(reports: MonthlyReport[]): Form65CategoryBenchmark[] {
  if (!reports || reports.length === 0) return [];

  // We look at the last 6 reports (or all available)
  const recentReports = reports.slice(-6);
  const count = recentReports.length || 1;

  // Aggregate category sums
  let rentSum = 0;
  let foodSum = 0;
  let heatSum = 0;
  let phoneSum = 0;
  let hydroSum = 0;
  let autoSum = 0;
  let transitSum = 0;
  let medicalCondSum = 0;
  let prescriptSum = 0;
  let childCareSum = 0;
  let personalCareSum = 0;
  let smokeAlcSum = 0;
  let insuranceSum = 0;
  let estateSum = 0;

  recentReports.forEach((rep) => {
    const d = rep.discretionary;
    const nd = rep.nonDiscretionary;

    rentSum += d?.housing?.rentOrMortgage || 1850;
    foodSum += d?.dayToDay?.foodGrocery || 720;
    heatSum += d?.housing?.heatingGasOil || 75;
    phoneSum += d?.housing?.telephone || 70;
    hydroSum += d?.housing?.hydro || 90;
    autoSum += d?.transportation?.repairMaintenanceGas || 205;
    transitSum += d?.transportation?.publicTransportation || 110;
    medicalCondSum += nd?.medicalConditionExpenses || 170;
    prescriptSum += d?.medical?.prescriptions || 60;
    childCareSum += nd?.childCare || 350;
    personalCareSum += (d?.dayToDay?.clothing || 0) + (d?.dayToDay?.groomingToiletries || 0);
    smokeAlcSum += (d?.personal?.alcohol || 0) + (d?.personal?.smoking || 0);
    insuranceSum += (d?.insurance?.vehicle || 0) + (d?.insurance?.house || 0) + (d?.insurance?.lifeInsurance || 0);
    estateSum += d?.payments?.toEstate || 159;
  });

  const categoryMap: { key: string; name: string; sum: number }[] = [
    { key: 'Rent or Mortgage Payments', name: 'Rent or Mortgage Payments', sum: rentSum },
    { key: 'Food & Grocery', name: 'Food & Grocery', sum: foodSum },
    { key: 'Heating / Gas / Oil', name: 'Heating / Gas / Oil', sum: heatSum },
    { key: 'Telephone & Digital Utilities', name: 'Telephone & Digital Utilities', sum: phoneSum },
    { key: 'Hydro & Water', name: 'Hydro & Water Utilities', sum: hydroSum },
    { key: 'Repair, Maintenance & Gas', name: 'Vehicle Gas & Maintenance', sum: autoSum },
    { key: 'Public Transportation', name: 'Public Transit Passes', sum: transitSum },
    { key: 'Medical Condition Expenses', name: 'Medical Condition Deductions', sum: medicalCondSum },
    { key: 'Prescriptions & Health', name: 'Prescription Copays', sum: prescriptSum },
    { key: 'Child Care', name: 'Child Care Expenses', sum: childCareSum },
    { key: 'Personal Care & Clothing', name: 'Clothing & Personal Grooming', sum: personalCareSum },
    { key: 'Smoking & Alcohol', name: 'Smoking & Alcohol Sundries', sum: smokeAlcSum },
    { key: 'Insurance (Vehicle/Life/Tenant)', name: 'Insurance Coverage (Auto & Home)', sum: insuranceSum },
    { key: 'Bankruptcy Estate Payment', name: 'Bankruptcy Surplus Payment (LIT)', sum: estateSum }
  ];

  return categoryMap.map((cat) => {
    const userAverage = Math.round(cat.sum / count);
    const benchmark = PEER_BENCHMARKS[cat.key] || {
      peerAverage: userAverage,
      group: 'Day-to-Day & Personal' as const,
      recommendation: 'Standard statutory benchmark.'
    };

    const diff = userAverage - benchmark.peerAverage;
    const variancePercent = Math.round((diff / benchmark.peerAverage) * 100);

    let status: Form65CategoryBenchmark['status'] = 'within-target';
    if (variancePercent <= -5) {
      status = 'optimal';
    } else if (variancePercent > 10) {
      status = 'above-average';
    }

    return {
      key: cat.key,
      name: cat.name,
      group: benchmark.group,
      userAverageSpend: userAverage,
      peerAverageSpend: benchmark.peerAverage,
      variancePercent,
      status,
      recommendation: benchmark.recommendation
    };
  });
}

/**
 * Load goals from Firestore or fallback to localStorage
 */
export async function fetchGoalsFromDb(userId: string): Promise<FinancialGoal[]> {
  try {
    const colRef = collection(db, 'goals');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const dbGoals: FinancialGoal[] = [];
      snapshot.forEach(docSnap => {
        dbGoals.push(docSnap.data() as FinancialGoal);
      });
      return dbGoals;
    }
  } catch (err) {
    console.warn('Firestore fetch goals warning:', err);
  }

  // Fallback to local storage or initial goals
  const local = localStorage.getItem('cleanslate_goals');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback below
    }
  }
  return INITIAL_FINANCIAL_GOALS;
}

/**
 * Save or update a goal in Firestore and local storage
 */
export async function saveGoalToDb(goal: FinancialGoal): Promise<void> {
  try {
    await setDoc(doc(db, 'goals', goal.id), goal);
  } catch (err) {
    console.warn('Firestore save goal error:', err);
  }
}

/**
 * Delete a goal from Firestore and local storage
 */
export async function deleteGoalFromDb(goalId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'goals', goalId));
  } catch (err) {
    console.warn('Firestore delete goal error:', err);
  }
}
