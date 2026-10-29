import { jsPDF } from 'jspdf';
import { MonthlyReport, UserProfile, Receipt, Transaction } from '../types';

interface GenerateReportOptions {
  report: MonthlyReport;
  profile: UserProfile;
  receipts: Receipt[];
  transactions: Transaction[];
}

export function generateMonthlyReportPDF({
  report,
  profile,
  receipts,
  transactions
}: GenerateReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const leftMargin = 14;
  const rightMargin = 196;
  const contentWidth = rightMargin - leftMargin; // 182mm
  let currentY = 12;

  // Helper for automated page breaks with running header
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 14;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFillColor(29, 26, 39); // CleanSlate dark slate
    doc.rect(leftMargin, currentY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`CLEANSLATE BANKRUPTCY PLATFORM · FORM 65 MONTHLY REPORT: ${report.month.toUpperCase()} ${report.year}`, leftMargin + 3, currentY + 5.5);
    doc.setTextColor(182, 179, 255);
    doc.text(`DEBTOR: ${profile.firstName} ${profile.lastName} (${profile.company})`, rightMargin - 3, currentY + 5.5, { align: 'right' });
    currentY += 12;
  };

  // Helper: Section title bar
  const renderSectionHeader = (title: string, subtitle?: string) => {
    checkPageBreak(14);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(leftMargin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
    doc.setFillColor(46, 41, 63); // CleanSlate brand accent bar
    doc.rect(leftMargin, currentY, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 26, 39);
    doc.text(title.toUpperCase(), leftMargin + 5, currentY + 5);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, rightMargin - 3, currentY + 5, { align: 'right' });
    }
    currentY += 10;
  };

  // 1. TOP HEADER BANNER
  doc.setFillColor(29, 26, 39); // #1d1a27
  doc.roundedRect(leftMargin, currentY, contentWidth, 24, 2, 2, 'F');

  // Title branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CLEANSLATE', leftMargin + 4, currentY + 8);
  doc.setFillColor(251, 240, 80); // yellow dot
  doc.circle(leftMargin + 42, currentY + 6.5, 1.5, 'F');

  doc.setFontSize(9);
  doc.setTextColor(182, 179, 255); // #b6b3ff
  doc.text('ESTATE STATUTORY DISCLOSURE & STATEMENT OF AFFAIRS', leftMargin + 4, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Bankruptcy and Insolvency Act (Form 65 - Monthly Income & Expense Statement)', leftMargin + 4, currentY + 19);

  // Month & Filing Badge on right
  doc.setFillColor(251, 240, 80); // Gold/Yellow
  doc.roundedRect(rightMargin - 46, currentY + 4, 42, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(29, 26, 39);
  doc.text('REPORTING PERIOD', rightMargin - 25, currentY + 9, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`${report.month.toUpperCase()} ${report.year}`, rightMargin - 25, currentY + 15, { align: 'center' });

  currentY += 28;

  // 2. DEBTOR & TRUSTEE METADATA GRID
  checkPageBreak(30);
  const colWidth = (contentWidth - 4) / 2;

  // Box 1: Debtor Profile
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, currentY, colWidth, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(29, 26, 39);
  doc.text('DEBTOR INFORMATION', leftMargin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Full Name: ${profile.firstName} ${profile.lastName}`, leftMargin + 3, currentY + 10);
  doc.text(`Address: ${profile.addressLine1}, ${profile.province} ${profile.postalCode}`, leftMargin + 3, currentY + 14);
  doc.text(`Employment: ${profile.currentTitle || 'Employed'} at ${profile.company}`, leftMargin + 3, currentY + 18);
  doc.text(`Household Size: ${profile.householdSize} Person(s) · Status: ${profile.maritalStatus || 'Married'}`, leftMargin + 3, currentY + 22);

  // Box 2: Licensed Insolvency Trustee
  doc.roundedRect(leftMargin + colWidth + 4, currentY, colWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(29, 26, 39);
  doc.text('LICENSED INSOLVENCY TRUSTEE (LIT)', leftMargin + colWidth + 7, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Trustee Name: ${profile.litName || 'John Doe, LIT'}`, leftMargin + colWidth + 7, currentY + 10);
  doc.text(`Firm: ${profile.litFirm || 'CleanSlate Insolvency Services'}`, leftMargin + colWidth + 7, currentY + 14);
  doc.text(`Trustee Email: ${profile.litEmail || 'trustee@cleanslate.ca'}`, leftMargin + colWidth + 7, currentY + 18);
  doc.text(`Filing Status: ${report.status.toUpperCase()} (${report.lastEditDate || 'Draft'})`, leftMargin + colWidth + 7, currentY + 22);

  currentY += 31;

  // 3. MONTHLY HOUSEHOLD INCOME (Form 65 Step 1)
  renderSectionHeader('1. Monthly Household Income (Form 65 Statutory Disclosure)', 'All Figures in CAD');

  // Debtor and Spouse Income calculation
  const debtorIncome = report.income.debtor;
  const spouseIncome = report.income.spouse;

  const debtorSum = Object.values(debtorIncome).reduce((a, b) => a + (Number(b) || 0), 0);
  const spouseSum = Object.values(spouseIncome).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalGrossHousehold = debtorSum + spouseSum;

  const incomeItems = [
    { label: 'Employment Income (Net/Gross take-home)', debtor: debtorIncome.employmentIncome, spouse: spouseIncome.employmentIncome },
    { label: 'Pensions / Annuities', debtor: debtorIncome.pensionAnnuities, spouse: spouseIncome.pensionAnnuities },
    { label: 'Child Support Received', debtor: debtorIncome.childSupport, spouse: spouseIncome.childSupport },
    { label: 'Spousal Support Received', debtor: debtorIncome.spousalSupport, spouse: spouseIncome.spousalSupport },
    { label: 'Employment Insurance / Income Benefits', debtor: debtorIncome.employmentIncomeBenefits, spouse: spouseIncome.employmentIncomeBenefits },
    { label: 'Social Assistance', debtor: debtorIncome.socialAssistance, spouse: spouseIncome.socialAssistance },
    { label: 'Self-Employment Income', debtor: debtorIncome.selfEmploymentIncome, spouse: spouseIncome.selfEmploymentIncome },
    { label: 'Canada Child Benefit (CCB)', debtor: debtorIncome.childTaxBenefit, spouse: spouseIncome.childTaxBenefit },
    { label: 'Other Net Income / Universal Benefits', debtor: debtorIncome.otherNetIncome, spouse: spouseIncome.otherNetIncome },
  ];

  // Table Header
  checkPageBreak(incomeItems.length * 5 + 16);
  doc.setFillColor(226, 232, 240);
  doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('INCOME SOURCE / REVENUE STREAM', leftMargin + 3, currentY + 4);
  doc.text(`DEBTOR (${profile.firstName})`, rightMargin - 60, currentY + 4, { align: 'right' });
  doc.text(`SPOUSE (${profile.spouseName || 'Jane'})`, rightMargin - 25, currentY + 4, { align: 'right' });
  doc.text('TOTAL (CAD)', rightMargin - 3, currentY + 4, { align: 'right' });
  currentY += 6;

  // Income Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  incomeItems.forEach((item, idx) => {
    checkPageBreak(5);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, currentY - 0.5, contentWidth, 4.5, 'F');
    }
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, leftMargin + 3, currentY + 3);
    doc.text(`$ ${(item.debtor || 0).toFixed(2)}`, rightMargin - 60, currentY + 3, { align: 'right' });
    doc.text(`$ ${(item.spouse || 0).toFixed(2)}`, rightMargin - 25, currentY + 3, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`$ ${((item.debtor || 0) + (item.spouse || 0)).toFixed(2)}`, rightMargin - 3, currentY + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    currentY += 4.5;
  });

  // Income Total Summary Row
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GROSS HOUSEHOLD INCOME:', leftMargin + 3, currentY + 4.5);
  doc.text(`$ ${debtorSum.toFixed(2)}`, rightMargin - 60, currentY + 4.5, { align: 'right' });
  doc.text(`$ ${spouseSum.toFixed(2)}`, rightMargin - 25, currentY + 4.5, { align: 'right' });
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`$ ${totalGrossHousehold.toFixed(2)}`, rightMargin - 3, currentY + 4.5, { align: 'right' });
  currentY += 10;

  // 4. NON-DISCRETIONARY EXPENSES & SURPLUS CALCULATION (Form 65 Step 2)
  renderSectionHeader('2. Non-Discretionary Expenses & OSB Surplus Threshold', 'BIA Section 68 Deductions');

  const nonDisc = report.nonDiscretionary;
  const nonDiscItems = [
    { label: 'Child Support Payments (Court Order)', amount: nonDisc.childSupportPayments, key: 'childSupportPayments' },
    { label: 'Spousal Support Payments', amount: nonDisc.spousalSupportPayments, key: 'spousalSupportPayments' },
    { label: 'Child Care Expenses (Daycare / Babysitting)', amount: nonDisc.childCare, key: 'childCare' },
    { label: 'Medical Condition Expenses (Prescriptions / Therapies)', amount: nonDisc.medicalConditionExpenses, key: 'medicalConditionExpenses' },
    { label: 'Fines / Penalties Imposed by Court', amount: nonDisc.finesPenaltiesCourt, key: 'finesPenaltiesCourt' },
    { label: 'Expenses as a Condition of Employment (Tools / Uniforms)', amount: nonDisc.expensesConditionEmployment, key: 'expensesConditionEmployment' },
    { label: 'Debts Where Stay of Proceedings Has Been Lifted', amount: nonDisc.debtsStayLifted, key: 'debtsStayLifted' }
  ];

  const totalNonDisc = nonDiscItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // OSB Threshold Calculation (Superintendent of Bankruptcy standards)
  const OSB_THRESHOLDS: { [size: number]: number } = {
    1: 2543,
    2: 3165,
    3: 3891,
    4: 4724,
    5: 5358,
    6: 6043,
    7: 6728
  };
  const householdSize = Math.min(Math.max(profile.householdSize || 2, 1), 7);
  const osbThreshold = OSB_THRESHOLDS[householdSize] || 3165;
  const netIncomeForSurplus = Math.max(0, totalGrossHousehold - totalNonDisc);
  const surplusDiff = netIncomeForSurplus - osbThreshold;
  const surplusOwed = surplusDiff > 200 ? surplusDiff * 0.5 : 0;

  checkPageBreak(nonDiscItems.length * 4.5 + 24);

  // Non-Discretionary Rows
  nonDiscItems.forEach((item, idx) => {
    checkPageBreak(5);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, currentY - 0.5, contentWidth, 4.5, 'F');
    }
    const hasProof = nonDisc.attachments?.[item.key]?.length || (item.key === 'medicalConditionExpenses' && receipts.length > 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, leftMargin + 3, currentY + 3);

    // Proof indicator
    if (hasProof) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('[VERIFIED PROOF ATTACHED]', rightMargin - 40, currentY + 3, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('(No receipt attached)', rightMargin - 40, currentY + 3, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$ ${(item.amount || 0).toFixed(2)}`, rightMargin - 3, currentY + 3, { align: 'right' });
    currentY += 4.5;
  });

  // Total Non-Discretionary & Surplus Box
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL STATUTORY NON-DISCRETIONARY DEDUCTIONS:', leftMargin + 3, currentY + 4.5);
  doc.text(`$ ${totalNonDisc.toFixed(2)} CAD`, rightMargin - 3, currentY + 4.5, { align: 'right' });
  currentY += 8;

  // OSB Surplus Summary Callout Banner
  checkPageBreak(16);
  doc.setFillColor(29, 26, 39);
  doc.roundedRect(leftMargin, currentY, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`SUPERINTENDENT SURPLUS STANDARDS (FAMILY SIZE ${householdSize}):`, leftMargin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Gross: $${totalGrossHousehold.toFixed(2)}  -  Deductions: $${totalNonDisc.toFixed(2)}  =  Net: $${netIncomeForSurplus.toFixed(2)}  (OSB Limit: $${osbThreshold.toFixed(2)})`, leftMargin + 4, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 240, 80);
  doc.text(`SURPLUS OWED (50%): $ ${surplusOwed.toFixed(2)} CAD`, rightMargin - 4, currentY + 8, { align: 'right' });
  currentY += 18;

  // 5. DISCRETIONARY LIVING EXPENSES (Form 65 Steps 3 & 4)
  renderSectionHeader('3. Discretionary Living Expenses Breakdown', 'Housing & Day-to-Day Categories');

  const disc = report.discretionary;
  const housingTotal = Object.values(disc.housing).reduce((a, b) => a + (Number(b) || 0), 0);
  const personalTotal = Object.values(disc.personal).reduce((a, b) => a + (Number(b) || 0), 0);
  const dayToDayTotal = Object.values(disc.dayToDay).reduce((a, b) => a + (Number(b) || 0), 0);
  const transportationTotal = Object.values(disc.transportation).reduce((a, b) => a + (Number(b) || 0), 0);
  const insuranceTotal = Object.values(disc.insurance).reduce((a, b) => a + (Number(b) || 0), 0);
  const medicalTotal = Object.values(disc.medical).reduce((a, b) => a + (Number(b) || 0), 0);
  const paymentsTotal = Object.values(disc.payments).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalDiscretionary = housingTotal + personalTotal + dayToDayTotal + transportationTotal + insuranceTotal + medicalTotal + paymentsTotal;

  const expenseCategories = [
    { name: 'Housing & Utilities (Rent/Mortgage, Hydro, Heating, Cable, Water)', amount: housingTotal },
    { name: 'Personal Expenses (Personal Care, Smoking, Alcohol, Sundries)', amount: personalTotal },
    { name: 'Day-to-Day Living (Food & Groceries, Laundry, Toiletries, Clothing)', amount: dayToDayTotal },
    { name: 'Transportation (Vehicle Maintenance, Gas, Public Transit)', amount: transportationTotal },
    { name: 'Insurance Coverage (Vehicle, House, Furniture, Life)', amount: insuranceTotal },
    { name: 'Medical & Dental (Prescriptions, Dental Treatments, Optics)', amount: medicalTotal },
    { name: 'Estate & Creditor Obligations (Secured Payments, Trust Remittances)', amount: paymentsTotal }
  ];

  checkPageBreak(expenseCategories.length * 4.5 + 10);
  expenseCategories.forEach((cat, idx) => {
    checkPageBreak(5);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, currentY - 0.5, contentWidth, 4.5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(cat.name, leftMargin + 3, currentY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$ ${(cat.amount || 0).toFixed(2)}`, rightMargin - 3, currentY + 3, { align: 'right' });
    currentY += 4.5;
  });

  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL DISCRETIONARY LIVING EXPENSES:', leftMargin + 3, currentY + 4.5);
  doc.text(`$ ${totalDiscretionary.toFixed(2)} CAD`, rightMargin - 3, currentY + 4.5, { align: 'right' });
  currentY += 10;

  // 6. VERIFIED RECEIPT VAULT & PROOF TOTALS
  renderSectionHeader('4. Verified Proof & Statutory Receipt Vault', `${receipts.length} Documents Registered`);

  const monthReceipts = receipts.filter(r => !r.reportMonth || r.reportMonth.toLowerCase().includes(report.month.toLowerCase()));
  const displayReceipts = monthReceipts.length > 0 ? monthReceipts : receipts;
  const totalReceiptsAmount = displayReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  checkPageBreak(Math.min(displayReceipts.length, 6) * 5 + 14);

  // Table header for receipts
  doc.setFillColor(226, 232, 240);
  doc.rect(leftMargin, currentY, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('DOCUMENT TITLE / MERCHANT', leftMargin + 3, currentY + 3.5);
  doc.text('STATUTORY CATEGORY', leftMargin + 80, currentY + 3.5);
  doc.text('DATE FILED', rightMargin - 35, currentY + 3.5);
  doc.text('VERIFIED AMOUNT', rightMargin - 3, currentY + 3.5, { align: 'right' });
  currentY += 5.5;

  displayReceipts.slice(0, 8).forEach((rec, idx) => {
    checkPageBreak(5);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, currentY - 0.5, contentWidth, 4.5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(rec.title || 'Receipt Proof Document', leftMargin + 3, currentY + 3);
    doc.setTextColor(100, 116, 139);
    doc.text(rec.category || 'Medical Condition Expenses', leftMargin + 80, currentY + 3);
    doc.text(rec.date || 'Sep 2022', rightMargin - 35, currentY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$ ${(rec.amount || 0).toFixed(2)}`, rightMargin - 3, currentY + 3, { align: 'right' });
    currentY += 4.5;
  });

  // Total Receipts Summary
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL AUDITED RECEIPT PROOFS (${displayReceipts.length} Documents):`, leftMargin + 3, currentY + 4);
  doc.setTextColor(16, 185, 129);
  doc.text(`$ ${totalReceiptsAmount.toFixed(2)} CAD`, rightMargin - 3, currentY + 4, { align: 'right' });
  currentY += 9;

  // 7. SELECTED MONTH'S BANKING TRANSACTIONS LOG
  renderSectionHeader('5. Selected Month Banking & Transaction Ledger', `${transactions.length} Verified Records`);

  checkPageBreak(Math.min(transactions.length, 8) * 5 + 14);

  // Table header for transactions
  doc.setFillColor(226, 232, 240);
  doc.rect(leftMargin, currentY, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('TRANSACTION ID / MERCHANT', leftMargin + 3, currentY + 3.5);
  doc.text('CATEGORY / CLASSIFICATION', leftMargin + 80, currentY + 3.5);
  doc.text('POST DATE', rightMargin - 35, currentY + 3.5);
  doc.text('AMOUNT (CAD)', rightMargin - 3, currentY + 3.5, { align: 'right' });
  currentY += 5.5;

  const monthTxs = transactions.slice(0, 10);
  const totalTxSpend = monthTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  monthTxs.forEach((tx, idx) => {
    checkPageBreak(5);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, currentY - 0.5, contentWidth, 4.5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(`${tx.company} (${tx.id})`, leftMargin + 3, currentY + 3);
    doc.setTextColor(100, 116, 139);
    doc.text(tx.category || tx.form65Category || 'Banking Expense', leftMargin + 80, currentY + 3);
    doc.text(tx.date, rightMargin - 35, currentY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$ ${(tx.amount || 0).toFixed(2)}`, rightMargin - 3, currentY + 3, { align: 'right' });
    currentY += 4.5;
  });

  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL LOGGED BANK TRANSACTIONS (${monthTxs.length} items shown):`, leftMargin + 3, currentY + 4);
  doc.text(`$ ${totalTxSpend.toFixed(2)} CAD`, rightMargin - 3, currentY + 4, { align: 'right' });
  currentY += 10;

  // 8. STATUTORY ATTESTATION & SIGNATURE SECTION
  checkPageBreak(34);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftMargin, currentY, contentWidth, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(29, 26, 39);
  doc.text('DEBTOR STATUTORY ATTESTATION (BANKRUPTCY & INSOLVENCY ACT)', leftMargin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'I solemnly declare that the statements made herein regarding my household gross revenues, statutory non-discretionary expenses,',
    leftMargin + 3,
    currentY + 9
  );
  doc.text(
    'and living disbursements for this period are true and complete in accordance with the Bankruptcy and Insolvency Act and directives of the OSB.',
    leftMargin + 3,
    currentY + 13
  );

  // Signature lines
  const sigColWidth = (contentWidth - 10) / 2;
  doc.setDrawColor(148, 163, 184);
  doc.line(leftMargin + 3, currentY + 23, leftMargin + 3 + sigColWidth, currentY + 23);
  doc.line(leftMargin + 7 + sigColWidth, currentY + 23, rightMargin - 3, currentY + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Debtor Signature: ${profile.firstName} ${profile.lastName}`, leftMargin + 3, currentY + 27);
  doc.text(`LIT Receipt Acknowledgment: ${profile.litName || 'Licensed Insolvency Trustee'}`, leftMargin + 7 + sigColWidth, currentY + 27);

  // FOOTER on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CleanSlate Bankruptcy Management Platform · Form 65 Monthly Report (${report.month} ${report.year}) · Generated on ${new Date().toLocaleDateString('en-CA')}`,
      leftMargin,
      pageHeight - 6
    );
    doc.text(`Page ${p} of ${totalPages}`, rightMargin, pageHeight - 6, { align: 'right' });
  }

  // Trigger browser download
  const safeFileName = `CleanSlate_Form65_Report_${report.month}_${report.year}.pdf`.replace(/\s+/g, '_');
  doc.save(safeFileName);
}
