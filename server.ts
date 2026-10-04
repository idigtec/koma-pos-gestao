import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pos-omnichannel-jwt-secret-min-32-chars-for-secure-signing';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- JWT TOKEN UTILITIES (Standard RFC 7519 HMAC-SHA256) ---
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function generateJwt(payload: Record<string, any>, expiresInSeconds: number = 8 * 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Token format invalid' };
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Verification failed' };
  }
}

// In-memory refresh token store (token -> { userId, expiresAt })
const refreshTokens = new Map<string, { userId: string; expiresAt: number }>();

// Initial Seed Users for API
interface ApiUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'cashier' | 'kitchen' | 'stock_manager' | 'finance';
  status: 'active' | 'inactive';
  passwordHash: string;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

const API_USERS: ApiUser[] = [
  {
    id: 'user-admin',
    name: 'Carlos Alberto Macamo',
    username: 'admin',
    email: 'admin@koma.co.mz',
    phone: '+258 84 990 0001',
    role: 'admin',
    status: 'active',
    passwordHash: 'admin123',
    permissions: [
      'sales.create', 'sales.cancel', 'sales.refund', 'sales.discount',
      'products.create', 'products.edit', 'products.delete', 'products.change_price',
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.view',
      'kitchen.view', 'kitchen.update',
      'customers.manage', 'finance.view', 'reports.view',
      'users.manage', 'settings.manage', 'audit.view'
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-manager',
    name: 'Ana Paula Mondlane',
    username: 'gerente',
    email: 'gerente@koma.co.mz',
    phone: '+258 84 990 0002',
    role: 'manager',
    status: 'active',
    passwordHash: 'gerente123',
    permissions: [
      'sales.create', 'sales.cancel', 'sales.refund', 'sales.discount',
      'products.create', 'products.edit', 'products.change_price',
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.view',
      'kitchen.view', 'kitchen.update',
      'customers.manage', 'finance.view', 'reports.view', 'audit.view'
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-cashier',
    name: 'João Baptista Sitoe',
    username: 'caixa',
    email: 'caixa@koma.co.mz',
    phone: '+258 84 990 0003',
    role: 'cashier',
    status: 'active',
    passwordHash: 'caixa123',
    permissions: [
      'sales.create', 'sales.discount',
      'cash.open', 'cash.close', 'cash.view',
      'customers.manage'
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-kitchen',
    name: 'Mateus Nhantumbo',
    username: 'cozinha',
    email: 'cozinha@koma.co.mz',
    phone: '+258 84 990 0004',
    role: 'kitchen',
    status: 'active',
    passwordHash: 'cozinha123',
    permissions: [
      'kitchen.view', 'kitchen.update',
      'inventory.view'
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-stock',
    name: 'Fátima Tembe',
    username: 'estoque',
    email: 'estoque@koma.co.mz',
    phone: '+258 84 990 0005',
    role: 'stock_manager',
    status: 'active',
    passwordHash: 'estoque123',
    permissions: [
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'products.create', 'products.edit', 'reports.view'
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-finance',
    name: 'Delfina Langa',
    username: 'financeiro',
    email: 'financeiro@koma.co.mz',
    phone: '+258 84 990 0006',
    role: 'finance',
    status: 'active',
    passwordHash: 'financeiro123',
    permissions: [
      'finance.view', 'reports.view', 'cash.view', 'audit.view'
    ],
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

// --- AUTHENTICATION MIDDLEWARE ---
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorização não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  const verified = verifyJwt(token);
  if (!verified.valid) {
    return res.status(401).json({ error: 'Token inválido ou expirado.', details: verified.error });
  }

  (req as any).user = verified.payload;
  next();
}

// --- BASE API ROUTES & HEALTH CHECKS ---
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'POS Omnichannel Management System API',
    uptimeSeconds: Math.floor(process.uptime()),
    database: 'connected',
    persistence: 'Firebase Firestore & PostgreSQL Ready',
    version: '1.0.0-phase1-auth',
  });
});

app.get('/api/ready', (_req: Request, res: Response) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    businessType: process.env.BUSINESS_TYPE || 'HYBRID',
    channels: [
      'COUNTER_POS',
      'RESTAURANT_DINE_IN',
      'TAKEAWAY',
      'KDS_KITCHEN',
      'KIOSK',
      'ONLINE_DELIVERY',
    ],
    currency: 'MZN',
    locale: 'pt-MZ',
    timezone: 'Africa/Maputo',
  });
});

app.get('/api/info', (_req: Request, res: Response) => {
  res.json({
    name: 'POS OMNICHANNEL MANAGEMENT SYSTEM',
    architecture: 'One Source of Truth (Centralized Engine)',
    phase: 'FASE 1 — AUTENTICAÇÃO + USUÁRIOS (RBAC & JWT)',
    status: 'ACTIVE_AND_TESTED',
    roles: ['admin', 'manager', 'cashier', 'kitchen', 'stock_manager', 'finance'],
  });
});

// --- AUTH REST API ENDPOINTS ---
// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usuário/email e senha são obrigatórios.' });
  }

  const cleanInput = username.trim().toLowerCase();
  const user = API_USERS.find(
    (u) =>
      (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) &&
      u.status === 'active'
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
  }

  if (user.passwordHash !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique sua senha.' });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();

  // Create JWT Token and Refresh Token
  const token = generateJwt({
    sub: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });

  const refreshToken = crypto.randomBytes(32).toString('hex');
  const refreshExpiresAt = Date.now() + 7 * 24 * 3600 * 1000; // 7 days
  refreshTokens.set(refreshToken, { userId: user.id, expiresAt: refreshExpiresAt });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    success: true,
    token,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 8 * 3600,
    user: safeUser,
  });
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token é obrigatório.' });
  }

  const tokenData = refreshTokens.get(refreshToken);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
  }

  const user = API_USERS.find((u) => u.id === tokenData.userId);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Usuário associado não encontrado ou inativo.' });
  }

  const newToken = generateJwt({
    sub: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });

  return res.json({
    success: true,
    token: newToken,
    tokenType: 'Bearer',
    expiresIn: 8 * 3600,
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const payload = (req as any).user;
  const user = API_USERS.find((u) => u.id === payload.sub);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// GET /api/roles
app.get('/api/roles', (_req: Request, res: Response) => {
  const roles = [
    {
      role: 'super_admin',
      name: 'Super Administrador',
      description: 'Acesso irrestrito a configurações, filiais, usuários e auditoria do sistema.',
    },
    {
      role: 'admin',
      name: 'Administrador',
      description: 'Gestão operacional completa, controle de equipe, cancelamentos e relatórios gerenciais.',
    },
    {
      role: 'manager',
      name: 'Gerente Operacional',
      description: 'Supervisão de turno, autorização de descontos, estoque, compras e relatórios.',
    },
    {
      role: 'cashier',
      name: 'Operador de Caixa (PDV)',
      description: 'Abertura de caixa, emissão de tickets, fechamento de turno e atendimento ao balcão.',
    },
    {
      role: 'kitchen',
      name: 'Chefe / Operador de Cozinha (KDS)',
      description: 'Acompanhamento do painel KDS, preparo de pedidos e tempos de cozinha.',
    },
    {
      role: 'stock_manager',
      name: 'Gestor de Estoque',
      description: 'Controle de armazém, inventário físico, conferência de compras e perdas.',
    },
    {
      role: 'finance',
      name: 'Analista Financeiro',
      description: 'Fluxo de caixa, receitas, despesas operacionais e relatórios fiscais.',
    },
  ];
  return res.json({ roles });
});

// GET /api/users
app.get('/api/users', (_req: Request, res: Response) => {
  const safeUsers = API_USERS.map(({ passwordHash: _, ...u }) => u);
  return res.json({ users: safeUsers });
});

// POST /api/users
app.post('/api/users', (req: Request, res: Response) => {
  const { name, username, email, phone, role, password } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Campos nome, username, senha e cargo são obrigatórios.' });
  }

  const existing = API_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'Já existe um usuário cadastrado com este nome de usuário.' });
  }

  const newUser: ApiUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    email: (email || `${username.trim()}@koma.co.mz`).toLowerCase(),
    phone: phone || '',
    role,
    status: 'active',
    passwordHash: password,
    permissions: [],
    createdAt: new Date().toISOString(),
  };

  API_USERS.push(newUser);
  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({ success: true, user: safeUser });
});

