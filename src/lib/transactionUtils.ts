import { Transaction } from '../types';

/**
 * Determines whether a transaction requires proof of purchase or prescription
 * under the Canadian Bankruptcy and Insolvency Act (BIA) Form 65 standards.
 */
export function isProofRequiredForTransaction(tx: Transaction): boolean {
  if (tx.requiresProof) return true;

  const category = (tx.form65Category || tx.category || '').toLowerCase();
  const company = (tx.company || '').toLowerCase();

  // 1. Statutory Non-Discretionary lines always require proof
  const nonDiscretionaryLines = [
    'medical condition',
    'medical',
    'prescription',
    'dental',
    'health',
    'pharmacy',
    'child care',
    'childcare',
    'child support',
    'spousal support',
    'court',
    'fine',
    'penalty',
    'condition of employment',
    'employment-related',
    'stay lifted'
  ];

  if (nonDiscretionaryLines.some(k => category.includes(k))) {
    return true;
  }

  // 2. Pharmacy, Medical & Healthcare merchants
  const medicalMerchants = [
    'shoppers drug mart',
    'rexall',
    'pharmacy',
    'drug mart',
    'apothecary',
    'clinic',
    'medical',
    'hospital',
    'dentist',
    'dental',
    'physiotherapy',
    'optometry',
    'optometrist'
  ];

  if (medicalMerchants.some(m => company.includes(m))) {
    return true;
  }

  // 3. Childcare & Employment condition merchants
  const mandatoryMerchants = [
    'montessori',
    'daycare',
    'child care',
    'nursery',
    'work wear',
    'safety',
    'safety supply',
    'marks work wearhouse',
    'union dues'
  ];

  if (mandatoryMerchants.some(m => company.includes(m))) {
    return true;
  }

  // 4. Higher-value repair/capital purchases ($500+)
  if (tx.amount >= 500 && (category.includes('repair') || category.includes('maintenance') || category.includes('vehicle'))) {
    return true;
  }

  return false;
}

/**
 * Returns compliance guidance metadata for a transaction
 */
export function getProofRequirementInfo(tx: Transaction): {
  required: boolean;
  type: 'prescription' | 'proof_of_purchase' | 'optional';
  label: string;
  explanation: string;
} {
  const category = (tx.form65Category || tx.category || '').toLowerCase();
  const company = (tx.company || '').toLowerCase();

  const isMedical = 
    category.includes('medical') || 
    category.includes('prescription') || 
    company.includes('shoppers') || 
    company.includes('rexall') || 
    company.includes('pharmacy') ||
    company.includes('clinic');

  if (isMedical) {
    return {
      required: true,
      type: 'prescription',
      label: 'Prescription / Medical Proof Required',
      explanation: 'BIA Section 68 mandates physician prescriptions and official pharmacy invoices to qualify for medical condition deductions.'
    };
  }

  const isMandatory = isProofRequiredForTransaction(tx);
  if (isMandatory) {
    return {
      required: true,
      type: 'proof_of_purchase',
      label: 'Proof of Purchase Required',
      explanation: 'Official invoice or receipt proof is mandatory under BIA Form 65 for trustee audit reconciliation.'
    };
  }

  return {
    required: false,
    type: 'optional',
    label: 'Receipt Proof Optional',
    explanation: 'Discretionary day-to-day expenditure. Receipt proof is recommended for complete audit trails but not legally mandatory.'
  };
}
