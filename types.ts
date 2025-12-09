

export enum ConstructionPhase {
    PLANNING = 'Planejamento',
    FOUNDATION = 'Fundação',
    STRUCTURE = 'Estrutura',
    MASONRY = 'Alvenaria',
    FINISHING = 'Acabamento',
    DELIVERED = 'Entregue',
    STOPPED = 'Parada'
}

export enum SiteProfile {
    POPULAR = 'Popular',
    MEDIUM_STD = 'Médio Padrão',
    MEDIUM_HIGH = 'Médio Alto',
    HIGH_END = 'Alto Padrão',
    LUXURY = 'Luxo'
}

export enum LeadStage {
    MAPPED = 'Mapeado',
    QUALIFIED = 'Qualificado',
    CONTACT = 'Em contato',
    PROPOSAL = 'Cliente convertido em proposta',
    INACTIVE = 'Inativo'
}

export enum TaskType {
    CALL = 'Ligação',
    EMAIL = 'E-mail',
    VISIT = 'Visita',
    WHATSAPP = 'WhatsApp',
    PROPOSAL = 'Orçamento'
}

export const REPRESENTATIONS = [
    'DM2', 'MGM', 'ALUMBRA', 'CONDEX', 'ROCA PORCELANATO', 
    'ROCA SANITÁRIOS', 'CONSTRUCOM BLOCOS', 'UNI-STEIN ARGAMASSAS', 'DACAPO'
];

export interface Task {
    id: string;
    siteId: string;
    description: string;
    notes?: string; 
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    type: TaskType;
    completed: boolean;
    createdAt: number;
}

export interface Contact {
    name: string;
    role: string; // Cargo (Engenheiro, Comprador, Mestre de Obras, etc.)
    phone: string;
    email: string;
}

export interface ConstructionSite {
    id: string;
    builderName: string;
    siteName: string;
    
    // New Structure for Multiple Contacts
    contacts: Contact[];

    // Deprecated fields (kept for backward compatibility during migration)
    responsibleName?: string;
    phone?: string;
    email?: string;

    address: string;
    neighborhood: string; 
    lat?: string; 
    lng?: string; 
    phase: ConstructionPhase;
    profile: SiteProfile;
    leadStage: LeadStage;
    connectedRepresentations: string[]; 
    tasks: Task[];
    createdAt: number;
}
