

import React, { useState } from 'react';
import { ConstructionSite, Task, TaskType, REPRESENTATIONS, LeadStage, Contact } from '../types';
import { MapPin, Phone, Mail, Clock, Calendar, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle, Edit2, AlertTriangle, Navigation, MessageCircle, Users } from 'lucide-react';
import { updateSite, deleteSite } from '../services/firebase';

interface Props {
    site: ConstructionSite;
    onEdit: (site: ConstructionSite) => void;
}

const ConstructionCard: React.FC<Props> = ({ site, onEdit }) => {
    const [expanded, setExpanded] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({ type: TaskType.CALL, description: '', notes: '', date: '', time: '' });

    // Helper to get contacts list, compatible with legacy data
    const getContacts = (): Contact[] => {
        if (site.contacts && site.contacts.length > 0) return site.contacts;
        if (site.responsibleName) {
            return [{
                name: site.responsibleName,
                role: 'Responsável',
                phone: site.phone || '',
                email: site.email || ''
            }];
        }
        return [];
    };

    const contacts = getContacts();
    const primaryContact = contacts.length > 0 ? contacts[0] : null;

    const handleAddTask = async () => {
        if (!newTask.description || !newTask.date || !newTask.time) return;
        
        const task: Task = {
            id: Math.random().toString(36).substr(2, 9),
            siteId: site.id,
            description: newTask.description!,
            notes: newTask.notes || '',
            date: newTask.date!,
            time: newTask.time!,
            type: newTask.type || TaskType.CALL,
            completed: false,
            createdAt: Date.now()
        };

        const updatedTasks = [...site.tasks, task];
        await updateSite(site.id, { tasks: updatedTasks });
        setNewTask({ type: TaskType.CALL, description: '', notes: '', date: '', time: '' });
    };

    const toggleRepresentation = async (rep: string) => {
        const current = site.connectedRepresentations || [];
        const updated = current.includes(rep) 
            ? current.filter(r => r !== rep) 
            : [...current, rep];
        await updateSite(site.id, { connectedRepresentations: updated });
    };

    const toggleTask = async (taskId: string) => {
        const updatedTasks = site.tasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        await updateSite(site.id, { tasks: updatedTasks });
    };

    const deleteTask = async (taskId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
        const updatedTasks = site.tasks.filter(t => t.id !== taskId);
        await updateSite(site.id, { tasks: updatedTasks });
    };

    const handleDeleteSite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir a obra "${site.siteName}"? Esta ação não pode ser desfeita.`)) {
            await deleteSite(site.id);
        }
    };

    // Calculate Inactivity (60 Days)
    const getLastInteractionTime = () => {
        const creationTime = site.createdAt;
        const lastTaskTime = site.tasks.length > 0 
            ? Math.max(...site.tasks.map(t => t.createdAt || 0)) 
            : 0;
        return Math.max(creationTime, lastTaskTime);
    };

    const lastInteraction = getLastInteractionTime();
    const daysSinceInteraction = Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24));
    const isAutoInactive = daysSinceInteraction > 60;
    
    // Effective Stage (Manual or Auto Inactive)
    const effectiveStage = (site.leadStage === LeadStage.INACTIVE || isAutoInactive) ? LeadStage.INACTIVE : site.leadStage;

    // Card Colors based on Lead Stage
    const getBorderColor = () => {
        if (effectiveStage === LeadStage.INACTIVE) return 'border-l-slate-400';
        if (effectiveStage === LeadStage.PROPOSAL) return 'border-l-green-500';
        if (effectiveStage === LeadStage.QUALIFIED) return 'border-l-indigo-500';
        if (effectiveStage === LeadStage.CONTACT) return 'border-l-blue-500';
        if (effectiveStage === LeadStage.MAPPED) return 'border-l-yellow-400';
        return 'border-l-slate-300';
    };

    // Navigation Handlers
    const openWaze = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!site.address) return;
        const encodedAddress = encodeURIComponent(site.address);
        // Opens Waze universal link
        window.open(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`, '_blank');
    };

    const openWhatsApp = (e: React.MouseEvent, phoneNumber: string) => {
        e.stopPropagation();
        if (!phoneNumber) return;
        // Basic clean up: remove non-digits
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        // Assume Brazil country code +55 if not present
        const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
        window.open(`https://wa.me/${fullPhone}`, '_blank');
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 ${getBorderColor()} hover:shadow-md transition-shadow`}>
            {/* Header / Summary */}
            <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{site.siteName}</h3>
                        <p className="text-sm text-slate-500 font-medium">{site.builderName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            site.phase === 'Entregue' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                            {site.phase}
                        </span>
                        {isAutoInactive && site.leadStage !== LeadStage.INACTIVE && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                <AlertTriangle size={10} /> +60 dias
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5 group" title="Navegar com Waze">
                        <MapPin size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span>{site.neighborhood || 'Bairro N/A'}</span>
                    </div>
                    {primaryContact && (
                        <div className="flex items-center gap-1.5 group" title={`Cargo: ${primaryContact.role}`}>
                            <Phone size={14} className="text-slate-400 group-hover:text-green-500 transition-colors" />
                            <span>{primaryContact.name.split(' ')[0]} ({primaryContact.role})</span>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                    <span>{site.tasks.filter(t => !t.completed).length} tarefas abertas</span>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-sm text-slate-700">Detalhes & Ações</h4>
                        <div className="flex gap-2">
                            <button onClick={handleDeleteSite} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors font-medium">
                                <Trash2 size={14} /> Excluir Obra
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(site); }} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                                <Edit2 size={14} /> Editar
                            </button>
                        </div>
                    </div>

                    {/* Contact Info (List) */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Users size={14} className="text-slate-500"/>
                             <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contatos</h5>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {contacts.map((contact, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-700">
                                            {contact.name} <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">{contact.role}</span>
                                        </p>
                                        <p className="text-xs text-slate-500">{contact.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600 text-xs">{contact.phone}</span>
                                        {contact.phone && (
                                            <button 
                                                onClick={(e) => openWhatsApp(e, contact.phone)} 
                                                className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors" 
                                                title="WhatsApp"
                                            >
                                                <MessageCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Address & Profile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-2 mb-4 text-sm bg-white p-3 rounded-lg border border-slate-200">
                         <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                             <span className="font-medium text-slate-600">Endereço:</span> 
                             <span className="text-slate-700 truncate flex-1">{site.address}</span>
                             <button onClick={openWaze} className="p-1 bg-blue-100 text-blue-500 rounded-full hover:bg-blue-200 transition-colors" title="Navegar com Waze">
                                <Navigation size={14} />
                             </button>
                         </div>

                         <p className="text-slate-600"><span className="font-medium">Perfil:</span> {site.profile}</p>
                         <p className="text-slate-600 flex items-center gap-2">
                             <span className="font-medium">Status:</span> 
                             <span className={`${effectiveStage === LeadStage.INACTIVE ? 'text-red-500 font-bold' : ''}`}>
                                 {effectiveStage}
                             </span>
                         </p>
                    </div>

                    {/* Representations Tags */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Representadas Conectadas</h4>
                        <div className="flex flex-wrap gap-2">
                            {REPRESENTATIONS.map(rep => (
                                <button 
                                    key={rep}
                                    onClick={() => toggleRepresentation(rep)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                        site.connectedRepresentations?.includes(rep)
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                                    }`}
                                >
                                    {rep}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" />
                            Tarefas
                        </h4>

                        {/* Add Task */}
                        <div className="flex flex-col gap-2 mb-4 p-2 bg-slate-50 rounded border border-slate-100">
                            <input 
                                placeholder="Nova tarefa..." 
                                className="bg-transparent text-sm outline-none border-b border-slate-200 pb-1 placeholder:text-slate-400"
                                value={newTask.description}
                                onChange={e => setNewTask({...newTask, description: e.target.value})}
                            />
                            <input 
                                placeholder="Observação (opcional)..." 
                                className="bg-transparent text-xs outline-none border-b border-slate-200 pb-1 placeholder:text-slate-400"
                                value={newTask.notes}
                                onChange={e => setNewTask({...newTask, notes: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <input type="date" className="text-xs bg-white border border-slate-200 rounded px-1 text-slate-600" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} />
                                <input type="time" className="text-xs bg-white border border-slate-200 rounded px-1 text-slate-600" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} />
                                <select className="text-xs bg-white border border-slate-200 rounded px-1 text-slate-600" value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as TaskType})}>
                                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <button onClick={handleAddTask} className="ml-auto bg-blue-600 text-white p-1 rounded hover:bg-blue-700">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {site.tasks.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).map(task => (
                                <div key={task.id} className={`flex items-start gap-2 p-2 rounded-md border ${task.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <button onClick={() => toggleTask(task.id)} className={`mt-0.5 ${task.completed ? 'text-green-500' : 'text-slate-300 hover:text-green-500'}`}>
                                        <CheckCircle size={16} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.description}</p>
                                        {task.notes && (
                                            <p className="text-xs text-slate-500 mt-1 bg-yellow-50 p-1 rounded border border-yellow-100 inline-block">
                                                Obs: {task.notes}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">{new Date(task.date).toLocaleDateString()} {task.time} • {task.type}</p>
                                    </div>
                                    <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500" title="Excluir Tarefa">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {site.tasks.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Nenhuma tarefa.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConstructionCard;
