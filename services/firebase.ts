
// Use standard modular imports for Firebase v9+
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
// Import User as a type to resolve "no exported member" error when mixed with values
import type { User } from 'firebase/auth';
import { ConstructionSite, ConstructionPhase, SiteProfile, LeadStage } from '../types';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCPtfLsNBnFML4pJG6n5xgZ2aeiHoOCqQY",
  authDomain: "prospeccaoengmat.firebaseapp.com",
  projectId: "prospeccaoengmat",
  storageBucket: "prospeccaoengmat.firebasestorage.app",
  messagingSenderId: "189441352712",
  appId: "1:189441352712:web:e2bcade74a4adfb0ccddbd",
  measurementId: "G-8LH6J76EN8"
};

// Initialize Firebase using modular SDK exports.
// Ensure we don't re-initialize if the app already exists.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore and Auth using the modular pattern.
export const db = getFirestore(app);
export const auth = getAuth(app);

// Re-export onAuthStateChanged to resolve module resolution issues in App.tsx.
export { onAuthStateChanged };

// --- HELPER FOR DEMO MODE ---
export const isDemoMode = false; 

// Initial Mock Data (Used only if isDemoMode is true)
// Updated to use proper enum values instead of casted strings.
let mockSites: ConstructionSite[] = [
    {
        id: '1',
        builderName: 'Construtora Horizonte',
        siteName: 'Residencial Vista Azul',
        responsibleName: 'Carlos Silva',
        phone: '(11) 99999-8888',
        email: 'carlos@horizonte.com',
        address: 'Av. Paulista, 1000',
        neighborhood: 'Bela Vista',
        phase: ConstructionPhase.STRUCTURE,
        profile: SiteProfile.HIGH_END,
        leadStage: LeadStage.CONTACT,
        connectedRepresentations: ['ROCA SANITÁRIOS', 'DM2'],
        contacts: [
            {
                name: 'Carlos Silva',
                role: 'Responsável',
                phone: '(11) 99999-8888',
                email: 'carlos@horizonte.com'
            }
        ],
        createdAt: Date.now() - 10000000,
        tasks: [
            {
                id: 't1',
                siteId: '1',
                description: 'Ligar para agendar visita',
                date: '2023-11-20',
                time: '14:00',
                type: 'Ligação' as any,
                completed: false,
                createdAt: Date.now()
            }
        ]
    }
];

export const subscribeToSites = (callback: (sites: ConstructionSite[]) => void) => {
    if (isDemoMode) {
        callback([...mockSites]);
        return () => {};
    }
    
    const sitesCollection = collection(db, 'sites');
    const q = query(sitesCollection, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const sites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConstructionSite));
        callback(sites);
    }, (error) => {
        console.error("Erro ao buscar obras:", error);
    });
};

export const addSite = async (site: Omit<ConstructionSite, 'id'>) => {
    if (isDemoMode) {
        const newSite = { ...site, id: Math.random().toString(36).substr(2, 9) };
        mockSites = [newSite, ...mockSites];
        return;
    }
    await addDoc(collection(db, 'sites'), site);
};

export const updateSite = async (siteId: string, data: Partial<ConstructionSite>) => {
    if (isDemoMode) {
        mockSites = mockSites.map(s => s.id === siteId ? { ...s, ...data } : s);
        return;
    }
    const siteRef = doc(db, 'sites', siteId);
    await updateDoc(siteRef, data);
};

export const deleteSite = async (siteId: string) => {
    if (isDemoMode) {
        mockSites = mockSites.filter(s => s.id !== siteId);
        return;
    }
    const siteRef = doc(db, 'sites', siteId);
    await deleteDoc(siteRef);
};

// --- AUTH SERVICES ---

export const login = async (email: string, password: string): Promise<User | {email: string} | null> => {
    if (isDemoMode) {
        if (email === 'demo@app.com' && password === 'demo123') {
             return { email: 'demo@app.com' } as any;
        }
        throw new Error('Credenciais inválidas. (Use demo@app.com / demo123)');
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
};

export const register = async (email: string, password: string): Promise<User | null> => {
    if (isDemoMode) {
        throw new Error('O registro não está disponível no modo Demo.');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
};

export const logout = async () => {
    if (isDemoMode) return;
    await signOut(auth);
};
