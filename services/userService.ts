
import { User } from '../types';

const API_URL = '/api';
const LS_KEY = 'ajm_users_local_db';

// Dados iniciais caso não exista nada local nem no backend
const FALLBACK_USERS: User[] = [
    { id: 'admin', username: 'admin', password: '1234', name: 'Admin Local', email: 'admin@local', role: 'admin', avatar: '🛡️' } as any,
    { id: 'user', username: 'user', password: '1234', name: 'User Local', email: 'user@local', role: 'user', avatar: '👤' } as any
];

// Helpers para LocalStorage
const getLocalUsers = (): User[] => {
    try {
        const stored = localStorage.getItem(LS_KEY);
        return stored ? JSON.parse(stored) : FALLBACK_USERS;
    } catch {
        return FALLBACK_USERS;
    }
};

const saveLocalUsers = (users: User[]) => {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(users));
    } catch (e) {
        console.warn("Erro ao salvar cache local de usuários");
    }
};

export const userService = {
    async getAllUsers(): Promise<User[]> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

            const res = await fetch(`${API_URL}/users`, { 
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' }
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error('Servidor indisponível');
            
            const users = await res.json();
            // Atualiza o backup local sempre que conseguir dados frescos do backend
            saveLocalUsers(users);
            return users;
        } catch (error) {
            // Silenciosamente retorna dados locais sem erro no console
            return getLocalUsers();
        }
    },

    async createUser(user: User & { password?: string }): Promise<User> {
        // Tenta salvar no backend
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            
            // SE O BACKEND REJEITAR (ex: 400 Duplicado), lança erro para não salvar localmente
            if (!res.ok) {
                if (res.status === 400 || res.status === 409) {
                    throw new Error("Erro de validação: Usuário já existe ou dados inválidos");
                }
            }

            if (res.ok) return await res.json();
        } catch (e) { 
            // Se for erro de validação (lançado acima), repassa o erro para interromper o fluxo
            if (e instanceof Error && e.message.includes("Erro de validação")) {
                throw e;
            }
            // Se for erro de rede (fetch failed), ignora e vai pro fallback
        }

        // Fallback: Salva localmente (Apenas se não foi rejeitado pelo servidor explicitamente)
        const currentUsers = getLocalUsers();
        // Verificação extra local de duplicidade para segurança offline
        if (currentUsers.some(u => u.username === user.username)) {
             throw new Error("Erro de validação: Usuário já existe (Local)");
        }

        currentUsers.push(user as User); 
        saveLocalUsers(currentUsers);
        return user as User;
    },

    async updateUser(user: User & { password?: string }): Promise<User> {
        try {
            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (res.ok) return await res.json();
        } catch (e) { /* Ignora */ }

        // Fallback Local
        const currentUsers = getLocalUsers();
        const index = currentUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
            currentUsers[index] = { ...currentUsers[index], ...user };
            saveLocalUsers(currentUsers);
        }
        return user as User;
    },

    async deleteUser(userId: string): Promise<void> {
        try {
            await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
        } catch (e) { /* Ignora */ }

        // Fallback Local
        const currentUsers = getLocalUsers();
        const filtered = currentUsers.filter(u => u.id !== userId);
        saveLocalUsers(filtered);
    }
};