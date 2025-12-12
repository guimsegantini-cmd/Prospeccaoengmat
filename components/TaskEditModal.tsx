import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { X, Calendar, Clock } from 'lucide-react';

interface Props {
    task: Task;
    onClose: () => void;
    onSave: (updates: Partial<Task>) => void;
}

const TaskEditModal: React.FC<Props> = ({ task, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        description: task.description,
        notes: task.notes || '',
        date: task.date,
        time: task.time,
        type: task.type
    });

    const handleQuickPostpone = (days: number) => {
        const date = new Date(formData.date);
        date.setDate(date.getDate() + days);
        setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Editar Tarefa</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
                        <input 
                            required
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    
                    <div>
                         <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo</label>
                         <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as TaskType})}
                         >
                            {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Data</label>
                            <input 
                                type="date"
                                required
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Hora</label>
                            <input 
                                type="time"
                                required
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Quick Postpone Buttons */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-700 font-semibold mb-2">Adiar Rápido:</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleQuickPostpone(1)} className="flex-1 bg-white text-blue-600 text-xs py-1.5 px-2 rounded border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                                +1 Dia (Amanhã)
                            </button>
                            <button type="button" onClick={() => handleQuickPostpone(7)} className="flex-1 bg-white text-blue-600 text-xs py-1.5 px-2 rounded border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                                +1 Semana
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskEditModal;
