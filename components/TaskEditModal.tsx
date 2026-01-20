import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { X, Save, Calendar, Clock, FileText, AlignLeft } from 'lucide-react';

interface Props {
    task: Task;
    siteName: string;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
}

const TaskEditModal: React.FC<Props> = ({ task, siteName, onClose, onSave }) => {
    const [formData, setFormData] = useState<Task>({ ...task });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">Editar Tarefa</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[250px]">Obra: {siteName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <FileText size={12} /> Descrição
                        </label>
                        <input 
                            name="description"
                            required
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Ligar para engenheiro"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <Calendar size={12} /> Data
                            </label>
                            <input 
                                type="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <Clock size={12} /> Hora
                            </label>
                            <input 
                                type="time"
                                name="time"
                                required
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Tarefa</label>
                        <select 
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-600"
                        >
                            {Object.values(TaskType).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <AlignLeft size={12} /> Observações
                        </label>
                        <textarea 
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Detalhes adicionais..."
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskEditModal;
