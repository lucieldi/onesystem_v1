
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Trash2, Users, MessageSquare, ChevronLeft, Search, CheckCheck, Circle, Shield, User as UserIcon, BadgeCheck } from 'lucide-react';
import { ChatMessage, User } from '../types';
import { chatService } from '../services/chatService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: (message: ChatMessage) => void;
  currentUser: User;
  users: User[]; // List of registered users to resolve avatars
  setTotalUnread?: (count: number) => void;
}

type UserStatus = 'online' | 'busy' | 'offline';
type ChatView = 'contacts' | 'conversation';

const GlobalChat: React.FC<Props> = ({ isOpen, onClose, onNewMessage, currentUser, users, setTotalUnread }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentView, setCurrentView] = useState<ChatView>('contacts');
  
  // 'GLOBAL' string means general chat, otherwise it's a User object for private chat
  const [selectedContact, setSelectedContact] = useState<User | 'GLOBAL'>('GLOBAL');
  const [searchTerm, setSearchTerm] = useState('');

  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  
  // Map of UserID/GLOBAL -> Timestamp of last read message
  const [lastReadMap, setLastReadMap] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastNotifiedMsgId = useRef<string | null>(null);

  // --- 0. LOAD READ STATUS FROM STORAGE ---
  useEffect(() => {
      const key = `ajm_chat_reads_${currentUser.id}`;
      try {
          const stored = localStorage.getItem(key);
          if (stored) {
              setLastReadMap(JSON.parse(stored));
          }
      } catch (e) {
          console.warn("Could not load chat read history");
      }
  }, [currentUser.id]);

  // Helper to update read status
  const markAsRead = (contactId: string) => {
      const now = Date.now();
      const newMap = { ...lastReadMap, [contactId]: now };
      setLastReadMap(newMap);
      localStorage.setItem(`ajm_chat_reads_${currentUser.id}`, JSON.stringify(newMap));
  };

  // --- 1. MESSAGE SYNC (POLLING) ---
  useEffect(() => {
    // Função de busca
    const fetchMessages = async () => {
        const msgs = await chatService.getMessages();
        setMessages(msgs);

        // Notificação de nova mensagem (Toast)
        if (msgs.length > 0) {
            const latestMsg = msgs[msgs.length - 1];
            // Se a mensagem é nova e não fui eu que mandei
            if (latestMsg.id !== lastNotifiedMsgId.current && latestMsg.senderId !== currentUser.username) {
                lastNotifiedMsgId.current = latestMsg.id;
                if (onNewMessage) onNewMessage(latestMsg);
            }
        }
    };

    // Busca inicial
    fetchMessages();

    // Polling a cada 2 segundos para simular tempo real
    const interval = setInterval(fetchMessages, 2000);

    return () => clearInterval(interval);
  }, [currentUser.username, onNewMessage]);

  // --- 2. PRESENCE SYSTEM (Heartbeat) ---
  useEffect(() => {
      // A. Write my own presence
      const heartbeat = () => {
          try {
            const presenceDb = JSON.parse(localStorage.getItem('ajm_presence_db') || '{}');
            presenceDb[currentUser.id] = Date.now(); // Update my timestamp
            localStorage.setItem('ajm_presence_db', JSON.stringify(presenceDb));
          } catch (e) {
             console.error("Presence write error", e);
          }
      };

      // B. Read others' presence
      const checkPresence = () => {
          try {
            const presenceDb = JSON.parse(localStorage.getItem('ajm_presence_db') || '{}');
            const now = Date.now();
            const newStatuses: Record<string, UserStatus> = {};
            
            users.forEach(u => {
                if (u.id === currentUser.id) {
                    newStatuses[u.id] = 'online'; // I am always online to myself
                } else {
                    const lastSeen = presenceDb[u.id];
                    // If seen in the last 15 seconds, consider online
                    if (lastSeen && (now - lastSeen < 15000)) {
                        newStatuses[u.id] = 'online'; 
                    } else {
                        newStatuses[u.id] = 'offline';
                    }
                }
            });
            setStatuses(newStatuses);
          } catch (e) {
              console.error("Presence read error", e);
          }
      };

      // Initial Call
      heartbeat();
      checkPresence();

      // Loop
      const interval = setInterval(() => {
          heartbeat();
          checkPresence();
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
  }, [currentUser.id, users]);


  // Scroll to bottom when chat updates & Mark as read if active
  useEffect(() => {
      if (currentView === 'conversation') {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          
          // Mark current conversation as read
          const contactKey = selectedContact === 'GLOBAL' ? 'GLOBAL' : selectedContact.id;
          markAsRead(contactKey);
      }
  }, [messages, isOpen, currentView, selectedContact]);

  // Calculate Total Unread for Sidebar Badge
  useEffect(() => {
      if (!setTotalUnread) return;

      let total = 0;
      
      // 1. Check Global Unread
      const globalLastRead = lastReadMap['GLOBAL'] || 0;
      const unreadGlobal = messages.filter(m => !m.recipientId && new Date(m.timestamp).getTime() > globalLastRead).length;
      total += unreadGlobal;

      // 2. Check Private Unread for ALL users
      users.forEach(u => {
          if (u.id === currentUser.id) return;
          const userLastRead = lastReadMap[u.id] || 0;
          const unreadPrivate = messages.filter(m => 
             m.senderId === u.username && 
             m.recipientId === currentUser.username &&
             new Date(m.timestamp).getTime() > userLastRead
          ).length;
          total += unreadPrivate;
      });

      setTotalUnread(total);
  }, [messages, lastReadMap, users, currentUser, setTotalUnread]);


  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const recipientId = selectedContact === 'GLOBAL' ? undefined : selectedContact.username;

    const newMsg: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: currentUser.username,
        recipientId: recipientId,
        text: inputText,
        timestamp: new Date().toISOString()
    };

    // Atualiza UI instantaneamente
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Update read status for self immediately so it doesn't count as unread
    const contactKey = selectedContact === 'GLOBAL' ? 'GLOBAL' : selectedContact.id;
    markAsRead(contactKey);

    // Envia para o serviço (Backend)
    await chatService.sendMessage(newMsg);
  };

  const handleClearChat = async () => {
      if(confirm('Limpar banco de dados do chat? Isso afeta todos os usuários.')) {
          await chatService.clearMessages();
          setMessages([]);
      }
  }

  // Filter messages for the active conversation
  const activeMessages = useMemo(() => {
      if (selectedContact === 'GLOBAL') {
          return messages.filter(m => !m.recipientId);
      } else {
          // Private chat: either I sent it to them, or they sent it to me
          const contactUsername = selectedContact.username;
          return messages.filter(m => 
            (m.senderId === currentUser.username && m.recipientId === contactUsername) ||
            (m.senderId === contactUsername && m.recipientId === currentUser.username)
          );
      }
  }, [messages, selectedContact, currentUser.username]);

  // Helper to get preview for contact list
  const getLastMessage = (contact: User | 'GLOBAL') => {
      let filtered = [];
      if (contact === 'GLOBAL') {
          filtered = messages.filter(m => !m.recipientId);
      } else {
          const contactUsername = contact.username;
          filtered = messages.filter(m => 
            (m.senderId === currentUser.username && m.recipientId === contactUsername) ||
            (m.senderId === contactUsername && m.recipientId === currentUser.username)
          );
      }
      if (filtered.length === 0) return null;
      return filtered[filtered.length - 1];
  };

  // Helper to get unread count for contact list
  const getUnreadCount = (contact: User | 'GLOBAL') => {
      const lastReadTime = lastReadMap[contact === 'GLOBAL' ? 'GLOBAL' : contact.id] || 0;
      
      if (contact === 'GLOBAL') {
          return messages.filter(m => 
            !m.recipientId && 
            new Date(m.timestamp).getTime() > lastReadTime &&
            m.senderId !== currentUser.username // Don't count my own messages
          ).length;
      } else {
          return messages.filter(m => 
            m.senderId === contact.username && 
            m.recipientId === currentUser.username &&
            new Date(m.timestamp).getTime() > lastReadTime
          ).length;
      }
  };

  // Helper to find user details
  const getUserDetails = (username: string) => {
      const found = users.find(u => u.username === username);
      return found || { name: username, avatar: '👤', role: 'unknown' }; 
  };

  const getStatusColor = (status?: UserStatus) => {
      switch (status) {
          case 'online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'; // Glowing green
          case 'busy': return 'bg-orange-500';
          case 'offline': return 'bg-red-500';
          default: return 'bg-gray-500';
      }
  };

  // Helper to translate status for display
  const getStatusText = (status?: UserStatus) => {
      switch (status) {
          case 'online': return 'Online';
          case 'busy': return 'Ocupado';
          case 'offline': return 'Offline';
          default: return 'Offline';
      }
  };

  const renderAvatar = (avatar: string) => {
      if (avatar.match(/^(http|data:)/)) {
          return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
      }
      return avatar;
  };

  const filteredContacts = users.filter(u => 
    u.id !== currentUser.id && 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const globalUnreadCount = getUnreadCount('GLOBAL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#121212] border-l border-[#333] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
        
        {/* === HEADER === */}
        <div className="h-16 bg-[#202020] border-b border-[#333] flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-3">
                {currentView === 'conversation' ? (
                     <button onClick={() => setCurrentView('contacts')} className="mr-1 text-gray-400 hover:text-white transition-colors">
                         <ChevronLeft size={24}/>
                     </button>
                ) : null}
                
                {currentView === 'contacts' ? (
                    <div>
                        <h3 className="font-bold text-lg text-white">Chat AJM</h3>
                        <p className="text-[10px] text-gray-400">Conectado como {currentUser.name}</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-sm shadow-inner overflow-hidden relative border border-[#444]">
                             {selectedContact === 'GLOBAL' ? '#' : renderAvatar(selectedContact.avatar)}
                        </div>
                        <div>
                             <h3 className="font-bold text-sm text-white">
                                 {selectedContact === 'GLOBAL' ? 'Chat Geral (Todos)' : selectedContact.name}
                             </h3>
                             <span className={`text-[10px] block font-medium ${selectedContact !== 'GLOBAL' && statuses[selectedContact.id] === 'online' ? 'text-green-400' : 'text-gray-400'}`}>
                                 {selectedContact === 'GLOBAL' 
                                    ? `${users.length} membros` 
                                    : getStatusText(statuses[selectedContact.id])}
                             </span>
                        </div>
                    </div>
                )}
            </div>
            
            <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* === CONTACT LIST VIEW === */}
        {currentView === 'contacts' && (
            <div className="flex-1 flex flex-col bg-[#121212]">
                {/* Search */}
                <div className="p-3 border-b border-[#333]">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-3 text-gray-500"/>
                        <input 
                            type="text" 
                            placeholder="Pesquisar pessoas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#191919] text-white text-sm rounded-full pl-9 pr-4 py-2 border border-[#333] focus:border-blue-500 outline-none placeholder-gray-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* GLOBAL CHAT ROW */}
                    {!searchTerm && (
                        <div 
                            onClick={() => { setSelectedContact('GLOBAL'); setCurrentView('conversation'); }}
                            className="flex items-center gap-3 p-4 hover:bg-[#202020] cursor-pointer transition-colors border-b border-[#333] relative"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl text-white shadow-lg shrink-0">
                                <Users size={20}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-200">Chat Geral (Todos)</h4>
                                    {getLastMessage('GLOBAL') && (
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(getLastMessage('GLOBAL')!.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs truncate ${globalUnreadCount > 0 ? 'font-bold text-white' : 'text-gray-400'}`}>
                                    {getLastMessage('GLOBAL') 
                                        ? `${getLastMessage('GLOBAL')!.senderId}: ${getLastMessage('GLOBAL')!.text}` 
                                        : 'Toque para conversar com todos'}
                                </p>
                            </div>
                            {globalUnreadCount > 0 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                                    {globalUnreadCount > 9 ? '9+' : globalUnreadCount}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Mensagens Diretas</span>
                        <span className="flex items-center gap-1"><Circle size={6} className="text-green-500 fill-green-500"/> Online</span>
                    </div>

                    {/* USER ROWS */}
                    {filteredContacts.map(user => {
                        const lastMsg = getLastMessage(user);
                        const status = statuses[user.id];
                        const unreadCount = getUnreadCount(user);
                        
                        return (
                            <div 
                                key={user.id}
                                onClick={() => { setSelectedContact(user); setCurrentView('conversation'); }}
                                className="flex items-center gap-3 p-3 px-4 hover:bg-[#202020] cursor-pointer transition-colors relative group"
                            >
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center text-lg border border-[#333] overflow-hidden">
                                        {renderAvatar(user.avatar)}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121212] ${getStatusColor(status)}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className="flex items-center">
                                            <h4 className={`font-semibold text-sm ${unreadCount > 0 ? 'text-white' : 'text-gray-200'}`}>
                                                {user.name}
                                            </h4>
                                            {/* ROLE BADGES FOR CLARITY */}
                                            {user.role === 'admin' ? (
                                                <span title="Administrador"><Shield size={12} className="text-blue-400 ml-1.5" /></span>
                                            ) : (
                                                <span title="Usuário Padrão"><BadgeCheck size={12} className="text-gray-500 ml-1.5" /></span>
                                            )}
                                        </div>
                                        {lastMsg && (
                                            <span className={`text-[10px] ${unreadCount > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                                                {new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-200 font-medium' : (lastMsg ? 'text-gray-400' : 'text-gray-600 italic')}`}>
                                        {lastMsg 
                                            ? (lastMsg.senderId === currentUser.username ? `Você: ${lastMsg.text}` : lastMsg.text)
                                            : 'Iniciar conversa'}
                                    </p>
                                </div>
                                {unreadCount > 0 && (
                                    <div className="ml-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {currentUser.role === 'admin' && (
                     <div className="p-3 border-t border-[#333]">
                        <button 
                            onClick={handleClearChat}
                            className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-900/20 py-2 rounded transition-colors"
                        >
                            <Trash2 size={12}/> Limpar Banco de Dados
                        </button>
                     </div>
                )}
            </div>
        )}

        {/* === CONVERSATION VIEW === */}
        {currentView === 'conversation' && (
            <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    {activeMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm italic opacity-50">
                            <MessageSquare size={32} className="mb-2 opacity-20"/>
                            <p>Nenhuma mensagem aqui ainda.</p>
                            <p className="text-xs">Diga olá!</p>
                        </div>
                    )}

                    {activeMessages.map((msg) => {
                        const isMe = msg.senderId === currentUser.username;
                        const senderDetails = getUserDetails(msg.senderId);

                        return (
                            <div key={msg.id} className={`flex w-full flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && selectedContact === 'GLOBAL' && (
                                    <div className="flex items-center gap-1 ml-1 mb-0.5">
                                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-[#333] text-[10px]">
                                            {renderAvatar(senderDetails.avatar)}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">{senderDetails.name}</span>
                                    </div>
                                )}
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-md relative group ${
                                    isMe 
                                    ? 'bg-[#005c4b] text-white rounded-tr-none' 
                                    : 'bg-[#202c33] text-gray-200 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                    <div className={`text-[9px] text-right mt-1 opacity-60 flex justify-end gap-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        {isMe && <CheckCheck size={10} />}
                                    </div>
                                    
                                    {/* Bubble Tail */}
                                    <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent ${
                                        isMe 
                                        ? '-right-[6px] border-t-[#005c4b] border-l-[#005c4b]' 
                                        : '-left-[6px] border-t-[#202c33] border-r-[#202c33]'
                                    }`}></div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 bg-[#202020] flex items-center gap-2 border-t border-[#333]">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="flex-1 bg-[#2C2C2C] text-white rounded-full px-4 py-2.5 text-sm border-none focus:ring-1 focus:ring-gray-500 outline-none placeholder-gray-500"
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        <Send size={18} className={inputText.trim() ? "translate-x-0.5" : ""} />
                    </button>
                </form>
            </div>
        )}
    </div>
  );
};

export default GlobalChat;
