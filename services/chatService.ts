
import { ChatMessage } from '../types';

const API_URL = '/api';
const LS_KEY = 'ajm_global_chat_history';

// Helper para fallback local se backend estiver offline
const getLocalMessages = (): ChatMessage[] => {
    try {
        const stored = localStorage.getItem(LS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveLocalMessages = (msgs: ChatMessage[]) => {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(msgs));
    } catch (e) {
        console.warn("Erro ao salvar cache local de chat");
    }
};

export const chatService = {
    /**
     * Busca todas as mensagens do servidor.
     */
    async getMessages(): Promise<ChatMessage[]> {
        try {
            // Timeout curto para não travar a UI se servidor estiver fora
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(`${API_URL}/messages`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const msgs = await res.json();
                // Sincroniza cache local com o servidor
                saveLocalMessages(msgs);
                return msgs;
            }
        } catch (e) {
            // Falha silenciosa, usa cache local
        }
        return getLocalMessages();
    },

    /**
     * Envia uma mensagem para o servidor.
     */
    async sendMessage(message: ChatMessage): Promise<void> {
        // 1. Atualiza LocalStorage imediatamente (Otimista)
        const current = getLocalMessages();
        saveLocalMessages([...current, message]);

        // 2. Envia para o Backend
        try {
            await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
        } catch (e) {
            console.error("Erro ao enviar mensagem para o servidor (salvo apenas localmente)");
        }
    },

    /**
     * Limpa o histórico de chat (Admin)
     */
    async clearMessages(): Promise<void> {
        saveLocalMessages([]);
        try {
            await fetch(`${API_URL}/messages`, { method: 'DELETE' });
        } catch (e) { /* Ignora */ }
    }
};