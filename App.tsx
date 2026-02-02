
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    User, Project, SupportTicket, AppSettings, ViewType, NavigationState, ChatMessage, 
    KanbanColumn
} from './types';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { chatService } from './services/chatService';
import { supportService } from './services/supportService';
import { generateKanbanBoard, generateIshikawaData, generateScrumBacklog } from './services/geminiService';

import LoginScreen from './components/LoginScreen';
import KanbanBoard from './components/KanbanBoard';
import IshikawaDiagram from './components/IshikawaDiagram';
import ScrumBoard from './components/ScrumBoard';
import GlobalChat from './components/GlobalChat';
import SettingsModal from './components/SettingsModal';
import AdminDashboard from './components/AdminDashboard';
import SupportHelpdesk from './components/SupportHelpdesk';
import TeamArea from './components/TeamArea';

import { 
    Search, Home, LayoutDashboard, Settings, MessageSquare, Plus, Trash2, ChevronDown, 
    RotateCcw, Monitor, LogOut, ShieldCheck, Briefcase, User as UserIcon, ChevronRight, 
    Clock, Trello, GitMerge, MoreHorizontal, ImageIcon, Upload, MoveVertical, Type, 
    Palette, List, Layers, Users, Calendar, BookOpen, Database, FileText
} from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
    showSidebar: true,
    showBreadcrumbs: true,
    showGreeting: true,
    sidebarHoverBehavior: false,
    theme: 'dark'
};