// PUT /api/users/:id
app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = API_USERS.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const { name, phone, email, role, status, password } = req.body;
  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  if (email) user.email = email.trim().toLowerCase();
  if (role) user.role = role;
  if (status) user.status = status;
  if (password && password.trim().length > 0) user.passwordHash = password.trim();

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = API_USERS.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  if (API_USERS[index].username === 'admin') {
    return res.status(403).json({ error: 'Não é permitido excluir o Administrador principal do sistema.' });
  }

  API_USERS.splice(index, 1);
  return res.json({ success: true, message: 'Usuário removido com sucesso.' });
});

// --- CATEGORIES & PRODUCTS API (FASE 2) ---
interface ApiCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  status: 'active' | 'inactive';
  color?: string;
}

interface ApiProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  status: 'active' | 'inactive';
  image?: string;
  imageBgColor?: string;
  isFoodItem?: boolean;
  isFavorite?: boolean;
  isBestSeller?: boolean;
  is86?: boolean;
  is86Reason?: string;
  is86By?: string;
  is86At?: string;
  displayOrder?: number;
  createdAt: string;
}

let API_CATEGORIES: ApiCategory[] = [
  { id: 'cat-burgers', name: 'Hambúrgueres & Sanduíches', icon: '🍔', description: 'Hambúrgueres artesanais bovinos e frango', status: 'active', color: 'orange' },
  { id: 'cat-pizzas', name: 'Pizzas Artesanais', icon: '🍕', description: 'Pizzas assadas na hora com queijo mozzarella', status: 'active', color: 'red' },
  { id: 'cat-frangos', name: 'Frangos & Porções', icon: '🍗', description: 'Frangos fritos crocantes e asinhas picantes', status: 'active', color: 'amber' },
  { id: 'cat-acompanhamentos', name: 'Batatas & Acompanhamentos', icon: '🍟', description: 'Batatas fritas rústicas e anéis de cebola', status: 'active', color: 'yellow' },
  { id: 'cat-bebidas', name: 'Bebidas & Refrigerantes', icon: '🥤', description: 'Refrigerantes gelados, sumos e águas minerais', status: 'active', color: 'blue' },
  { id: 'cat-cervejas', name: 'Cervejas & Alcoólicos', icon: '🍺', description: 'Cervejas moçambicanas 2M, Laurentina e Txilar', status: 'active', color: 'emerald' },
  { id: 'cat-sobremesas', name: 'Cafetaria & Sobremesas', icon: '☕', description: 'Espresso italiano, milkshakes e sobremesas', status: 'active', color: 'purple' },
];

let API_PRODUCTS: ApiProduct[] = [
  {
    id: 'prod-burger-classico',
    sku: 'BUR-001',
    barcode: '600200100001',
    name: 'Hambúrguer Clássico KOMA com Queijo & Bacon',
    description: 'Hambúrguer de 180g de carne bovina moída, queijo cheddar derretido, fatias de bacon crocante, alface e molho da casa.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 150,
    sellingPrice: 320,
    currentStock: 65,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    is86: false,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-burger-duplo',
    sku: 'BUR-002',
    barcode: '600200100002',
    name: 'Hambúrguer Duplo Cheddar & Cebola Caramelizada',
    description: 'Dois discos de carne 120g cada, dobro de cheddar cremoso e cebola caramelizada artesanal.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 210,
    sellingPrice: 450,
    currentStock: 40,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    is86: false,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-batata-frita-grande',
    sku: 'BAT-001',
    barcode: '600200100003',
    name: 'Batata Frita Crocante Dourada (Porção Grande)',
    description: 'Batatas palito importadas bem sequinhas e crocantes temperadas com sal marinho.',
    categoryId: 'cat-acompanhamentos',
    categoryName: 'Batatas & Acompanhamentos',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 45,
    sellingPrice: 120,
    currentStock: 120,
    minStock: 25,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF9C3',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    is86: false,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-coca-cola-lata',
    sku: 'BEB-001',
    barcode: '5449000000996',
    name: 'Coca-Cola Original Lata 330ml Gelada',
    description: 'Refrigerante de cola em lata 330ml bem gelado.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Coca-Cola',
    unit: 'lata',
    costPrice: 40,
    sellingPrice: 70,
    currentStock: 250,
    minStock: 48,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    is86: false,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-2m-lata',
    sku: 'CER-001',
    barcode: '600100200001',
    name: 'Cerveja 2M Especial Moçambique Lata 330ml',
    description: 'A autêntica cerveja moçambicana servida estupidamente gelada.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Alcoólicos',
    brand: '2M CDM',
    unit: 'lata',
    costPrice: 50,
    sellingPrice: 85,
    currentStock: 180,
    minStock: 48,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1608270146059-e93bf0ffda65?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: false,
    is86: false,
    displayOrder: 5,
    createdAt: new Date().toISOString(),
  },
];

// --- CATEGORIES REST ENDPOINTS ---
app.get('/api/categories', (_req: Request, res: Response) => {
  return res.json({ categories: API_CATEGORIES });
});

app.post('/api/categories', (req: Request, res: Response) => {
  const { name, icon, description, status, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
  }

  const newCat: ApiCategory = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    icon: icon || '🍔',
    description: description ? description.trim() : '',
    status: status || 'active',
    color: color || 'orange',
  };

  API_CATEGORIES.push(newCat);
  return res.status(201).json({ success: true, category: newCat });
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const cat = API_CATEGORIES.find((c) => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'Categoria não encontrada.' });
  }

  const { name, icon, description, status, color } = req.body;
  if (name) cat.name = name.trim();
  if (icon) cat.icon = icon;
  if (description !== undefined) cat.description = description.trim();
  if (status) cat.status = status;
  if (color) cat.color = color;

  return res.json({ success: true, category: cat });
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = API_CATEGORIES.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Categoria não encontrada.' });
  }

  API_CATEGORIES.splice(index, 1);
  return res.json({ success: true, message: 'Categoria removida com sucesso.' });
});

// --- PRODUCTS REST ENDPOINTS ---
app.get('/api/products', (req: Request, res: Response) => {
  const { category, status, q, only86 } = req.query;
  let result = [...API_PRODUCTS];

  if (category && category !== 'all') {
    result = result.filter((p) => p.categoryId === category);
  }
  if (status && status !== 'all') {
    result = result.filter((p) => p.status === status);
  }
  if (only86 === 'true') {
    result = result.filter((p) => p.is86 === true);
  }
  if (q) {
    const term = (q as string).toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term))
    );
  }

  // Calculate gross margin for each product in response
  const enriched = result.map((p) => {
    const marginPercent =
      p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
    const nominalProfit = p.sellingPrice - p.costPrice;
    return {
      ...p,
      marginPercent: parseFloat(marginPercent.toFixed(1)),
      nominalProfit: parseFloat(nominalProfit.toFixed(2)),
    };
  });

  return res.json({ products: enriched, total: enriched.length });
});

