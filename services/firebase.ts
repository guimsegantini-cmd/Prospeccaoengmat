import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { ConstructionSite, Task } from '../types';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- HELPER FOR DEMO MODE ---
// Set to false to use real Firebase Auth
let isDemoMode = false; 

// Initial Mock Data (Used only if isDemoMode is true)
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
        phase: 'Estrutura' as any,
        profile: 'Alto Padrão' as any,
        leadStage: 'Em Negociação' as any,
        connectedRepresentations: ['ROCA SANITÁRIOS', 'DM2'],
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
    
    const q = query(collection(db, 'sites'), orderBy('createdAt', 'desc'));
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
    await updateDoc(doc(db, 'sites', siteId), data);
};

export const deleteSite = async (siteId: string) => {
    if (isDemoMode) {
        mockSites = mockSites.filter(s => s.id !== siteId);
        return;
    }
    await deleteDoc(doc(db, 'sites', siteId));
};

// --- AUTH SERVICES ---

export const login = async (email: string, password: string): Promise<User | {email: string} | null> => {
    if (isDemoMode) {
        if (email === 'demo@app.com' && password === 'demo123') {
             return { email: 'demo@app.com' };
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

export { auth, db, isDemoMode };
