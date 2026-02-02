import React from 'react';
import { User, NavigationState, KanbanColumn } from '../types';
import { Users, Mail, Shield, BadgeCheck, Megaphone, FileText, Calendar, Link, BookOpen, Database, Trello, Plus } from 'lucide-react';
import KanbanBoard from './KanbanBoard';

interface Props {
  users: User[];
  currentUser: User;
  view: NavigationState;
  teamKanbanData?: KanbanColumn[];
  onTeamKanbanChange?: (data: KanbanColumn[]) => void;
}

const TeamArea: React.FC<Props> = ({ users, currentUser, view, teamKanbanData, onTeamKanbanChange }) => {

  // --- SUB-VIEWS ---

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {/* Left Column: Announcements & Resources */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#202020] rounded-lg border border-[#333] p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Megaphone size={20} className="text-yellow-500"/> Mural de Avisos
                    </div>
                    <span className="text-xs text-notion-muted">Atualizado recentemente</span>
                </div>
                <div className="space-y-4">
                    <div className="bg-[#252525] p-4 rounded border-l-4 border-blue-500 hover:bg-[#2A2A2A] transition-colors">
                        <h4 className="font-medium text-gray-200 mb-1 flex items-center justify-between">
                            Reunião Geral Mensal
                            <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded">IMPORTANTE</span>
                        </h4>
                        <p className="text-sm text-gray-400 leading-relaxed">Nossa reunião de alinhamento será na próxima sexta-feira às 15h.</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-notion-muted border-t border-white/5 pt-2">
                            <div className="flex items-center gap-1"><Calendar size={12}/> 24 Nov, 2023</div>
                            <div className="flex items-center gap-1"><Users size={12}/> Toda a equipe</div>
                        </div>
                    </div>
                </div>
            </div>

             <div className="bg-[#202020] rounded-lg border border-[#333] p-6">
                <div className="flex items-center gap-2 mb-4 text-white font-semibold">
                    <FileText size={20} className="text-blue-400"/> Documentos Recentes
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { name: 'Manual de Conduta', type: 'PDF' },
                        { name: 'Onboarding Kit', type: 'ZIP' },
                    ].map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#252525] hover:bg-[#2A2A2A] rounded border border-[#333] cursor-pointer transition-colors group">
                            <div className="p-2 bg-blue-900/20 text-blue-400 rounded shrink-0">
                                <FileText size={18}/>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm text-gray-300 group-hover:text-white font-medium truncate">{doc.name}</span>
                                <span className="text-[10px] text-notion-muted">{doc.type} • 2MB</span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>

        {/* Right Column: Directory Preview */}
        <div className="bg-[#202020] rounded-lg border border-[#333] overflow-hidden flex flex-col h-fit sticky top-6">
            <div className="p-4 border-b border-[#333] bg-[#252525] flex justify-between items-center">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Users size={18} className="text-gray-400"/> Membros Online
                </h3>
                <span className="text-xs bg-[#333] px-2 py-0.5 rounded text-gray-400">{users.length}</span>
            </div>
            <div className="p-4 space-y-3">
                {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs border border-[#444] overflow-hidden shrink-0">
                             {user.avatar.match(/^(http|data:)/) ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : user.avatar}
                        </div>
                        <span className="text-sm text-gray-300">{user.name}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderCalendar = () => (
      <div className="bg-[#202020] rounded-lg border border-[#333] p-6 h-full animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="text-red-400"/> Agenda da Equipe</h2>
              <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">Adicionar Evento</button>
              </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-[#333] border border-[#333] rounded-lg overflow-hidden">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                  <div key={day} className="bg-[#252525] p-2 text-center text-xs text-gray-400 font-semibold uppercase">{day}</div>
              ))}
              {Array.from({length: 35}).map((_, i) => (
                  <div key={i} className="bg-[#1e1e1e] h-24 p-2 hover:bg-[#252525] transition-colors relative group cursor-pointer">
                      <span className={`text-xs ${i === 14 ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-gray-500'}`}>
                          {i + 1}
                      </span>
                      {i === 14 && (
                          <div className="mt-1 text-[10px] bg-yellow-900/40 text-yellow-200 p-1 rounded border-l-2 border-yellow-500 truncate">
                              Reunião Geral
                          </div>
                      )}
                      {i === 16 && (
                          <div className="mt-1 text-[10px] bg-purple-900/40 text-purple-200 p-1 rounded border-l-2 border-purple-500 truncate">
                              Workshop
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  const renderDocuments = () => (
      <div className="bg-[#202020] rounded-lg border border-[#333] p-6 h-full animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="text-blue-400"/> Documentos</h2>
              <button className="px-3 py-1 bg-[#333] text-white text-xs rounded hover:bg-[#444] border border-[#444] flex items-center gap-2">
                  <Plus size={14}/> Upload
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[
                    { name: 'Onboarding 2024', type: 'Pasta', items: '12 arquivos' },
                    { name: 'Brand Assets', type: 'Pasta', items: '45 arquivos' },
                    { name: 'Contratos Modelo', type: 'Pasta', items: '8 arquivos' },
                    { name: 'Financeiro Q3', type: 'XLSX', size: '2.4 MB' },
                    { name: 'Apresentação Institucional', type: 'PPTX', size: '15 MB' },
                    { name: 'Manual do Colaborador', type: 'PDF', size: '4.1 MB' },
               ].map((item, i) => (
                   <div key={i} className="bg-[#252525] p-4 rounded border border-[#333] hover:border-blue-500/50 cursor-pointer group flex flex-col items-center justify-center text-center h-32 hover:bg-[#2a2a2a] transition-all">
                       <div className="mb-2 text-gray-400 group-hover:text-blue-400 transition-colors">
                           {item.type === 'Pasta' ? <div className="text-4xl">📁</div> : <FileText size={32}/>}
                       </div>
                       <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate w-full px-2">{item.name}</span>
                       <span className="text-[10px] text-gray-500 mt-1">{item.type === 'Pasta' ? item.items : item.type}</span>
                   </div>
               ))}
          </div>
      </div>
  );

  const renderMembers = () => (
      <div className="bg-[#202020] rounded-lg border border-[#333] h-full flex flex-col animate-in fade-in duration-300">
          <div className="p-6 border-b border-[#333]">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-green-400"/> Diretório da Equipe</h2>
          </div>
          <div className="p-0 overflow-y-auto custom-scrollbar">
             {users.map(user => (
                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-[#252525] border-b border-[#333] last:border-0 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-xl border border-[#444] overflow-hidden shrink-0">
                            {user.avatar.match(/^(http|data:)/) ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : user.avatar}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{user.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' : 'bg-[#333] text-gray-400'}`}>
                                {user.role === 'admin' ? 'Admin' : 'Membro'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1"><Mail size={12}/> {user.email || 'N/A'}</span>
                            <span className="flex items-center gap-1 opacity-50">@{user.username}</span>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 bg-[#333] hover:bg-blue-600 text-white text-xs rounded transition-colors">
                        Ver Perfil
                    </button>
                </div>
             ))}
          </div>
      </div>
  );

  const renderTraining = () => (
      <div className="bg-[#202020] rounded-lg border border-[#333] p-6 h-full animate-in fade-in duration-300">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><BookOpen className="text-orange-400"/> Treinamentos</h2>
          <div className="space-y-4">
              {[
                  { title: 'Segurança da Informação', progress: 100, status: 'Concluído' },
                  { title: 'Cultura e Valores', progress: 65, status: 'Em Andamento' },
                  { title: 'Ferramentas Internas 2.0', progress: 0, status: 'Não Iniciado' },
              ].map((course, i) => (
                  <div key={i} className="bg-[#252525] p-4 rounded border border-[#333] hover:border-[#444] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-200">{course.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                              course.status === 'Concluído' ? 'bg-green-900/20 text-green-400' :
                              course.status === 'Em Andamento' ? 'bg-blue-900/20 text-blue-400' :
                              'bg-gray-700/20 text-gray-400'
                          }`}>{course.status}</span>
                      </div>
                      <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${course.progress}%` }}
                          />
                      </div>
                      <div className="mt-2 text-right text-xs text-gray-500">{course.progress}%</div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderRecords = () => (
       <div className="bg-[#202020] rounded-lg border border-[#333] p-6 h-full animate-in fade-in duration-300 flex flex-col items-center justify-center text-center">
           <Database size={48} className="text-[#333] mb-4"/>
           <h2 className="text-xl font-bold text-gray-300 mb-2">Registros Internos</h2>
           <p className="text-sm text-gray-500 max-w-md">Área destinada a registros de ponto, logs de atividade e histórico de alterações do sistema.</p>
           <button className="mt-6 px-4 py-2 bg-[#333] text-white rounded hover:bg-[#444] text-sm">Acessar Arquivos Mortos</button>
       </div>
  );

  // --- MAIN RENDER ---
  const getHeader = () => {
      switch(view) {
          case 'TEAM_AREA': return { title: 'Área da Equipe', desc: 'Visão geral', icon: <Users size={32} className="text-pink-500"/> };
          case 'TEAM_CALENDAR': return { title: 'Agenda', desc: 'Eventos e compromissos', icon: <Calendar size={32} className="text-red-500"/> };
          case 'TEAM_DOCUMENTS': return { title: 'Documentos', desc: 'Arquivos compartilhados', icon: <FileText size={32} className="text-blue-500"/> };
          case 'TEAM_MEMBERS': return { title: 'Equipe', desc: 'Diretório de membros', icon: <Users size={32} className="text-green-500"/> };
          case 'TEAM_TRAINING': return { title: 'Treinamentos', desc: 'Cursos e capacitação', icon: <BookOpen size={32} className="text-orange-500"/> };
          case 'TEAM_RECORDS': return { title: 'Registros', desc: 'Logs e histórico', icon: <Database size={32} className="text-gray-500"/> };
          case 'TEAM_KANBAN': return { title: 'Kanban da Equipe', desc: 'Gestão visual de tarefas', icon: <Trello size={32} className="text-purple-500"/> };
          default: return { title: 'Área da Equipe', desc: '', icon: <Users size={32}/> };
      }
  };

  const header = getHeader();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto animate-in fade-in duration-300 flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            {header.icon} {header.title}
        </h1>
        <p className="text-notion-muted">{header.desc}</p>
      </div>

      <div className="flex-1 min-h-0">
          {view === 'TEAM_AREA' && renderDashboard()}
          {view === 'TEAM_CALENDAR' && renderCalendar()}
          {view === 'TEAM_DOCUMENTS' && renderDocuments()}
          {view === 'TEAM_MEMBERS' && renderMembers()}
          {view === 'TEAM_TRAINING' && renderTraining()}
          {view === 'TEAM_RECORDS' && renderRecords()}
          {view === 'TEAM_KANBAN' && teamKanbanData && onTeamKanbanChange && (
              <div className="h-full">
                  <KanbanBoard 
                    data={teamKanbanData} 
                    onChange={onTeamKanbanChange} 
                    currentUser={currentUser} 
                  />
              </div>
          )}
      </div>
    </div>
  );
};

export default TeamArea;