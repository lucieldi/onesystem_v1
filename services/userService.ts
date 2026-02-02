
import { User } from '../types';

const API_URL = '/api';
const LS_KEY = 'ajm_users_local_db';

const FALLBACK_USERS: User[] = [
    { id: 'admin', username: 'admin', name: 'Administrador', email: 'admin@sistema.com', role: 'admin', avatar: '🛡️' },
    { id: 'user', username: 'user', name: 'Usuário Padrão', email: 'user@sistema.com', role: 'user', avatar: '👤' }
];

const getLocalUsers = (): User[] => {
    try {
        const stored = localStorage.getItem(LS_KEY);
        return stored ? JSON.parse(stored) : FALLBACK_USERS;
    } catch {
        return FALLBACK_USERS;
    }
};

const saveLocalUsers = (users: User[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify(users));
};

export const userService = {
    async getAllUsers(): Promise<User[]> {
        try {
            const res = await fetch(`${API_URL}/users`, { 
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error();
            const users = await res.json();
            saveLocalUsers(users);
            return users;
        } catch {
            return getLocalUsers();
        }
    },

    async createUser(user: User & { password?: string }): Promise<User> {
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (res.ok) return await res.json();
        } catch {}

        const current = getLocalUsers();
        if (current.some(u => u.username === user.username)) throw new Error("Usuário já existe");
        current.push(user);
        saveLocalUsers(current);
        return user;
    },

    async updateUser(user: User & { password?: string }): Promise<User> {
        try {
            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (res.ok) return await res.json();
        } catch {}

        const current = getLocalUsers();
        const idx = current.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            current[idx] = { ...current[idx], ...user };
            saveLocalUsers(current);
        }
        return user;
    },

    async deleteUser(userId: string): Promise<void> {
        try {
            await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
        } catch {}
        const current = getLocalUsers().filter(u => u.id !== userId);
        saveLocalUsers(current);
    }
};
