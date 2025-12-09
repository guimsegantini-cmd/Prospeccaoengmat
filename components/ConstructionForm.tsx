import React, { useState } from 'react';
import { ConstructionSite, ConstructionPhase, SiteProfile, LeadStage } from '../types';
import { X, MapPin } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSubmit: (site: Omit<ConstructionSite, 'id'>) => void;
    initialData?: ConstructionSite;
}

const ConstructionForm: React.FC<Props> = ({ onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<Partial<ConstructionSite>>(initialData || {
        builderName: '',
        siteName: '',
        responsibleName: '',
        phone: '',
        email: '',
        address: '',
        neighborhood: '',
        lat: '',
        lng: '',
        phase: ConstructionPhase.FOUNDATION,
        profile: SiteProfile.MEDIUM_STD,
        leadStage: LeadStage.MAPPED,
        connectedRepresentations: [],
        tasks: []
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData as ConstructionSite,
            createdAt: initialData ? initialData.createdAt : Date.now(),
            tasks: initialData ? initialData.tasks : [],
            connectedRepresentations: initialData ? initialData.connectedRepresentations : []
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
                        <input required name="builderName" value={formData.builderName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Construtora XYZ" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                        <input required name="responsibleName" value={formData.responsibleName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome do contato" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(00) 00000-0000" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@exemplo.com" />
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fase da Obra</label>
                        <select name="phase" value={formData.phase} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(ConstructionPhase).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
                        <select name="profile" value={formData.profile} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {Object.values(SiteProfile).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
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