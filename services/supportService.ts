
import { SupportTicket } from '../types';

const API_URL = '/api/tickets';

export const supportService = {
    async getTickets(): Promise<SupportTicket[]> {
        try {
            const res = await fetch(API_URL);
            if (res.ok) return await res.json();
        } catch (e) { console.error(e); }
        return [];
    },

    async createTicket(ticket: SupportTicket): Promise<void> {
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket)
            });
        } catch (e) { console.error(e); }
    },

    async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
        try {
            await fetch(`${API_URL}/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (e) { console.error(e); }
    }
};
