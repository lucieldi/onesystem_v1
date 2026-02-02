import React, { useState, useEffect, useRef } from 'react';
import { KanbanColumn, Task, Attachment, Tag, User } from '../types';
import { Plus, X, MoreHorizontal, AlignLeft, Calendar, User as UserIcon, Clock, Trash2, Smile, Palette, Paperclip, File as FileIcon, Check, GripVertical, Edit2, Tag as TagIcon, Image as ImageIcon, Upload, Loader2, FileText, Download } from 'lucide-react';
import { fileService } from '../services/fileService';

interface Props {
  data: KanbanColumn[];
  onChange: (newData: KanbanColumn[]) => void;
  currentUser: User | null;
}

interface TaskModalProps {
  task: Task;
  columnTitle: string;
  onClose: (updatedTask: Task) => void;
  onDelete: () => void;
}

const COLUMN_COLORS = [
    'transparent',
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
];

const TAG_COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#1F2937', // Dark
];

const PRESET_TICKETS = [
    { text: 'Bug', color: '#EF4444' },
    { text: 'Feature', color: '#3B82F6' },
    { text: 'Urgente', color: '#EC4899' },
    { text: 'Design', color: '#8B5CF6' },
    { text: 'Dev', color: '#10B981' },
    { text: 'Marketing', color: '#F59E0B' },
];

