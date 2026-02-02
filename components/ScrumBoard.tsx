
import React, { useState } from 'react';
import { ScrumData, Sprint, Task } from '../types';
import { Plus, CheckCircle, ChevronDown, ChevronRight, Layers, Trash2, Trophy, PlayCircle, RotateCcw } from 'lucide-react';

interface Props {
  data: ScrumData;
  onChange: (newData: ScrumData) => void;
}

interface TaskCardProps {
  task: Task;
  containerType: 'backlog' | 'sprint';
  containerId?: string;
  onDragStart: (e: React.DragEvent, taskId: string, type: 'backlog' | 'sprint', id?: string) => void;
  onUpdatePoints: (task: Task, containerType: 'backlog' | 'sprint', containerId?: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, containerType, containerId, onDragStart, onUpdatePoints }) => (
      <div 
        draggable
        onDragStart={(e) => onDragStart(e, task.id, containerType, containerId)}
        className="bg-[#2C2C2C] p-3 rounded border border-[#333] hover:border-[#555] cursor-grab active:cursor-grabbing flex items-start justify-between group shadow-sm"
      >
          <div className="flex-1">
              <div className="text-gray-200 text-sm mb-1">{task.content}</div>
              <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      task.priority === 'High' ? 'bg-red-900/30 text-red-400 border-red-900/50' : 
                      task.priority === 'Low' ? 'bg-green-900/30 text-green-400 border-green-900/50' : 
                      'bg-blue-900/30 text-blue-400 border-blue-900/50'
                  }`}>
                      {task.priority || 'Medium'}
                  </span>
                  {task.assignee && (
                      <span className="text-[10px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded flex items-center gap-1">
                         {task.assignee}
                      </span>
                  )}
              </div>
          </div>
          <div 
            onClick={() => onUpdatePoints(task, containerType, containerId)}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-[#191919] text-xs text-gray-400 hover:text-white hover:bg-blue-600 transition-colors cursor-pointer border border-[#333]"
            title="Story Points"
          >
              {task.storyPoints || '-'}
          </div>
      </div>
  );

const ScrumBoard: React.FC<Props> = ({ data, onChange }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [sourceContainer, setSourceContainer] = useState<{ type: 'backlog' | 'sprint', id?: string } | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(data.sprints.map(s => s.id)));

  // --- Actions ---

  const addBacklogItem = () => {
    const text = prompt("Digite a História de Usuário / Tarefa:");
    if (!text) return;
    
    const newTask: Task = {
        id: crypto.randomUUID(),
        content: text,
        priority: 'Medium',
        storyPoints: 0
    };

    onChange({
        ...data,
        backlog: [newTask, ...data.backlog]
    });
  };

  const createSprint = () => {
      const number = data.sprints.length + 1;
      const newSprint: Sprint = {
          id: crypto.randomUUID(),
          title: `Sprint ${number}`,
          status: 'planned',
          tasks: []
      };
      onChange({
          ...data,
          sprints: [newSprint, ...data.sprints]
      });
      toggleSprintExpand(newSprint.id, true);
  };

  const startSprint = (sprintId: string) => {
      const newData = { ...data };
      const sprint = newData.sprints.find(s => s.id === sprintId);
      if (sprint) {
          sprint.status = 'active';
          sprint.startDate = new Date().toISOString();
      }
      onChange(newData);
  };

  const completeSprint = (sprintId: string) => {
      if(!confirm("Concluir este sprint? Todas as tarefas serão arquivadas visualmente como concluídas.")) return;
      const newData = { ...data };
      const sprint = newData.sprints.find(s => s.id === sprintId);
      if (sprint) {
          sprint.status = 'completed';
          sprint.endDate = new Date().toISOString();
      }
      onChange(newData);
  };

  const reopenSprint = (sprintId: string) => {
      if(!confirm("Reabrir este sprint e torná-lo ativo novamente?")) return;
      const newData = { ...data };
      const sprint = newData.sprints.find(s => s.id === sprintId);
      if (sprint) {
          sprint.status = 'active';
          delete sprint.endDate;
      }
      onChange(newData);
  };

  const deleteSprint = (sprintId: string) => {
      if(!confirm("Excluir este sprint? As tarefas voltarão para o backlog.")) return;
      const sprint = data.sprints.find(s => s.id === sprintId);
      if(!sprint) return;

      // Move tasks to backlog
      const newBacklog = [...data.backlog, ...sprint.tasks];
      const newSprints = data.sprints.filter(s => s.id !== sprintId);

      onChange({
          backlog: newBacklog,
          sprints: newSprints
      });
  };

  const toggleSprintExpand = (id: string, forceState?: boolean) => {
      const newSet = new Set(expandedSprints);
      if (forceState !== undefined) {
          forceState ? newSet.add(id) : newSet.delete(id);
      } else {
          newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      }
      setExpandedSprints(newSet);
  };

  const updateTaskPoints = (task: Task, containerType: 'backlog' | 'sprint', containerId?: string) => {
      const pointsStr = prompt("Estimar Pontos de História (0, 1, 2, 3, 5, 8, 13):", task.storyPoints?.toString() || "0");
      if (pointsStr === null) return;
      const points = parseInt(pointsStr) || 0;

      const newData = { ...data };
      
      if (containerType === 'backlog') {
          newData.backlog = newData.backlog.map(t => t.id === task.id ? { ...t, storyPoints: points } : t);
      } else if (containerType === 'sprint' && containerId) {
          const sprint = newData.sprints.find(s => s.id === containerId);
          if (sprint) {
              sprint.tasks = sprint.tasks.map(t => t.id === task.id ? { ...t, storyPoints: points } : t);
          }
      }
      onChange(newData);
  };

  // --- DnD Handlers ---

  const handleDragStart = (e: React.DragEvent, taskId: string, type: 'backlog' | 'sprint', id?: string) => {
      setDraggedTaskId(taskId);
      setSourceContainer({ type, id });
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetType: 'backlog' | 'sprint', targetId?: string) => {
      e.preventDefault();
      if (!draggedTaskId || !sourceContainer) return;

      // Deep copy
      const newData = JSON.parse(JSON.stringify(data)) as ScrumData;
      
      // Find and remove task from source
      let task: Task | undefined;
      
      if (sourceContainer.type === 'backlog') {
          const idx = newData.backlog.findIndex(t => t.id === draggedTaskId);
          if (idx > -1) task = newData.backlog.splice(idx, 1)[0];
      } else if (sourceContainer.type === 'sprint' && sourceContainer.id) {
          const sprint = newData.sprints.find(s => s.id === sourceContainer.id);
          if (sprint) {
              const idx = sprint.tasks.findIndex(t => t.id === draggedTaskId);
              if (idx > -1) task = sprint.tasks.splice(idx, 1)[0];
          }
      }

      if (!task) return;

      // Add to target
      if (targetType === 'backlog') {
          newData.backlog.push(task);
      } else if (targetType === 'sprint' && targetId) {
          const sprint = newData.sprints.find(s => s.id === targetId);
          if (sprint) {
              sprint.tasks.push(task);
          }
      }

      onChange(newData);
      setDraggedTaskId(null);
      setSourceContainer(null);
  };

  return (
    <div className="h-full flex gap-6 p-4 overflow-hidden">
        {/* BACKLOG COLUMN */}
        <div className="flex-1 flex flex-col min-w-[300px] max-w-[400px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Layers size={20} className="text-gray-400"/> Backlog 
                    <span className="text-xs font-normal text-notion-muted bg-[#2C2C2C] px-2 py-0.5 rounded-full">{data.backlog.length}</span>
                </h3>
                <button onClick={addBacklogItem} className="p-1 hover:bg-[#333] rounded text-notion-muted hover:text-white">
                    <Plus size={20} />
                </button>
            </div>
            
            <div 
                className="flex-1 overflow-y-auto bg-[#202020]/50 rounded-lg border border-[#333] p-2 space-y-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'backlog')}
            >
                {data.backlog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-notion-muted text-sm italic">
                        <span>O backlog está vazio</span>
                        <span className="text-xs opacity-50">Gere com IA ou adicione manualmente</span>
                    </div>
                ) : (
                    data.backlog.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            containerType="backlog"
                            onDragStart={handleDragStart}
                            onUpdatePoints={updateTaskPoints} 
                        />
                    ))
                )}
            </div>
        </div>

        {/* SPRINTS AREA */}
        <div className="flex-[2] flex flex-col min-w-[400px]">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-500"/> Sprints
                </h3>
                <button 
                    onClick={createSprint}
                    className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
                >
                    <Plus size={14} /> Criar Sprint
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {data.sprints.length === 0 && (
                    <div className="text-center py-20 text-notion-muted border border-dashed border-[#333] rounded-lg">
                        <Trophy size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Nenhum sprint criado ainda.</p>
                        <button onClick={createSprint} className="text-blue-500 hover:underline mt-2 text-sm">Inicie seu primeiro sprint</button>
                    </div>
                )}

                {data.sprints.map(sprint => (
                    <div 
                        key={sprint.id} 
                        className={`rounded-lg border transition-all ${
                            sprint.status === 'active' ? 'bg-[#1e293b] border-blue-900/50' : 
                            sprint.status === 'completed' ? 'bg-[#202020] border-[#333] opacity-60' : 'bg-[#202020] border-[#333]'
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'sprint', sprint.id)}
                    >
                        {/* Sprint Header */}
                        <div className="p-3 flex items-center justify-between select-none">
                            <div 
                                className="flex items-center gap-3 cursor-pointer flex-1"
                                onClick={() => toggleSprintExpand(sprint.id)}
                            >
                                <div className="text-notion-muted hover:text-white">
                                    {expandedSprints.has(sprint.id) ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        {sprint.title}
                                        {sprint.status === 'active' && <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded font-bold uppercase tracking-wider">Ativo</span>}
                                        {sprint.status === 'completed' && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded border border-green-500/30">Concluído</span>}
                                    </div>
                                    <div className="text-xs text-notion-muted flex items-center gap-2 mt-0.5">
                                        <span>{sprint.tasks.length} itens</span>
                                        <span>•</span>
                                        <span>{sprint.tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {sprint.status === 'planned' && (
                                    <>
                                        <button onClick={() => deleteSprint(sprint.id)} className="p-1.5 text-notion-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Excluir Sprint">
                                            <Trash2 size={14}/>
                                        </button>
                                        <button 
                                            onClick={() => startSprint(sprint.id)}
                                            className="text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded border border-white/10"
                                        >
                                            <PlayCircle size={12}/> Iniciar
                                        </button>
                                    </>
                                )}
                                {sprint.status === 'active' && (
                                     <button 
                                        onClick={() => completeSprint(sprint.id)}
                                        className="text-xs flex items-center gap-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 px-2 py-1 rounded border border-green-500/30"
                                    >
                                        <CheckCircle size={12}/> Concluir
                                    </button>
                                )}
                                {sprint.status === 'completed' && (
                                     <button 
                                        onClick={() => reopenSprint(sprint.id)}
                                        className="text-xs flex items-center gap-1 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 px-2 py-1 rounded border border-orange-500/30"
                                        title="Reabrir Sprint e tornar ativo"
                                    >
                                        <RotateCcw size={12}/> Reabrir
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sprint Content */}
                        {expandedSprints.has(sprint.id) && (
                            <div className="px-3 pb-3 pt-0">
                                <div className="min-h-[60px] bg-black/20 rounded border border-black/10 p-2 space-y-1">
                                    {sprint.tasks.length === 0 ? (
                                        <div className="text-xs text-notion-muted text-center py-4">Arraste itens do backlog para cá</div>
                                    ) : (
                                        sprint.tasks.map(task => (
                                            <TaskCard 
                                                key={task.id} 
                                                task={task} 
                                                containerType="sprint" 
                                                containerId={sprint.id} 
                                                onDragStart={handleDragStart}
                                                onUpdatePoints={updateTaskPoints}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ScrumBoard;
