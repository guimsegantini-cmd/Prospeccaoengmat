import React, { useState } from 'react';
import { ConstructionSite, ConstructionPhase, SiteProfile, LeadStage, Contact } from '../types';
import { X, MapPin, Plus, Trash2, User } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSubmit: (site: Omit<ConstructionSite, 'id'>) => void;
    initialData?: ConstructionSite;
    existingBuilders: string[]; // List of existing builders for autocomplete
}

const ConstructionForm: React.FC<Props> = ({ onClose, onSubmit, initialData, existingBuilders }) => {
    // Helper to migrate old data structure to new contacts array if needed
    const getInitialContacts = (): Contact[] => {
        if (initialData?.contacts && initialData.contacts.length > 0) {
            return initialData.contacts;
        }
        // Fallback for legacy data
        if (initialData?.responsibleName) {
            return [{
                name: initialData.responsibleName,
                role: 'Responsável',
                phone: initialData.phone || '',
                email: initialData.email || ''
            }];
        }
        // Default empty contact
        return [{ name: '', role: '', phone: '', email: '' }];
    };

    const [formData, setFormData] = useState<Partial<ConstructionSite>>({
        builderName: initialData?.builderName || '',
        siteName: initialData?.siteName || '',
        address: initialData?.address || '',
        neighborhood: initialData?.neighborhood || '',
        lat: initialData?.lat || '',
        lng: initialData?.lng || '',
        phase: initialData?.phase || ConstructionPhase.FOUNDATION,
        profile: initialData?.profile || SiteProfile.MEDIUM_STD,
        leadStage: initialData?.leadStage || LeadStage.MAPPED,
        connectedRepresentations: initialData?.connectedRepresentations || [],
        tasks: initialData?.tasks || []
    });

    const [contacts, setContacts] = useState<Contact[]>(getInitialContacts());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Contact Management ---
    const handleContactChange = (index: number, field: keyof Contact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    const addContact = () => {
        setContacts([...contacts, { name: '', role: '', phone: '', email: '' }]);
    };

    const removeContact = (index: number) => {
        if (contacts.length === 1) {
            alert("É necessário ter pelo menos um contato.");
            return;
        }
        const newContacts = contacts.filter((_, i) => i !== index);
        setContacts(newContacts);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: Ensure at least one contact has a name
        if (contacts.length === 0 || !contacts[0].name) {
            alert("Por favor, adicione pelo menos um contato com nome.");
            return;
        }

        onSubmit({
            ...formData as ConstructionSite,
            contacts: contacts,
            createdAt: initialData ? initialData.createdAt : Date.now(),
            tasks: initialData ? initialData.tasks : [],
            connectedRepresentations: initialData ? initialData.connectedRepresentations : [],
            // Legacy fields for backward compatibility (optional)
            responsibleName: contacts[0].name,
            phone: contacts[0].phone,
            email: contacts[0].email
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">
                        {initialData ? 'Editar Obra' : 'Nova Obra'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Obra</label>
                        <input required name="siteName" value={formData.siteName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Residencial Flores" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Construtora</label>
                        <input 
                            required 
                            name="builderName" 
                            list="builders-list"
                            value={formData.builderName} 
                            onChange={handleChange} 
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="Selecione ou digite..." 
                        />
                        <datalist id="builders-list">
                            {existingBuilders.map((builder, idx) => (
                                <option key={idx} value={builder} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fase da Obra</label>
                        <select name="phase" value={formData.phase} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(ConstructionPhase).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* --- Contacts Section --- */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <User size={16} /> Contatos
                            </label>
                            <button type="button" onClick={addContact} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium flex items-center gap-1">
                                <Plus size={12} /> Adicionar Contato
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {contacts.map((contact, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="md:col-span-4">
                                        <input required placeholder="Nome" value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <input placeholder="Cargo (Ex: Eng.)" value={contact.role} onChange={e => handleContactChange(index, 'role', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                        <input placeholder="Telefone" value={contact.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none focus:border-blue-500" />
                                        <input placeholder="Email" value={contact.email} onChange={e => handleContactChange(index, 'email', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-1 flex justify-center mt-2 md:mt-0">
                                        <button type="button" onClick={() => removeContact(index)} className="text-slate-400 hover:text-red-500 transition-colors" title="Remover contato">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Rua, Número, Cidade" />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                         <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bairro/Região</label>
                            <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Centro" />
                        </div>
                        <div className="col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Lat (Opcional)</label>
                             <input name="lat" value={formData.lat} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="-23.5505" />
                        </div>
                        <div className="col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Long (Opcional)</label>
                             <input name="lng" value={formData.lng} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="-46.6333" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
                        <select name="profile" value={formData.profile} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(SiteProfile).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status do Lead</label>
                        <select name="leadStage" value={formData.leadStage} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors">
                            {initialData ? 'Salvar Alterações' : 'Cadastrar Obra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConstructionForm;
