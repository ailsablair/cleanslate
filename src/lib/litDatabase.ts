import { LIT } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export const INITIAL_LITS: LIT[] = [
  {
    id: 'lit-bdo-001',
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
    id: 'lit-mnp-002',
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
    id: 'lit-sands-003',
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
    id: 'lit-gt-004',
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
    id: 'lit-brom-005',
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
    id: 'lit-deloitte-006',
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
    id: 'lit-fuller-007',
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
    id: 'lit-farber-008',
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
    id: 'lit-kpmg-009',
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
