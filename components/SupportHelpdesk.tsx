
import React, { useState } from 'react';
import { Monitor, Plus, AlertCircle, CheckCircle, Clock, Search, Filter, X, Send } from 'lucide-react';
import { SupportTicket, User } from '../types';

interface Props {
  currentUser: User;
  tickets: SupportTicket[];
  onAddTicket: (ticket: SupportTicket) => void;
  onUpdateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
}

const SupportHelpdesk: React.FC<Props> = ({ currentUser, tickets, onAddTicket, onUpdateTicketStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SupportTicket['status']>('All');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Software');
  const [priority, setPriority] = useState<SupportTicket['priority']>('Medium');

  const isAdmin = currentUser.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const newTicket: SupportTicket = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      priority,
      status: 'Open',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString()
    };

    onAddTicket(newTicket);
    setIsModalOpen(false);
    
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('Software');
    setPriority('Medium');
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    
    // Standard users only see their own tickets, Admins see all
    const matchesUser = isAdmin ? true : t.createdBy === currentUser.name;

    return matchesSearch && matchesStatus && matchesUser;
  });

  const getPriorityColor = (p: SupportTicket['priority']) => {
    switch (p) {
      case 'Critical': return 'text-red-500 bg-red-900/20 border-red-900/30';
      case 'High': return 'text-orange-500 bg-orange-900/20 border-orange-900/30';
      case 'Medium': return 'text-blue-400 bg-blue-900/20 border-blue-900/30';
      case 'Low': return 'text-green-400 bg-green-900/20 border-green-900/30';
    }
  };

  const getStatusColor = (s: SupportTicket['status']) => {
    switch (s) {
      case 'Open': return 'text-yellow-400';
      case 'In Progress': return 'text-blue-400';
      case 'Resolved': return 'text-green-400';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Monitor size={32} className="text-purple-500"/> Helpdesk do TI
          </h1>
          <p className="text-notion-muted">Abra chamados e acompanhe o status das solicitações de suporte.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
        >
          <Plus size={18}/> Novo Chamado
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-[#202020] p-4 rounded-lg border border-[#333]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-500"/>
          <input 
            type="text" 
            placeholder="Pesquisar chamados..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#151515] text-white text-sm rounded-md pl-9 pr-4 py-2 border border-[#333] focus:border-purple-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 border-l border-[#333] pl-4">
          <Filter size={16} className="text-gray-500"/>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#151515] text-white text-sm rounded px-3 py-2 border border-[#333] outline-none"
          >
            <option value="All">Todos os Status</option>
            <option value="Open">Aberto</option>
            <option value="In Progress">Em Progresso</option>
            <option value="Resolved">Resolvido</option>
          </select>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTickets.length === 0 ? (
           <div className="col-span-1 lg:col-span-2 text-center py-20 bg-[#202020] rounded-lg border border-dashed border-[#333]">
             <AlertCircle size={48} className="mx-auto mb-4 text-gray-600"/>
             <p className="text-gray-400">Nenhum chamado encontrado.</p>
           </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="bg-[#202020] p-5 rounded-lg border border-[#333] hover:border-[#555] transition-all group relative flex flex-col">
              <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-notion-muted bg-[#333] px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-500"/>
                    <span className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                 </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">{ticket.title}</h3>
              <p className="text-sm text-gray-400 mb-4 bg-[#151515] p-3 rounded border border-[#333] leading-relaxed flex-1">
                {ticket.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#333] mt-auto">
                <div className="flex items-center gap-2 text-xs">
                   <span className="text-notion-muted">Solicitado por:</span>
                   <span className="text-white font-medium">{ticket.createdBy}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status === 'Resolved' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    {ticket.status === 'Open' ? 'Aberto' : ticket.status === 'In Progress' ? 'Em Progresso' : 'Resolvido'}
                  </div>

                  {isAdmin && (
                    <div className="flex bg-[#151515] rounded border border-[#333] overflow-hidden ml-2">
                       <button 
                        onClick={() => onUpdateTicketStatus(ticket.id, 'Open')}
                        className={`px-2 py-1 text-[10px] hover:bg-[#333] transition-colors ${ticket.status === 'Open' ? 'bg-yellow-900/30 text-yellow-400' : 'text-gray-500'}`}
                        title="Marcar como Aberto"
                       >
                         Aber
                       </button>
                       <div className="w-px bg-[#333]"></div>
                       <button 
                        onClick={() => onUpdateTicketStatus(ticket.id, 'In Progress')}
                        className={`px-2 py-1 text-[10px] hover:bg-[#333] transition-colors ${ticket.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400' : 'text-gray-500'}`}
                        title="Marcar Em Progresso"
                       >
                         Prog
                       </button>
                       <div className="w-px bg-[#333]"></div>
                       <button 
                        onClick={() => onUpdateTicketStatus(ticket.id, 'Resolved')}
                        className={`px-2 py-1 text-[10px] hover:bg-[#333] transition-colors ${ticket.status === 'Resolved' ? 'bg-green-900/30 text-green-400' : 'text-gray-500'}`}
                        title="Marcar Resolvido"
                       >
                         Res
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#202020] w-full max-w-lg rounded-xl border border-[#333] shadow-2xl p-6 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-white">Novo Chamado</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                   <X size={20}/>
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs text-notion-muted font-semibold uppercase">Título do Problema</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-[#151515] border border-[#333] rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                      placeholder="Ex: Impressora não funciona..."
                      required
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-notion-muted font-semibold uppercase">Categoria</label>
                        <select 
                          value={category}
                          onChange={e => setCategory(e.target.value as any)}
                          className="w-full bg-[#151515] border border-[#333] rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                        >
                          <option value="Software">Software</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Network">Rede / Internet</option>
                          <option value="Access">Acessos / Senhas</option>
                          <option value="Other">Outros</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-notion-muted font-semibold uppercase">Prioridade</label>
                        <select 
                          value={priority}
                          onChange={e => setPriority(e.target.value as any)}
                          className="w-full bg-[#151515] border border-[#333] rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                        >
                          <option value="Low">Baixa</option>
                          <option value="Medium">Média</option>
                          <option value="High">Alta</option>
                          <option value="Critical">Crítica</option>
                        </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs text-notion-muted font-semibold uppercase">Descrição Detalhada</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-[#151515] border border-[#333] rounded p-2 text-sm text-white focus:border-purple-500 outline-none h-32 resize-none"
                      placeholder="Descreva o problema e os passos para reproduzi-lo..."
                      required
                    />
                 </div>

                 <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                    <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded text-sm font-medium shadow-lg flex items-center gap-2">
                       <Send size={16}/> Enviar Chamado
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupportHelpdesk;
