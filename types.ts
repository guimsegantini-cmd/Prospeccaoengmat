

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
    notes?: string; // Added field for task observations
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    type: TaskType;
    completed: boolean;
    createdAt: number;
}

export interface ConstructionSite {
    id: string;
    builderName: string;
    siteName: string;
    responsibleName: string;
    phone: string;
    email: string;
    address: string;
    neighborhood: string; // Added for Heatmap filtering logic
    lat?: string; // Latitude (stored as string to avoid formatting issues in inputs, converted to number for map)
    lng?: string; // Longitude
    phase: ConstructionPhase;
    profile: SiteProfile;
    leadStage: LeadStage;
    connectedRepresentations: string[]; // List of connected brands
    tasks: Task[];
    createdAt: number;
}