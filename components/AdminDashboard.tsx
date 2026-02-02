
import React, { useState, useMemo } from 'react';
import { Project, User, Task } from '../types';
import { 
  LayoutDashboard, CheckCircle, Circle, Clock, Folder, 
  User as UserIcon, ArrowRight, Trello, ListTodo, Filter,
  Calendar, Users, Search, Shield, BadgeCheck
} from 'lucide-react';

interface Props {
  projects: Project[];
  users: User[];
  onNavigateToProject: (projectId: string) => void;
}

// Helper to flatten tasks for the global view
interface FlatTask extends Task {
  projectName: string;
  projectId: string;
  context: string; // e.g., "Kanban: To Do" or "Sprint 1"
  type: 'kanban' | 'scrum';
}

const AdminDashboard: React.FC<Props> = ({ projects, users, onNavigateToProject }) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'users'>('projects');
  const [userSearch, setUserSearch] = useState('');

  // --- Aggregate Stats ---
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    let totalTasks = 0;
    let completedTasks = 0;

    projects.forEach(p => {
        // Kanban stats
        p.kanbanData.forEach(col => {
            totalTasks += col.tasks.length;
            if (col.title.toLowerCase().includes('done') || col.title.toLowerCase().includes('complete') || col.title.toLowerCase().includes('concluído')) {
                completedTasks += col.tasks.length;
            }
        });
        // Scrum stats
        p.scrumData.sprints.forEach(sprint => {
            totalTasks += sprint.tasks.length;
            if (sprint.status === 'completed') {
                completedTasks += sprint.tasks.length; // Simplified assumption
            }
        });
        totalTasks += p.scrumData.backlog.length;
    });

    return { totalProjects, activeProjects, totalTasks, completedTasks };
  }, [projects]);

  // --- Flatten All Tasks ---
  const allTasks = useMemo(() => {
    const flattened: FlatTask[] = [];
    
    projects.forEach(p => {
        // Kanban Tasks
        p.kanbanData.forEach(col => {
            col.tasks.forEach(t => {
                flattened.push({
                    ...t,
                    projectName: p.title,
                    projectId: p.id,
                    context: `Kanban: ${col.title}`,
                    type: 'kanban'
                });
            });
        });

        // Scrum Backlog
        p.scrumData.backlog.forEach(t => {
            flattened.push({
                ...t,
                projectName: p.title,
                projectId: p.id,
                context: 'Backlog',
                type: 'scrum'
            });
        });

        // Scrum Sprints
        p.scrumData.sprints.forEach(s => {
            s.tasks.forEach(t => {
                 flattened.push({
                    ...t,
                    projectName: p.title,
                    projectId: p.id,
                    context: `Sprint: ${s.title} (${s.status === 'active' ? 'Ativo' : s.status === 'completed' ? 'Concluído' : 'Planejado'})`,
                    type: 'scrum'
                });
            });
        });
    });

    return flattened;
  }, [projects]);

  // --- Filter Tasks ---
  const filteredTasks = useMemo(() => {
      if (selectedUser === 'all') return allTasks;
      // Filter by assignee name (case insensitive partial match to handle simple string storage)
      const user = users.find(u => u.id === selectedUser);
      if (!user) return [];
      
      return allTasks.filter(t => 
          t.assignee && t.assignee.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())
      );
  }, [allTasks, selectedUser, users]);

  // --- Filter Users ---
  const filteredUsers = useMemo(() => {
      return users.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearch.toLowerCase())
      );
  }, [users, userSearch]);

  const renderAvatar = (avatar: string) => {
      if (avatar.match(/^(http|data:)/)) {
          return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
      }
      return avatar;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <LayoutDashboard size={32} className="text-blue-500"/> Painel do Admin
            </h1>
            <p className="text-notion-muted">Visão geral da atividade do workspace e cargas de trabalho.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center gap-4">
                <div className="p-3 bg-blue-900/30 rounded-full text-blue-400">
                    <Folder size={24}/>
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
                    <div className="text-xs text-notion-muted">Total de Projetos</div>
                </div>
            </div>
            <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center gap-4">
                <div className="p-3 bg-purple-900/30 rounded-full text-purple-400">
                    <Users size={24}/>
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <div className="text-xs text-notion-muted">Usuários Cadastrados</div>
                </div>
            </div>
            <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center gap-4">
                <div className="p-3 bg-orange-900/30 rounded-full text-orange-400">
                    <ListTodo size={24}/>
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                    <div className="text-xs text-notion-muted">Total de Tarefas Rastreadas</div>
                </div>
            </div>
             <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center gap-4">
                <div className="p-3 bg-green-900/30 rounded-full text-green-400">
                    <CheckCircle size={24}/>
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">{stats.completedTasks}</div>
                    <div className="text-xs text-notion-muted">Concluídas (Est.)</div>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#333] mb-6">
            <button 
                onClick={() => setActiveTab('projects')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'projects' ? 'border-blue-500 text-white' : 'border-transparent text-notion-muted hover:text-gray-300'}`}
            >
                Todos os Projetos
            </button>
            <button 
                 onClick={() => setActiveTab('tasks')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'tasks' ? 'border-blue-500 text-white' : 'border-transparent text-notion-muted hover:text-gray-300'}`}
            >
                Lista Global de Tarefas
            </button>
             <button 
                 onClick={() => setActiveTab('users')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-white' : 'border-transparent text-notion-muted hover:text-gray-300'}`}
            >
                Banco de Dados de Usuários
            </button>
        </div>

        {/* PROJECTS VIEW */}
        {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => (
                    <div key={p.id} className="bg-[#202020] rounded-lg border border-[#333] p-4 hover:border-[#555] transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{p.icon}</div>
                                <div>
                                    <h3 className="font-semibold text-white">{p.title}</h3>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${p.status === 'active' ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-orange-900/20 text-orange-400 border-orange-900/30'}`}>
                                        {p.status === 'active' ? 'ATIVO' : 'CONCLUÍDO'}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => onNavigateToProject(p.id)}
                                className="p-2 bg-[#333] rounded-full text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ArrowRight size={16}/>
                            </button>
                        </div>
                        <div className="space-y-2">
                             <div className="flex justify-between text-xs text-notion-muted">
                                 <span>Última Atualização</span>
                                 <span>{p.updatedAt.toLocaleDateString()}</span>
                             </div>
                             <div className="flex justify-between text-xs text-notion-muted">
                                 <span>Tarefas Kanban</span>
                                 <span>{p.kanbanData.reduce((acc, c) => acc + c.tasks.length, 0)}</span>
                             </div>
                             <div className="flex justify-between text-xs text-notion-muted">
                                 <span>Itens de Backlog/Sprint</span>
                                 <span>{p.scrumData.backlog.length + p.scrumData.sprints.reduce((acc, s) => acc + s.tasks.length, 0)}</span>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* TASKS VIEW */}
        {activeTab === 'tasks' && (
            <div className="bg-[#202020] rounded-lg border border-[#333] overflow-hidden flex flex-col h-[600px]">
                {/* Filter Toolbar */}
                <div className="p-4 border-b border-[#333] bg-[#252525] flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Filter size={16} /> Filtrar por Usuário:
                    </div>
                    <select 
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="bg-[#191919] border border-[#333] text-white text-sm rounded px-3 py-1.5 outline-none focus:border-blue-500"
                    >
                        <option value="all">Todos os Usuários</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <div className="ml-auto text-xs text-notion-muted">
                        Mostrando {filteredTasks.length} tarefas
                    </div>
                </div>

                {/* Task Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#191919] text-xs uppercase text-notion-muted sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-semibold border-b border-[#333]">TAREFA</th>
                                <th className="p-4 font-semibold border-b border-[#333]">PROJETO</th>
                                <th className="p-4 font-semibold border-b border-[#333]">RESPONSÁVEL</th>
                                <th className="p-4 font-semibold border-b border-[#333]">CONTEXTO / STATUS</th>
                                <th className="p-4 font-semibold border-b border-[#333]">PRAZO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-notion-muted italic">
                                        Nenhuma tarefa encontrada para o filtro selecionado.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr key={`${task.projectId}-${task.id}`} className="hover:bg-[#2C2C2C] group transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{task.icon || (task.type === 'kanban' ? <Trello size={14} className="text-blue-400"/> : <ListTodo size={14} className="text-purple-400"/>)}</span>
                                                <span className="text-sm font-medium text-gray-200">{task.content}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {task.projectName}
                                        </td>
                                        <td className="p-4">
                                            {task.assignee ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#333] text-xs text-gray-200">
                                                    <UserIcon size={12}/> {task.assignee}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">Não atribuído</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded border ${
                                                task.context.toLowerCase().includes('done') || task.context.toLowerCase().includes('complete') || task.context.toLowerCase().includes('concluído') 
                                                ? 'bg-green-900/20 text-green-400 border-green-900/30' 
                                                : 'bg-blue-900/20 text-blue-400 border-blue-900/30'
                                            }`}>
                                                {task.context}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {task.dueDate ? (
                                                <div className="flex items-center gap-2 text-notion-muted">
                                                    <Calendar size={14}/>
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </div>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* USERS DB VIEW */}
        {activeTab === 'users' && (
            <div className="bg-[#202020] rounded-lg border border-[#333] overflow-hidden flex flex-col h-[600px]">
                {/* Search Toolbar */}
                <div className="p-4 border-b border-[#333] bg-[#252525] flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-3 text-gray-500"/>
                        <input 
                            type="text" 
                            placeholder="Pesquisar no banco de dados (Nome, Email, ID)..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-[#191919] text-white text-sm rounded-full pl-9 pr-4 py-2 border border-[#333] focus:border-blue-500 outline-none placeholder-gray-600"
                        />
                    </div>
                    <div className="ml-auto text-xs text-notion-muted">
                        Total: {filteredUsers.length} registros
                    </div>
                </div>

                {/* Users Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#191919] text-xs uppercase text-notion-muted sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-semibold border-b border-[#333]">USUÁRIO</th>
                                <th className="p-4 font-semibold border-b border-[#333]">EMAIL / LOGIN</th>
                                <th className="p-4 font-semibold border-b border-[#333]">PERMISSÃO</th>
                                <th className="p-4 font-semibold border-b border-[#333]">ID DO SISTEMA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                             {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-notion-muted italic">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-[#2C2C2C] group transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg border border-[#444] overflow-hidden">
                                                    {renderAvatar(user.avatar)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.name}</div>
                                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-300">{user.email || <span className="text-gray-600 italic">Não cadastrado</span>}</div>
                                        </td>
                                        <td className="p-4">
                                             {user.role === 'admin' ? (
                                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/30 text-blue-400 border border-blue-900/50 text-xs font-medium">
                                                     <Shield size={12}/> Administrador
                                                 </span>
                                             ) : (
                                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-xs font-medium">
                                                     <BadgeCheck size={12}/> Padrão
                                                 </span>
                                             )}
                                        </td>
                                        <td className="p-4">
                                            <code className="text-xs bg-[#151515] px-2 py-1 rounded text-gray-500 font-mono">
                                                {user.id}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;