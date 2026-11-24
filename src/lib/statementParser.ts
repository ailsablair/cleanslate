import { BankAccount, Transaction } from '../types';

export interface ParsedStatementResult {
  format: 'csv' | 'ofx' | 'qfx' | 'pdf';
  institution?: string;
  accountName?: string;
  accountType?: BankAccount['accountType'];
  accountMask?: string;
  endingBalance?: number;
  transactions: Array<Omit<Transaction, 'id'>>;
  warnings: string[];
}

export interface InferredForm65Result {
  category: string;
  form65Category: string;
  isCategorized: boolean;
  confidenceScore: number;
  needsConfirmation: boolean;
  confirmationReason?: string;
  requiresProof?: boolean;
}

/**
 * Infer a Canadian Form 65 category + confidence from a bank description.
 * Flags uncertain, ambiguous, or non-discretionary deduction candidates for the Confirm Queue
 * so the debtor never misses earnings-retaining deductions or misreports income.
 */
export function inferForm65FromDescription(
  description: string,
  signedAmount: number
): InferredForm65Result {
  const desc = description.toLowerCase();

  // Income / deposits (positive deposit in CSV/OFX/PDF)
  if (signedAmount > 0) {
    if (/payroll|salary|direct deposit|pay\b|wages|adp|ceridian|workday|gusto|intuit/.test(desc)) {
      return {
        category: 'Income',
        form65Category: 'Employment Income',
        isCategorized: true,
        confidenceScore: 100,
        needsConfirmation: false
      };
    }
    if (/cpp\b|oas\b|pension|rrif|annuity|retire/.test(desc)) {
      return {
        category: 'Income',
        form65Category: 'Pension/Annuities',
        isCategorized: true,
        confidenceScore: 100,
        needsConfirmation: false
      };
    }
    if (/ei\b|employment insurance|service canada/.test(desc)) {
      return {
        category: 'Government Benefits',
        form65Category: 'Employment Insurance Benefits',
        isCategorized: true,
        confidenceScore: 100,
        needsConfirmation: false
      };
    }
    if (/ccb|child tax|canada child/.test(desc)) {
      return {
        category: 'Government Benefits',
        form65Category: 'Child Tax Benefit',
        isCategorized: true,
        confidenceScore: 100,
        needsConfirmation: false
      };
    }
    if (/social assistance|welfare|disability|odsp|pwd|aish|ontario works|bc income/.test(desc)) {
      return {
        category: 'Government Benefits',
        form65Category: 'Social Assistance',
        isCategorized: true,
        confidenceScore: 100,
        needsConfirmation: false
      };
    }
    if (/self[- ]?employ|freelance|invoice|consulting|stripe|square/.test(desc)) {
      return {
        category: 'Income',
        form65Category: 'Self-Employment Income',
        isCategorized: false,
        confidenceScore: 70,
        needsConfirmation: true,
        confirmationReason:
          'Verify net self-employment income after allowable business expenses so your surplus income isn’t overstated.'
      };
    }
    if (/transfer|e-transfer|etransfer|tfr\b|internal/.test(desc)) {
      return {
        category: 'Internal Transfer',
        form65Category: 'Other Net Income',
        isCategorized: false,
        confidenceScore: 35,
        needsConfirmation: true,
        confirmationReason:
          'Confirm whether this incoming transfer is new income or an internal move/reimbursement.'
      };
    }
    return {
      category: 'Income',
      form65Category: 'Other Net Income',
      isCategorized: false,
      confidenceScore: 50,
      needsConfirmation: true,
      confirmationReason:
        'Unrecognized deposit — verify its source so exempt benefits or refunds don’t inflate surplus income.'
    };
  }

  // Expenses / outflows
  if (/shoppers drug|rexall|pharmasave|pharmacy|london drugs|prescription|rx\b|jean coutu|pharmaprix|drug mart/.test(desc)) {
    return {
      category: 'Healthcare',
      form65Category: 'Medical Condition Expenses',
      isCategorized: false,
      confidenceScore: 65,
      needsConfirmation: true,
      requiresProof: true,
      confirmationReason:
        'Pharmacy purchase: if backed by a prescription for a medical condition, claim under Family Non-Discretionary Expenses to retain more of your earnings.'
    };
  }
  if (/dental|dentist|orthodont/.test(desc)) {
    return {
      category: 'Healthcare',
      form65Category: 'Dental',
      isCategorized: false,
      confidenceScore: 80,
      needsConfirmation: true,
      requiresProof: true,
      confirmationReason:
        'Verify whether this dental care is a Non-Discretionary Medical Condition Expense or Non-Recoverable Dental and attach your receipt.'
    };
  }
  if (/clinic|medical|physio|optometr|chiro|dr\.\s|hospital|lifelabs|dynacare/.test(desc)) {
    return {
      category: 'Healthcare',
      form65Category: 'Medical Condition Expenses',
      isCategorized: false,
      confidenceScore: 75,
      needsConfirmation: true,
      requiresProof: true,
      confirmationReason:
        'Medical visits supported by a prescription or physician note qualify as Non-Discretionary deductions under BIA Form 65.'
    };
  }
  if (/daycare|childcare|child care|ymca|montessori|after[- ]?school/.test(desc)) {
    return {
      category: 'Child Care',
      form65Category: 'Child Care',
      isCategorized: false,
      confidenceScore: 85,
      needsConfirmation: true,
      requiresProof: true,
      confirmationReason:
        'Confirm Child Care invoice — verified childcare is a full Non-Discretionary deduction that lowers your surplus payment.'
    };
  }
  if (/walmart|costco|amazon|dollarama|canadian tire/.test(desc)) {
    const isAutoStore = /canadian tire/.test(desc);
    return {
      category: isAutoStore ? 'Transportation' : 'Food & Grocery',
      form65Category: isAutoStore ? 'Repair/Maintenance/Gas' : 'Food/Grocery',
      isCategorized: false,
      confidenceScore: 55,
      needsConfirmation: true,
      confirmationReason:
        'Mixed-merchandise retailer — confirm if this was Food/Grocery, Pharmacy/Medical, Work Gear, or Clothing.'
    };
  }
  if (/loblaws|no frills|superstore|metro\b|sobeys|safeway|save-on|freshco|whole foods|grocery|farm boy|iga\b|maxi\b|provigo|food basics|longo|t&t/.test(desc)) {
    return {
      category: 'Food & Grocery',
      form65Category: 'Food/Grocery',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/instacart/.test(desc)) {
    return {
      category: 'Food & Grocery',
      form65Category: 'Food/Grocery',
      isCategorized: false,
      confidenceScore: 70,
      needsConfirmation: true,
      confirmationReason:
        'Confirm whether this Instacart order was Groceries (Food/Grocery) or prepared takeout (Dining/Restaurants).'
    };
  }
  if (/mcdonald|tim hortons|starbucks|subway|skip ?the ?dishes|uber ?eats|doordash|restaurant|cafe|pizza|sushi|dining|wendy|burger|a&w|kfc|popeyes|chipotle|earls|cactus|moxie|bistro|pub\b|bar\b/.test(desc)) {
    return {
      category: 'Food & Dining',
      form65Category: 'Dining/Lunches/Restaurants',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/lcbo|beer store|bc liquor|saq\b|wine|liquor|brewery|alcohol/.test(desc)) {
    return {
      category: 'Personal',
      form65Category: 'Alcohol',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/smoke|tobacco|vape|cigarette|cannabis|dispensary/.test(desc)) {
    return {
      category: 'Personal',
      form65Category: 'Smoking',
      isCategorized: /cannabis|dispensary/.test(desc) ? false : true,
      confidenceScore: /cannabis|dispensary/.test(desc) ? 65 : 100,
      needsConfirmation: /cannabis|dispensary/.test(desc),
      confirmationReason: /cannabis|dispensary/.test(desc)
        ? 'If physician-authorized for a medical condition, claim under Non-Discretionary Medical Condition Expenses.'
        : undefined
    };
  }
  if (/hydro|bc hydro|hydro one|hydro-quebec|toronto hydro|epcor|enmax|alectra|nspower|nb power/.test(desc)) {
    return {
      category: 'Utilities',
      form65Category: 'Hydro',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/fortis|enbridge|union gas|natural gas|heating|saskenergy|atco/.test(desc)) {
    return {
      category: 'Utilities',
      form65Category: 'Heating/Gas/Oil',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/city of .*water|water utility|epcor water/.test(desc)) {
    return {
      category: 'Utilities',
      form65Category: 'Water',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/telus|rogers|bell\b|fido|koodo|virgin|freedom mobile|shaw|videotron|public mobile|chatr/.test(desc)) {
    if (/internet|tv|cable|fib[er]/.test(desc)) {
      return {
        category: 'Utilities',
        form65Category: 'Cable',
        isCategorized: true,
        confidenceScore: 100,
        needsConfirmation: false
      };
    }
    return {
      category: 'Utilities',
      form65Category: 'Telephone',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/condo|strata|property tax|municipal tax/.test(desc)) {
    return {
      category: 'Housing',
      form65Category: 'Property Taxes/Condo Fees',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/rent|lease|landlord|acn properties|apartments|mortgage/.test(desc)) {
    return {
      category: 'Housing',
      form65Category: 'Rent/Mortgage',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/ikea|ashley|leon'?s|brick\b|wayfair|furniture/.test(desc)) {
    return {
      category: 'Housing',
      form65Category: 'Furniture',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/mechanic|midas|jiffy lube|kal tire|mr\.?\s*lube|auto repair/.test(desc)) {
    return {
      category: 'Transportation',
      form65Category: 'Repair/Maintenance/Gas',
      isCategorized: false,
      confidenceScore: 70,
      needsConfirmation: true,
      requiresProof: Math.abs(signedAmount) >= 500,
      confirmationReason:
        'Confirm if this vehicle repair is routine transportation or an essential Employment Expense required for work.'
    };
  }
  if (/shell|esso|petro[- ]?canada|petrocan|chevron|pioneer|ultramar|mobil\b|circle k|co-op gas|husky/.test(desc)) {
    return {
      category: 'Transportation',
      form65Category: 'Repair/Maintenance/Gas',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/ttc\b|translink|presto|stm\b|oc transpo|bc transit|go transit|uber\b|lyft\b|compass|bixi|via rail/.test(desc)) {
    return {
      category: 'Transportation',
      form65Category: 'Public Transportation',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/icbc|intact|aviva|sonnet|td insurance|desjardins ins|belair|co-operators|wawanesa|mpi\b|sgi\b/.test(desc)) {
    return {
      category: 'Insurance',
      form65Category: 'Vehicle',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/manulife|sun life|sunlife|canada life|great[- ]?west/.test(desc)) {
    return {
      category: 'Insurance',
      form65Category: 'Life Insurance',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/mark'?s|work wear|safety supply|union dues/.test(desc)) {
    return {
      category: 'Employment',
      form65Category: 'Employment Expenses',
      isCategorized: false,
      confidenceScore: 70,
      needsConfirmation: true,
      requiresProof: true,
      confirmationReason:
        'Items required as a condition of employment qualify as Non-Discretionary Employment Expenses — attach receipt to retain more earnings.'
    };
  }
  if (/winners|marshalls|old navy|gap\b|h&m|zara|uniqlo|sport chek|lululemon|hudson'?s bay|value village|clothing|apparel/.test(desc)) {
    return {
      category: 'Clothing',
      form65Category: 'Clothing',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/laundry|dry clean|coinamatic/.test(desc)) {
    return {
      category: 'Living',
      form65Category: 'Laundry & Dry Cleaning',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/barber|salon|haircut|sephora|grooming|toiletries/.test(desc)) {
    return {
      category: 'Personal',
      form65Category: 'Grooming & Toiletries',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/netflix|spotify|disney|cineplex|playstation|xbox|steam|apple\.com|google play|gym|goodlife|planet fitness/.test(desc)) {
    return {
      category: 'Personal',
      form65Category: 'Entertainment/Sports',
      isCategorized: true,
      confidenceScore: 100,
      needsConfirmation: false
    };
  }
  if (/dropbox|adobe|microsoft|github|canva/.test(desc)) {
    return {
      category: 'Software & Subscriptions',
      form65Category: 'Telephone',
      isCategorized: false,
      confidenceScore: 55,
      needsConfirmation: true,
      confirmationReason:
        'Confirm if this software subscription is required for work (Employment Expenses) or personal utilities.'
    };
  }
  if (/transfer|e-transfer|etransfer|tfr\b|payment thank you|visa payment|mastercard payment|amex payment/.test(desc)) {
    return {
      category: 'Transfer / Internal',
      form65Category: 'Other Payments',
      isCategorized: false,
      confidenceScore: 40,
      needsConfirmation: true,
      confirmationReason:
        'Confirm whether this transfer was child/spousal support (Non-Discretionary), creditor payment, or an internal account transfer.'
    };
  }

  return {
    category: 'Uncategorized',
    form65Category: '',
    isCategorized: false,
    confidenceScore: 0,
    needsConfirmation: true,
    confirmationReason:
      'Unrecognized merchant — please confirm the exact Form 65 category so no allowable deduction is overlooked.'
  };
}

function formatReadableDate(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  // Handle OFX YYYYMMDD[HHMMSS...]
  const ofxMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxMatch) {
    const d = new Date(Number(ofxMatch[1]), Number(ofxMatch[2]) - 1, Number(ofxMatch[3]));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
  }

  // Handle ISO YYYY-MM-DD cleanly without timezone drift
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  return cleaned;
}

function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Support accounting negative format ($123.45)
  const isParenNegative = /^\(.*\)$/.test(trimmed);
  const numericStr = trimmed.replace(/[$,()\sCADcad]/g, '');
  const val = parseFloat(numericStr);
  if (!Number.isFinite(val)) return null;
  return isParenNegative ? -Math.abs(val) : val;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvStatement(
  csvText: string,
  userId: string,
  accountId?: string
): ParsedStatementResult {
  const warnings: string[] = [];
  const rawLines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return { format: 'csv', transactions: [], warnings: ['The uploaded CSV file appears to be empty.'] };
  }

  // Locate header row (some banks like BMO/CIBC prepend 1-3 metadata lines before the header)
  let headerIndex = 0;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rawLines.length, 8); i++) {
    const cols = splitCsvLine(rawLines[i]).map((c) => c.toLowerCase());
    const hasDate = cols.some((c) => /date|posted/.test(c));
    const hasAmount = cols.some((c) => /amount|debit|credit|withdrawal|deposit|cad\$/.test(c));
    if (hasDate && hasAmount) {
      headerIndex = i;
      headers = cols;
      break;
    }
  }

  const firstRowCols = splitCsvLine(rawLines[0]).map((c) => c.toLowerCase());
  const looksHeaderless = headers.length === 0;

  // Headerless fallback (common in CIBC / TD / Simplii raw CSV exports: Date, Description, Debit, Credit[, Balance])
  let dateCol = -1;
  let descCol = -1;
  let descCol2 = -1;
  let amountCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let balanceCol = -1;
  let startDataRow = headerIndex + 1;

  if (!looksHeaderless) {
    dateCol = headers.findIndex((h) => /transaction date|posted date|date/.test(h));
    descCol = headers.findIndex((h) => /description 1|description|merchant|payee|name|details|memo/.test(h));
    descCol2 = headers.findIndex((h) => /description 2/.test(h));
    amountCol = headers.findIndex((h) => /^amount$|transaction amount|^cad\$$|^usd\$$/.test(h));
    debitCol = headers.findIndex((h) => /debit|withdrawal|outflow/.test(h));
    creditCol = headers.findIndex((h) => /credit|deposit|inflow/.test(h));
    balanceCol = headers.findIndex((h) => /balance/.test(h));
  } else if (firstRowCols.length >= 3) {
    startDataRow = 0;
    dateCol = 0;
    descCol = 1;
    if (firstRowCols.length === 3) {
      amountCol = 2;
    } else {
      debitCol = 2;
      creditCol = 3;
      if (firstRowCols.length >= 5) balanceCol = 4;
    }
    warnings.push('No column header row detected; applied standard Canadian Date / Description / Debit / Credit layout.');
  } else {
    return {
      format: 'csv',
      transactions: [],
      warnings: ['Could not recognize CSV columns. Expected Date, Description, and Amount/Debit/Credit columns.'],
    };
  }

  const transactions: Array<Omit<Transaction, 'id'>> = [];
  let endingBalance: number | undefined;

  for (let i = startDataRow; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i]);
    if (cols.length < 2) continue;

    const rawDate = dateCol >= 0 ? cols[dateCol] : cols[0];
    const descParts = [
      descCol >= 0 ? cols[descCol] : cols[1],
      descCol2 >= 0 ? cols[descCol2] : '',
    ]
      .map((s) => (s || '').trim())
      .filter(Boolean);
    const description = descParts.join(' — ') || 'Bank Transaction';

    let signedAmount: number | null = null;
    if (amountCol >= 0 && cols[amountCol]) {
      signedAmount = parseMoney(cols[amountCol]);
    } else {
      const debitVal = debitCol >= 0 ? parseMoney(cols[debitCol]) : null;
      const creditVal = creditCol >= 0 ? parseMoney(cols[creditCol]) : null;
      if (debitVal !== null && debitVal !== 0) {
        signedAmount = -Math.abs(debitVal);
      } else if (creditVal !== null && creditVal !== 0) {
        signedAmount = Math.abs(creditVal);
      }
    }

    if (signedAmount === null || signedAmount === 0) continue;

    if (balanceCol >= 0 && cols[balanceCol]) {
      const bal = parseMoney(cols[balanceCol]);
      if (bal !== null) {
        endingBalance = bal;
      }
    }

    const absAmount = Number(Math.abs(signedAmount).toFixed(2));
    const inferred = inferForm65FromDescription(description, signedAmount);

    transactions.push({
      userId,
      accountId,
      company: description.slice(0, 90),
      date: formatReadableDate(rawDate),
      amount: absAmount,
      category: inferred.category,
      form65Category: inferred.form65Category || undefined,
      isCategorized: inferred.isCategorized,
      needsConfirmation: inferred.needsConfirmation,
      confidenceScore: inferred.confidenceScore,
      confirmationReason: inferred.confirmationReason,
      requiresProof: inferred.requiresProof,
      status: 'cleared',
    });
  }

  if (transactions.length === 0) {
    warnings.push('No valid transactions were extracted from this CSV file.');
  }

  return {
    format: 'csv',
    endingBalance,
    transactions,
    warnings,
  };
}

function extractOfxTag(block: string, tag: string): string | undefined {
  const xmlRegex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const xmlMatch = block.match(xmlRegex);
  if (xmlMatch) return xmlMatch[1].trim();

  const sgmlRegex = new RegExp(`<${tag}>([^\\r\\n<]+)`, 'i');
  const sgmlMatch = block.match(sgmlRegex);
  if (sgmlMatch) return sgmlMatch[1].trim();

  return undefined;
}

export function parseOfxStatement(
  ofxText: string,
  format: 'ofx' | 'qfx',
  userId: string,
  accountId?: string
): ParsedStatementResult {
  const warnings: string[] = [];

  const org = extractOfxTag(ofxText, 'ORG');
  const acctId = extractOfxTag(ofxText, 'ACCTID');
  const acctTypeRaw = (extractOfxTag(ofxText, 'ACCTTYPE') || '').toUpperCase();
  const balAmtRaw = extractOfxTag(ofxText, 'BALAMT');

  let accountType: BankAccount['accountType'] = 'Chequing';
  if (acctTypeRaw.includes('SAV')) accountType = 'Savings';
  else if (acctTypeRaw.includes('CREDIT') || ofxText.includes('<CCSTMTRS>')) accountType = 'Credit Card';

  const accountMask = acctId ? `•••• ${acctId.slice(-4)}` : undefined;
  const endingBalance = balAmtRaw ? parseMoney(balAmtRaw) ?? undefined : undefined;

  // Match each <STMTTRN> block (handles both closed </STMTTRN> and SGML blocks before next <STMTTRN> or </BANKTRANLIST>)
  const trnChunks = ofxText.split(/<STMTTRN>/i).slice(1);
  const transactions: Array<Omit<Transaction, 'id'>> = [];

  for (const rawChunk of trnChunks) {
    const block = rawChunk.split(/<\/STMTTRN>|<\/BANKTRANLIST>/i)[0] || rawChunk;
    const dtPosted = extractOfxTag(block, 'DTPOSTED') || '';
    const trnAmtRaw = extractOfxTag(block, 'TRNAMT');
    const name = extractOfxTag(block, 'NAME') || '';
    const memo = extractOfxTag(block, 'MEMO') || '';

    const signedAmount = parseMoney(trnAmtRaw);
    if (signedAmount === null || signedAmount === 0) continue;

    const description =
      name && memo && memo.toLowerCase() !== name.toLowerCase()
        ? `${name} — ${memo}`
        : name || memo || 'Bank Transaction';

    const inferred = inferForm65FromDescription(description, signedAmount);

    transactions.push({
      userId,
      accountId,
      company: description.slice(0, 90),
      date: formatReadableDate(dtPosted),
      amount: Number(Math.abs(signedAmount).toFixed(2)),
      category: inferred.category,
      form65Category: inferred.form65Category || undefined,
      isCategorized: inferred.isCategorized,
      needsConfirmation: inferred.needsConfirmation,
      confidenceScore: inferred.confidenceScore,
      confirmationReason: inferred.confirmationReason,
      requiresProof: inferred.requiresProof,
      status: 'cleared',
    });
  }

  if (transactions.length === 0) {
    warnings.push(`No <STMTTRN> records were found inside the ${format.toUpperCase()} file.`);
  }

  return {
    format,
    institution: org,
    accountType,
    accountMask,
    endingBalance,
    transactions,
    warnings,
  };
}
