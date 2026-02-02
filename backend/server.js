
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));

// Configuração de Pastas de Armazenamento
const STORAGE_DIR = path.join(__dirname, 'storage');
const DB_DIR = path.join(STORAGE_DIR, 'db');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const DOCS_DIR = path.join(STORAGE_DIR, 'documents');

// Arquivos de Banco de Dados (JSON)
const FILES = {
    users: path.join(DB_DIR, 'users.json'),
    projects: path.join(DB_DIR, 'projects.json'),
    messages: path.join(DB_DIR, 'messages.json'),
    tickets: path.join(DB_DIR, 'tickets.json'),
    presence: path.join(DB_DIR, 'presence.json')
};

// Inicialização da Infraestrutura
(function init() {
    [STORAGE_DIR, DB_DIR, UPLOADS_DIR, DOCS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    if (!fs.existsSync(FILES.users)) {
        fs.writeFileSync(FILES.users, JSON.stringify([
            { id: "admin", username: "admin", password: "1234", name: "Administrador", role: "admin", avatar: "🛡️", email: "admin@sistema.com" }
        ], null, 2));
    }
    if (!fs.existsSync(FILES.projects)) fs.writeFileSync(FILES.projects, JSON.stringify([], null, 2));
    if (!fs.existsSync(FILES.messages)) fs.writeFileSync(FILES.messages, JSON.stringify([], null, 2));
    if (!fs.existsSync(FILES.tickets)) fs.writeFileSync(FILES.tickets, JSON.stringify([], null, 2));
    if (!fs.existsSync(FILES.presence)) fs.writeFileSync(FILES.presence, JSON.stringify({}, null, 2));
})();

// Utilitários de Leitura/Escrita
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- ROTAS DE USUÁRIOS ---
app.get('/api/users', (req, res) => res.json(readJSON(FILES.users)));
app.post('/api/users', (req, res) => {
    const users = readJSON(FILES.users);
    const newUser = req.body;
    if (users.find(u => u.username === newUser.username)) return res.status(400).json({ error: 'Usuário já existe' });
    users.push(newUser);
    writeJSON(FILES.users, users);
    res.status(201).json(newUser);
});
app.put('/api/users/:id', (req, res) => {
    const users = readJSON(FILES.users);
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).send();
    users[idx] = { ...users[idx], ...req.body };
    writeJSON(FILES.users, users);
    res.json(users[idx]);
});
app.delete('/api/users/:id', (req, res) => {
    const users = readJSON(FILES.users).filter(u => u.id !== req.params.id);
    writeJSON(FILES.users, users);
    res.json({ success: true });
});

// --- ROTAS DE PROJETOS ---
app.get('/api/projects', (req, res) => res.json(readJSON(FILES.projects)));
app.post('/api/projects', (req, res) => {
    writeJSON(FILES.projects, req.body);
    res.json({ success: true });
});

// --- ROTAS DE CHAT ---
app.get('/api/messages', (req, res) => res.json(readJSON(FILES.messages)));
app.post('/api/messages', (req, res) => {
    const msgs = readJSON(FILES.messages);
    msgs.push(req.body);
    if (msgs.length > 2000) msgs.shift(); // Limite de 2000 mensagens
    writeJSON(FILES.messages, msgs);
    res.json({ success: true });
});
app.delete('/api/messages', (req, res) => {
    writeJSON(FILES.messages, []);
    res.json({ success: true });
});

// --- ROTAS DE HELPDESK (TICKETS) ---
app.get('/api/tickets', (req, res) => res.json(readJSON(FILES.tickets)));
app.post('/api/tickets', (req, res) => {
    const tickets = readJSON(FILES.tickets);
    tickets.push(req.body);
    writeJSON(FILES.tickets, tickets);
    res.json({ success: true });
});
app.put('/api/tickets/:id', (req, res) => {
    const tickets = readJSON(FILES.tickets);
    const idx = tickets.findIndex(t => t.id === req.params.id);
    if (idx !== -1) {
        tickets[idx] = { ...tickets[idx], ...req.body };
        writeJSON(FILES.tickets, tickets);
    }
    res.json({ success: true });
});

// --- UPLOAD DE ARQUIVOS ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, req.query.folder === 'documents' ? DOCS_DIR : UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage });

app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/documents', express.static(DOCS_DIR));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    const isDoc = req.query.folder === 'documents';
    const url = `${req.protocol}://${req.get('host')}${isDoc ? '/documents/' : '/uploads/'}${req.file.filename}`;
    res.json({ url, name: req.file.originalname, type: isDoc ? 'file' : 'image' });
});

app.listen(PORT, () => console.log(`Backend AJM OneSystem rodando na porta ${PORT}`));
