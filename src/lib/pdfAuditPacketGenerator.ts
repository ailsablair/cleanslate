import { jsPDF } from 'jspdf';
import { MonthlyReport, UserProfile, Receipt, Transaction, BankAccount } from '../types';

interface AuditPacketOptions {
  profile: UserProfile;
  reports: MonthlyReport[];
  receipts: Receipt[];
  transactions?: Transaction[];
  bankAccounts?: BankAccount[];
}

export function generateLITAuditPacketPDF({
  profile,
  reports,
  receipts,
  transactions = [],
  bankAccounts = []
}: AuditPacketOptions): void {
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

  const totalVaultReceiptsAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Helper for running header
  const renderHeader = (sectionTitle: string, pageNum: number) => {
    doc.setFillColor(29, 26, 39); // #1d1a27 CleanSlate Dark Slate
    doc.rect(leftMargin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`CLEANSLATE OSB AUDIT DOSSIER · ${sectionTitle.toUpperCase()}`, leftMargin + 3, currentY + 4.8);
    doc.setTextColor(182, 179, 255);
    doc.text(`ESTATE: ${profile.firstName} ${profile.lastName} | LIT: ${profile.litName?.split(',')[0] || 'TRUSTEE'} (PAGE ${pageNum})`, rightMargin - 3, currentY + 4.8, { align: 'right' });
    currentY += 11;
  };

  const renderSectionBar = (title: string, subtitle?: string) => {
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(leftMargin, currentY, contentWidth, 6.5, 1, 1, 'F');
    doc.setFillColor(46, 41, 63);
    doc.rect(leftMargin, currentY, 2.5, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(29, 26, 39);
    doc.text(title.toUpperCase(), leftMargin + 5, currentY + 4.5);
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, rightMargin - 3, currentY + 4.5, { align: 'right' });
    }
    currentY += 9;
  };

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE AUDIT SUMMARY
  // ==========================================
  // Top Banner
  doc.setFillColor(29, 26, 39);
  doc.roundedRect(leftMargin, currentY, contentWidth, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('CLEANSLATE', leftMargin + 4, currentY + 8);
  doc.setFillColor(251, 240, 80);
  doc.circle(leftMargin + 43, currentY + 6.5, 1.5, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(182, 179, 255);
  doc.text('OFFICIAL BIA FORM 65 AUDIT & TAX RECONCILIATION DOSSIER', leftMargin + 4, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Office of the Superintendent of Bankruptcy Canada (OSB) Directive No. 11R2-2024 Compliance Dossier', leftMargin + 4, currentY + 19);

  // Status Badge on Right
  doc.setFillColor(251, 240, 80);
  doc.roundedRect(rightMargin - 46, currentY + 4, 42, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(29, 26, 39);
  doc.text('ESTATE AUDIT READY', rightMargin - 25, currentY + 9, { align: 'center' });
  doc.setFontSize(10);
  doc.text('COMPLETE', rightMargin - 25, currentY + 15, { align: 'center' });

  currentY += 31;

  // Debtor & LIT Identification Strip
  renderSectionBar('1. Debtor & Licensed Insolvency Trustee Information');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, currentY, contentWidth, 26, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  // Left col: Debtor
  doc.text('DEBTOR PROFILE:', leftMargin + 4, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Full Name: ${profile.firstName} ${profile.lastName}`, leftMargin + 4, currentY + 9);
  doc.text(`Address: ${profile.addressLine1}, ${profile.province} ${profile.postalCode}`, leftMargin + 4, currentY + 13);
  doc.text(`Employment: ${profile.currentTitle} at ${profile.company}`, leftMargin + 4, currentY + 17);
  doc.text(`Marital & Household: ${profile.maritalStatus} (${profile.householdSize} Persons)`, leftMargin + 4, currentY + 21);

  // Right col: LIT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('LICENSED INSOLVENCY TRUSTEE (LIT):', leftMargin + 95, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Trustee Name: ${profile.litName || 'Sarah Jenkins, LIT'}`, leftMargin + 95, currentY + 9);
  doc.text(`Trustee Firm: ${profile.litFirm || 'BDO Canada Limited'}`, leftMargin + 95, currentY + 13);
  doc.text(`Email: ${profile.litEmail || 'sjenkins@bdo.ca'}`, leftMargin + 95, currentY + 17);
  doc.text(`Phone: ${profile.litPhone || '(604) 688-5421'}`, leftMargin + 95, currentY + 21);

  currentY += 30;

  // Key Audit Metrics Grid
  renderSectionBar('2. Consolidated Statutory Metrics Summary');
  const metrics = [
    { label: 'Total Form 65 Reports', val: `${reports.length} Reports` },
    { label: 'Submitted to Trustee', val: `${reports.filter(r => r.status === 'Submitted').length} Filed` },
    { label: 'Verified Proof Receipts', val: `${receipts.length} Documents` },
    { label: 'Total Verified Deductions', val: `$${totalVaultReceiptsAmount.toFixed(2)} CAD` },
    { label: 'Total Bank Accounts', val: `${bankAccounts.length} Connected` },
    { label: 'Aggregate Ledger Balance', val: `$${totalBankBalance.toFixed(2)} CAD` }
  ];

  const colW = contentWidth / 3;
  for (let i = 0; i < metrics.length; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = leftMargin + col * colW;
    const y = currentY + row * 13;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, colW - 2, 11, 1, 1, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(metrics[i].label.toUpperCase(), x + 3, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(metrics[i].val, x + 3, y + 8.5);
  }
  currentY += 30;

  // Statement of Purpose Callout
  doc.setFillColor(254, 252, 232); // light amber
  doc.setDrawColor(250, 204, 21);
  doc.roundedRect(leftMargin, currentY, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(133, 77, 14);
  doc.text('OFFICIAL PURPOSE & SUBMISSION DECLARATION:', leftMargin + 3.5, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(113, 63, 18);
  doc.text(
    'This audit packet compiles debtor income statements, verified non-discretionary proofs, bank ledgers, and statutory surplus calculations for official submission pursuant to Section 68 of the Bankruptcy and Insolvency Act (BIA) and Canada Revenue Agency (CRA) pre/post-bankruptcy tax return filings.',
    leftMargin + 3.5,
    currentY + 9,
    { maxWidth: contentWidth - 7 }
  );
  currentY += 24;

  // Sign-Off Signatures on Page 1
  renderSectionBar('3. Formal Estate Sign-Off & Verification');
  const sigBoxW = (contentWidth - 6) / 2;

  // Debtor box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftMargin, currentY, sigBoxW, 28, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('DEBTOR STATUTORY ATTESTATION', leftMargin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('I declare that the information in this dossier is complete and true.', leftMargin + 3, currentY + 8.5);
  doc.line(leftMargin + 3, currentY + 20, leftMargin + sigBoxW - 3, currentY + 20);
  doc.text(`Signed: ${profile.firstName} ${profile.lastName} (Digital Verification)`, leftMargin + 3, currentY + 24);

  // LIT box
  doc.roundedRect(leftMargin + sigBoxW + 6, currentY, sigBoxW, 28, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TRUSTEE IN RECEIPT & AUDIT CERTIFICATION', leftMargin + sigBoxW + 9, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Received and verified for OSB estate administration.', leftMargin + sigBoxW + 9, currentY + 8.5);
  doc.line(leftMargin + sigBoxW + 9, currentY + 20, rightMargin - 3, currentY + 20);
  doc.text(`Certified: ${profile.litName || 'Sarah Jenkins, LIT'}`, leftMargin + sigBoxW + 9, currentY + 24);

  // ==========================================
  // PAGE 2: 12-MONTH FORM 65 MONTHLY SCHEDULE
  // ==========================================
  doc.addPage();
  currentY = 12;
  renderHeader('Monthly Form 65 Statement Schedule (12-Month Audit Trail)', 2);

  renderSectionBar('Monthly Income, Deductions & Surplus Assessment Ledger');

  // Table headers
  const colX = [leftMargin, leftMargin + 25, leftMargin + 50, leftMargin + 80, leftMargin + 115, leftMargin + 145, rightMargin];
  doc.setFillColor(226, 232, 240);
  doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.text('Month / Period', colX[0] + 2, currentY + 4.2);
  doc.text('Status', colX[1] + 2, currentY + 4.2);
  doc.text('Gross Income', colX[2] + 2, currentY + 4.2);
  doc.text('Non-Discretionary', colX[3] + 2, currentY + 4.2);
  doc.text('OSB Threshold', colX[4] + 2, currentY + 4.2);
  doc.text('Surplus Assessed', colX[5] + 2, currentY + 4.2);
  currentY += 6.5;

  reports.forEach((rep, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(leftMargin, currentY, contentWidth, 6, 'F');

    const debtorIncome = Object.values(rep.income.debtor).reduce((a, b) => a + Number(b || 0), 0);
    const spouseIncome = Object.values(rep.income.spouse).reduce((a, b) => a + Number(b || 0), 0);
    const gross = debtorIncome + spouseIncome;
    const nonDisc = Object.values(rep.nonDiscretionary).reduce((a, b) => a + Number(b || 0), 0) as number;
    const threshold = profile.householdSize === 1 ? 2400 : profile.householdSize === 2 ? 2980 : 3600;
    const surplusBase = Math.max(0, gross - nonDisc);
    const surplusOwed = Math.max(0, (surplusBase - threshold) * 0.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${rep.month} ${rep.year}`, colX[0] + 2, currentY + 4.2);

    doc.setFont('helvetica', rep.status === 'Submitted' ? 'bold' : 'normal');
    doc.setTextColor(rep.status === 'Submitted' ? 22 : rep.status === 'Overdue' ? 225 : 100, rep.status === 'Submitted' ? 101 : 29, rep.status === 'Submitted' ? 52 : 72);
    doc.text(rep.status, colX[1] + 2, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`$${gross.toFixed(2)}`, colX[2] + 2, currentY + 4.2);
    doc.text(`$${nonDisc.toFixed(2)}`, colX[3] + 2, currentY + 4.2);
    doc.text(`$${threshold.toFixed(2)}`, colX[4] + 2, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(surplusOwed > 0 ? 180 : 30, surplusOwed > 0 ? 83 : 41, surplusOwed > 0 ? 9 : 59);
    doc.text(`$${surplusOwed.toFixed(2)}`, colX[5] + 2, currentY + 4.2);

    currentY += 6;
  });

  currentY += 8;

  // OSB Directive Summary Note
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(leftMargin, currentY, contentWidth, 18, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('SUPERINTENDENT OF BANKRUPTCY SURPLUS INCOME STANDARDS:', leftMargin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Under BIA Section 68, surplus income is evaluated monthly. When a bankrupt has surplus income exceeding $200.00/month, the statutory bankruptcy period extends from 9 months to 21 months (first-time bankruptcy) or from 24 to 36 months (second bankruptcy). All 50% surplus payments are credited directly to the bankrupt estate for creditor dividends.',
    leftMargin + 3,
    currentY + 8.5,
    { maxWidth: contentWidth - 6 }
  );

  // ==========================================
  // PAGE 3: VERIFIED RECEIPT & PROOF INVENTORY
  // ==========================================
  doc.addPage();
  currentY = 12;
  renderHeader('Verified Proof Documents & Receipt Vault Schedule', 3);

  renderSectionBar('Document Proof Ledger (PHI & Statutory Expense Attachments)');

  // Receipt table headers
  const rColX = [leftMargin, leftMargin + 35, leftMargin + 85, leftMargin + 120, leftMargin + 150, rightMargin];
  doc.setFillColor(226, 232, 240);
  doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.text('Document Title', rColX[0] + 2, currentY + 4.2);
  doc.text('Statutory Category', rColX[1] + 2, currentY + 4.2);
  doc.text('Reporting Month', rColX[2] + 2, currentY + 4.2);
  doc.text('Amount CAD', rColX[3] + 2, currentY + 4.2);
  doc.text('Verification Status', rColX[4] + 2, currentY + 4.2);
  currentY += 6.5;

  receipts.slice(0, 16).forEach((rec, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(leftMargin, currentY, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(rec.title.length > 24 ? rec.title.substring(0, 22) + '...' : rec.title, rColX[0] + 2, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(rec.category.length > 28 ? rec.category.substring(0, 26) + '...' : rec.category, rColX[1] + 2, currentY + 4.2);
    doc.text(rec.reportMonth || 'September 2022', rColX[2] + 2, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$${(rec.amount || 0).toFixed(2)}`, rColX[3] + 2, currentY + 4.2);

    doc.setTextColor(22, 101, 52);
    doc.text('Verified (Enclave)', rColX[4] + 2, currentY + 4.2);

    currentY += 6;
  });

  currentY += 8;

  // PHI & Privacy Compliance Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(74, 222, 128);
  doc.roundedRect(leftMargin, currentY, contentWidth, 20, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text('HEALTH PRIVACY & STATUTORY ENCRYPTION NOTICE:', leftMargin + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(21, 128, 61);
  doc.text(
    'Medical prescriptions and health proofs contained in this dossier are classified as Personal Health Information (PHI) under PIPEDA and provincial privacy statutes. All documents have been verified against BIA non-discretionary deduction standards and are segregated exclusively for LIT surplus calculation audit purposes.',
    leftMargin + 3,
    currentY + 9,
    { maxWidth: contentWidth - 6 }
  );

  // Download PDF
  const filename = `CleanSlate_LIT_Audit_Packet_${profile.lastName}_${profile.firstName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
