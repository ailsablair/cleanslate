import { MonthlyReport, Transaction } from '../types';
import { normalizeForm65Category } from './form65Categories';

/**
 * Applies categorized transactions into the corresponding Form 65 statutory lines
 * of a MonthlyReport, returning an updated copy of the report.
 */
export function applyTransactionsToMonthlyReport(
  report: MonthlyReport,
  parsedTransactions: Array<Pick<Transaction, 'amount' | 'form65Category'>>
): MonthlyReport {
  const next: MonthlyReport = {
    ...report,
    lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`,
    income: {
      ...report.income,
      debtor: { ...report.income.debtor },
      spouse: { ...report.income.spouse }
    },
    nonDiscretionary: { ...report.nonDiscretionary },
    discretionary: {
      ...report.discretionary,
      housing: { ...report.discretionary.housing },
      personal: { ...report.discretionary.personal },
      medical: { ...report.discretionary.medical },
      dayToDay: { ...report.discretionary.dayToDay },
      transportation: { ...report.discretionary.transportation },
      insurance: { ...report.discretionary.insurance },
      payments: { ...report.discretionary.payments }
    }
  };

  const round2 = (n: number) => Number(n.toFixed(2));

  for (const tx of parsedTransactions) {
    const amt = Math.abs(Number(tx.amount) || 0);
    if (amt <= 0) continue;

    const category = normalizeForm65Category(tx.form65Category);

    switch (category) {
      case 'Employment Income':
        next.income.debtor.employmentIncome = round2((next.income.debtor.employmentIncome || 0) + amt);
        break;
      case 'Pension/Annuities':
        next.income.debtor.pensionAnnuities = round2((next.income.debtor.pensionAnnuities || 0) + amt);
        break;
      case 'Child Support':
        next.income.debtor.childSupport = round2((next.income.debtor.childSupport || 0) + amt);
        break;
      case 'Spousal Support':
        next.income.debtor.spousalSupport = round2((next.income.debtor.spousalSupport || 0) + amt);
        break;
      case 'Employment Insurance Benefits':
        next.income.debtor.employmentIncomeBenefits = round2((next.income.debtor.employmentIncomeBenefits || 0) + amt);
        break;
      case 'Social Assistance':
        next.income.debtor.socialAssistance = round2((next.income.debtor.socialAssistance || 0) + amt);
        break;
      case 'Self-Employment Income':
        next.income.debtor.selfEmploymentIncome = round2((next.income.debtor.selfEmploymentIncome || 0) + amt);
        break;
      case 'Child Tax Benefit':
        next.income.debtor.childTaxBenefit = round2((next.income.debtor.childTaxBenefit || 0) + amt);
        break;
      case 'Other Net Income':
        next.income.debtor.otherNetIncome = round2((next.income.debtor.otherNetIncome || 0) + amt);
        break;
      case 'Child Support Payments':
        next.nonDiscretionary.childSupportPayments = round2((next.nonDiscretionary.childSupportPayments || 0) + amt);
        break;
      case 'Spousal Support Payments':
        next.nonDiscretionary.spousalSupportPayments = round2((next.nonDiscretionary.spousalSupportPayments || 0) + amt);
        break;
      case 'Child Care':
        next.nonDiscretionary.childCare = round2((next.nonDiscretionary.childCare || 0) + amt);
        break;
      case 'Medical Condition Expenses':
        next.nonDiscretionary.medicalConditionExpenses = round2((next.nonDiscretionary.medicalConditionExpenses || 0) + amt);
        break;
      case 'Court Mandated Fines/Penalties':
        next.nonDiscretionary.finesPenaltiesCourt = round2((next.nonDiscretionary.finesPenaltiesCourt || 0) + amt);
        break;
      case 'Employment Expenses':
        next.nonDiscretionary.expensesConditionEmployment = round2((next.nonDiscretionary.expensesConditionEmployment || 0) + amt);
        break;
      case 'Debts (Stay Lifted)':
        next.nonDiscretionary.debtsStayLifted = round2((next.nonDiscretionary.debtsStayLifted || 0) + amt);
        break;
      case 'Rent/Mortgage':
        next.discretionary.housing.rentOrMortgage = round2((next.discretionary.housing.rentOrMortgage || 0) + amt);
        break;
      case 'Property Taxes/Condo Fees':
        next.discretionary.housing.propertyTaxesCondo = round2((next.discretionary.housing.propertyTaxesCondo || 0) + amt);
        break;
      case 'Heating/Gas/Oil':
        next.discretionary.housing.heatingGasOil = round2((next.discretionary.housing.heatingGasOil || 0) + amt);
        break;
      case 'Telephone':
        next.discretionary.housing.telephone = round2((next.discretionary.housing.telephone || 0) + amt);
        break;
      case 'Cable':
        next.discretionary.housing.cable = round2((next.discretionary.housing.cable || 0) + amt);
        break;
      case 'Hydro':
        next.discretionary.housing.hydro = round2((next.discretionary.housing.hydro || 0) + amt);
        break;
      case 'Water':
        next.discretionary.housing.water = round2((next.discretionary.housing.water || 0) + amt);
        break;
      case 'Furniture':
        next.discretionary.housing.furniture = round2((next.discretionary.housing.furniture || 0) + amt);
        break;
      case 'Other Housing Expenses':
        next.discretionary.housing.other = round2((next.discretionary.housing.other || 0) + amt);
        break;
      case 'Smoking':
        next.discretionary.personal.smoking = round2((next.discretionary.personal.smoking || 0) + amt);
        break;
      case 'Alcohol':
        next.discretionary.personal.alcohol = round2((next.discretionary.personal.alcohol || 0) + amt);
        break;
      case 'Dining/Lunches/Restaurants':
        next.discretionary.personal.diningOut = round2((next.discretionary.personal.diningOut || 0) + amt);
        break;
      case 'Entertainment/Sports':
      case 'Other Personal Expenses':
      case 'Gifts & Charitable Donations':
      case 'Allowances':
        next.discretionary.personal.other = round2((next.discretionary.personal.other || 0) + amt);
        break;
      case 'Prescriptions':
        next.discretionary.medical.prescriptions = round2((next.discretionary.medical.prescriptions || 0) + amt);
        break;
      case 'Dental':
        next.discretionary.medical.dental = round2((next.discretionary.medical.dental || 0) + amt);
        break;
      case 'Other Non-Recoverable Medical Expenses':
        next.discretionary.medical.other = round2((next.discretionary.medical.other || 0) + amt);
        break;
      case 'Food/Grocery':
        next.discretionary.dayToDay.foodGrocery = round2((next.discretionary.dayToDay.foodGrocery || 0) + amt);
        break;
      case 'Laundry & Dry Cleaning':
        next.discretionary.dayToDay.laundryDryCleaning = round2((next.discretionary.dayToDay.laundryDryCleaning || 0) + amt);
        break;
      case 'Grooming & Toiletries':
        next.discretionary.dayToDay.groomingToiletries = round2((next.discretionary.dayToDay.groomingToiletries || 0) + amt);
        break;
      case 'Clothing':
        next.discretionary.dayToDay.clothing = round2((next.discretionary.dayToDay.clothing || 0) + amt);
        break;
      case 'Repair/Maintenance/Gas':
        next.discretionary.transportation.repairMaintenanceGas = round2((next.discretionary.transportation.repairMaintenanceGas || 0) + amt);
        break;
      case 'Public Transportation':
        next.discretionary.transportation.publicTransportation = round2((next.discretionary.transportation.publicTransportation || 0) + amt);
        break;
      case 'Other Transportation Expenses':
        next.discretionary.transportation.other = round2((next.discretionary.transportation.other || 0) + amt);
        break;
      case 'Vehicle':
        next.discretionary.insurance.vehicle = round2((next.discretionary.insurance.vehicle || 0) + amt);
        break;
      case 'House':
        next.discretionary.insurance.house = round2((next.discretionary.insurance.house || 0) + amt);
        break;
      case 'Furniture & Contents':
        next.discretionary.insurance.furnitureContents = round2((next.discretionary.insurance.furnitureContents || 0) + amt);
        break;
      case 'Life Insurance':
        next.discretionary.insurance.lifeInsurance = round2((next.discretionary.insurance.lifeInsurance || 0) + amt);
        break;
      case 'Other Insurance Expenses':
        next.discretionary.insurance.other = round2((next.discretionary.insurance.other || 0) + amt);
        break;
      case 'To The Estate':
        next.discretionary.payments.toEstate = round2((next.discretionary.payments.toEstate || 0) + amt);
        break;
      case 'To Secured Creditor':
        next.discretionary.payments.toSecuredCreditor = round2((next.discretionary.payments.toSecuredCreditor || 0) + amt);
        break;
      case 'Other Than Mortgage or Vehicle':
        next.discretionary.payments.otherThanMortgageOrVehicle = round2((next.discretionary.payments.otherThanMortgageOrVehicle || 0) + amt);
        break;
      case 'Other Payments':
        next.discretionary.payments.other = round2((next.discretionary.payments.other || 0) + amt);
        break;
      default:
        next.discretionary.dayToDay.other = round2((next.discretionary.dayToDay.other || 0) + amt);
        break;
    }
  }

  return next;
}
