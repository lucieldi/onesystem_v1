export enum ViewType {
  DOCUMENT = 'DOCUMENT',
  KANBAN = 'KANBAN',
  ISHIKAWA = 'ISHIKAWA',
  SCRUM = 'SCRUM'
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar: string;
}

export interface AppSettings {
  showSidebar: boolean;
  showBreadcrumbs: boolean;
  showGreeting: boolean;
  sidebarHoverBehavior: boolean;
  theme: 'light' | 'dark';
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface Tag {
  id: string;
  text: string;
  color: string;
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  icon?: string;
  tags?: Tag[];
  attachments?: Attachment[];
  documents?: Attachment[];
  storyPoints?: number;
  priority?: 'Low' | 'Medium' | 'High';
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

export interface IshikawaCategory {
  name: string;
  causes: string[];
}

export interface IshikawaData {
  effect: string;
  categories: IshikawaCategory[];
}

export interface Sprint {
  id: string;
  title: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  tasks: Task[];
}

export interface ScrumData {
  backlog: Task[];
  sprints: Sprint[];
}

export interface Project {
  id: string;
  title: string;
  icon: string;
  updatedAt: Date;
  content: string;
  kanbanData: KanbanColumn[];
  ishikawaData: IshikawaData;
  scrumData: ScrumData;
  cover?: string;
  coverText?: string;
  theme?: string;
  status: 'active' | 'completed';
  createdBy?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'Hardware' | 'Software' | 'Network' | 'Access' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdBy: string;
  createdAt: string;
}

export type NavigationState = 
  | 'HOME' 
  | 'PROJECT' 
  | 'ADMIN_DASHBOARD' 
  | 'IT_HELPDESK' 
  | 'TEAM_AREA' 
  | 'TEAM_CALENDAR'
  | 'TEAM_DOCUMENTS'
  | 'TEAM_MEMBERS'
  | 'TEAM_TRAINING'
  | 'TEAM_RECORDS'
  | 'TEAM_KANBAN';