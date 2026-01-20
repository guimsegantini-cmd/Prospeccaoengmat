
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  login, 
  register,
  logout, 
  subscribeToSites, 
  addSite, 
  updateSite, 
  auth,
  isDemoMode,
  onAuthStateChanged
} from './services/firebase';
import { askGeminiAboutSites } from './services/geminiService';
import { ConstructionSite, Task, TaskType, LeadStage, ConstructionPhase } from './types';
import ConstructionCard from './components/ConstructionCard';
import ConstructionForm from './components/ConstructionForm';
import DashboardTab from './components/DashboardTab';
import TaskEditModal from './components/TaskEditModal';
import { 
  LayoutDashboard, 
  HardHat, 
  CheckSquare, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Bot, 
  Send, 
  X, 
  Calendar, 
  Clock, 
  Grid,
  List,
  Edit,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

// LoginScreen provides a UI for user authentication when not logged in
const LoginScreen = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        const user = await register(email, password);
        onLogin(user);
      } else {
        const user = await login(email, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl">
            <HardHat size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Prospecção Engmat</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">{isRegister ? 'Crie sua conta para começar' : 'Entre com suas credenciais'}</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required 
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              required 
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-xs italic">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            {isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-blue-600 hover:underline">
            {isRegister ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
        
        {isDemoMode && (
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Modo de Demonstração</p>
            <p className="text-xs text-slate-600">Use: <span className="font-mono bg-slate-200 px-1 text-[10px]">demo@app.com</span> / <span className="font-mono bg-slate-200 px-1 text-[10px]">demo123</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [activeTab, setActiveTab] = useState<'sites' | 'tasks' | 'dashboard'>('sites');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ConstructionSite | undefined>(undefined);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [taskView, setTaskView] = useState<'list' | 'calendar'>('list');

  const [editingTaskData, setEditingTaskData] = useState<{ task: Task, siteId: string, siteName: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [registrationDateFilter, setRegistrationDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'alpha'>('date_desc');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showOverdueTasksOnly, setShowOverdueTasksOnly] = useState(false);
  const [taskPeriod, setTaskPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | ''>(''); 
  const [phaseFilter, setPhaseFilter] = useState<ConstructionPhase | ''>(''); 

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (isDemoMode) return; 
      if (u) setUser(u);
      else setUser(null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user || auth.currentUser) {
      const unsubscribe = subscribeToSites((data) => setSites(data));
      return unsubscribe;
    }
  }, [user]);

  const uniqueBuilders = useMemo(() => {
    const names = sites.map(s => s.builderName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [sites]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleSaveSite = async (siteData: Omit<ConstructionSite, 'id'>) => {
    if (editingSite) await updateSite(editingSite.id, siteData);
    else await addSite(siteData);
  };

  const toggleTaskCompletion = async (siteId: string, taskId: string, currentStatus: boolean) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    const updatedTasks = site.tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t);
    await updateSite(siteId, { tasks: updatedTasks });
  };

  const filteredSites = useMemo(() => {
    let result = [...sites];
    const now = Date.now();
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.siteName.toLowerCase().includes(lower) || 
        s.builderName.toLowerCase().includes(lower) ||
        s.neighborhood?.toLowerCase().includes(lower)
      );
    }
    if (registrationDateFilter) {
      result = result.filter(s => new Date(s.createdAt).toISOString().split('T')[0] === registrationDateFilter);
    }
    if (showOverdueOnly) {
      result = result.filter(s => s.tasks.some(t => !t.completed && new Date(`${t.date}T${t.time}`).getTime() < now));
    }
    if (phaseFilter) result = result.filter(s => s.phase === phaseFilter);
    if (sortOrder === 'alpha') result.sort((a, b) => a.siteName.localeCompare(b.siteName));
    else if (sortOrder === 'date_desc') result.sort((a, b) => b.createdAt - a.createdAt);
    else result.sort((a, b) => a.createdAt - b.createdAt);
    return result;
  }, [sites, searchTerm, registrationDateFilter, sortOrder, showOverdueOnly, phaseFilter]);

  const filteredTasks = useMemo(() => {
    let tasks = sites.flatMap(s => s.tasks.map(t => ({ ...t, site: s })));
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (showOverdueTasksOnly) {
      const nowTime = now.getTime();
      tasks = tasks.filter(t => !t.completed && new Date(`${t.date}T${t.time}`).getTime() < nowTime);
    } else {
      if (taskPeriod === 'today') {
        tasks = tasks.filter(t => t.date === todayStr);
      } else if (taskPeriod === 'week') {
        const first = now.getDate() - now.getDay();
        const last = first + 6;
        const firstDay = new Date(now.setDate(first)).toISOString().split('T')[0];
        const lastDay = new Date(now.setDate(last)).toISOString().split('T')[0];
        tasks = tasks.filter(t => t.date >= firstDay && t.date <= lastDay);
      } else if (taskPeriod === 'month') {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        tasks = tasks.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
      }
    }

    if (taskTypeFilter) tasks = tasks.filter(t => t.type === taskTypeFilter);
    return tasks.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [sites, taskPeriod, taskTypeFilter, showOverdueTasksOnly]);

  // Calendar Logic
  const CalendarView = () => {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const dayGrid = [];
    for (let i = 0; i < firstDay; i++) dayGrid.push(null);
    for (let i = 1; i <= daysInMonth; i++) dayGrid.push(i);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-800 capitalize">{monthName}</h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20}/></button>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b bg-slate-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
            <div key={d} className="p-2 text-center text-xs font-bold text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 h-[600px]">
          {dayGrid.map((day, idx) => {
            if (!day) return <div key={idx} className="border-r border-b bg-slate-50/30"></div>;
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = sites.flatMap(s => s.tasks.filter(t => t.date === dateStr).map(t => ({ ...t, siteName: s.siteName })));
            
            return (
              <div key={idx} className="border-r border-b p-1 overflow-y-auto hover:bg-slate-50 transition-colors">
                <span className={`text-xs font-medium ${dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {dayTasks.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => setEditingTaskData({ task: t, siteId: '', siteName: t.siteName })}
                      className={`text-[9px] p-1 rounded border leading-tight cursor-pointer truncate ${t.completed ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'} ${!t.completed && new Date(`${t.date}T${t.time}`).getTime() < Date.now() ? 'border-red-500 bg-red-50 text-red-700' : ''}`}
                      title={`${t.time} - ${t.description}`}
                    >
                      {t.time} {t.description}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const currentUser = user || auth.currentUser;
  if (!currentUser) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><HardHat className="text-blue-500" /> Prospecção Engmat</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('sites')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'sites' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <HardHat size={20} /> Obras
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <CheckSquare size={20} /> Tarefas
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-2"><LogOut size={16} /> Sair</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="p-6 max-w-7xl mx-auto pb-24">
          
          {activeTab === 'sites' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Gestão de Obras</h1>
                <div className="flex gap-2">
                    <button 
                      onClick={() => setShowOverdueOnly(!showOverdueOnly)} 
                      className={`border px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${showOverdueOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                      title="Filtrar obras com tarefas atrasadas"
                    >
                      <AlertCircle size={18} /> Atrasadas
                    </button>
                    <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="bg-white border border-slate-300 text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      {viewMode === 'grid' ? <List size={20}/> : <Grid size={20}/>}
                    </button>
                    <button onClick={() => { setEditingSite(undefined); setIsFormOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
                      <Plus size={20} /> Nova Obra
                    </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar obras..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Data Cadastro</label>
                  <input type="date" className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none" value={registrationDateFilter} onChange={e => setRegistrationDateFilter(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Ordenar</label>
                  <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white outline-none" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
                    <option value="date_desc">Novas Primeiro</option>
                    <option value="date_asc">Antigas Primeiro</option>
                    <option value="alpha">A-Z</option>
                  </select>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredSites.map(site => <ConstructionCard key={site.id} site={site} onEdit={s => { setEditingSite(s); setIsFormOpen(true); }} />)}
                  {filteredSites.length === 0 && <div className="col-span-full py-12 text-center text-slate-400">Nenhuma obra encontrada.</div>}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y">
                   {filteredSites.map(site => (
                     <div key={site.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setEditingSite(site); setIsFormOpen(true); }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{site.siteName}</p>
                            <p className="text-xs text-slate-500">{site.builderName} • {site.neighborhood}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {site.tasks.some(t => !t.completed && new Date(`${t.date}T${t.time}`).getTime() < Date.now()) && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <AlertCircle size={10} /> Pendências
                                </span>
                            )}
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{site.phase}</span>
                            <ArrowRight size={16} className="text-slate-300"/>
                          </div>
                        </div>
                     </div>
                   ))}
                   {filteredSites.length === 0 && <div className="p-12 text-center text-slate-400">Nenhuma obra encontrada.</div>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Agenda de Tarefas</h1>
                <div className="flex gap-2">
                    <button 
                      onClick={() => setShowOverdueTasksOnly(!showOverdueTasksOnly)} 
                      className={`border px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${showOverdueTasksOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <AlertCircle size={18} /> Atrasadas
                    </button>
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
                        <button onClick={() => setTaskView('list')} className={`px-3 py-1 text-xs rounded-md transition-all ${taskView === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>Lista</button>
                        <button onClick={() => setTaskView('calendar')} className={`px-3 py-1 text-xs rounded-md transition-all ${taskView === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>Calendário</button>
                    </div>
                </div>
              </div>

              {!showOverdueTasksOnly && (
                <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => setTaskPeriod('all')} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${taskPeriod === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Todas</button>
                    <button onClick={() => setTaskPeriod('today')} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${taskPeriod === 'today' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Hoje</button>
                    <button onClick={() => setTaskPeriod('week')} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${taskPeriod === 'week' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Esta Semana</button>
                    <button onClick={() => setTaskPeriod('month')} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${taskPeriod === 'month' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Mês Atual</button>
                </div>
              )}

              {taskView === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y">
                  {filteredTasks.map(task => {
                    const isOverdue = !task.completed && new Date(`${task.date}T${task.time}`).getTime() < Date.now();
                    return (
                      <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <button onClick={() => toggleTaskCompletion(task.site.id, task.id, task.completed)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                          {task.completed && <CheckSquare size={14} />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.description}</p>
                            {isOverdue && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase">Atrasada</span>}
                          </div>
                          <p className="text-xs text-slate-500">{task.site.siteName} • {new Date(task.date).toLocaleDateString()} {task.time}</p>
                        </div>
                        <button onClick={() => setEditingTaskData({ task, siteId: task.site.id, siteName: task.site.siteName })} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit size={18} />
                        </button>
                      </div>
                    );
                  })}
                  {filteredTasks.length === 0 && <div className="p-12 text-center text-slate-400">Nenhuma tarefa encontrada.</div>}
                </div>
              ) : <CalendarView />}
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardTab sites={sites} />}
        </div>
        
        <button onClick={() => setIsAiOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-all z-40"><Bot size={24} /></button>
        {isAiOpen && (
          <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Bot size={20} /> IA Assistant</h3>
              <button onClick={() => setIsAiOpen(false)}><X size={18} /></button>
            </div>
            <div className="h-80 overflow-y-auto p-4 bg-slate-50">
              {aiResponse && <div className="bg-white p-3 rounded-lg shadow-sm text-sm whitespace-pre-wrap mb-4">{aiResponse}</div>}
              {aiLoading && <div className="text-center text-xs animate-pulse">Pensando...</div>}
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); setAiLoading(true); const r = await askGeminiAboutSites(aiPrompt, sites); setAiResponse(r); setAiLoading(false); }} className="p-3 border-t bg-white flex gap-2">
              <input className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Pergunte à IA..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
              <button type="submit" disabled={aiLoading} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={18} /></button>
            </form>
          </div>
        )}

        {isFormOpen && <ConstructionForm onClose={() => setIsFormOpen(false)} onSubmit={handleSaveSite} initialData={editingSite} existingBuilders={uniqueBuilders} allSites={sites} />}
        {editingTaskData && <TaskEditModal task={editingTaskData.task} siteName={editingTaskData.siteName} onClose={() => setEditingTaskData(null)} onSave={async (t) => { const s = sites.find(site => site.tasks.some(task => task.id === t.id)); if (s) { const tasks = s.tasks.map(task => task.id === t.id ? t : task); await updateSite(s.id, { tasks }); } setEditingTaskData(null); }} />}
      </main>
    </div>
  );
}