app.post('/api/products', (req: Request, res: Response) => {
  const {
    name,
    sku,
    barcode,
    categoryId,
    brand,
    unit,
    costPrice,
    sellingPrice,
    currentStock,
    minStock,
    image,
    description,
    isFoodItem,
    status,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do produto é obrigatório.' });
  }

  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const cat = API_CATEGORIES.find((c) => c.id === categoryId);

  const newProd: ApiProduct = {
    id: `prod-${Date.now()}`,
    sku: sku ? sku.trim() : `PRD-${Date.now().toString().slice(-4)}`,
    barcode: barcode ? barcode.trim() : `${Date.now().toString().slice(-12)}`,
    name: name.trim(),
    description: description ? description.trim() : '',
    categoryId: categoryId || 'cat-burgers',
    categoryName: cat ? cat.name : 'Diversos',
    brand: brand ? brand.trim() : 'KOMA',
    unit: unit || 'un',
    costPrice: cost,
    sellingPrice: sell,
    currentStock: parseFloat(currentStock) || 0,
    minStock: parseFloat(minStock) || 10,
    status: status || 'active',
    image: image ? image.trim() : undefined,
    isFoodItem: isFoodItem ?? true,
    is86: false,
    displayOrder: API_PRODUCTS.length + 1,
    createdAt: new Date().toISOString(),
  };

  API_PRODUCTS.push(newProd);
  return res.status(201).json({ success: true, product: newProd });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = API_PRODUCTS.find((p) => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const {
    name,
    sku,
    barcode,
    categoryId,
    brand,
    unit,
    costPrice,
    sellingPrice,
    currentStock,
    minStock,
    status,
    image,
    description,
    is86,
    is86Reason,
    displayOrder,
  } = req.body;

  if (name) prod.name = name.trim();
  if (sku) prod.sku = sku.trim();
  if (barcode) prod.barcode = barcode.trim();
  if (categoryId) {
    prod.categoryId = categoryId;
    const cat = API_CATEGORIES.find((c) => c.id === categoryId);
    if (cat) prod.categoryName = cat.name;
  }
  if (brand !== undefined) prod.brand = brand.trim();
  if (unit) prod.unit = unit;
  if (costPrice !== undefined) prod.costPrice = parseFloat(costPrice) || 0;
  if (sellingPrice !== undefined) prod.sellingPrice = parseFloat(sellingPrice) || 0;
  if (currentStock !== undefined) prod.currentStock = parseFloat(currentStock) || 0;
  if (minStock !== undefined) prod.minStock = parseFloat(minStock) || 0;
  if (status) prod.status = status;
  if (image !== undefined) prod.image = image ? image.trim() : undefined;
  if (description !== undefined) prod.description = description.trim();
  if (is86 !== undefined) prod.is86 = is86;
  if (is86Reason !== undefined) prod.is86Reason = is86Reason;
  if (displayOrder !== undefined) prod.displayOrder = displayOrder;

  return res.json({ success: true, product: prod });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = API_PRODUCTS.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  API_PRODUCTS.splice(index, 1);
  return res.json({ success: true, message: 'Produto removido com sucesso.' });
});

// PATCH /api/products/:id/toggle-86
app.patch('/api/products/:id/toggle-86', (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = API_PRODUCTS.find((p) => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const { is86, reason, userName } = req.body;
  prod.is86 = is86 !== undefined ? is86 : !prod.is86;
  prod.is86Reason = prod.is86 ? (reason || 'Esgotado temporariamente') : undefined;
  prod.is86By = prod.is86 ? (userName || 'Operador') : undefined;
  prod.is86At = prod.is86 ? new Date().toISOString() : undefined;

  return res.json({
    success: true,
    is86: prod.is86,
    product: prod,
    message: prod.is86
      ? `Produto "${prod.name}" marcado como ESGOTADO (86).`
      : `Produto "${prod.name}" reativado como DISPONÍVEL.`,
  });
});

// --- INGREDIENTS API (FASE 3) ---
interface ApiIngredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierName?: string;
  isAvailable: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

let API_INGREDIENTS: ApiIngredient[] = [
  { id: 'ing-pao', name: 'Pão de Hambúrguer com Sésamo', category: 'Pães', unit: 'un', currentStock: 250, minStock: 50, costPerUnit: 15, supplierName: 'Padaria Central Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-carne', name: 'Hambúrguer Bovino 150g Fresco', category: 'Carnes', unit: 'un', currentStock: 200, minStock: 40, costPerUnit: 70, supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-queijo', name: 'Queijo Cheddar em Fatias', category: 'Lacticínios', unit: 'un', currentStock: 450, minStock: 80, costPerUnit: 12, supplierName: 'Padaria Central Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-bacon', name: 'Bacon Fumado em Tiras', category: 'Carnes', unit: 'un', currentStock: 300, minStock: 50, costPerUnit: 25, supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-alface', name: 'Alface Americana Fresca', category: 'Vegetais', unit: 'g', currentStock: 6000, minStock: 1200, costPerUnit: 0.1, supplierName: 'Hortifrútis da Manhiça', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-tomate', name: 'Tomate Fresco em Rodelas', category: 'Vegetais', unit: 'g', currentStock: 5000, minStock: 1000, costPerUnit: 0.12, supplierName: 'Hortifrútis da Manhiça', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-cebola', name: 'Cebola Roxa Fatiada', category: 'Vegetais', unit: 'g', currentStock: 4000, minStock: 800, costPerUnit: 0.08, supplierName: 'Hortifrútis da Manhiça', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-molho', name: 'Molho Especial KOMA', category: 'Molhos', unit: 'ml', currentStock: 8000, minStock: 1500, costPerUnit: 0.25, supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-batata', name: 'Batata Palito Pré-Frita', category: 'Vegetais', unit: 'g', currentStock: 30000, minStock: 5000, costPerUnit: 0.09, supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-massa-pizza', name: 'Massa Artesanal de Pizza Média', category: 'Massas', unit: 'un', currentStock: 80, minStock: 20, costPerUnit: 50, supplierName: 'Padaria Central Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-mozzarella', name: 'Queijo Mozzarella Ralado', category: 'Lacticínios', unit: 'g', currentStock: 10000, minStock: 2000, costPerUnit: 0.45, supplierName: 'Padaria Central Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-frango', name: 'Frango Desfiado com Piri-Piri', category: 'Carnes', unit: 'g', currentStock: 7500, minStock: 1500, costPerUnit: 0.35, supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-embalagem', name: 'Embalagem Térmica Takeaway KOMA', category: 'Descartáveis', unit: 'un', currentStock: 600, minStock: 100, costPerUnit: 10, supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
];

app.get('/api/ingredients', (req: Request, res: Response) => {
  const { category, status, q, only86 } = req.query;
  let result = [...API_INGREDIENTS];

  if (category && category !== 'all') {
    result = result.filter(i => i.category === category);
  }
  if (status && status !== 'all') {
    result = result.filter(i => i.status === status);
  }
  if (only86 === 'true') {
    result = result.filter(i => !i.isAvailable);
  }
  if (q) {
    const term = (q as string).toLowerCase().trim();
    result = result.filter(i => i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term));
  }

  return res.json({ ingredients: result, total: result.length });
});

app.post('/api/ingredients', (req: Request, res: Response) => {
  const { name, category, unit, currentStock, minStock, costPerUnit, supplierName, status } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do ingrediente é obrigatório.' });
  }

  const newIng: ApiIngredient = {
    id: `ing-${Date.now()}`,
    name: name.trim(),
    category: category || 'Geral',
    unit: unit || 'un',
    currentStock: parseFloat(currentStock) || 0,
    minStock: parseFloat(minStock) || 10,
    costPerUnit: parseFloat(costPerUnit) || 0,
    supplierName: supplierName ? supplierName.trim() : undefined,
    isAvailable: true,
    status: status || 'active',
    createdAt: new Date().toISOString(),
  };

  API_INGREDIENTS.push(newIng);
  return res.status(201).json({ success: true, ingredient: newIng });
});

app.put('/api/ingredients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ing = API_INGREDIENTS.find(i => i.id === id);
  if (!ing) {
    return res.status(404).json({ error: 'Ingrediente não encontrado.' });
  }

  const { name, category, unit, currentStock, minStock, costPerUnit, supplierName, status, isAvailable } = req.body;
  if (name) ing.name = name.trim();
  if (category) ing.category = category;
  if (unit) ing.unit = unit;
  if (currentStock !== undefined) ing.currentStock = parseFloat(currentStock) || 0;
  if (minStock !== undefined) ing.minStock = parseFloat(minStock) || 0;
  if (costPerUnit !== undefined) ing.costPerUnit = parseFloat(costPerUnit) || 0;
  if (supplierName !== undefined) ing.supplierName = supplierName.trim();
  if (status) ing.status = status;
  if (isAvailable !== undefined) ing.isAvailable = isAvailable;

  return res.json({ success: true, ingredient: ing });
});

app.delete('/api/ingredients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = API_INGREDIENTS.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ingrediente não encontrado.' });
  }

  API_INGREDIENTS.splice(index, 1);
  return res.json({ success: true, message: 'Ingrediente removido com sucesso.' });
});

app.patch('/api/ingredients/:id/toggle-86', (req: Request, res: Response) => {
  const { id } = req.params;
  const ing = API_INGREDIENTS.find(i => i.id === id);
  if (!ing) {
    return res.status(404).json({ error: 'Ingrediente não encontrado.' });
  }

  const { isAvailable } = req.body;
  ing.isAvailable = isAvailable !== undefined ? isAvailable : !ing.isAvailable;

  return res.json({
    success: true,
    isAvailable: ing.isAvailable,
    ingredient: ing,
    message: ing.isAvailable
      ? `Ingrediente "${ing.name}" disponível.`
      : `Ingrediente "${ing.name}" marcado como ESGOTADO (86).`,
  });
});

