const API_URL = '/api';

export const fileService = {
    /**
     * Tenta enviar arquivo para o backend. Se falhar, converte para Base64 para uso local.
     */
    async uploadFile(file: File, folder?: string): Promise<{ url: string; name: string; type: 'image' | 'file' }> {
        // Tentativa de Upload Online
        try {
            const formData = new FormData();
            formData.append('file', file);
            const query = folder === 'documents' ? '?folder=documents' : '';
            
            const res = await fetch(`${API_URL}/upload${query}`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                return {
                    url: data.url, 
                    name: data.originalName,
                    type: data.type
                };
            }
        } catch (error) {
            // Backend offline - segue para fallback
        }

        // Fallback: Modo Offline (Base64)
        // Permite que o usuário veja a imagem/arquivo mesmo sem servidor rodando
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                url: e.target?.result as string,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'file'
            });
            reader.readAsDataURL(file);
        });
    }
};