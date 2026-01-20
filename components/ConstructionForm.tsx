
import React, { useState, useEffect } from 'react';
import { ConstructionSite, ConstructionPhase, SiteProfile, LeadStage, Contact } from '../types';
import { X, MapPin, Plus, Trash2, User, Search, Zap } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSubmit: (site: Omit<ConstructionSite, 'id'>) => void;
    initialData?: ConstructionSite;
    existingBuilders: string[]; 
    allSites?: ConstructionSite[]; // Pass all sites to allow finding previous data
}

const ConstructionForm: React.FC<Props> = ({ onClose, onSubmit, initialData, existingBuilders, allSites }) => {
    const getInitialContacts = (): Contact[] => {
        if (initialData?.contacts && initialData.contacts.length > 0) return initialData.contacts;
        if (initialData?.responsibleName) {
            return [{ name: initialData.responsibleName, role: 'Responsável', phone: initialData.phone || '', email: initialData.email || '' }];
        }
        return [{ name: '', role: '', phone: '', email: '' }];
    };

    const [formData, setFormData] = useState<Partial<ConstructionSite>>({
        builderName: initialData?.builderName || '',
        siteName: initialData?.siteName || '',
        address: initialData?.address || '',
        neighborhood: initialData?.neighborhood || '',
        cep: initialData?.cep || '',
        lat: initialData?.lat || '',
        lng: initialData?.lng || '',
        phase: initialData?.phase || ConstructionPhase.FOUNDATION,
        profile: initialData?.profile || SiteProfile.MEDIUM_STD,
        leadStage: initialData?.leadStage || LeadStage.MAPPED,
        connectedRepresentations: initialData?.connectedRepresentations || [],
        tasks: initialData?.tasks || []
    });

    const [contacts, setContacts] = useState<Contact[]>(getInitialContacts());
    const [loadingCep, setLoadingCep] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // CEP Lookup
    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        setFormData({ ...formData, cep });

        if (cep.length === 8) {
            setLoadingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: `${data.logradouro}, ${data.localidade} - ${data.uf}`,
                        neighborhood: data.bairro
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            } finally {
                setLoadingCep(false);
            }
        }
    };

    // Auto-fill logic based on builder name
    const suggestAutoFill = () => {
        if (!allSites || !formData.builderName) return;
        const previousSite = allSites.find(s => s.builderName.toLowerCase() === formData.builderName?.toLowerCase());
        if (previousSite) {
            if (window.confirm(`Deseja carregar os contatos e dados da última obra da "${previousSite.builderName}"?`)) {
                setContacts(previousSite.contacts || []);
            }
        } else {
            alert("Nenhum dado prévio encontrado para esta construtora.");
        }
    };

    const handleContactChange = (index: number, field: keyof Contact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    const addContact = () => setContacts([...contacts, { name: '', role: '', phone: '', email: '' }]);
    const removeContact = (index: number) => {
        if (contacts.length === 1) return;
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (contacts.length === 0 || !contacts[0].name) {
            alert("Por favor, adicione pelo menos um contato com nome.");
            return;
        }
        onSubmit({
            ...formData as ConstructionSite,
            contacts: contacts,
            createdAt: initialData ? initialData.createdAt : Date.now(),
            tasks: initialData ? initialData.tasks : [],
            connectedRepresentations: formData.connectedRepresentations || [],
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
                    <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Editar Obra' : 'Nova Obra'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Obra</label>
                        <input required name="siteName" value={formData.siteName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Residencial Flores" />
                    </div>
                    
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Construtora</label>
                        <div className="flex gap-2">
                            <input required name="builderName" list="builders-list" value={formData.builderName} onChange={handleChange} className="flex-1 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Gafisa" />
                            <button type="button" onClick={suggestAutoFill} className="px-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors" title="Auto-preencher dados antigos">
                                <Zap size={18} />
                            </button>
                        </div>
                        <datalist id="builders-list">
                            {existingBuilders.map((builder, idx) => <option key={idx} value={builder} />)}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fase da Obra</label>
                        <select name="phase" value={formData.phase} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(ConstructionPhase).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={16} /> Contatos</label>
                            <button type="button" onClick={addContact} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium flex items-center gap-1"><Plus size={12} /> Add Contato</button>
                        </div>
                        <div className="space-y-3">
                            {contacts.map((contact, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="md:col-span-4"><input required placeholder="Nome" value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none" /></div>
                                    <div className="md:col-span-3"><input placeholder="Cargo" value={contact.role} onChange={e => handleContactChange(index, 'role', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none" /></div>
                                    <div className="md:col-span-4 grid grid-cols-2 gap-2">
                                        <input placeholder="Tel" value={contact.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none" />
                                        <input placeholder="Email" value={contact.email} onChange={e => handleContactChange(index, 'email', e.target.value)} className="w-full text-sm border-slate-200 rounded p-2 bg-slate-50 focus:bg-white border outline-none" />
                                    </div>
                                    <div className="md:col-span-1 flex justify-center"><button type="button" onClick={() => removeContact(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">CEP {loadingCep && <span className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></span>}</label>
                        <input name="cep" value={formData.cep} onChange={handleCepChange} maxLength={9} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="00000-000" />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bairro/Região</label>
                        <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Centro" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Logradouro, Numero, Cidade" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
                        <select name="profile" value={formData.profile} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(SiteProfile).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status do Lead</label>
                        <select name="leadStage" value={formData.leadStage} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors">{initialData ? 'Salvar Alterações' : 'Cadastrar Obra'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConstructionForm;