const INITIAL_TEAM_KANBAN: KanbanColumn[] = [
    { id: 'tk1', title: 'Ideias da Equipe', color: '#6366f1', tasks: [] },
    { id: 'tk2', title: 'Em Andamento', color: '#eab308', tasks: [] },
    { id: 'tk3', title: 'Concluído', color: '#22c55e', tasks: [] }
];

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [teamKanbanData, setTeamKanbanData] = useState<KanbanColumn[]>(INITIAL_TEAM_KANBAN);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [navState, setNavState] = useState<NavigationState>('HOME');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>(ViewType.DOCUMENT);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, onUndo?: () => void} | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const currentProject = projects.find(p => p.id === currentProjectId);

  // Inicialização de Dados do Backend
  useEffect(() => {
    const initData = async () => {
        const [fetchedUsers, fetchedProjects, fetchedTickets] = await Promise.all([
            userService.getAllUsers(),
            projectService.getProjects(),
            supportService.getTickets()
        ]);
        setUsers(fetchedUsers);
        setProjects(fetchedProjects);
        setSupportTickets(fetchedTickets);
    };
    initData();
  }, []);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => { setCurrentUser(null); setNavState('HOME'); };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: 'Sem Título',
      icon: '📄',
      updatedAt: new Date(),
      status: 'active',
      createdBy: currentUser?.id, 
      content: '',
      kanbanData: [
        { id: 'todo', title: 'A Fazer', tasks: [] },
        { id: 'prog', title: 'Em Progresso', tasks: [] },
        { id: 'done', title: 'Concluído', tasks: [] }
      ],
      ishikawaData: { effect: "Problema", categories: [] },
      scrumData: { backlog: [], sprints: [] }
    };
    const newProjects = [newProject, ...projects];
    setProjects(newProjects);
    projectService.saveProjects(newProjects);
    setCurrentProjectId(newProject.id);
    setNavState('PROJECT');
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const newProjects = projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p);
    setProjects(newProjects);
    projectService.saveProjects(newProjects);
  };

  const handleAddTicket = async (ticket: SupportTicket) => {
      setSupportTickets(prev => [ticket, ...prev]);
      await supportService.createTicket(ticket);
      setToast({ message: 'Chamado aberto no servidor!' });
      setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      await supportService.updateTicketStatus(ticketId, status);
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} users={users} />;

  return (
    <div className={`flex h-screen w-full bg-[#191919] text-gray-200 font-sans overflow-hidden ${appSettings.theme}`}>
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-[#202020] border-r border-[#333] transition-all duration-300 flex flex-col overflow-hidden shrink-0`}>
        <div className="p-4 border-b border-[#333] font-bold text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">A</div> OneSystem
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button onClick={() => setNavState('HOME')} className={`w-full flex items-center gap-2 p-2 rounded text-sm ${navState === 'HOME' ? 'bg-[#333]' : 'hover:bg-[#333]'}`}><Home size={16}/> Início</button>
            {isAdmin && <button onClick={() => setNavState('ADMIN_DASHBOARD')} className={`w-full flex items-center gap-2 p-2 rounded text-sm text-blue-400 ${navState === 'ADMIN_DASHBOARD' ? 'bg-[#333]' : 'hover:bg-[#333]'}`}><ShieldCheck size={16}/> Admin</button>}
            <button onClick={() => setNavState('TEAM_AREA')} className={`w-full flex items-center gap-2 p-2 rounded text-sm ${navState === 'TEAM_AREA' ? 'bg-[#333]' : 'hover:bg-[#333]'}`}><Users size={16}/> Equipe</button>
            <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase">Projetos</div>
            {projects.filter(p => p.status === 'active').map(p => (
                <button key={p.id} onClick={() => { setCurrentProjectId(p.id); setNavState('PROJECT'); }} className={`w-full flex items-center gap-2 p-2 rounded text-sm truncate ${currentProjectId === p.id && navState === 'PROJECT' ? 'bg-[#333]' : 'hover:bg-[#333]'}`}>
                    <span>{p.icon}</span> {p.title}
                </button>
            ))}
            <button onClick={handleCreateProject} className="w-full flex items-center gap-2 p-2 text-gray-500 hover:text-white text-sm"><Plus size={16}/> Novo Projeto</button>
        </nav>
        <div className="p-4 border-t border-[#333] space-y-2">
            <button onClick={() => setIsChatOpen(true)} className="w-full flex items-center gap-2 p-2 hover:bg-[#333] rounded text-sm"><MessageSquare size={16}/> Chat</button>
            <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-2 p-2 hover:bg-[#333] rounded text-sm"><Settings size={16}/> Ajustes</button>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2 text-red-400 hover:bg-red-900/20 rounded text-sm"><LogOut size={16}/> Sair</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#191919]">
        <header className="h-12 border-b border-[#333] flex items-center px-4 justify-between bg-[#191919]/50 backdrop-blur-md z-10">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-[#333] rounded"><List size={20}/></button>
            <div className="flex items-center gap-3 text-xs text-gray-400">
                {currentUser.name} <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">{currentUser.avatar}</div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {navState === 'HOME' && (
                <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
                    <h1 className="text-4xl font-bold mb-8">Olá, {currentUser.name}</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-[#202020] rounded-xl border border-[#333] hover:border-blue-500/50 transition-all cursor-pointer" onClick={handleCreateProject}>
                            <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-lg flex items-center justify-center mb-4"><Plus size={24}/></div>
                            <h3 className="font-bold">Novo Projeto</h3>
                            <p className="text-sm text-gray-500 mt-1">Workspace persistente no servidor.</p>
                        </div>
                        <div className="p-6 bg-[#202020] rounded-xl border border-[#333] hover:border-purple-500/50 transition-all cursor-pointer" onClick={() => setNavState('TEAM_AREA')}>
                            <div className="w-12 h-12 bg-purple-900/30 text-purple-400 rounded-lg flex items-center justify-center mb-4"><Users size={24}/></div>
                            <h3 className="font-bold">Área da Equipe</h3>
                            <p className="text-sm text-gray-500 mt-1">Colaboração em tempo real.</p>
                        </div>
                        <div className="p-6 bg-[#202020] rounded-xl border border-[#333] hover:border-orange-500/50 transition-all cursor-pointer" onClick={() => setNavState('IT_HELPDESK')}>
                            <div className="w-12 h-12 bg-orange-900/30 text-orange-400 rounded-lg flex items-center justify-center mb-4"><Monitor size={24}/></div>
                            <h3 className="font-bold">Helpdesk TI</h3>
                            <p className="text-sm text-gray-500 mt-1">Chamados salvos no banco de dados.</p>
                        </div>
                    </div>
                </div>
            )}

            {navState === 'PROJECT' && currentProject && (
                <div className="h-full flex flex-col max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-5xl">{currentProject.icon}</span>
                        <input className="text-4xl font-bold bg-transparent border-none outline-none w-full" value={currentProject.title} onChange={e => updateProject(currentProject.id, { title: e.target.value })} />
                    </div>
                    <div className="flex gap-4 border-b border-[#333] mb-6">
                        <button onClick={() => setViewType(ViewType.DOCUMENT)} className={`pb-2 text-sm font-medium ${viewType === ViewType.DOCUMENT ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}>Documento</button>
                        <button onClick={() => setViewType(ViewType.KANBAN)} className={`pb-2 text-sm font-medium ${viewType === ViewType.KANBAN ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}>Kanban</button>
                        <button onClick={() => setViewType(ViewType.ISHIKAWA)} className={`pb-2 text-sm font-medium ${viewType === ViewType.ISHIKAWA ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}>Ishikawa</button>
                        <button onClick={() => setViewType(ViewType.SCRUM)} className={`pb-2 text-sm font-medium ${viewType === ViewType.SCRUM ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}>Scrum</button>
                    </div>
                    <div className="flex-1">
                        {viewType === ViewType.DOCUMENT && <textarea className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-300 leading-relaxed text-lg" value={currentProject.content} placeholder="Comece a escrever..." onChange={e => updateProject(currentProject.id, { content: e.target.value })} />}
                        {viewType === ViewType.KANBAN && <KanbanBoard data={currentProject.kanbanData} currentUser={currentUser} onChange={newData => updateProject(currentProject.id, { kanbanData: newData })} />}
                        {viewType === ViewType.ISHIKAWA && <IshikawaDiagram data={currentProject.ishikawaData} />}
                        {viewType === ViewType.SCRUM && <ScrumBoard data={currentProject.scrumData} onChange={newData => updateProject(currentProject.id, { scrumData: newData })} />}
                    </div>
                </div>
            )}

            {navState === 'ADMIN_DASHBOARD' && isAdmin && <AdminDashboard projects={projects} users={users} onNavigateToProject={(id) => { setCurrentProjectId(id); setNavState('PROJECT'); }} />}
            {navState === 'IT_HELPDESK' && <SupportHelpdesk currentUser={currentUser} tickets={supportTickets} onAddTicket={handleAddTicket} onUpdateTicketStatus={handleUpdateTicketStatus} />}
            {navState === 'TEAM_AREA' && <TeamArea users={users} currentUser={currentUser} view="TEAM_AREA" />}
        </div>
      </main>

      <GlobalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={currentUser} users={users} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        users={users} 
        onAddUser={userService.createUser} 
        onUpdateUser={userService.updateUser} 
        onDeleteUser={userService.deleteUser} 
        currentUserId={currentUser.id} 
        currentUser={currentUser} 
        appSettings={appSettings} 
        setAppSettings={setAppSettings} 
        onResetSettings={() => setAppSettings(DEFAULT_SETTINGS)} 
      />

      {toast && <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-xl animate-in slide-in-from-bottom-5 z-[200]">{toast.message}</div>}
    </div>
  );
}

export default App;
