import { Project } from '../types';

const API_URL = '/api';
const LS_KEY = 'ajm_projects_local_db';

const getLocalProjects = (): Project[] => {
    try {
        const stored = localStorage.getItem(LS_KEY);
        if (stored) {
            // Re-hidratar datas
            const parsed = JSON.parse(stored);
            return parsed.map((p: any) => ({
                ...p,
                updatedAt: new Date(p.updatedAt || Date.now())
            }));
        }
    } catch (e) {
        console.error("Erro ao ler projetos locais", e);
    }
    return [];
};

export const projectService = {
    async getProjects(): Promise<Project[]> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(`${API_URL}/projects`, { 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const data = await res.json();
                const projects = Array.isArray(data) ? data.map((p: any) => ({
                    ...p,
                    updatedAt: new Date(p.updatedAt || Date.now())
                })) : [];
                
                // Backup no LocalStorage
                localStorage.setItem(LS_KEY, JSON.stringify(projects));
                return projects;
            }
        } catch (error) {
            // Falha silenciosa para modo offline
        }
        
        return getLocalProjects();
    },

    async saveProjects(projects: Project[]): Promise<void> {
        // 1. Salva sempre localmente primeiro para garantir velocidade e segurança
        localStorage.setItem(LS_KEY, JSON.stringify(projects));

        // 2. Tenta sincronizar com o backend em segundo plano
        try {
            await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projects)
            });
        } catch (error) {
            // Backend offline, mas dados estão salvos localmente.
            // Não lançamos erro para não interromper o fluxo do usuário.
        }
    }
};