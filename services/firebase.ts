import { ConstructionSite, Task } from '../types';

// Mock User Interface
export interface User {
    uid: string;
    email: string | null;
}

// --- HELPER FOR DEMO MODE ---
export const isDemoMode = true; 

// Mock Objects
export const db = {};
export const auth = {
    currentUser: null as User | null
};

// Initial Mock Data
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

// Mock onAuthStateChanged
export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
    // Check local storage for persisted demo session
    const storedUser = localStorage.getItem('demo_user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            auth.currentUser = user;
            callback(user);
        } catch (e) {
            callback(null);
        }
    } else {
        callback(null);
    }
    // Return unsubscribe function
    return () => {};
};

export const subscribeToSites = (callback: (sites: ConstructionSite[]) => void) => {
    // Simulate network delay
    setTimeout(() => {
        callback([...mockSites]);
    }, 300);
    return () => {};
};

export const addSite = async (site: Omit<ConstructionSite, 'id'>) => {
    const newSite = { ...site, id: Math.random().toString(36).substr(2, 9) };
    mockSites = [newSite, ...mockSites];
    return;
};

export const updateSite = async (siteId: string, data: Partial<ConstructionSite>) => {
    mockSites = mockSites.map(s => s.id === siteId ? { ...s, ...data } : s);
    return;
};

export const deleteSite = async (siteId: string) => {
    mockSites = mockSites.filter(s => s.id !== siteId);
    return;
};

// --- AUTH SERVICES ---

export const login = async (email: string, password: string): Promise<User | null> => {
    if (email === 'demo@app.com' && password === 'demo123') {
         const user = { email: 'demo@app.com', uid: 'demo-123' };
         localStorage.setItem('demo_user', JSON.stringify(user));
         auth.currentUser = user;
         return user;
    }
    throw new Error('Credenciais inválidas. (Use demo@app.com / demo123)');
};

export const register = async (email: string, password: string): Promise<User | null> => {
    throw new Error('O registro não está disponível no modo Demo.');
};

export const logout = async () => {
    localStorage.removeItem('demo_user');
    auth.currentUser = null;
};