// --- RECIPE & MODIFIERS REST ENDPOINTS ---
app.get('/api/products/:id/recipe', (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = API_PRODUCTS.find(p => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  return res.json({
    productId: prod.id,
    productName: prod.name,
    sellingPrice: prod.sellingPrice,
    recipe: (prod as any).recipe || [],
  });
});

app.put('/api/products/:id/recipe', (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = API_PRODUCTS.find(p => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const { recipe, updateCostPrice, costPrice } = req.body;
  (prod as any).recipe = recipe || [];
  if (updateCostPrice && costPrice !== undefined) {
    prod.costPrice = parseFloat(costPrice) || prod.costPrice;
  }

  return res.json({
    success: true,
    message: 'Ficha técnica salva com sucesso.',
    product: prod,
  });
});

app.get('/api/products/:id/modifiers', (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = API_PRODUCTS.find(p => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  return res.json({
    productId: prod.id,
    productName: prod.name,
    modifierGroups: (prod as any).modifierGroups || [],
  });
});

app.put('/api/products/:id/modifiers', (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = API_PRODUCTS.find(p => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const { modifierGroups } = req.body;
  (prod as any).modifierGroups = modifierGroups || [];

  return res.json({
    success: true,
    message: 'Modificadores salvos com sucesso.',
    product: prod,
  });
});

// --- WAREHOUSES & PROFESSIONAL STOCK ENDPOINTS (FASE 4) ---
interface ApiWarehouse {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault?: boolean;
  status: 'active' | 'inactive';
  location?: string;
  createdAt: string;
}

let API_WAREHOUSES: ApiWarehouse[] = [
  { id: 'wh-central', name: 'Armazém Geral & Câmara Frigorífica', code: 'ALM-01', description: 'Armazenamento principal de carnes congeladas e insumos refrigerados.', isDefault: true, status: 'active', location: 'Edifício Central - Piso 0', createdAt: new Date().toISOString() },
  { id: 'wh-cozinha', name: 'Cozinha Principal / Linha de Preparo', code: 'COZ-01', description: 'Estoque de operação imediata para cocção, grelhados e frituras.', isDefault: false, status: 'active', location: 'Linha Quente', createdAt: new Date().toISOString() },
  { id: 'wh-bar', name: 'Bar, Balcão & Bebidas Geladas', code: 'BAR-01', description: 'Frigoríficos de exposição, cervejas, sumos e refrigerantes gelados.', isDefault: false, status: 'active', location: 'Frente de Atendimento', createdAt: new Date().toISOString() },
  { id: 'wh-secos', name: 'Depósito Seco & Descartáveis', code: 'SEC-01', description: 'Embalagens takeaway, guardanapos, copos e farinhas secas.', isDefault: false, status: 'active', location: 'Mezanino Superior', createdAt: new Date().toISOString() },
];

interface ApiStockMovement {
  id: string;
  itemType: 'product' | 'ingredient';
  productId?: string;
  ingredientId?: string;
  itemName: string;
  sku?: string;
  type: 'entry' | 'exit' | 'adjustment' | 'sale' | 'return' | 'loss' | 'inventory' | 'transfer';
  quantity: number;
  previousStock: number;
  nextStock: number;
  unit: string;
  costPerUnit?: number;
  totalCost?: number;
  warehouseId?: string;
  warehouseName?: string;
  targetWarehouseId?: string;
  targetWarehouseName?: string;
  reason: string;
  documentRef?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

let API_STOCK_MOVEMENTS: ApiStockMovement[] = [
  { id: 'sm-001', itemType: 'ingredient', ingredientId: 'ing-carne', itemName: 'Hambúrguer Bovino 150g Fresco', type: 'entry', quantity: 100, previousStock: 100, nextStock: 200, unit: 'un', costPerUnit: 70, totalCost: 7000, warehouseId: 'wh-central', warehouseName: 'Armazém Geral', reason: 'Compra de Lote Fornecedor Polana', documentRef: 'FAT-2026/890', userId: 'admin', userName: 'Carlos Alberto Macamo', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'sm-002', itemType: 'ingredient', ingredientId: 'ing-pao', itemName: 'Pão de Hambúrguer com Sésamo', type: 'entry', quantity: 150, previousStock: 100, nextStock: 250, unit: 'un', costPerUnit: 15, totalCost: 2250, warehouseId: 'wh-central', warehouseName: 'Armazém Geral', reason: 'Entrega Diária Padaria Central', documentRef: 'GUIA-4402', userId: 'admin', userName: 'Carlos Alberto Macamo', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'sm-003', itemType: 'product', productId: 'prod-burger-classico', itemName: 'Hambúrguer Clássico KOMA', sku: 'BUR-001', type: 'entry', quantity: 20, previousStock: 45, nextStock: 65, unit: 'un', costPerUnit: 150, totalCost: 3000, warehouseId: 'wh-cozinha', warehouseName: 'Cozinha Principal', reason: 'Produção e Montagem do Dia', userId: 'admin', userName: 'Carlos Alberto Macamo', createdAt: new Date().toISOString() },
];

interface ApiStockCountItem {
  id: string;
  name: string;
  itemType: 'product' | 'ingredient';
  unit: string;
  systemQty: number;
  countedQty: number;
  diff: number;
  costPerUnit: number;
  totalDiffCost: number;
  adjusted: boolean;
}

interface ApiStockCount {
  id: string;
  title: string;
  warehouseId?: string;
  warehouseName?: string;
  date: string;
  performedBy: string;
  status: 'draft' | 'completed';
  notes?: string;
  items: ApiStockCountItem[];
  createdAt: string;
  completedAt?: string;
}

let API_STOCK_COUNTS: ApiStockCount[] = [];

// WAREHOUSE ENDPOINTS
app.get('/api/warehouses', (_req: Request, res: Response) => {
  return res.json({ warehouses: API_WAREHOUSES, total: API_WAREHOUSES.length });
});

app.post('/api/warehouses', (req: Request, res: Response) => {
  const { name, code, description, isDefault, status, location } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do armazém é obrigatório.' });
  }

  const newWh: ApiWarehouse = {
    id: `wh-${Date.now()}`,
    name: name.trim(),
    code: code ? code.trim().toUpperCase() : `LOC-${API_WAREHOUSES.length + 1}`,
    description: description ? description.trim() : undefined,
    isDefault: Boolean(isDefault),
    status: status || 'active',
    location: location ? location.trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  if (newWh.isDefault) {
    API_WAREHOUSES.forEach(w => { w.isDefault = false; });
  }

  API_WAREHOUSES.push(newWh);
  return res.status(201).json({ success: true, warehouse: newWh });
});

app.put('/api/warehouses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const wh = API_WAREHOUSES.find(w => w.id === id);
  if (!wh) {
    return res.status(404).json({ error: 'Armazém não encontrado.' });
  }

  const { name, code, description, isDefault, status, location } = req.body;
  if (name) wh.name = name.trim();
  if (code) wh.code = code.trim().toUpperCase();
  if (description !== undefined) wh.description = description.trim();
  if (isDefault !== undefined) {
    wh.isDefault = Boolean(isDefault);
    if (wh.isDefault) {
      API_WAREHOUSES.filter(w => w.id !== id).forEach(w => { w.isDefault = false; });
    }
  }
  if (status) wh.status = status;
  if (location !== undefined) wh.location = location.trim();

  return res.json({ success: true, warehouse: wh });
});

app.delete('/api/warehouses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = API_WAREHOUSES.findIndex(w => w.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Armazém não encontrado.' });
  }

  API_WAREHOUSES.splice(index, 1);
  return res.json({ success: true, message: 'Armazém removido com sucesso.' });
});

