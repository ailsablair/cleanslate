import { LIT } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export const INITIAL_LITS: LIT[] = [
  // British Columbia
  {
    id: 'lit-bdo-bc-001',
    name: 'Sarah Jenkins, CPA, CIRP, LIT',
    firm: 'BDO Canada Limited',
    email: 'sjenkins@bdo.ca',
    phone: '(604) 688-5421',
    city: 'Vancouver',
    province: 'British Columbia',
    licenseNumber: 'LIT-BC-2849',
    address: '601 W Hastings St #1100, Vancouver, BC V6B 1M8'
  },
  {
    id: 'lit-mnp-bc-002',
    name: 'David Tremblay, CIRP, LIT',
    firm: 'MNP Ltd. Insolvency',
    email: 'david.tremblay@mnp.ca',
    phone: '(604) 639-0001',
    city: 'Vancouver',
    province: 'British Columbia',
    licenseNumber: 'LIT-BC-3190',
    address: '1021 W Hastings St #2200, Vancouver, BC V6E 0C3'
  },
  {
    id: 'lit-sands-bc-003',
    name: 'Blair Mantin, CIRP, LIT',
    firm: 'Sands & Associates',
    email: 'bmantin@sands-trustee.com',
    phone: '(604) 684-3030',
    city: 'Vancouver',
    province: 'British Columbia',
    licenseNumber: 'LIT-BC-1422',
    address: '1100 Melville St #1340, Vancouver, BC V6E 4A6'
  },
  {
    id: 'lit-cs-bc-004',
    name: 'Colleen Craig, CIRP, LIT',
    firm: 'C. Craig & Associates Licensed Insolvency Trustee',
    email: 'colleen@ccraigtrustee.ca',
    phone: '(250) 386-8778',
    city: 'Victoria',
    province: 'British Columbia',
    licenseNumber: 'LIT-BC-1923',
    address: '730 View St #500, Victoria, BC V8W 1J8'
  },
  {
    id: 'lit-bdo-kelowna-005',
    name: 'Robert Vanderhoof, CIRP, LIT',
    firm: 'BDO Canada Limited',
    email: 'rvanderhoof@bdo.ca',
    phone: '(250) 763-6700',
    city: 'Kelowna',
    province: 'British Columbia',
    licenseNumber: 'LIT-BC-4102',
    address: '1631 Dickson Ave #400, Kelowna, BC V1Y 0B5'
  },

  // Alberta
  {
    id: 'lit-brom-ab-006',
    name: 'Taz Rajan, CIRP, LIT',
    firm: 'Bromwich+Smith Licensed Insolvency Trustees',
    email: 'taz.rajan@bromwichandsmith.com',
    phone: '(403) 263-2225',
    city: 'Calgary',
    province: 'Alberta',
    licenseNumber: 'LIT-AB-5098',
    address: '840 6 Ave SW #300, Calgary, AB T2P 3E5'
  },
  {
    id: 'lit-faber-ab-007',
    name: 'Paul Faber, CIRP, LIT',
    firm: 'Faber Inc. Licensed Insolvency Trustee',
    email: 'pfaber@faberinc.com',
    phone: '(780) 424-4300',
    city: 'Edmonton',
    province: 'Alberta',
    licenseNumber: 'LIT-AB-2211',
    address: '10130 103 St NW #1700, Edmonton, AB T5J 3N9'
  },
  {
    id: 'lit-mnp-cgy-008',
    name: 'Donna Carson, CIRP, LIT',
    firm: 'MNP Ltd. Insolvency',
    email: 'donna.carson@mnp.ca',
    phone: '(403) 537-8424',
    city: 'Calgary',
    province: 'Alberta',
    licenseNumber: 'LIT-AB-3392',
    address: '150 6 Ave SW #2000, Calgary, AB T2P 3Y7'
  },

  // Ontario
  {
    id: 'lit-gt-on-009',
    name: 'Elena Rostova, CPA, LIT',
    firm: 'Grant Thornton Limited',
    email: 'elena.rostova@ca.gt.com',
    phone: '(416) 366-0100',
    city: 'Toronto',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-4912',
    address: '1900 Minnesota Crt #110, Mississauga, ON L5N 3C9'
  },
  {
    id: 'lit-farber-on-010',
    name: 'Richard Goldhar, CIRP, LIT',
    firm: 'Farber Debt Solutions',
    email: 'rgoldhar@farbergroup.com',
    phone: '(416) 496-3070',
    city: 'Toronto',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-3829',
    address: '150 York St #1600, Toronto, ON M5H 3S5'
  },
  {
    id: 'lit-hm-on-011',
    name: 'Doug Hoyes, FCPA, CIRP, LIT',
    firm: 'Hoyes, Michalos & Associates Inc.',
    email: 'dhoyes@hoyes.com',
    phone: '(866) 747-0660',
    city: 'Kitchener',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-1150',
    address: '603 King St W #202, Kitchener, ON N2G 1C9'
  },
  {
    id: 'lit-spergel-on-012',
    name: 'Gillian Goldblatt, CPA, CIRP, LIT',
    firm: 'msi Spergel Inc.',
    email: 'ggoldblatt@spergel.ca',
    phone: '(416) 497-1660',
    city: 'Toronto',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-2780',
    address: '505 Consumers Rd #200, North York, ON M2J 4V8'
  },
  {
    id: 'lit-fuller-on-013',
    name: 'Ken Pearl, CIRP, LIT',
    firm: 'Fuller Landau Debt Solutions',
    email: 'kpearl@fullerllp.com',
    phone: '(416) 645-6500',
    city: 'Toronto',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-2291',
    address: '151 Bloor St W #1200, Toronto, ON M5S 1S4'
  },
  {
    id: 'lit-doyle-ott-014',
    name: 'Dana MacRae, CIRP, LIT',
    firm: 'Doyle Salewski Inc.',
    email: 'dana.macrae@doylesalewski.com',
    phone: '(613) 235-2000',
    city: 'Ottawa',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-3490',
    address: '234 Argyle Ave, Ottawa, ON K2P 1B9'
  },
  {
    id: 'lit-fontaine-on-015',
    name: 'Robert Fontaine, CIRP, LIT',
    firm: 'Fontaine & Associates Inc.',
    email: 'rfontaine@fontainetrustee.com',
    phone: '(613) 548-8888',
    city: 'Kingston',
    province: 'Ontario',
    licenseNumber: 'LIT-ON-1823',
    address: '800 Princess St #201, Kingston, ON K7L 5E4'
  },

  // Quebec
  {
    id: 'lit-deloitte-qc-016',
    name: 'Michael Fontaine, CPA, LIT',
    firm: 'Deloitte Restructuring Inc.',
    email: 'mfontaine@deloitte.ca',
    phone: '(514) 393-7115',
    city: 'Montreal',
    province: 'Quebec',
    licenseNumber: 'LIT-QC-1184',
    address: '1190 Avenue des Canadiens-de-Montréal, Montreal, QC H3B 0M7'
  },
  {
    id: 'lit-ginsberg-qc-017',
    name: 'Chantal Gingras, CIRP, LIT',
    firm: 'Ginsberg Gingras & Associates',
    email: 'cgingras@ginsberg-gingras.com',
    phone: '(819) 776-0284',
    city: 'Gatineau',
    province: 'Quebec',
    licenseNumber: 'LIT-QC-2901',
    address: '15 Blvd du Mont-Bleu #200, Gatineau, QC J8Z 1V1'
  },
  {
    id: 'lit-rc-qc-018',
    name: 'Jean-Daniel Raymond, CIRP, LIT',
    firm: 'Raymond Chabot Grant Thornton',
    email: 'raymond.jd@rcgt.com',
    phone: '(514) 878-2691',
    city: 'Montreal',
    province: 'Quebec',
    licenseNumber: 'LIT-QC-3419',
    address: '600 Rue de la Gauchetière O #2000, Montreal, QC H3B 4L8'
  },

  // Manitoba
  {
    id: 'lit-lctaylor-mb-019',
    name: 'Leigh Taylor, CIRP, LIT',
    firm: 'L.C. Taylor & Co. Ltd. Trustees',
    email: 'ltaylor@lctaylor.com',
    phone: '(204) 925-6400',
    city: 'Winnipeg',
    province: 'Manitoba',
    licenseNumber: 'LIT-MB-1049',
    address: '386 Broadway #505, Winnipeg, MB R3C 3R6'
  },
  {
    id: 'lit-mnp-wpg-020',
    name: 'Gord Neudorf, CPA, LIT',
    firm: 'MNP Ltd. Insolvency',
    email: 'gord.neudorf@mnp.ca',
    phone: '(204) 336-6167',
    city: 'Winnipeg',
    province: 'Manitoba',
    licenseNumber: 'LIT-MB-2410',
    address: '242 Hargrave St #1600, Winnipeg, MB R3C 0T8'
  },

  // Saskatchewan
  {
    id: 'lit-deloitte-sk-021',
    name: 'Brent Vandale, CIRP, LIT',
    firm: 'Deloitte Restructuring Inc.',
    email: 'bvandale@deloitte.ca',
    phone: '(306) 565-5200',
    city: 'Regina',
    province: 'Saskatchewan',
    licenseNumber: 'LIT-SK-2189',
    address: '2103 11th Ave #900, Regina, SK S4P 3Z8'
  },
  {
    id: 'lit-mnp-sask-022',
    name: 'Pamela Meger, CIRP, LIT',
    firm: 'MNP Ltd. Insolvency',
    email: 'pamela.meger@mnp.ca',
    phone: '(306) 751-8012',
    city: 'Saskatoon',
    province: 'Saskatchewan',
    licenseNumber: 'LIT-SK-4091',
    address: '119 4th Ave S #800, Saskatoon, SK S7K 5X2'
  },

  // Nova Scotia
  {
    id: 'lit-allan-ns-023',
    name: 'Allan Marshall, CIRP, LIT',
    firm: 'Allan Marshall & Associates Inc.',
    email: 'amarshall@marshalls.org',
    phone: '(902) 466-4150',
    city: 'Halifax',
    province: 'Nova Scotia',
    licenseNumber: 'LIT-NS-1102',
    address: '99 Wyse Rd #102, Dartmouth, NS B3A 4S5'
  },
  {
    id: 'lit-gt-ns-024',
    name: 'Paul LeBlanc, CIRP, LIT',
    firm: 'Grant Thornton Limited',
    email: 'paul.leblanc@ca.gt.com',
    phone: '(902) 421-1734',
    city: 'Halifax',
    province: 'Nova Scotia',
    licenseNumber: 'LIT-NS-2890',
    address: '1675 Grafton St #1000, Halifax, NS B3J 0E9'
  },

  // New Brunswick
  {
    id: 'lit-allan-nb-025',
    name: 'Kelly Roberts, CIRP, LIT',
    firm: 'Allan Marshall & Associates Inc.',
    email: 'kroberts@marshalls.org',
    phone: '(506) 652-3200',
    city: 'Saint John',
    province: 'New Brunswick',
    licenseNumber: 'LIT-NB-3180',
    address: '53 King St #200, Saint John, NB E2L 1G5'
  },

  // Newfoundland & Labrador
  {
    id: 'lit-bdo-nl-026',
    name: 'Heather Keats, CIRP, LIT',
    firm: 'BDO Canada Limited',
    email: 'hkeats@bdo.ca',
    phone: '(709) 576-8500',
    city: 'St. John\'s',
    province: 'Newfoundland and Labrador',
    licenseNumber: 'LIT-NL-1980',
    address: '300 Water St #400, St. John\'s, NL A1C 0B7'
  },

  // Prince Edward Island
  {
    id: 'lit-gt-pei-027',
    name: 'David Boyd, CIRP, LIT',
    firm: 'Grant Thornton Limited',
    email: 'david.boyd@ca.gt.com',
    phone: '(902) 892-6547',
    city: 'Charlottetown',
    province: 'Prince Edward Island',
    licenseNumber: 'LIT-PE-1420',
    address: '98 Fitzroy St, Charlottetown, PE C1A 1R7'
  },

  // National Firms & Specialists
  {
    id: 'lit-pwc-nat-028',
    name: 'Karen Johnston, CPA, LIT',
    firm: 'PricewaterhouseCoopers Inc. (PwC)',
    email: 'karen.johnston@pwc.com',
    phone: '(416) 863-1133',
    city: 'Toronto',
    province: 'Ontario',
    licenseNumber: 'LIT-NAT-4019',
    address: '18 York St #2600, Toronto, ON M5J 0B2'
  },
  {
    id: 'lit-kpmg-bc-029',
    name: 'Amanda Bell, CPA, LIT',
    firm: 'KPMG Inc. Insolvency',
    email: 'amandabell@kpmg.ca',
    phone: '(604) 691-3000',
    city: 'Vancouver',
    province: 'British Columbia',
    licenseNumber: 'LIT-BC-6721',
    address: '777 Dunsmuir St, Vancouver, BC V7Y 1K3'
  }
];

export async function fetchLITs(): Promise<LIT[]> {
  try {
    const colRef = collection(db, 'lits');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: LIT[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<LIT, 'id'>) });
      });
      return items;
    } else {
      // Seed initial LITs in background
      INITIAL_LITS.forEach(async (lit) => {
        try {
          await setDoc(doc(db, 'lits', lit.id), lit);
        } catch (e) {
          console.warn('Seeding LIT failed silently:', e);
        }
      });
      return INITIAL_LITS;
    }
  } catch (error) {
    console.warn('Using local fallback LIT list:', error);
    return INITIAL_LITS;
  }
}