const TaskModal: React.FC<TaskModalProps> = ({ task, columnTitle, onClose, onDelete }) => {
  const [content, setContent] = useState(task.content);
  const [desc, setDesc] = useState(task.description || '');
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [icon, setIcon] = useState(task.icon || '');
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || []);
  const [documents, setDocuments] = useState<Attachment[]>(task.documents || []);
  const [tags, setTags] = useState<Tag[]>(task.tags || []);
  
  // Tag creation state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[3]);

  // Loading States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Avatar Menu state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onClose({
      ...task,
      content,
      description: desc,
      assignee,
      dueDate,
      icon,
      attachments,
      documents,
      tags
    });
  };

  const handleEmojiSelect = () => {
      const newIcon = prompt("Digite um emoji para esta tarefa:", typeof icon === 'string' && !icon.startsWith('data:') && !icon.startsWith('http') ? icon : '📄');
      if (newIcon) setIcon(newIcon);
      setShowAvatarMenu(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploadingAvatar(true);
          try {
              const result = await fileService.uploadFile(file);
              setIcon(result.url);
          } catch (err) {
              console.error(err);
              alert("Erro ao carregar imagem");
          } finally {
              setIsUploadingAvatar(false);
              setShowAvatarMenu(false);
          }
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingFile(true);
      try {
          const result = await fileService.uploadFile(file);
          const newAttachment: Attachment = {
             id: crypto.randomUUID(),
             name: result.name,
             url: result.url,
             type: result.type
          };
          setAttachments([...attachments, newAttachment]);
      } catch (err) {
          console.error(err);
          alert("Erro ao enviar arquivo");
      } finally {
          setIsUploadingFile(false);
      }
    }
    e.target.value = '';
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingDoc(true);
      try {
          // Pass 'documents' as the folder parameter to store in backend/data/documents
          const result = await fileService.uploadFile(file, 'documents');
          const newDoc: Attachment = {
             id: crypto.randomUUID(),
             name: result.name,
             url: result.url,
             type: result.type
          };
          setDocuments([...documents, newDoc]);
      } catch (err) {
          console.error(err);
          alert("Erro ao enviar documento");
      } finally {
          setIsUploadingDoc(false);
      }
    }
    e.target.value = '';
  };

  const handleAddTag = () => {
      if (newTagText.trim()) {
          const newTag: Tag = {
              id: crypto.randomUUID(),
              text: newTagText,
              color: newTagColor
          };
          setTags([...tags, newTag]);
          setNewTagText('');
          setIsAddingTag(false);
      }
  };

  const handleAddPresetTag = (preset: { text: string, color: string }) => {
      const newTag: Tag = {
          id: crypto.randomUUID(),
          text: preset.text,
          color: preset.color
      };
      setTags([...tags, newTag]);
      setIsAddingTag(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" 
      onClick={handleClose}
    >
      <div 
        className="bg-[#202020] w-[650px] max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#333] animate-in fade-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image Area */}
        <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900 w-full relative group shrink-0">
            <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1 rounded-md transition-colors">
                 <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
             <div className="px-8 pb-8">
                 {/* Icon - Overlapping Banner */}
                 <div className="-mt-9 mb-4 relative">
                     <button 
                        onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                        disabled={isUploadingAvatar}
                        className="text-5xl flex items-center justify-center w-[72px] h-[72px] bg-[#202020] hover:bg-[#2C2C2C] rounded-md transition-colors cursor-pointer select-none shadow-sm group border border-transparent hover:border-[#444] overflow-hidden"
                     >
                         {isUploadingAvatar ? (
                             <Loader2 size={32} className="animate-spin text-blue-500" />
                         ) : icon && (icon.startsWith('data:') || icon.startsWith('http')) ? (
                             <img src={icon} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                             icon ? icon : <span className="text-notion-muted opacity-50 group-hover:opacity-100"><Smile size={32}/></span>
                         )}
                     </button>

                     {/* Avatar Context Menu */}
                     {showAvatarMenu && (
                         <div className="absolute top-20 left-0 bg-[#2C2C2C] border border-[#444] rounded shadow-xl p-1 z-50 w-40 flex flex-col gap-1">
                             <button onClick={handleEmojiSelect} className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-[#333] hover:text-white rounded text-left">
                                 <Smile size={14}/> Usar Emoji
                             </button>
                             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-[#333] hover:text-white rounded text-left">
                                 <ImageIcon size={14}/> Carregar Foto
                             </button>
                         </div>
                     )}
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                     />
                 </div>

                 {/* Title */}
                 <div className="mb-6">
                     <input 
                        className="text-3xl font-bold bg-transparent border-none outline-none w-full text-white placeholder-gray-500"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Título da Tarefa"
                     />
                     <div className="text-sm text-notion-muted mt-2 flex items-center gap-2">
                        na lista <span className="bg-[#2C2C2C] px-1.5 py-0.5 rounded text-gray-300 text-xs">{columnTitle}</span>
                     </div>
                 </div>
                 
                 {/* Properties Grid */}
                 <div className="grid grid-cols-[140px_1fr] gap-y-5 mb-8">
                     {/* Assignee */}
                     <div className="text-sm text-notion-muted flex items-center gap-2">
                         <UserIcon size={16} /> Responsável
                     </div>
                     <div className="">
                         <input 
                            className="bg-transparent hover:bg-[#2C2C2C] rounded px-2 py-1 -ml-2 border-none outline-none text-sm text-gray-200 w-full cursor-pointer transition-colors placeholder-gray-600" 
                            placeholder="Vazio"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                         />
                     </div>

                     {/* Due Date */}
                     <div className="text-sm text-notion-muted flex items-center gap-2">
                         <Calendar size={16} /> Prazo
                     </div>
                     <div className="">
                         <input 
                            type="date"
                            className="bg-transparent hover:bg-[#2C2C2C] rounded px-2 py-1 -ml-2 border-none outline-none text-sm text-gray-200 cursor-pointer color-scheme-dark transition-colors" 
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                         />
                     </div>

                     {/* Labels / Tags */}
                     <div className="text-sm text-notion-muted flex items-center gap-2 pt-1 self-start">
                         <TagIcon size={16} /> Etiquetas
                     </div>
                     <div className="flex flex-col gap-2">
                         <div className="flex flex-wrap gap-2 items-center">
                             {tags.map(tag => (
                                 <div 
                                    key={tag.id} 
                                    className="px-2.5 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1.5 group shadow-sm border border-white/5 uppercase tracking-wide"
                                    style={{ backgroundColor: tag.color }}
                                 >
                                     {tag.text}
                                     <button 
                                        onClick={() => setTags(tags.filter(t => t.id !== tag.id))}
                                        className="opacity-0 group-hover:opacity-100 hover:text-black/50 transition-opacity"
                                     >
                                         <X size={12} />
                                     </button>
                                 </div>
                             ))}
                             
                             {!isAddingTag && (
                                 <button 
                                    onClick={() => setIsAddingTag(true)}
                                    className="text-xs text-notion-muted hover:text-white bg-[#2C2C2C] hover:bg-[#333] px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                 >
                                     <Plus size={12} /> Adicionar
                                 </button>
                             )}
                         </div>

                         {isAddingTag && (
                             <div className="bg-[#2C2C2C] border border-[#444] rounded p-3 animate-in slide-in-from-top-2">
                                 <div className="flex items-center gap-2 mb-3">
                                     <input 
                                        className="bg-[#191919] border border-[#333] rounded px-2 py-1 text-sm text-white outline-none w-full"
                                        placeholder="Nome da etiqueta..."
                                        value={newTagText}
                                        onChange={e => setNewTagText(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                     />
                                     <button onClick={handleAddTag} className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded"><Check size={14}/></button>
                                     <button onClick={() => setIsAddingTag(false)} className="bg-[#333] hover:bg-[#444] text-white p-1.5 rounded"><X size={14}/></button>
                                 </div>
                                 <div className="flex gap-2 flex-wrap mb-3">
                                     {TAG_COLORS.map(c => (
                                         <div 
                                            key={c} 
                                            onClick={() => setNewTagColor(c)}
                                            className={`w-5 h-5 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${newTagColor === c ? 'border-white' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                         />
                                     ))}
                                 </div>
                                 <div className="text-[10px] text-notion-muted mb-2 uppercase font-semibold">Sugestões</div>
                                 <div className="flex flex-wrap gap-2">
                                     {PRESET_TICKETS.map(preset => (
                                         <button
                                            key={preset.text}
                                            onClick={() => handleAddPresetTag(preset)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white/90 hover:text-white border border-white/10 hover:border-white/30 transition-colors uppercase tracking-wide"
                                            style={{ backgroundColor: preset.color }} 
                                         >
                                             {preset.text}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         )}
                     </div>


                     {/* Attachments */}
                     <div className="text-sm text-notion-muted flex items-center gap-2 pt-1 self-start">
                         <Paperclip size={16} /> Anexos
                     </div>
                     <div className="">
                        <div className="flex flex-wrap gap-2">
                            {attachments.map(att => (
                                <div key={att.id} className="group relative w-20 h-20 bg-[#2C2C2C] border border-[#333] rounded-md overflow-hidden flex flex-col items-center justify-center hover:bg-[#333] transition-colors cursor-pointer" title={att.name}>
                                    {att.type === 'image' ? (
                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-2 text-center w-full h-full">
                                            <FileIcon size={20} className="text-gray-400 mb-1" />
                                            <span className="text-[9px] text-gray-500 truncate w-full px-1">{att.name}</span>
                                        </div>
                                    )}
                                    {/* Delete Button Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setAttachments(attachments.filter(a => a.id !== att.id)); }}
                                            className="text-white hover:text-red-400 p-1"
                                            title="Remover anexo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <a 
                                        href={att.url} 
                                        download={att.name}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-white bg-black/50 rounded p-0.5 hover:bg-black/80 z-20"
                                        title="Baixar / Abrir"
                                    >
                                        <Download size={10} />
                                    </a>
                                </div>
                            ))}
                            <label className={`w-20 h-20 border border-dashed border-[#444] rounded-md flex flex-col items-center justify-center text-notion-muted hover:text-white hover:bg-[#2C2C2C] hover:border-gray-500 cursor-pointer transition-all ${isUploadingFile ? 'opacity-50 cursor-wait' : ''}`}>
                                {isUploadingFile ? (
                                    <Loader2 size={20} className="animate-spin mb-1"/>
                                ) : (
                                    <Plus size={20} className="mb-1 opacity-50"/>
                                )}
                                <span className="text-[10px] opacity-70">{isUploadingFile ? 'Enviando' : 'Adic.'}</span>
                                <input type="file" className="hidden" onChange={handleFileSelect} disabled={isUploadingFile} />
                            </label>
                        </div>
                     </div>

                     {/* Documents Submission Section */}
                     <div className="text-sm text-notion-muted flex items-center gap-2 pt-1 self-start">
                         <FileText size={16} /> Envio de Documentos
                     </div>
                     <div className="">
                        <div className="flex flex-col gap-2">
                             {documents.map(doc => (
                                 <div key={doc.id} className="flex items-center justify-between p-2 bg-[#2C2C2C] border border-[#333] rounded hover:border-[#555] group transition-colors">
                                     <div className="flex items-center gap-3 overflow-hidden">
                                         <div className="w-8 h-8 bg-[#202020] rounded flex items-center justify-center shrink-0 text-blue-400">
                                             <FileText size={16} />
                                         </div>
                                         <div className="flex flex-col min-w-0">
                                             <span className="text-xs font-medium text-gray-200 truncate pr-2">{doc.name}</span>
                                             <span className="text-[10px] text-gray-500">Documento Enviado</span>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-1">
                                         <a 
                                            href={doc.url} 
                                            download={doc.name}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                                            title="Baixar"
                                         >
                                             <Download size={14} />
                                         </a>
                                         <button 
                                            onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 </div>
                             ))}
                             
                             <label className={`flex items-center justify-center gap-2 p-2 border border-dashed border-[#444] rounded text-notion-muted hover:text-white hover:bg-[#2C2C2C] hover:border-gray-500 cursor-pointer transition-all w-full ${isUploadingDoc ? 'opacity-50 cursor-wait' : ''}`}>
                                 {isUploadingDoc ? (
                                     <Loader2 size={16} className="animate-spin"/>
                                 ) : (
                                     <Upload size={16} />
                                 )}
                                 <span className="text-xs w-full text-center">{isUploadingDoc ? 'Enviando ao Servidor...' : 'Enviar Documento'}</span>
                                 <input type="file" className="hidden" onChange={handleDocumentUpload} disabled={isUploadingDoc} />
                             </label>
                        </div>
                     </div>

                 </div>

                 <div className="h-[1px] bg-[#333] w-full mb-8"></div>

                 {/* Description */}
                 <div className="mb-8">
                      <div className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                          <AlignLeft size={20} />
                          <h3>Descrição</h3>
                      </div>
                      <textarea
                        className="w-full min-h-[200px] bg-[#2C2C2C] rounded-md p-4 text-sm text-gray-200 outline-none resize-none focus:ring-1 focus:ring-notion-muted/50 border border-transparent placeholder-gray-500 leading-relaxed"
                        placeholder="Adicione uma descrição mais detalhada..."
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                      />
                 </div>
                 
                 {/* Actions */}
                 <div className="flex justify-end pt-4">
                     <button 
                        onClick={onDelete}
                        className="flex items-center gap-2 text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded text-sm transition-colors"
                     >
                         <Trash2 size={14} /> Excluir Tarefa
                     </button>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<Props> = ({ data, onChange, currentUser }) => {
  const [draggedItem, setDraggedItem] = useState<{ taskId: string, colId: string } | null>(null);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ colId: string, task: Task } | null>(null);
  const [openColorMenu, setOpenColorMenu] = useState<string | null>(null);
  
  // Quick Add State (Tasks)
  const [addingColumnId, setAddingColumnId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  // Quick Add State (Columns)
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Editing Column Title State
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [tempColumnTitle, setTempColumnTitle] = useState('');

  // --- Task DnD ---
  const handleTaskDragStart = (e: React.DragEvent, taskId: string, colId: string) => {
    e.stopPropagation(); // Prevent column dragging
    setDraggedItem({ taskId, colId });
  };

  // --- Column DnD ---
  const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColId: string, targetTaskId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Column Reordering
    if (draggedColId) {
        if (draggedColId === targetColId) {
            setDraggedColId(null);
            return;
        }

        const oldIndex = data.findIndex(c => c.id === draggedColId);
        const newIndex = data.findIndex(c => c.id === targetColId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newData = [...data];
        const [movedCol] = newData.splice(oldIndex, 1);
        newData.splice(newIndex, 0, movedCol);
        
        onChange(newData);
        setDraggedColId(null);
        return;
    }

    // 2. Task Moving
    if (draggedItem) {
        const sourceColIndex = data.findIndex(c => c.id === draggedItem.colId);
        const targetColIndex = data.findIndex(c => c.id === targetColId);

        if (sourceColIndex === -1 || targetColIndex === -1) return;

        const newData = [...data];
        
        // Use separate copies for source/target to modify tasks array safely
        const sourceCol = { ...newData[sourceColIndex], tasks: [...newData[sourceColIndex].tasks] };
        // If same column, targetCol is the same object reference (sourceCol), else clone target
        let targetCol = sourceColIndex === targetColIndex 
             ? sourceCol 
             : { ...newData[targetColIndex], tasks: [...newData[targetColIndex].tasks] };

        const taskIndex = sourceCol.tasks.findIndex(t => t.id === draggedItem.taskId);
        if (taskIndex === -1) return;
        
        const [task] = sourceCol.tasks.splice(taskIndex, 1);

        if (targetTaskId) {
            // Reordering / Inserting at specific position
            // We use IDs to find insertion index in the array (which already had the item removed if same column)
            const insertIndex = targetCol.tasks.findIndex(t => t.id === targetTaskId);
            if (insertIndex !== -1) {
                targetCol.tasks.splice(insertIndex, 0, task);
            } else {
                targetCol.tasks.push(task); // Fallback
            }
        } else {
             // Append to column
             targetCol.tasks.push(task);
        }

        newData[sourceColIndex] = sourceCol;
        if (sourceColIndex !== targetColIndex) {
            newData[targetColIndex] = targetCol;
        }

        onChange(newData);
        setDraggedItem(null);
    }
  };

  const confirmAddTask = () => {
    if (!addingColumnId || !newItemText.trim()) {
        setAddingColumnId(null);
        return;
    }
    
    // Auto-assign to current user if available
    const assignee = currentUser ? currentUser.name : '';

    const newData = data.map(col => {
      if (col.id === addingColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, { id: crypto.randomUUID(), content: newItemText, assignee }]
        };
      }
      return col;
    });
    onChange(newData);
    setNewItemText('');
    // Optional: Keep input open for rapid entry
    // setAddingColumnId(null); 
  };

  const confirmAddColumn = () => {
    if (!newColumnTitle.trim()) {
        setIsAddingColumn(false);
        return;
    }
    const newColumn: KanbanColumn = {
        id: crypto.randomUUID(),
        title: newColumnTitle,
        tasks: [],
        color: 'transparent'
    };
    onChange([...data, newColumn]);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const removeTask = (colId: string, taskId: string) => {
     const newData = data.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: col.tasks.filter(t => t.id !== taskId)
        };
      }
      return col;
    });
    onChange(newData);
  };

  const updateTask = (colId: string, updatedTask: Task) => {
    const newData = data.map(col => {
        if (col.id === colId) {
            return {
                ...col,
                tasks: col.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
            };
        }
        return col;
    });
    onChange(newData);
  };

  const updateColumnColor = (colId: string, color: string) => {
      const newData = data.map(col => {
          if (col.id === colId) {
              return { ...col, color };
          }
          return col;
      });
      onChange(newData);
      setOpenColorMenu(null);
  };

  // --- Column Edit & Delete ---

  const handleDeleteColumn = (colId: string) => {
      if(confirm('Tem certeza que deseja excluir esta coluna e todas as suas tarefas?')) {
          const newData = data.filter(c => c.id !== colId);
          onChange(newData);
          setOpenColorMenu(null);
      }
  };

  const handleStartEditColumn = (col: KanbanColumn) => {
      setEditingColumnId(col.id);
      setTempColumnTitle(col.title);
      setOpenColorMenu(null);
  };

  const handleSaveColumnTitle = () => {
      if (editingColumnId && tempColumnTitle.trim()) {
          const newData = data.map(c => c.id === editingColumnId ? { ...c, title: tempColumnTitle } : c);
          onChange(newData);
      }
      setEditingColumnId(null);
      setTempColumnTitle('');
  };

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto pb-4 h-full items-start">
        {data.map(column => (
          <div 
            key={column.id}
            draggable={!addingColumnId && !editingColumnId} // Only draggable if not editing
            onDragStart={(e) => handleColumnDragStart(e, column.id)}
            className={`min-w-[280px] w-[280px] rounded-md flex flex-col max-h-full border border-[#333] transition-all relative ${draggedColId === column.id ? 'opacity-50 cursor-grabbing' : ''}`}
            style={{ backgroundColor: '#202020e6' }} // Slight transparency for background
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Color Strip if colored */}
            <div 
                className="h-1 w-full rounded-t-md"
                style={{ backgroundColor: column.color === 'transparent' ? 'transparent' : column.color }}
            />

            <div className="p-3 flex justify-between items-center border-b border-[#333] cursor-grab active:cursor-grabbing">
              <div className="flex-1 flex items-center gap-2">
                 <div 
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: column.color && column.color !== 'transparent' ? column.color : '#2383E2' }}
                 ></div>
                 
                 {editingColumnId === column.id ? (
                     <input 
                        autoFocus
                        className="font-semibold text-sm text-white bg-[#191919] border border-blue-500 rounded px-1 py-0.5 outline-none w-full"
                        value={tempColumnTitle}
                        onChange={e => setTempColumnTitle(e.target.value)}
                        onBlur={handleSaveColumnTitle}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveColumnTitle();
                            if (e.key === 'Escape') setEditingColumnId(null);
                        }}
                     />
                 ) : (
                    <h3 className="font-semibold text-sm text-gray-300 select-none truncate" title={column.title}>
                        {column.title} 
                        <span className="text-notion-muted font-normal ml-1 text-xs">({column.tasks.length})</span>
                    </h3>
                 )}
              </div>
              
              <div className="flex gap-1 text-notion-muted cursor-pointer hover:text-white relative shrink-0">
                  <Plus size={16} onClick={(e) => { e.stopPropagation(); setAddingColumnId(column.id); setNewItemText(''); }}/>
                  <div onClick={(e) => { e.stopPropagation(); setOpenColorMenu(openColorMenu === column.id ? null : column.id); }}>
                      <MoreHorizontal size={16} />
                  </div>
                  
                  {/* Column Menu */}
                  {openColorMenu === column.id && (
                      <div className="absolute top-6 left-0 z-20 bg-[#2C2C2C] border border-[#444] rounded shadow-xl p-2 min-w-[140px] cursor-default" onClick={e => e.stopPropagation()}>
                          <div className="text-xs text-notion-muted mb-2 font-semibold">COR DO CABEÇALHO</div>
                          <div className="flex gap-1 flex-wrap w-[120px] mb-3">
                              {COLUMN_COLORS.map(c => (
                                  <div 
                                    key={c}
                                    onClick={(e) => { e.stopPropagation(); updateColumnColor(column.id, c); }}
                                    className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform border border-white/10"
                                    style={{ backgroundColor: c === 'transparent' ? '#333' : c }}
                                    title={c}
                                  >
                                      {c === 'transparent' && <div className="w-full h-full flex items-center justify-center text-[8px] text-white">/</div>}
                                  </div>
                              ))}
                          </div>
                          
                          <div className="h-[1px] bg-[#444] my-2"></div>
                          
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleStartEditColumn(column); }}
                             className="w-full text-left flex items-center gap-2 text-xs text-notion-muted hover:text-white hover:bg-[#333] p-1.5 rounded transition-colors"
                          >
                              <Edit2 size={12} /> Renomear
                          </button>
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteColumn(column.id); }}
                             className="w-full text-left flex items-center gap-2 text-xs text-red-400 hover:bg-red-900/20 p-1.5 rounded transition-colors"
                          >
                              <Trash2 size={12} /> Excluir
                          </button>
                      </div>
                  )}
              </div>
            </div>

            <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-[100px] cursor-default">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleTaskDragStart(e, task.id, column.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id, task.id)}
                  onClick={() => setEditingTask({ colId: column.id, task })}
                  className="bg-notion-card p-3 rounded shadow-sm hover:bg-notion-hover cursor-pointer active:cursor-grabbing border border-transparent hover:border-[#444] group relative"
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                      {task.tags?.map(tag => (
                          <span 
                            key={tag.id} 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm border border-black/10 truncate max-w-[120px] uppercase tracking-wide" 
                            style={{ backgroundColor: tag.color }} 
                          >
                              {tag.text}
                          </span>
                      ))}
                  </div>

                  <div className="flex items-start gap-2 mb-1">
                      {task.icon && (
                          task.icon.startsWith('data:') || task.icon.startsWith('http') ? (
                              <img src={task.icon} className="w-4 h-4 rounded object-cover mt-0.5 shrink-0" alt="" />
                          ) : (
                              <span className="text-base leading-snug">{task.icon}</span>
                          )
                      )}
                      <span className="text-sm text-gray-200 leading-snug break-words">{task.content}</span>
                  </div>
                  
                  {/* Task Metadata Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.description && (
                        <div className="text-notion-muted" title="Possui descrição">
                             <AlignLeft size={14} />
                        </div>
                    )}
                    {task.documents && task.documents.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-300 bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/20" title={`${task.documents.length} documentos enviados`}>
                             <FileText size={11} />
                             {task.documents.length}
                        </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded" title={`${task.attachments.length} anexos`}>
                             <Paperclip size={11} />
                             {task.attachments.length}
                        </div>
                    )}
                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded">
                             <Clock size={11} /> 
                             {new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </div>
                    )}
                    {task.assignee && (
                        <div className="flex items-center gap-1 text-[11px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded ml-auto">
                             <UserIcon size={11} />
                             <span className="max-w-[60px] truncate">{task.assignee}</span>
                        </div>
                    )}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTask(column.id, task.id); }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-notion-muted hover:text-red-400 transition-opacity p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {column.tasks.length === 0 && !addingColumnId && (
                  <div className="text-xs text-notion-muted text-center py-4 italic">Solte itens aqui</div>
              )}
            </div>
            
             {addingColumnId === column.id ? (
                 <div className="p-2 m-2 mt-0 bg-[#2C2C2C] rounded border border-blue-500 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                     <input
                        autoFocus
                        className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500 mb-2"
                        placeholder="Digite o título da tarefa..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmAddTask();
                            if (e.key === 'Escape') setAddingColumnId(null);
                        }}
                     />
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={confirmAddTask}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors"
                         >
                             Adicionar
                         </button>
                         <button 
                            onClick={() => setAddingColumnId(null)}
                            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                         >
                             <X size={14}/>
                         </button>
                     </div>
                 </div>
             ) : (
                <div 
                    onClick={() => { setAddingColumnId(column.id); setNewItemText(''); }}
                    className="p-2 m-2 mt-0 text-notion-muted hover:bg-notion-hover rounded cursor-pointer text-sm flex items-center gap-2 transition-colors"
                >
                    <Plus size={14}/> Novo
                </div>
             )}
          </div>
        ))}

        {/* Add Column Section */}
         {isAddingColumn ? (
             <div className="min-w-[280px] w-[280px] p-3 bg-[#2C2C2C] rounded-md border border-blue-500 shadow-lg animate-in fade-in zoom-in-95 duration-200 h-fit shrink-0">
                 <input
                    autoFocus
                    className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500 mb-2 font-semibold"
                    placeholder="Título da coluna..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmAddColumn();
                        if (e.key === 'Escape') setIsAddingColumn(false);
                    }}
                 />
                 <div className="flex items-center gap-2">
                     <button 
                        onClick={confirmAddColumn}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors"
                     >
                         Adicionar
                     </button>
                     <button 
                        onClick={() => setIsAddingColumn(false)}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                     >
                         <X size={14}/>
                     </button>
                 </div>
             </div>
        ) : (
            <div 
                onClick={() => { setIsAddingColumn(true); setNewColumnTitle(''); }}
                className="min-w-[280px] h-[50px] border border-dashed border-[#444] rounded-md flex items-center justify-center text-notion-muted cursor-pointer hover:bg-notion-hover/50 bg-[#202020]/50 shrink-0"
            >
                <Plus size={16} className="mr-2"/> Adicionar Coluna
            </div>
        )}
      </div>

      {editingTask && (
        <TaskModal 
            task={editingTask.task} 
            columnTitle={data.find(c => c.id === editingTask.colId)?.title || ''}
            onClose={(updated) => {
                updateTask(editingTask.colId, updated);
                setEditingTask(null);
            }}
            onDelete={() => {
                removeTask(editingTask.colId, editingTask.task.id);
                setEditingTask(null);
            }}
        />
      )}
    </>
  );
};

export default KanbanBoard;