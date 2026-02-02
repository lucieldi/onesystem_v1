
import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Trash2, Shield, User as UserIcon, Edit2, Lock, Eye, Users, Layout, Send, AlertTriangle, Smile, Check, Moon, Sun, Camera, Upload, Loader2, MousePointer2, RotateCcw } from 'lucide-react';
import { User, UserRole, AppSettings } from '../types';
import { fileService } from '../services/fileService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (user: User & { password?: string }) => Promise<void>; // Updated to Promise
  onUpdateUser: (user: User & { password?: string }) => Promise<void>; // Updated to Promise
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
  currentUser: User;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  onResetSettings: () => void;
}

type Tab = 'users' | 'security' | 'appearance';

// Lista expandida de presets
const EMOJI_PRESETS = [
    '👤', '👩‍💼', '👨‍💻', '🤵', '👷', 
    '🚀', '⭐', '🔥', '💡', '✅', 
    '🐱', '🐶', '🦊', '🦁', '🐸', 
    '🤖', '👽', '👻', '💀', '🤡',
    '🦄', '🐲', '🌵', '🍄', '🌍'
];

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, users, onAddUser, onUpdateUser, onDeleteUser, currentUserId, currentUser, appSettings, setAppSettings, onResetSettings }) => {
  const [activeTab, setActiveTab] = useState<Tab>(currentUser.role === 'admin' ? 'users' : 'appearance');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state when modal opens
  useEffect(() => {
      if (isOpen) {
          if (currentUser.role !== 'admin' && activeTab === 'users') {
              // Standard users default to editing their own profile in the 'users' tab if active
              handleEditClick(currentUser);
          } else if (currentUser.role === 'admin') {
              resetForm();
          }
      }
  }, [isOpen, currentUser]);

  // User Management State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [avatar, setAvatar] = useState('👤');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to prevent double clicks
  
  // Estado para controlar o picker de emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Security State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Handle Recovery Email Default State
  useEffect(() => {
      if (activeTab === 'security') {
          if (currentUser.role === 'admin') {
              setRecoveryEmail('');
          } else {
              setRecoveryEmail(currentUser.email || '');
          }
      }
  }, [activeTab, currentUser]);

  // If user switches to 'users' tab and is not admin, ensure they are editing themselves
  useEffect(() => {
      if (activeTab === 'users' && currentUser.role !== 'admin') {
          handleEditClick(currentUser);
      }
  }, [activeTab, currentUser]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('user');
    setAvatar('👤');
    setEditingUserId(null);
    setDeleteConfirmId(null);
    setShowEmojiPicker(false);
    setIsSubmitting(false);
  };

  const handleEditClick = (user: User) => {
      setEditingUserId(user.id);
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email || '');
      setPassword(''); 
      setRole(user.role);
      setAvatar(user.avatar);
      setDeleteConfirmId(null); 
      setShowEmojiPicker(false);
      setIsSubmitting(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
              const result = await fileService.uploadFile(file);
              setAvatar(result.url);
          } catch (err) {
              alert("Erro ao carregar imagem");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || isSubmitting) return;

    // VALIDAÇÃO DE DUPLICIDADE
    if (!editingUserId) {
        const userExists = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
        if (userExists) {
            alert('Este nome de usuário já está em uso. Por favor, escolha outro.');
            return;
        }
    }

    const baseUserData = {
      id: editingUserId || username.trim(), 
      name,
      username: username.trim(),
      email,
      role,
      avatar
    };

    setIsSubmitting(true);

    try {
        if (editingUserId) {
            // Update Flow
            const updatePayload = { ...baseUserData };
            if (password.trim()) {
                (updatePayload as any).password = password;
            }
            await onUpdateUser(updatePayload as any);
            
            // If not admin, give feedback but stay on form
            if (currentUser.role !== 'admin') {
                 // Maybe show a checkmark or toast, for now just no reset
            } else {
                resetForm();
            }
        } else {
            // Registration Flow
            if (!password) return; 
            await onAddUser({ ...baseUserData, password });
            resetForm();
        }
    } catch (error) {
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendRecovery = () => {
      if(!recoveryEmail) return;
      setRecoveryStatus('sending');
      setTimeout(() => {
          setRecoveryStatus('sent');
          setTimeout(() => {
              setRecoveryStatus('idle');
              // Only clear if admin, otherwise keep user email
              if (currentUser.role === 'admin') {
                  setRecoveryEmail('');
              }
          }, 3000);
      }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#191919] w-full max-w-4xl h-[80vh] rounded-xl border border-[#333] shadow-2xl flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <div className="w-64 bg-[#202020] border-r border-[#333] flex flex-col">
            <div className="p-6 border-b border-[#333]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield size={20} className="text-blue-500" /> {currentUser.role === 'admin' ? 'Admin' : 'Configurações'}
                </h2>
                <p className="text-xs text-notion-muted">Painel de Controle</p>
            </div>
            <div className="p-2 space-y-1">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'users' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                >
                    <Users size={18} /> {currentUser.role === 'admin' ? 'Gerenciamento de Usuários' : 'Meu Perfil'}
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'security' ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                >
                    <Lock size={18} /> Segurança e Recuperação
                </button>
                 <button 
                    onClick={() => setActiveTab('appearance')}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'appearance' ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                >
                    <Eye size={18} /> Aparência
                </button>
            </div>
            <div className="mt-auto p-4 border-t border-[#333]">
                <button onClick={() => { onClose(); resetForm(); }} className="w-full py-2 bg-[#333] hover:bg-[#444] rounded text-sm text-white transition-colors">
                    Fechar Configurações
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#151515] p-8">
            
            {/* --- TAB: USER MANAGEMENT / MY PROFILE --- */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">
                        {currentUser.role === 'admin' ? 'Gerenciamento de Usuários' : 'Meu Perfil'}
                    </h2>
                    
                    {/* Add/Edit Form */}
                    <div className="bg-[#202020] rounded-lg border border-[#333] p-6 mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            {editingUserId ? <Edit2 size={16} /> : <UserPlus size={16} />} 
                            {editingUserId ? (currentUser.role === 'admin' ? 'Editar Usuário' : 'Editar Meus Dados') : 'Registrar Novo Usuário'}
                        </h3>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-[auto_1fr_1fr] gap-6">
                            
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-24 h-24 rounded-full bg-[#151515] border-2 border-[#333] flex items-center justify-center text-4xl overflow-hidden relative group">
                                    {isUploading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    ) : (
                                        avatar.match(/^(http|data:)/) ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            avatar
                                        )
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                        <Camera size={24} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex gap-2 relative">
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-[#333] hover:bg-[#444] rounded-full text-white transition-colors"
                                        title="Carregar Foto"
                                    >
                                        <Upload size={14} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`p-2 rounded-full text-white transition-colors ${showEmojiPicker ? 'bg-blue-600' : 'bg-[#333] hover:bg-[#444]'}`}
                                        title="Escolher Emoji"
                                    >
                                        <Smile size={14} />
                                    </button>
                                    
                                    {/* Emoji Picker Dropdown */}
                                    {showEmojiPicker && (
                                        <div className="absolute top-10 left-0 z-50 bg-[#2C2C2C] border border-[#444] rounded-lg p-2 shadow-2xl w-48 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="grid grid-cols-5 gap-1">
                                                {EMOJI_PRESETS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => {
                                                            setAvatar(emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#444] text-xl transition-colors"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-[#444]">
                                                <input 
                                                    type="text" 
                                                    placeholder="Outro..." 
                                                    className="w-full bg-[#191919] border border-[#333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                                    maxLength={2}
                                                    onChange={(e) => {
                                                        if(e.target.value) {
                                                            setAvatar(e.target.value);
                                                            // Opcional: fechar ao digitar
                                                            // setShowEmojiPicker(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                <div className="col-span-1 space-y-1">
                                    <label className="text-xs text-notion-muted">Nome Completo</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="ex: João Silva"/>
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-xs text-notion-muted">Usuário</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="ex: joao" disabled={currentUser.role !== 'admin' && editingUserId !== null} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-notion-muted">Endereço de Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="usuario@empresa.com"/>
                                </div>
                                {/* Password Field - Full width for standard users, half for admins (who have Role next to it) */}
                                <div className={`${currentUser.role === 'admin' ? 'col-span-1' : 'col-span-2'} space-y-1`}>
                                    <label className="text-xs text-notion-muted">Senha {editingUserId && "(Em branco para manter)"}</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600" placeholder="••••••"/>
                                </div>
                                
                                {/* Role Field - ONLY VISIBLE TO ADMINS */}
                                {currentUser.role === 'admin' && (
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-xs text-notion-muted">Função</label>
                                        <select 
                                            value={role} 
                                            onChange={e => setRole(e.target.value as UserRole)} 
                                            className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-600"
                                        >
                                            <option value="user">Usuário Padrão</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                )}
                                
                                <div className="col-span-2 flex justify-end gap-2 mt-2">
                                    {editingUserId && currentUser.role === 'admin' && (
                                        <button type="button" onClick={resetForm} className="text-gray-400 hover:text-white px-4 py-2 text-sm">Cancelar</button>
                                    )}
                                    <button 
                                        type="submit" 
                                        disabled={!name || !username || (!editingUserId && !password) || isSubmitting} 
                                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded text-sm font-medium transition-colors shadow-lg flex items-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                        {editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* User List - Only visible to Admins */}
                    {currentUser.role === 'admin' && (
                        <div className="bg-[#202020] rounded-lg border border-[#333] overflow-hidden">
                            {users.map(user => (
                                <div key={user.id} className="p-4 border-b border-[#333] last:border-0 flex items-center justify-between hover:bg-[#252525] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg border border-[#444] overflow-hidden">
                                            {user.avatar.match(/^(http|data:)/) ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : user.avatar}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white flex items-center gap-2">
                                                {user.name} 
                                                {user.role === 'admin' && <span className="text-[10px] bg-blue-900/40 text-blue-300 px-1.5 rounded border border-blue-500/20">ADMIN</span>}
                                            </div>
                                            <div className="text-xs text-gray-500">{user.email || 'Sem email'} • @{user.username}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {deleteConfirmId === user.id ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => onDeleteUser(user.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded">Confirmar</button>
                                                <button onClick={() => setDeleteConfirmId(null)} className="bg-[#333] text-white text-xs px-2 py-1 rounded">Cancelar</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-blue-400"><Edit2 size={16}/></button>
                                                {/* Prevent deleting yourself OR the root admin user */}
                                                {user.id !== currentUserId && user.id !== 'admin' && (
                                                    <button onClick={() => setDeleteConfirmId(user.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: SECURITY --- */}
            {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Segurança e Recuperação</h2>
                    
                    <div className="bg-[#202020] p-6 rounded-lg border border-[#333] mb-6">
                        <div className="flex items-center gap-3 mb-4 text-orange-400">
                            <AlertTriangle size={24} />
                            <h3 className="font-semibold text-white">Recuperação de Senha</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            {currentUser.role === 'admin' 
                                ? 'Envie um link de redefinição de senha para o email registrado de qualquer usuário.'
                                : 'Envie um link de redefinição de senha para o seu email registrado.'}
                        </p>
                        
                        <div className="space-y-4">
                            <label className="text-xs text-notion-muted">
                                {currentUser.role === 'admin' ? 'Selecione o Usuário para Recuperar' : 'Seu Email Registrado'}
                            </label>
                            
                            {currentUser.role === 'admin' ? (
                                <select 
                                    value={recoveryEmail} 
                                    onChange={e => setRecoveryEmail(e.target.value)} 
                                    className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2.5 text-sm text-white outline-none"
                                >
                                    <option value="">Selecione um usuário...</option>
                                    {users.filter(u => u.email).map(u => (
                                        <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="relative opacity-75">
                                    <input 
                                        type="text" 
                                        value={recoveryEmail || 'Email não cadastrado'} 
                                        disabled 
                                        className="w-full bg-[#151515] border border-[#333] rounded px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed outline-none"
                                    />
                                    <Lock size={16} className="absolute right-3 top-2.5 text-gray-600"/>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleSendRecovery}
                                disabled={!recoveryEmail || recoveryStatus !== 'idle'}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium transition-colors ${
                                    recoveryStatus === 'sent' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-[#333] hover:bg-[#444] text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {recoveryStatus === 'idle' && <><Send size={16}/> Enviar Email de Recuperação</>}
                                {recoveryStatus === 'sending' && "Enviando..."}
                                {recoveryStatus === 'sent' && <><Check size={16}/> Enviado com Sucesso</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: APPEARANCE --- */}
            {activeTab === 'appearance' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Aparência do Espaço de Trabalho</h2>

                    <div className="space-y-4">
                        <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-900/20 text-blue-400 rounded">
                                    {appSettings.theme === 'light' ? <Sun size={20}/> : <Moon size={20}/>}
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">Tema do Sistema</h3>
                                    <p className="text-xs text-gray-500">Alternar entre modo claro e escuro.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, theme: appSettings.theme === 'light' ? 'dark' : 'light' })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.theme === 'light' ? 'bg-gray-500' : 'bg-blue-600'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.theme === 'light' ? 'translate-x-0' : 'translate-x-6'}`}></div>
                            </div>
                        </div>

                        <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Layout size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Mostrar Barra Lateral</h3>
                                    <p className="text-xs text-gray-500">Alternar a barra lateral de navegação principal.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, showSidebar: !appSettings.showSidebar })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.showSidebar ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.showSidebar ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        {/* New Sidebar Hover Toggle */}
                        <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MousePointer2 size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Menu Expansível (Hover)</h3>
                                    <p className="text-xs text-gray-500">Abrir a barra lateral ao passar o mouse.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, sidebarHoverBehavior: !appSettings.sidebarHoverBehavior })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.sidebarHoverBehavior ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.sidebarHoverBehavior ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                         <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Eye size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Cabeçalho do Projeto</h3>
                                    <p className="text-xs text-gray-500">Mostrar breadcrumbs e barra de navegação superior.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, showBreadcrumbs: !appSettings.showBreadcrumbs })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.showBreadcrumbs ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.showBreadcrumbs ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        <div className="bg-[#202020] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smile size={20} className="text-gray-400"/>
                                <div>
                                    <h3 className="font-medium text-white">Saudação Inicial</h3>
                                    <p className="text-xs text-gray-500">Mostrar mensagem "Boa Tarde" no painel.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setAppSettings({ ...appSettings, showGreeting: !appSettings.showGreeting })}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.showGreeting ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings.showGreeting ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        {/* RESET BUTTON */}
                        <div className="pt-4 mt-4 border-t border-[#333]">
                            <button
                                onClick={onResetSettings}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium text-red-400 hover:bg-red-900/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-900/30"
                            >
                                <RotateCcw size={16} /> Restaurar Configurações Iniciais
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