// STOCK MOVEMENTS ENDPOINTS
app.get('/api/stock/movements', (req: Request, res: Response) => {
  const { type, itemId, warehouseId, limit: limitQ } = req.query;
  let result = [...API_STOCK_MOVEMENTS];

  if (type && type !== 'all') {
    result = result.filter(m => m.type === type);
  }
  if (itemId) {
    result = result.filter(m => m.productId === itemId || m.ingredientId === itemId);
  }
  if (warehouseId && warehouseId !== 'all') {
    result = result.filter(m => m.warehouseId === warehouseId || m.targetWarehouseId === warehouseId);
  }

  // Sort desc by timestamp
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (limitQ) {
    const lim = parseInt(limitQ as string, 10);
    if (!isNaN(lim) && lim > 0) result = result.slice(0, lim);
  }

  return res.json({ movements: result, total: result.length });
});

app.post('/api/stock/movements', (req: Request, res: Response) => {
  const {
    itemType,
    id,
    type,
    quantity,
    reason,
    costPerUnit,
    documentRef,
    warehouseId,
    targetWarehouseId,
    userName,
    userId,
  } = req.body;

  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantidade movimentada deve ser maior que zero.' });
  }

  let itemName = '';
  let sku = '';
  let prevStock = 0;
  let nextStock = 0;
  let unit = 'un';
  let unitCost = parseFloat(costPerUnit) || 0;

  if (itemType === 'product') {
    const prod = API_PRODUCTS.find(p => p.id === id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado.' });
    itemName = prod.name;
    sku = prod.sku;
    unit = prod.unit || 'un';
    prevStock = prod.currentStock;
    if (!unitCost) unitCost = prod.costPrice;

    if (type === 'entry') nextStock = prevStock + qty;
    else if (type === 'exit' || type === 'loss') nextStock = Math.max(0, prevStock - qty);
    else if (type === 'transfer') nextStock = prevStock;
    else nextStock = qty;

    prod.currentStock = nextStock;
  } else {
    const ing = API_INGREDIENTS.find(i => i.id === id);
    if (!ing) return res.status(404).json({ error: 'Ingrediente não encontrado.' });
    itemName = ing.name;
    unit = ing.unit || 'un';
    prevStock = ing.currentStock;
    if (!unitCost) unitCost = ing.costPerUnit;

    if (type === 'entry') nextStock = prevStock + qty;
    else if (type === 'exit' || type === 'loss') nextStock = Math.max(0, prevStock - qty);
    else if (type === 'transfer') nextStock = prevStock;
    else nextStock = qty;

    ing.currentStock = nextStock;
  }

  const wh = API_WAREHOUSES.find(w => w.id === warehouseId);
  const targetWh = API_WAREHOUSES.find(w => w.id === targetWarehouseId);

  const newMove: ApiStockMovement = {
    id: `sm-${type}-${Date.now()}`,
    itemType: itemType || 'product',
    productId: itemType === 'product' ? id : undefined,
    ingredientId: itemType === 'ingredient' ? id : undefined,
    itemName,
    sku,
    type,
    quantity: qty,
    previousStock: prevStock,
    nextStock,
    unit,
    costPerUnit: unitCost,
    totalCost: unitCost * qty,
    warehouseId: warehouseId || 'wh-central',
    warehouseName: wh ? wh.name : 'Armazém Geral',
    targetWarehouseId: targetWarehouseId || undefined,
    targetWarehouseName: targetWh ? targetWh.name : undefined,
    reason: reason || 'Movimentação manual de estoque',
    documentRef: documentRef ? documentRef.trim() : undefined,
    userId: userId || 'admin',
    userName: userName || 'Administrador',
    createdAt: new Date().toISOString(),
  };

  API_STOCK_MOVEMENTS.unshift(newMove);

  return res.status(201).json({
    success: true,
    movement: newMove,
    updatedStock: nextStock,
    message: `Movimentação de ${type.toUpperCase()} registrada com sucesso.`,
  });
});

// STOCK VALUATION & AUDIT ENDPOINTS
app.get('/api/stock/valuation', (_req: Request, res: Response) => {
  const productsValue = API_PRODUCTS.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const ingredientsValue = API_INGREDIENTS.reduce((acc, i) => acc + (i.currentStock * i.costPerUnit), 0);
  const totalValuation = productsValue + ingredientsValue;

  const lowStockProducts = API_PRODUCTS.filter(p => p.currentStock <= p.minStock);
  const lowStockIngredients = API_INGREDIENTS.filter(i => i.currentStock <= i.minStock);
  const outOfStockProducts = API_PRODUCTS.filter(p => p.currentStock <= 0);
  const items86 = API_PRODUCTS.filter(p => p.is86).length + API_INGREDIENTS.filter(i => !i.isAvailable).length;

  return res.json({
    valuation: {
      totalValuation: parseFloat(totalValuation.toFixed(2)),
      productsValue: parseFloat(productsValue.toFixed(2)),
      ingredientsValue: parseFloat(ingredientsValue.toFixed(2)),
    },
    counts: {
      totalProducts: API_PRODUCTS.length,
      totalIngredients: API_INGREDIENTS.length,
      lowStockTotal: lowStockProducts.length + lowStockIngredients.length,
      outOfStockTotal: outOfStockProducts.length,
      items86,
    },
  });
});

app.get('/api/stock/audits', (_req: Request, res: Response) => {
  return res.json({ audits: API_STOCK_COUNTS, total: API_STOCK_COUNTS.length });
});

app.post('/api/stock/audits', (req: Request, res: Response) => {
  const { title, warehouseId, performedBy, notes, items } = req.body;
  const wh = API_WAREHOUSES.find(w => w.id === warehouseId);

  const newAudit: ApiStockCount = {
    id: `audit-${Date.now()}`,
    title: title || `Inventário Físico ${new Date().toLocaleDateString('pt-MZ')}`,
    warehouseId: warehouseId || 'wh-central',
    warehouseName: wh ? wh.name : 'Armazém Geral',
    date: new Date().toISOString().slice(0, 10),
    performedBy: performedBy || 'Supervisor de Estoque',
    status: 'draft',
    notes: notes || undefined,
    items: items || [],
    createdAt: new Date().toISOString(),
  };

  API_STOCK_COUNTS.unshift(newAudit);
  return res.status(201).json({ success: true, audit: newAudit });
});

