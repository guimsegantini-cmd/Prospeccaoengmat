import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  login, 
  register,
  logout, 
  subscribeToSites, 
  addSite, 
  updateSite, 
  auth,
  isDemoMode
} from './services/firebase';
import { askGeminiAboutSites } from './services/geminiService';
import { ConstructionSite, Task, TaskType, LeadStage, ConstructionPhase } from './types';
import ConstructionCard from './components/ConstructionCard';
import ConstructionForm from './components/ConstructionForm';
import DashboardTab from './components/DashboardTab';
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
  MapPin,
  Download,
  Upload,
  FileSpreadsheet,
  UserPlus
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import * as XLSX from 'xlsx';

// --- LOGIN COMPONENT ---
const LoginScreen = ({ onLogin }: { onLogin: (u: any) => void }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
            throw new Error('As senhas não conferem.');
        }
        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        const user = await register(email, password);
        onLogin(user);
      } else {
        const user = await login(email, password);
        onLogin(user);
      }
    } catch (err: any) {
      // Firebase specific error mapping
      if (err.code === 'auth/email-already-in-use') {
          setError('Este e-mail já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
          setError('A senha é muito fraca.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('E-mail ou senha inválidos.');
      } else {
          setError(err.message || 'Ocorreu um erro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <HardHat size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Prospecção Engmat</h1>
          <p className="text-slate-500 mt-2">{isRegistering ? 'Crie sua conta' : 'Acesso Restrito'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isRegistering && (
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
          )}
          
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? 'Processando...' : (isRegistering ? 'Cadastrar' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button 
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
                {isRegistering ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se agora'}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [activeTab, setActiveTab] = useState<'sites' | 'tasks' | 'dashboard'>('sites');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ConstructionSite | undefined>(undefined);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'alpha'>('date_desc');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [taskDateFilter, setTaskDateFilter] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | ''>(''); // New Task Type Filter
  const [phaseFilter, setPhaseFilter] = useState<ConstructionPhase | ''>(''); // New Phase Filter

  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // In Demo Mode, we handle auth state manually via LoginScreen and setUser.
      // We ignore firebase updates to prevent it from clearing our demo user state.
      if (isDemoMode) return; 
      
      if (u) setUser(u);
      else setUser(null);
    });
    return unsubscribe;
  }, []);

  // Data Subscription
  useEffect(() => {
    if (user || auth.currentUser) {
      const unsubscribe = subscribeToSites((data) => {
        setSites(data);
      });
      return unsubscribe;
    }
  }, [user]);

  // Derived Unique Builders for Autocomplete
  const uniqueBuilders = useMemo(() => {
    const names = sites.map(s => s.builderName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [sites]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleEditSite = (site: ConstructionSite) => {
    setEditingSite(site);
    setIsFormOpen(true);
  };

  const handleSaveSite = async (siteData: Omit<ConstructionSite, 'id'>) => {
    if (editingSite) {
      await updateSite(editingSite.id, siteData);
    } else {
      await addSite(siteData);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setAiLoading(true);
    const response = await askGeminiAboutSites(aiPrompt, sites);
    setAiResponse(response);
    setAiLoading(false);
  };

  const toggleTaskCompletion = async (siteId: string, taskId: string, currentStatus: boolean) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    const updatedTasks = site.tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t);
    await updateSite(siteId, { tasks: updatedTasks });
  };

  // --- IMPORT / EXPORT HANDLERS (EXCEL) ---
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // 1. Prepare Obras Sheet
    const sitesData = sites.map(site => {
        // Flatten primary contact for export simplicity, or we could export a separate sheet for contacts
        // For this version, we export the primary contact to the main row
        const primary = site.contacts?.[0] || {};
        
        return {
            ID: site.id, 
            Obra: site.siteName,
            Construtora: site.builderName,
            // Export legacy or primary contact fields
            Responsavel: primary.name || site.responsibleName || '',
            Cargo: primary.role || '',
            Telefone: primary.phone || site.phone || '',
            Email: primary.email || site.email || '',
            Endereco: site.address,
            Bairro: site.neighborhood,
            Lat: site.lat,
            Lng: site.lng,
            Fase: site.phase,
            Perfil: site.profile,
            Status: site.leadStage,
            Representadas: site.connectedRepresentations ? site.connectedRepresentations.join(', ') : '',
            CriadoEm: new Date(site.createdAt).toLocaleDateString()
        };
    });

    const wsSites = XLSX.utils.json_to_sheet(sitesData);
    XLSX.utils.book_append_sheet(wb, wsSites, "Obras");

    // 2. Prepare Tarefas Sheet
    const allTasksData = sites.flatMap(s => s.tasks.map(t => ({
      ID_Tarefa: t.id,
      ID_Obra: s.id, // Foreign Key
      Descricao: t.description,
      Obs: t.notes || '',
      Data: t.date,
      Hora: t.time,
      Tipo: t.type,
      Concluido: t.completed ? 'Sim' : 'Não'
    })));

    const wsTasks = XLSX.utils.json_to_sheet(allTasksData);
    XLSX.utils.book_append_sheet(wb, wsTasks, "Tarefas");

    // Write File
    XLSX.writeFile(wb, `Prospeccao_Engmat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        
        // Read Sheets
        const sheetObras = wb.Sheets["Obras"];
        const sheetTarefas = wb.Sheets["Tarefas"];

        if (!sheetObras) {
          alert("Arquivo inválido: Aba 'Obras' não encontrada.");
          return;
        }

        const rawSites = XLSX.utils.sheet_to_json<any>(sheetObras);
        const rawTasks = sheetTarefas ? XLSX.utils.sheet_to_json<any>(sheetTarefas) : [];

        let count = 0;

        for (const row of rawSites) {
            // Basic validation
            if (!row.Obra || !row.Construtora) continue;

            // 1. Reconstruct Tasks
            const siteTasks = rawTasks
                .filter(t => t.ID_Obra === row.ID) 
                .map(t => ({
                    id: Math.random().toString(36).substr(2, 9), 
                    siteId: '', 
                    description: t.Descricao,
                    notes: t.Obs,
                    date: t.Data,
                    time: t.Hora,
                    type: t.Tipo,
                    completed: t.Concluido === 'Sim',
                    createdAt: Date.now()
                }));

            // 2. Reconstruct Contact Structure from Flat Excel Columns
            const contacts = [{
                name: row.Responsavel || '',
                role: row.Cargo || 'Responsável',
                phone: row.Telefone || '',
                email: row.Email || ''
            }];

            // 3. Reconstruct Site Object
            const newSite: Omit<ConstructionSite, 'id'> = {
                siteName: row.Obra,
                builderName: row.Construtora,
                // Legacy fields populated for safety
                responsibleName: row.Responsavel || '',
                phone: row.Telefone || '',
                email: row.Email || '',
                
                contacts: contacts,
                address: row.Endereco || '',
                neighborhood: row.Bairro || '',
                lat: row.Lat,
                lng: row.Lng,
                phase: row.Fase || 'Fundação',
                profile: row.Perfil || 'Médio Padrão',
                leadStage: row.Status || 'Mapeado',
                connectedRepresentations: row.Representadas ? row.Representadas.split(',').map((s: string) => s.trim()) : [],
                createdAt: Date.now(), 
                tasks: siteTasks
            };

            await addSite(newSite);
            count++;
        }

        alert(`${count} obras importadas com sucesso!`);

      } catch (err) {
        console.error(err);
        alert('Erro ao processar arquivo Excel. Verifique o formato.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // --- FILTERED DATA ---
  const filteredSites = useMemo(() => {
    let result = [...sites];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.siteName.toLowerCase().includes(lower) || 
        s.builderName.toLowerCase().includes(lower) ||
        // Search in primary contact or legacy field
        (s.contacts?.[0]?.name || s.responsibleName || '').toLowerCase().includes(lower) ||
        s.neighborhood?.toLowerCase().includes(lower)
      );
    }

    if (showOverdueOnly) {
      const now = Date.now();
      result = result.filter(s => s.tasks.some(t => !t.completed && new Date(`${t.date}T${t.time}`).getTime() < now));
    }

    if (phaseFilter) {
      result = result.filter(s => s.phase === phaseFilter);
    }

    if (sortOrder === 'alpha') {
      result.sort((a, b) => a.siteName.localeCompare(b.siteName));
    } else if (sortOrder === 'date_desc') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      result.sort((a, b) => a.createdAt - b.createdAt);
    }

    return result;
  }, [sites, searchTerm, sortOrder, showOverdueOnly, phaseFilter]);

  const allTasks = useMemo(() => {
    let tasks = sites.flatMap(s => s.tasks.map(t => ({ ...t, site: s })));
    
    // Filter by Date if selected
    if (taskDateFilter) {
      tasks = tasks.filter(t => t.date === taskDateFilter);
    }
    
    // Filter by Task Type
    if (taskTypeFilter) {
      tasks = tasks.filter(t => t.type === taskTypeFilter);
    }
    
    // Sort by Date then Time
    return tasks.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
  }, [sites, taskDateFilter, taskTypeFilter]);

  // Derived user state to safely handle both Demo Mode and Real Firebase Auth
  const currentUser = user || auth.currentUser;

  if (!currentUser) { 
    return <LoginScreen onLogin={setUser} />;
  }

  // Safe email accessor
  const userEmail = currentUser.email || 'Usuário';
  const userInitial = userEmail[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardHat className="text-blue-500" />
            Prospecção Engmat
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('sites')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'sites' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <HardHat size={20} />
            Cadastro de Obras
          </button>
          
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <CheckSquare size={20} />
            Tarefas
          </button>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {userInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{userEmail}</p>
              <p className="text-xs text-slate-500">Representante</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-2">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="p-6 max-w-7xl mx-auto pb-24">
          
          {/* TAB: SITES */}
          {activeTab === 'sites' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Gestão de Obras</h1>
                
                <div className="flex gap-2">
                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".xlsx, .xls"
                    />
                    
                    <button 
                      onClick={handleImportClick}
                      className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                      title="Importar Excel"
                    >
                      <Upload size={16} /> Importar XLSX
                    </button>
                    
                    <button 
                      onClick={handleExport}
                      className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                      title="Exportar Excel"
                    >
                      <FileSpreadsheet size={16} /> Exportar XLSX
                    </button>

                    <button 
                      onClick={() => { setEditingSite(undefined); setIsFormOpen(true); }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                    >
                      <Plus size={20} /> Nova Obra
                    </button>
                </div>
              </div>

              {/* Phase Filter Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <button 
                    onClick={() => setPhaseFilter('')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${!phaseFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    Todas
                  </button>
                  {Object.values(ConstructionPhase).map(phase => (
                    <button 
                        key={phase}
                        onClick={() => setPhaseFilter(phase === phaseFilter ? '' : phase)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${phaseFilter === phase ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {phase}
                    </button>
                  ))}
              </div>

              {/* Filters Toolbar */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por obra, construtora, bairro..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                   <select 
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                   >
                     <option value="date_desc">Recentes primeiro</option>
                     <option value="date_asc">Antigos primeiro</option>
                     <option value="alpha">Ordem Alfabética</option>
                   </select>

                   <button 
                    onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                    className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${showOverdueOnly ? 'bg-red-50 border-red-200 text-red-600 font-medium' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                   >
                     <Filter size={16} />
                     Atrasadas
                   </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSites.map(site => (
                  <ConstructionCard key={site.id} site={site} onEdit={handleEditSite} />
                ))}
                {filteredSites.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-400">
                    Nenhuma obra encontrada com os filtros atuais.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Agenda de Tarefas</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <Filter size={18} className="text-slate-400" />
                        <select 
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            value={taskTypeFilter}
                            onChange={(e) => setTaskTypeFilter(e.target.value as TaskType)}
                        >
                            <option value="">Todos os Tipos</option>
                            {Object.values(TaskType).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <Calendar size={18} className="text-slate-400" />
                        <input 
                            type="date" 
                            className="outline-none text-slate-600 text-sm"
                            value={taskDateFilter}
                            onChange={(e) => setTaskDateFilter(e.target.value)}
                        />
                        {taskDateFilter && (
                            <button onClick={() => setTaskDateFilter('')} className="text-xs text-blue-600 hover:underline">Limpar</button>
                        )}
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {allTasks.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {allTasks.map(task => {
                      const isOverdue = !task.completed && new Date(`${task.date}T${task.time}`).getTime() < Date.now();
                      return (
                        <div key={`${task.site.id}-${task.id}`} className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${task.completed ? 'opacity-60 bg-slate-50' : ''}`}>
                          <button 
                            onClick={() => toggleTaskCompletion(task.site.id, task.id, task.completed)}
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
                          >
                            {task.completed && <CheckSquare size={14} />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                                task.type === TaskType.CALL ? 'bg-blue-400' :
                                task.type === TaskType.VISIT ? 'bg-purple-400' :
                                task.type === TaskType.WHATSAPP ? 'bg-green-500' :
                                task.type === TaskType.EMAIL ? 'bg-orange-400' : 'bg-slate-400'
                              }`}>
                                {task.type}
                              </span>
                              {isOverdue && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Atrasado</span>}
                            </div>
                            <p className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.description}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                              <HardHat size={12} /> {task.site.siteName} 
                              <span className="text-slate-300">|</span> 
                              {task.site.builderName}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end text-slate-700 font-medium">
                              <Clock size={14} className="text-slate-400" />
                              {task.time}
                            </div>
                            <div className="flex items-center gap-1 justify-end text-xs text-slate-500 mt-1">
                              <Calendar size={12} />
                              {new Date(task.date).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="shrink-0 text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded">
                             {task.site.neighborhood || 'S/ Bairro'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhuma tarefa encontrada para este período ou tipo.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
               <h1 className="text-2xl font-bold text-slate-800">Dashboard de Performance</h1>
               <DashboardTab sites={sites} />
            </div>
          )}
        </div>

        {/* AI FLOATING BUTTON */}
        <button 
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40 flex items-center gap-2 group"
        >
          <Bot size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">IA Assistant</span>
        </button>

        {/* AI MODAL */}
        {isAiOpen && (
          <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-blue-400" />
                <h3 className="font-bold">Assistente Inteligente</h3>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 p-4 h-80 overflow-y-auto bg-slate-50">
              {aiResponse ? (
                <div className="flex flex-col gap-2">
                   <div className="self-end bg-blue-100 text-blue-900 p-3 rounded-t-xl rounded-bl-xl text-sm max-w-[90%]">
                     {aiPrompt}
                   </div>
                   <div className="self-start bg-white border border-slate-200 p-3 rounded-t-xl rounded-br-xl text-sm text-slate-700 shadow-sm max-w-[90%] whitespace-pre-wrap">
                     {aiResponse}
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center text-sm p-4">
                  <Bot size={32} className="mb-2 opacity-50" />
                  <p>Pergunte sobre suas obras, tarefas atrasadas ou oportunidades por região.</p>
                </div>
              )}
              {aiLoading && (
                <div className="text-xs text-center text-slate-400 mt-2 animate-pulse">
                  Analisando dados...
                </div>
              )}
            </div>

            <form onSubmit={handleAiSubmit} className="p-3 border-t border-slate-100 bg-white flex gap-2">
              <input 
                className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Quais obras estão em acabamento?"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={aiLoading || !aiPrompt.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* FORM MODAL */}
        {isFormOpen && (
          <ConstructionForm 
            onClose={() => setIsFormOpen(false)} 
            onSubmit={handleSaveSite}
            initialData={editingSite}
            existingBuilders={uniqueBuilders}
          />
        )}

      </main>
    </div>
  );
}