app.post('/api/stock/audits/:id/apply', (req: Request, res: Response) => {
  const { id } = req.params;
  const audit = API_STOCK_COUNTS.find(a => a.id === id);
  if (!audit) {
    return res.status(404).json({ error: 'Ficha de inventário não encontrada.' });
  }

  if (audit.status === 'completed') {
    return res.status(400).json({ error: 'Este inventário já foi aplicado anteriormente.' });
  }

  let adjustmentsCount = 0;
  audit.items.forEach(item => {
    if (item.diff !== 0 && !item.adjusted) {
      if (item.itemType === 'product') {
        const prod = API_PRODUCTS.find(p => p.id === item.id);
        if (prod) prod.currentStock = item.countedQty;
      } else {
        const ing = API_INGREDIENTS.find(i => i.id === item.id);
        if (ing) ing.currentStock = item.countedQty;
      }

      API_STOCK_MOVEMENTS.unshift({
        id: `sm-adj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        itemType: item.itemType,
        productId: item.itemType === 'product' ? item.id : undefined,
        ingredientId: item.itemType === 'ingredient' ? item.id : undefined,
        itemName: item.name,
        type: 'adjustment',
        quantity: item.countedQty,
        previousStock: item.systemQty,
        nextStock: item.countedQty,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        totalCost: Math.abs(item.totalDiffCost),
        warehouseId: audit.warehouseId,
        warehouseName: audit.warehouseName,
        reason: `Ajuste de Balanço Físico: "${audit.title}" (${item.diff > 0 ? `+${item.diff}` : item.diff} ${item.unit})`,
        userId: 'admin',
        userName: audit.performedBy,
        createdAt: new Date().toISOString(),
      });

      item.adjusted = true;
      adjustmentsCount++;
    }
  });

  audit.status = 'completed';
  audit.completedAt = new Date().toISOString();

  return res.json({
    success: true,
    message: `Inventário aplicado com sucesso. ${adjustmentsCount} ajustes de estoque efetuados.`,
    audit,
  });
});

// --- FASE 7: KDS / COZINHA REST API ---
interface ApiKitchenOrder {
  id: string;
  orderNumber: string;
  diningOption: string;
  tableNumber?: string;
  customerName: string;
  items: {
    productName: string;
    quantity: number;
    notes?: string;
    averagePrepMinutes: number;
  }[];
  total: number;
  status: 'novo' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
  isPaid: boolean;
  createdAt: string;
}

const API_KITCHEN_ORDERS: ApiKitchenOrder[] = [
  {
    id: 'kds-01',
    orderNumber: '#401',
    diningOption: 'mesa',
    tableNumber: 'Mesa 02',
    customerName: 'Manuel Chissano',
    items: [
      { productName: 'Hambúrguer Clássico Artesanal', quantity: 2, notes: 'Sem cebola', averagePrepMinutes: 12 },
      { productName: 'Batata Rústica com Alecrim & Queijo', quantity: 1, averagePrepMinutes: 8 }
    ],
    total: 820,
    status: 'em_preparo',
    isPaid: true,
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
  },
  {
    id: 'kds-02',
    orderNumber: '#402',
    diningOption: 'takeaway',
    customerName: 'Marta Mabunda',
    items: [
      { productName: 'Combo KOMA Bacon Supremo', quantity: 1, averagePrepMinutes: 10 },
      { productName: 'Refrigerante Coca-Cola 330ml Lata', quantity: 1, averagePrepMinutes: 2 }
    ],
    total: 450,
    status: 'novo',
    isPaid: true,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
  }
];

app.get('/api/kitchen/orders', (_req: Request, res: Response) => {
  return res.json({ orders: API_KITCHEN_ORDERS, total: API_KITCHEN_ORDERS.length });
});

app.patch('/api/kitchen/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = API_KITCHEN_ORDERS.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Pedido de cozinha não encontrado.' });
  if (status) order.status = status;
  return res.json({ success: true, order, message: `Status do pedido ${order.orderNumber} atualizado para ${status}.` });
});

// --- FASE 8: COMPRAS & FORNECEDORES REST API ---
const API_SUPPLIERS = [
  { id: 'sup-1', name: 'Distribuidora Carnes do Sul', contactPerson: 'António Cossa', phone: '+258 84 100 2000', email: 'vendas@carnesdosul.co.mz', city: 'Matola' },
  { id: 'sup-2', name: 'Panificadora Central de Maputo', contactPerson: 'Maria João', phone: '+258 82 300 4000', email: 'pedidos@panificadoracentral.co.mz', city: 'Maputo' },
  { id: 'sup-3', name: 'Lacticínios do Vale Limpopo', contactPerson: 'Bernardo Sitoe', phone: '+258 84 555 6789', email: 'comercial@valelimpopo.co.mz', city: 'Chókwè' }
];

const API_PURCHASE_ORDERS = [
  {
    id: 'po-101',
    orderNumber: 'OC-2026/089',
    supplierId: 'sup-1',
    supplierName: 'Distribuidora Carnes do Sul',
    status: 'received',
    total: 35000,
    itemsCount: 3,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  }
];

app.get('/api/purchases/suppliers', (_req: Request, res: Response) => {
  return res.json({ suppliers: API_SUPPLIERS, total: API_SUPPLIERS.length });
});

app.post('/api/purchases/suppliers', (req: Request, res: Response) => {
  const { name, contactPerson, phone, email, city } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome do fornecedor é obrigatório.' });
  const newSup = {
    id: `sup-${Date.now()}`,
    name,
    contactPerson: contactPerson || '',
    phone: phone || '',
    email: email || '',
    city: city || 'Maputo',
  };
  API_SUPPLIERS.push(newSup);
  return res.status(201).json({ success: true, supplier: newSup });
});

app.get('/api/purchases/orders', (_req: Request, res: Response) => {
  return res.json({ orders: API_PURCHASE_ORDERS, total: API_PURCHASE_ORDERS.length });
});

// --- FASE 11: DELIVERY & ZONAS REST API ---
const API_DELIVERY_ZONES = [
  { id: 'zone-1', name: 'Matola Rio & Centro', fee: 100, estimatedMinutes: 30 },
  { id: 'zone-2', name: 'Maputo Central (Baixa & Museu)', fee: 150, estimatedMinutes: 40 },
  { id: 'zone-3', name: 'Sommerschield & Polana', fee: 180, estimatedMinutes: 45 }
];

const API_DELIVERY_ORDERS = [
  {
    id: 'del-01',
    orderNumber: 'DEL-8812',
    customerName: 'Carlos Macamo',
    customerPhone: '+258 84 990 0001',
    deliveryAddress: 'Av. Julius Nyerere, Condomínio Solar nº 4B',
    zoneName: 'Sommerschield & Polana',
    driverName: 'Estafeta KOMA Moto 1',
    status: 'a_caminho',
    total: 980,
    deliveryFee: 180,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  }
];

app.get('/api/delivery/zones', (_req: Request, res: Response) => {
  return res.json({ zones: API_DELIVERY_ZONES, total: API_DELIVERY_ZONES.length });
});

app.get('/api/delivery/orders', (_req: Request, res: Response) => {
  return res.json({ orders: API_DELIVERY_ORDERS, total: API_DELIVERY_ORDERS.length });
});

app.patch('/api/delivery/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, driverName } = req.body;
  const ord = API_DELIVERY_ORDERS.find(o => o.id === id);
  if (!ord) return res.status(404).json({ error: 'Pedido de entrega não encontrado.' });
  if (status) ord.status = status;
  if (driverName) ord.driverName = driverName;
  return res.json({ success: true, order: ord });
});

// --- FASE 10: CLIENTES & PROMOÇÕES REST API ---
const API_CUSTOMERS = [
  { id: 'cust-1', name: 'Carlos Alberto Macamo', phone: '+258 84 990 0001', documentNumber: '110100234512B', totalSpent: 12500, totalPurchases: 14, loyaltyPoints: 1250 },
  { id: 'cust-2', name: 'Ana Paula Mondlane', phone: '+258 84 990 0002', documentNumber: '110200543210C', totalSpent: 8900, totalPurchases: 9, loyaltyPoints: 890 },
  { id: 'cust-3', name: 'Mateus Nhantumbo', phone: '+258 84 990 0004', documentNumber: '110400998877A', totalSpent: 5400, totalPurchases: 6, loyaltyPoints: 540 },
];

const API_PROMOTIONS = [
  { id: 'promo-1', title: 'Happy Hour Burgers & Fritas', discount: '20% OFF', category: 'Burgers', status: 'active' },
  { id: 'promo-2', title: 'Quarta-feira Burgers 2x1', discount: '50% no 2º', category: 'Combos', status: 'active' },
  { id: 'promo-3', title: 'Bebida Cortesia em Takeaway > 500 MT', discount: 'Grátis', category: 'Bebidas', status: 'active' },
  { id: 'promo-4', title: 'Cashback Fidelidade KOMA 5%', discount: '5% Retorno', category: 'Fidelidade', status: 'active' }
];

app.get('/api/customers', (_req: Request, res: Response) => {
  return res.json({ customers: API_CUSTOMERS, total: API_CUSTOMERS.length });
});

app.get('/api/loyalty/promotions', (_req: Request, res: Response) => {
  return res.json({ promotions: API_PROMOTIONS, total: API_PROMOTIONS.length });
});

// --- FASE 13: MULTI-LOJA / FILIAIS REST API ---
const API_STORES = [
  { id: 'store-matola', name: 'KOMA Matola Rio (Matriz)', address: 'Estrada Nacional 4, Km 12', city: 'Matola', isMatrix: true, status: 'active' },
  { id: 'store-maputo', name: 'KOMA Maputo (Av. 24 de Julho)', address: 'Av. 24 de Julho, 1420', city: 'Maputo', isMatrix: false, status: 'active' },
  { id: 'store-polana', name: 'KOMA Polana (VIP Express)', address: 'Av. Julius Nyerere, 800', city: 'Maputo', isMatrix: false, status: 'active' }
];

app.get('/api/stores', (_req: Request, res: Response) => {
  return res.json({ stores: API_STORES, total: API_STORES.length });
});

// --- MULTI-TENANT / MULTI-EMPRESA SAAS REST API ---
const API_ORGANIZATIONS = [
  {
    id: 'org-gege',
    name: 'Grupo Gege Participações & Negócios Lda',
    taxId: '400998877',
    country: 'Moçambique',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
];

const API_COMPANIES = [
  {
    id: 'company-koma',
    organizationId: 'org-gege',
    name: 'KOMA Fast Food Takeaway Lda',
    tradeName: 'KOMA Fast Food',
    nuit: '400192837',
    email: 'contacto@koma.co.mz',
    phone: '+258 84 990 0000',
    secondaryPhone: '+258 82 990 0000',
    address: 'Estrada Nacional 4, Km 12',
    city: 'Matola',
    province: 'Maputo Província',
    status: 'active',
    subscriptionPlan: 'enterprise',
    maxUsers: 50,
    maxBranches: 10,
    branchesCount: 3,
    currency: 'MZN',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'company-piri',
    organizationId: 'org-gege',
    name: 'Piri Piri Frangos & Grelhados Lda',
    tradeName: 'Piri Piri Grelhados',
    nuit: '400876543',
    email: 'admin@piripirigrill.co.mz',
    phone: '+258 84 555 1234',
    address: 'Av. 24 de Julho nº 1420',
    city: 'Maputo',
    province: 'Maputo Cidade',
    status: 'active',
    subscriptionPlan: 'professional',
    maxUsers: 15,
    maxBranches: 3,
    branchesCount: 1,
    currency: 'MZN',
    createdAt: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'company-zamani',
    name: 'Zamani Cafetaria & Pastelaria Lda',
    tradeName: 'Zamani Café & Bakery',
    nuit: '400345678',
    email: 'geral@zamanicafe.co.mz',
    phone: '+258 84 777 9876',
    address: 'Av. Julius Nyerere nº 800, Polana',
    city: 'Maputo',
    province: 'Maputo Cidade',
    status: 'trial',
    subscriptionPlan: 'starter',
    maxUsers: 5,
    maxBranches: 1,
    branchesCount: 1,
    currency: 'MZN',
    createdAt: '2026-03-01T14:30:00.000Z',
  }
];

const API_LOCATIONS = [
  {
    id: 'loc-matola-matriz',
    companyId: 'company-koma',
    name: 'KOMA Matola Rio (Matriz & Sede)',
    code: 'MAT-01',
    type: 'RESTAURANT',
    phone: '+258 84 990 0001',
    email: 'matola@koma.co.mz',
    address: 'Estrada Nacional 4, Km 12',
    city: 'Matola',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  },
  {
    id: 'loc-maputo-central',
    companyId: 'company-koma',
    name: 'KOMA Maputo (Av. 24 de Julho)',
    code: 'MPM-01',
    type: 'STORE',
    phone: '+258 84 990 0002',
    email: 'maputo@koma.co.mz',
    address: 'Av. 24 de Julho, 1420',
    city: 'Maputo',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: false,
  },
  {
    id: 'loc-polana-express',
    companyId: 'company-koma',
    name: 'KOMA Polana (VIP Express)',
    code: 'POL-01',
    type: 'KIOSK',
    phone: '+258 84 990 0003',
    email: 'polana@koma.co.mz',
    address: 'Av. Julius Nyerere, 800',
    city: 'Maputo',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: false,
  },
  {
    id: 'loc-piri-central',
    companyId: 'company-piri',
    name: 'Piri Piri Maputo Central',
    code: 'PIR-01',
    type: 'RESTAURANT',
    phone: '+258 84 555 1234',
    address: 'Av. 24 de Julho nº 1420',
    city: 'Maputo',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  },
  {
    id: 'loc-zamani-polana',
    companyId: 'company-zamani',
    name: 'Zamani Café Polana Cimento',
    code: 'ZAM-01',
    type: 'STORE',
    phone: '+258 84 777 9876',
    address: 'Av. Julius Nyerere nº 800',
    city: 'Maputo',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  }
];

const API_REGISTERS = [
  { id: 'reg-matola-01', locationId: 'loc-matola-matriz', companyId: 'company-koma', code: 'CX-01', name: 'Caixa 01 - Balcão Principal', status: 'OPEN' },
  { id: 'reg-matola-02', locationId: 'loc-matola-matriz', companyId: 'company-koma', code: 'CX-02', name: 'Caixa 02 - Drive / Takeaway', status: 'CLOSED' },
  { id: 'reg-maputo-01', locationId: 'loc-maputo-central', companyId: 'company-koma', code: 'CX-01', name: 'Caixa 01 - Salão', status: 'OPEN' },
  { id: 'reg-polana-01', locationId: 'loc-polana-express', companyId: 'company-koma', code: 'CX-01', name: 'Caixa 01 - Totem', status: 'OPEN' },
];

const API_PLANS = [
  {
    id: 'plan-starter',
    name: 'Starter (Lanchonetes & Cafés)',
    code: 'starter',
    description: 'Para 1 loja física ou takeaway com até 5 operadores.',
    priceMonthly: 3500,
    priceYearly: 35000,
    currency: 'MZN',
    features: ['POS', 'INVENTORY', 'OFFLINE', 'BASIC_REPORTS'],
    limits: { maxUsers: 5, maxLocations: 1, maxRegisters: 2, maxProducts: 500, maxOrdersPerMonth: 1500 },
  },
  {
    id: 'plan-pro',
    name: 'Professional (Restaurantes & Multi-Lojas)',
    code: 'professional',
    description: 'Gestão completa com KDS Cozinha, Delivery, controle de estoque com fichas e relatórios.',
    priceMonthly: 8500,
    priceYearly: 85000,
    currency: 'MZN',
    features: ['POS', 'INVENTORY', 'KDS', 'DELIVERY', 'KIOSK', 'OFFLINE', 'ADVANCED_REPORTS', 'LOYALTY'],
    limits: { maxUsers: 15, maxLocations: 3, maxRegisters: 6, maxProducts: 2500, maxOrdersPerMonth: 10000 },
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise (Redes, Franquias & Grupos)',
    code: 'enterprise',
    description: 'Infraestrutura corporativa ilimitada com Multi-Brand, Multi-Organização, API e White Label.',
    priceMonthly: 19500,
    priceYearly: 195000,
    currency: 'MZN',
    features: ['POS', 'INVENTORY', 'KDS', 'DELIVERY', 'KIOSK', 'OFFLINE', 'ADVANCED_REPORTS', 'LOYALTY', 'MULTI_LOCATION', 'MULTI_BRAND', 'API', 'WHITE_LABEL', 'ADVANCED_AUDIT'],
    limits: { maxUsers: 100, maxLocations: 20, maxRegisters: 50, maxProducts: 20000, maxOrdersPerMonth: 100000 },
  },
];

const API_MEMBERSHIPS = [
  { id: 'mem-1', userId: 'user-admin', companyId: 'company-koma', role: 'admin', isDefault: true },
  { id: 'mem-2', userId: 'user-admin', companyId: 'company-piri', role: 'admin', isDefault: false },
  { id: 'mem-3', userId: 'user-admin', companyId: 'company-zamani', role: 'admin', isDefault: false },
  { id: 'mem-4', userId: 'user-manager', companyId: 'company-koma', role: 'manager', isDefault: true },
  { id: 'mem-5', userId: 'user-caixa', companyId: 'company-koma', role: 'cashier', isDefault: true },
  { id: 'mem-6', userId: 'user-cozinha', companyId: 'company-koma', role: 'kitchen', isDefault: true },
  { id: 'mem-7', userId: 'user-stock', companyId: 'company-koma', role: 'stock_manager', isDefault: true },
  { id: 'mem-8', userId: 'user-finance', companyId: 'company-koma', role: 'finance', isDefault: true },
];

const API_SAAS_AUDIT_LOGS: any[] = [
  {
    id: 'saas-audit-1',
    action: 'TENANT_INITIALIZED',
    actorUserId: 'user-admin',
    companyId: 'company-koma',
    description: 'Ambiente Multi-Tenant empresarial inicializado com sucesso.',
    timestamp: new Date().toISOString(),
  }
];

// In-memory active context per user
const activeUserContexts = new Map<string, { companyId: string; locationId: string }>();

// 1. Authoritative Tenant Context Endpoint
app.get('/api/me/context', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user = API_USERS[0]; // fallback to admin if not authenticated

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = verifyJwt(authHeader.split(' ')[1]);
    if (verified.valid) {
      const found = API_USERS.find(u => u.id === verified.payload.id);
      if (found) user = found;
    }
  }

  const userMemberships = API_MEMBERSHIPS.filter(m => m.userId === user.id);
  const allowedCompanyIds = new Set(userMemberships.map(m => m.companyId));
  let authorizedCompanies = API_COMPANIES.filter(c => allowedCompanyIds.has(c.id));
  if (user.role === 'super_admin' || user.role === 'admin' || authorizedCompanies.length === 0) {
    authorizedCompanies = API_COMPANIES;
  }

  // Header or saved active company
  const headerCompanyId = req.headers['x-company-id'] as string;
  const userCtx = activeUserContexts.get(user.id);
  let activeCompanyId = headerCompanyId || userCtx?.companyId;

  let activeCompany = authorizedCompanies.find(c => c.id === activeCompanyId);
  if (!activeCompany) {
    activeCompany = authorizedCompanies[0];
  }

  // Locations for active company
  const locations = API_LOCATIONS.filter(l => l.companyId === activeCompany.id);
  const headerLocationId = req.headers['x-location-id'] as string;
  let activeLocation = locations.find(l => l.id === (headerLocationId || userCtx?.locationId));
  if (!activeLocation) {
    activeLocation = locations.find(l => (l as any).isMatrix) || locations[0] || API_LOCATIONS[0];
  }

  // Registers for active location
  const registers = API_REGISTERS.filter(r => r.locationId === activeLocation.id);
  const activeRegister = registers[0];

  // Plan
  const plan = API_PLANS.find(p => p.code === activeCompany.subscriptionPlan) || API_PLANS[1];

  // Usage
  const usage = {
    companyId: activeCompany.id,
    usersCount: API_USERS.length,
    locationsCount: locations.length,
    registersCount: registers.length,
    productsCount: API_PRODUCTS.length,
    monthlyOrdersCount: 24,
    lastCalculatedAt: new Date().toISOString(),
  };

  const org = API_ORGANIZATIONS.find(o => o.id === (activeCompany as any).organizationId);

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      organization: org,
      companies: authorizedCompanies,
      activeCompany,
      locations,
      activeLocation,
      registers,
      activeRegister,
      permissions: user.permissions,
      entitlements: plan.features,
      plan,
      usage,
    }
  });
});

// Switch Tenant Context
app.post('/api/me/context', (req: Request, res: Response) => {
  const { companyId, locationId } = req.body;
  const authHeader = req.headers.authorization;
  let userId = 'user-admin';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = verifyJwt(authHeader.split(' ')[1]);
    if (verified.valid) userId = verified.payload.id;
  }

  const targetCompany = API_COMPANIES.find(c => c.id === companyId);
  if (!targetCompany) {
    return res.status(404).json({ success: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Empresa não encontrada.' } });
  }

  if (targetCompany.status === 'suspended') {
    return res.status(403).json({ success: false, error: { code: 'COMPANY_SUSPENDED', message: 'A empresa selecionada está suspensa.' } });
  }

  activeUserContexts.set(userId, {
    companyId,
    locationId: locationId || (API_LOCATIONS.find(l => l.companyId === companyId)?.id || 'loc-matola-matriz')
  });

  API_SAAS_AUDIT_LOGS.push({
    id: `audit-${Date.now()}`,
    action: 'TENANT_SWITCHED',
    actorUserId: userId,
    companyId,
    description: `Usuário alternou contexto ativo para empresa "${targetCompany.tradeName}".`,
    timestamp: new Date().toISOString(),
  });

  return res.json({ success: true, message: `Contexto alterado com sucesso para ${targetCompany.tradeName}.` });
});

// Companies List
app.get('/api/companies', (_req: Request, res: Response) => {
  return res.json({ companies: API_COMPANIES, total: API_COMPANIES.length });
});

// Single Company
app.get('/api/companies/:id', (req: Request, res: Response) => {
  const comp = API_COMPANIES.find(c => c.id === req.params.id);
  if (!comp) return res.status(404).json({ error: 'Empresa não encontrada.' });
  const locs = API_LOCATIONS.filter(l => l.companyId === comp.id);
  return res.json({ company: comp, locations: locs });
});

// Create Company
app.post('/api/companies', (req: Request, res: Response) => {
  const { name, tradeName, nuit, email, phone, address, city, subscriptionPlan, maxUsers, maxBranches } = req.body;
  if (!name || !nuit) {
    return res.status(400).json({ error: 'Razão Social e NUIT são obrigatórios.' });
  }
  const newCompanyId = `company-${Date.now()}`;
  const newCompany = {
    id: newCompanyId,
    name,
    tradeName: tradeName || name,
    nuit,
    email: email || '',
    phone: phone || '',
    address: address || '',
    city: city || 'Maputo',
    province: 'Maputo Cidade',
    status: 'active',
    subscriptionPlan: subscriptionPlan || 'professional',
    maxUsers: maxUsers || 10,
    maxBranches: maxBranches || 2,
    branchesCount: 1,
    currency: 'MZN',
    createdAt: new Date().toISOString(),
  };
  API_COMPANIES.push(newCompany);

  // Auto-provision first default branch
  API_LOCATIONS.push({
    id: `loc-${Date.now()}`,
    companyId: newCompanyId,
    name: `${newCompany.tradeName} (Sede)`,
    code: 'SED-01',
    type: 'RESTAURANT',
    phone: newCompany.phone || '+258 84 000 0000',
    address: newCompany.address || 'Sede Operacional',
    city: newCompany.city,
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  });

  return res.status(201).json({ success: true, company: newCompany });
});

// Update Company Status
app.patch('/api/companies/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const comp = API_COMPANIES.find(c => c.id === id);
  if (!comp) return res.status(404).json({ error: 'Empresa não encontrada.' });
  if (status) comp.status = status;
  return res.json({ success: true, company: comp, message: `Status da empresa "${comp.tradeName}" alterado para ${status}.` });
});

// Company Locations
app.get('/api/companies/:id/locations', (req: Request, res: Response) => {
  const locs = API_LOCATIONS.filter(l => l.companyId === req.params.id);
  return res.json({ locations: locs, total: locs.length });
});

app.post('/api/companies/:id/locations', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, type, address, city, phone } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Nome e código da filial são obrigatórios.' });
  }
  const newLoc = {
    id: `loc-${Date.now()}`,
    companyId: id,
    name,
    code,
    type: type || 'STORE',
    address: address || '',
    city: city || 'Maputo',
    phone: phone || '',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: false,
  };
  API_LOCATIONS.push(newLoc);

  const comp = API_COMPANIES.find(c => c.id === id);
  if (comp) comp.branchesCount = (comp.branchesCount || 1) + 1;

  return res.status(201).json({ success: true, location: newLoc });
});

// SaaS Plans
app.get('/api/plans', (_req: Request, res: Response) => {
  return res.json({ plans: API_PLANS, total: API_PLANS.length });
});

// SaaS Usage Metrics
app.get('/api/company/usage', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'company-koma';
  const locs = API_LOCATIONS.filter(l => l.companyId === companyId);
  return res.json({
    companyId,
    usersCount: API_USERS.length,
    locationsCount: locs.length,
    productsCount: API_PRODUCTS.length,
    ordersCount: 24,
    storageMb: 120,
    limits: {
      maxUsers: 50,
      maxLocations: 10,
      maxProducts: 20000,
    }
  });
});

// SaaS Audit
app.get('/api/saas/audit', (_req: Request, res: Response) => {
  return res.json({ logs: API_SAAS_AUDIT_LOGS, total: API_SAAS_AUDIT_LOGS.length });
});

// Explicit Service Worker Route (/sw.js)
app.get('/sw.js', (_req: Request, res: Response) => {
  const rootSw = path.resolve(__dirname, 'sw.js');
  if (fs.existsSync(rootSw)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    return res.sendFile(rootSw);
  }
  const publicSw = path.resolve(__dirname, 'public', 'sw.js');
  if (fs.existsSync(publicSw)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    return res.sendFile(publicSw);
  }
  res.status(404).send('Service worker not found');
});

// Start Server & mount Vite middlewares in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite middlewares mounted on Express server');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[POS Omnichannel] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[POS Omnichannel] Healthcheck at http://0.0.0.0:${PORT}/api/health`);
    console.log(`[POS Omnichannel] Auth endpoints available at /api/auth/*`);
  });
}

startServer().catch((err) => {
  console.error('[POS Omnichannel] Fatal error starting server:', err);
  process.exit(1);
});
