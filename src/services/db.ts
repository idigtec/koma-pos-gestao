import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  User,
  Category,
  Product,
  Customer,
  Sale,
  CashSession,
  CashMovement,
  StockMovement,
  StockMovementType,
  FinancialTransaction,
  AuditLog,
  CompanySettings,
  CartItem,
  PaymentItem,
  Ingredient,
  Supplier,
  StockLoss,
  StockCount,
  StockCountItem,
  Warehouse,
  KitchenOrder,
  KitchenStatus,
  DiningOption,
  SyncQueueItem,
  DiningTable,
  ComandaTab,
  PurchaseOrder,
  PurchaseOrderItem,
  LoyaltyAccount,
  PromotionCoupon,
  DeliveryZone,
  DeliveryOrder,
  Company,
  CompanyStatus,
  Organization,
  Brand,
  Location,
  Register,
  UserCompanyMembership,
  UserLocationMembership,
  Plan,
  Subscription,
  CompanyUsage,
  TenantContext,
  PermissionKey
} from '../types';
import { generateSaleNumber } from '../utils/formatters';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-gege',
    name: 'Grupo Gege Participações & Negócios Lda',
    taxId: '400998877',
    country: 'Moçambique',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'company-koma',
    organizationId: 'org-gege',
    name: 'KOMA Fast Food Takeaway Lda',
    tradeName: 'KOMA Fast Food',
    nuit: '400192837',
    email: 'contacto@koma.co.mz',
    phone: '+258 84 990 0000',
    secondaryPhone: '+258 82 990 0000',
    address: 'Estrada Nacional 4, Km 12, Matola Rio',
    city: 'Matola',
    province: 'Maputo Província',
    status: 'active',
    subscriptionPlan: 'enterprise',
    maxUsers: 50,
    maxBranches: 10,
    branchesCount: 3,
    currency: 'MZN',
    createdAt: '2026-01-10T08:00:00.000Z',
    notes: 'Empresa Principal Matriz da rede KOMA Fast Food.',
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
    notes: 'Franquia especializada em frangos na brasa e takeaway rápido.',
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
    notes: 'Período de teste de 30 dias para gestão de padaria e POS touch.',
  },
];

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-koma',
    companyId: 'company-koma',
    name: 'KOMA Fast Food',
    primaryColor: '#ea580c',
    secondaryColor: '#f97316',
    description: 'Rede de Fast Food com burgers artesanais, frango frito e batatas rústicas.',
    status: 'active',
  },
  {
    id: 'brand-koma-express',
    companyId: 'company-koma',
    name: 'KOMA Express Kiosk',
    primaryColor: '#c2410c',
    secondaryColor: '#ea580c',
    description: 'Quiosques de atendimento expresso em centros comerciais e postos.',
    status: 'active',
  },
  {
    id: 'brand-piri',
    companyId: 'company-piri',
    name: 'Piri Piri Grill House',
    primaryColor: '#dc2626',
    secondaryColor: '#ef4444',
    description: 'Churrasqueira tradicional moçambicana com frango no carvão.',
    status: 'active',
  },
  {
    id: 'brand-zamani',
    companyId: 'company-zamani',
    name: 'Zamani Café & Bakery',
    primaryColor: '#d97706',
    secondaryColor: '#f59e0b',
    description: 'Cafés especiais, confeitaria fina e pães artesanais.',
    status: 'active',
  },
];

export const INITIAL_LOCATIONS: Location[] = [
  {
    id: 'loc-matola-matriz',
    companyId: 'company-koma',
    brandId: 'brand-koma',
    name: 'KOMA Matola Rio (Matriz & Sede)',
    code: 'MAT-01',
    type: 'RESTAURANT',
    phone: '+258 84 990 0001',
    email: 'matola@koma.co.mz',
    address: 'Estrada Nacional 4, Km 12',
    city: 'Matola',
    province: 'Maputo Província',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  },
  {
    id: 'loc-maputo-central',
    companyId: 'company-koma',
    brandId: 'brand-koma',
    name: 'KOMA Maputo (Av. 24 de Julho)',
    code: 'MPM-01',
    type: 'STORE',
    phone: '+258 84 990 0002',
    email: 'maputo@koma.co.mz',
    address: 'Av. 24 de Julho, nº 1420',
    city: 'Maputo',
    province: 'Maputo Cidade',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: false,
  },
  {
    id: 'loc-polana-express',
    companyId: 'company-koma',
    brandId: 'brand-koma-express',
    name: 'KOMA Polana (VIP Express)',
    code: 'POL-01',
    type: 'KIOSK',
    phone: '+258 84 990 0003',
    email: 'polana@koma.co.mz',
    address: 'Av. Julius Nyerere, nº 800',
    city: 'Maputo',
    province: 'Maputo Cidade',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: false,
  },
  {
    id: 'loc-piri-central',
    companyId: 'company-piri',
    brandId: 'brand-piri',
    name: 'Piri Piri Maputo Central',
    code: 'PIR-01',
    type: 'RESTAURANT',
    phone: '+258 84 555 1234',
    email: 'loja@piripirigrill.co.mz',
    address: 'Av. 24 de Julho nº 1420',
    city: 'Maputo',
    province: 'Maputo Cidade',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  },
  {
    id: 'loc-zamani-polana',
    companyId: 'company-zamani',
    brandId: 'brand-zamani',
    name: 'Zamani Café Polana Cimento',
    code: 'ZAM-01',
    type: 'STORE',
    phone: '+258 84 777 9876',
    email: 'cafe@zamanicafe.co.mz',
    address: 'Av. Julius Nyerere nº 800',
    city: 'Maputo',
    province: 'Maputo Cidade',
    status: 'ACTIVE',
    timezone: 'Africa/Maputo',
    isMatrix: true,
  }
];

export const INITIAL_REGISTERS: Register[] = [
  {
    id: 'reg-matola-01',
    locationId: 'loc-matola-matriz',
    companyId: 'company-koma',
    code: 'CX-01',
    name: 'Caixa 01 - Balcão Principal',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reg-matola-02',
    locationId: 'loc-matola-matriz',
    companyId: 'company-koma',
    code: 'CX-02',
    name: 'Caixa 02 - Drive-thru / Takeaway',
    status: 'CLOSED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reg-maputo-01',
    locationId: 'loc-maputo-central',
    companyId: 'company-koma',
    code: 'CX-01',
    name: 'Caixa 01 - Salão 24 de Julho',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reg-polana-01',
    locationId: 'loc-polana-express',
    companyId: 'company-koma',
    code: 'CX-01',
    name: 'Caixa 01 - Totem / Atendimento Rápido',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-starter',
    name: 'Starter (Pequenos Negócios & Cafés)',
    code: 'starter',
    description: 'Ideal para lanchonetes e takeaways em início de operação com 1 filial.',
    priceMonthly: 3500,
    priceYearly: 35000,
    currency: 'MZN',
    features: ['POS', 'INVENTORY', 'OFFLINE', 'BASIC_REPORTS'],
    limits: {
      maxUsers: 5,
      maxLocations: 1,
      maxRegisters: 2,
      maxProducts: 500,
      maxOrdersPerMonth: 1500,
    },
    status: 'active',
  },
  {
    id: 'plan-pro',
    name: 'Professional (Restaurantes & Multi-Lojas)',
    code: 'professional',
    description: 'Gestão completa com KDS Cozinha, Delivery, controle de estoque com ficha técnica e relatórios.',
    priceMonthly: 8500,
    priceYearly: 85000,
    currency: 'MZN',
    features: ['POS', 'INVENTORY', 'KDS', 'DELIVERY', 'KIOSK', 'OFFLINE', 'ADVANCED_REPORTS', 'LOYALTY'],
    limits: {
      maxUsers: 15,
      maxLocations: 3,
      maxRegisters: 6,
      maxProducts: 2500,
      maxOrdersPerMonth: 10000,
    },
    status: 'active',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise (Redes, Franquias & Grupos)',
    code: 'enterprise',
    description: 'Infraestrutura corporativa ilimitada com Multi-Brand, Multi-Organização, API, White Label e DRE.',
    priceMonthly: 19500,
    priceYearly: 195000,
    currency: 'MZN',
    features: [
      'POS',
      'INVENTORY',
      'KDS',
      'DELIVERY',
      'KIOSK',
      'OFFLINE',
      'ADVANCED_REPORTS',
      'LOYALTY',
      'MULTI_LOCATION',
      'MULTI_BRAND',
      'API',
      'WHITE_LABEL',
      'ADVANCED_AUDIT'
    ],
    limits: {
      maxUsers: 100,
      maxLocations: 20,
      maxRegisters: 50,
      maxProducts: 20000,
      maxOrdersPerMonth: 100000,
    },
    status: 'active',
  },
];

export const INITIAL_MEMBERSHIPS: UserCompanyMembership[] = [
  {
    id: 'mem-admin-koma',
    userId: 'user-admin',
    companyId: 'company-koma',
    role: 'admin',
    isDefault: true,
    status: 'active',
  },
  {
    id: 'mem-admin-piri',
    userId: 'user-admin',
    companyId: 'company-piri',
    role: 'admin',
    isDefault: false,
    status: 'active',
  },
  {
    id: 'mem-admin-zamani',
    userId: 'user-admin',
    companyId: 'company-zamani',
    role: 'admin',
    isDefault: false,
    status: 'active',
  },
  {
    id: 'mem-manager-koma',
    userId: 'user-manager',
    companyId: 'company-koma',
    role: 'manager',
    isDefault: true,
    status: 'active',
  },
  {
    id: 'mem-caixa-koma',
    userId: 'user-caixa',
    companyId: 'company-koma',
    role: 'cashier',
    isDefault: true,
    status: 'active',
  },
  {
    id: 'mem-cozinha-koma',
    userId: 'user-cozinha',
    companyId: 'company-koma',
    role: 'kitchen',
    isDefault: true,
    status: 'active',
  },
  {
    id: 'mem-stock-koma',
    userId: 'user-stock',
    companyId: 'company-koma',
    role: 'stock_manager',
    isDefault: true,
    status: 'active',
  },
  {
    id: 'mem-finance-koma',
    userId: 'user-finance',
    companyId: 'company-koma',
    role: 'finance',
    isDefault: true,
    status: 'active',
  },
];

export const DEFAULT_TABLES: DiningTable[] = [
  { id: 'tbl-01', number: 'Mesa 01', zone: 'salao', capacity: 4, status: 'free' },
  { id: 'tbl-02', number: 'Mesa 02', zone: 'salao', capacity: 2, status: 'free' },
  { id: 'tbl-03', number: 'Mesa 03', zone: 'salao', capacity: 4, status: 'free' },
  { id: 'tbl-04', number: 'Mesa 04', zone: 'salao', capacity: 6, status: 'free' },
  { id: 'tbl-05', number: 'Mesa 05', zone: 'salao', capacity: 4, status: 'free' },
  { id: 'tbl-esp-01', number: 'Esplanada 01', zone: 'esplanada', capacity: 4, status: 'free' },
  { id: 'tbl-esp-02', number: 'Esplanada 02', zone: 'esplanada', capacity: 4, status: 'free' },
  { id: 'tbl-esp-03', number: 'Esplanada 03', zone: 'esplanada', capacity: 6, status: 'free' },
  { id: 'tbl-bal-01', number: 'Balcão 01', zone: 'balcao', capacity: 1, status: 'free' },
  { id: 'tbl-bal-02', number: 'Balcão 02', zone: 'balcao', capacity: 1, status: 'free' },
  { id: 'tbl-bal-03', number: 'Balcão 03', zone: 'balcao', capacity: 1, status: 'free' },
  { id: 'tbl-vip-01', number: 'Sala VIP Polana', zone: 'vip', capacity: 10, status: 'free' },
];

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'zone-polana', name: 'Polana Cimento & Sommerschield', fee: 100, estimatedMinutes: 25, active: true },
  { id: 'zone-baixa', name: 'Baixa de Maputo & Central', fee: 120, estimatedMinutes: 30, active: true },
  { id: 'zone-costa', name: 'Costa do Sol & Triunfo', fee: 150, estimatedMinutes: 35, active: true },
  { id: 'zone-malhangalene', name: 'Malhangalene & Maxaquene', fee: 100, estimatedMinutes: 25, active: true },
  { id: 'zone-matola', name: 'Matola Cidade & Fomento', fee: 250, estimatedMinutes: 45, active: true },
];

export const DEFAULT_COUPONS: PromotionCoupon[] = [
  { id: 'cupom-koma10', code: 'KOMA10', description: '10% de desconto no pedido', discountType: 'percentage', discountValue: 10, minOrderValue: 300, validFrom: '2026-01-01', validUntil: '2026-12-31', timesUsed: 14, status: 'active' },
  { id: 'cupom-combo50', code: 'COMBO50', description: '50 MT de desconto em qualquer Combo', discountType: 'fixed', discountValue: 50, minOrderValue: 400, validFrom: '2026-01-01', validUntil: '2026-12-31', timesUsed: 28, status: 'active' },
  { id: 'cupom-segunda', code: 'SEGUNDAFOOD', description: '15% de desconto especial', discountType: 'percentage', discountValue: 15, minOrderValue: 500, validFrom: '2026-01-01', validUntil: '2026-12-31', timesUsed: 9, status: 'active' },
];

export const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-central',
    name: 'Armazém Geral & Câmara Frigorífica',
    code: 'ALM-01',
    description: 'Armazenamento principal de carnes congeladas, lacticínios e matérias-primas refrigeradas.',
    isDefault: true,
    status: 'active',
    location: 'Setor Traseiro - Edifício Central',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wh-cozinha',
    name: 'Cozinha Principal / Linha de Preparo',
    code: 'COZ-01',
    description: 'Estoque operacional direto da linha quente, fritadeiras e bancadas de montagem.',
    isDefault: false,
    status: 'active',
    location: 'Área de Cocção e Expedição',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wh-bar',
    name: 'Bar, Balcão & Bebidas Geladas',
    code: 'BAR-01',
    description: 'Frigoríficos de bebidas, cervejas 2M, sumos, copos e insumos de balcão.',
    isDefault: false,
    status: 'active',
    location: 'Frente de Atendimento / Caixa',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wh-secos',
    name: 'Depósito Seco & Descartáveis',
    code: 'SEC-01',
    description: 'Caixas de takeaway KOMA, embalagens térmicas, guardanapos, óleos e secos.',
    isDefault: false,
    status: 'active',
    location: 'Almoxarifado Superior',
    createdAt: new Date().toISOString(),
  },
];

// Default initial company settings
export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'KOMA Fast Food Takeaway, Lda.',
  tradingName: 'KOMA Fast Food Takeaway',
  nuit: '400987654',
  phone: '+258 84 123 4567 / +258 82 987 6543',
  email: 'pedidos@koma.co.mz',
  address: 'Av. Julius Nyerere, nº 1420, R/C - Polana Cimento',
  city: 'Maputo',
  province: 'Maputo Cidade',
  currency: 'MT',
  receiptFooterMessage: 'KOMA FAST FOOD TAKEAWAY\nFresh • Tasty • Happy\nObrigado pela sua preferência! Volte sempre.\nDocumento processado por computador.',
  defaultMinStockAlert: 10,
  posMode: 'restaurant',
  posUiMode: 'touch',
  posCardSize: 'large',
  posShowImages: true,
  posShowStock: true,
  posSoundEnabled: true,
  posAutoSendKitchen: true,
};

// Initial Seed Users (Mozambique context)
const INITIAL_USERS: User[] = [
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

// Initial Categories with food icons
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-burgers', name: 'Hambúrgueres & Sanduíches', icon: '🍔', description: 'Hambúrgueres artesanais de carne bovina, frango e vegetarianos', status: 'active', color: 'orange' },
  { id: 'cat-pizzas', name: 'Pizzas Artesanais', icon: '🍕', description: 'Pizzas frescas com massa fina crocante e molho caseiro', status: 'active', color: 'rose' },
  { id: 'cat-pratos', name: 'Pratos & Grelhados', icon: '🍗', description: 'Pratos executivos, frango à zambeziana, bifes e peixe grelhado', status: 'active', color: 'orange' },
  { id: 'cat-acompanhamentos', name: 'Acompanhamentos & Porções', icon: '🍟', description: 'Batatas fritas, aros de cebola e snacks crocantes', status: 'active', color: 'amber' },
  { id: 'cat-petiscos', name: 'Petiscos & Salgados', icon: '🥟', description: 'Chamuças caseiras, rissóis de camarão e asinhas crocantes', status: 'active', color: 'amber' },
  { id: 'cat-combos', name: 'Combos & Menus KOMA', icon: '🔥', description: 'Refeições completas com hambúrguer, batatas e bebida', status: 'active', color: 'red' },
  { id: 'cat-cervejas', name: 'Cervejas & Bar', icon: '🍺', description: 'Cervejas nacionais moçambicanas 2M, Laurentina e bebidas de bar', status: 'active', color: 'amber' },
  { id: 'cat-bebidas', name: 'Bebidas & Refrigerantes', icon: '🥤', description: 'Refrigerantes gelados, sumos naturais, águas e sumos', status: 'active', color: 'blue' },
  { id: 'cat-sobremesas', name: 'Cafetaria & Sobremesas', icon: '☕', description: 'Café expresso moído na hora, donuts e doces', status: 'active', color: 'emerald' },
];

// Initial Suppliers
const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'Armando Cossa',
    company: 'Distribuidora Alimentar de Maputo (DAM)',
    nuit: '400112233',
    phone: '+258 84 333 4455',
    email: 'vendas@dam.co.mz',
    address: 'Zona Industrial da Matola, Armazém 12',
    notes: 'Fornecedor principal de carnes frescas, frango e óleos alimentares',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup-02',
    name: 'Fátima Matusse',
    company: 'Padaria Central & Lacticínios Polana',
    nuit: '400223344',
    phone: '+258 82 444 5566',
    email: 'encomendas@padariapolana.co.mz',
    address: 'Av. 24 de Julho, nº 890, Maputo',
    notes: 'Entrega diária às 06:30 de pães de hambúrguer e fatias de queijo cheddar',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup-03',
    name: 'Tomás Zandamela',
    company: 'Hortifrútis Frescos da Manhiça',
    nuit: '400334455',
    phone: '+258 84 555 6677',
    email: 'horta@manhicafresco.co.mz',
    address: 'Mercado Grossista do Zimpeto, Bancada 45',
    notes: 'Alfaces americanas, tomates de primeira e cebolas roxas selecionadas',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup-04',
    name: 'Gestão de Contas',
    company: 'Coca-Cola Sabco Moçambique & CDM',
    nuit: '400445566',
    phone: '+258 21 789 000',
    email: 'pedidos@cocacola.co.mz',
    address: 'Av. de Moçambique, Km 3.5, Maputo',
    notes: 'Refrigerantes, sumos Minute Maid, águas e cervejas 2M e Laurentina',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

// Initial Ingredients for Technical Recipes (Ficha Técnica)
const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-pao', name: 'Pão de Hambúrguer com Sésamo', category: 'Pães', unit: 'un', currentStock: 250, minStock: 50, costPerUnit: 15, supplierId: 'sup-02', supplierName: 'Padaria Central & Lacticínios Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-carne', name: 'Hambúrguer Bovino 150g Fresco', category: 'Carnes', unit: 'un', currentStock: 200, minStock: 40, costPerUnit: 70, supplierId: 'sup-01', supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-queijo', name: 'Queijo Cheddar em Fatias', category: 'Lacticínios', unit: 'un', currentStock: 450, minStock: 80, costPerUnit: 12, supplierId: 'sup-02', supplierName: 'Padaria Central & Lacticínios Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-alface', name: 'Alface Americana Fresca', category: 'Vegetais', unit: 'g', currentStock: 6000, minStock: 1200, costPerUnit: 0.1, supplierId: 'sup-03', supplierName: 'Hortifrútis Frescos da Manhiça', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-tomate', name: 'Tomate Fresco em Rodelas', category: 'Vegetais', unit: 'g', currentStock: 5000, minStock: 1000, costPerUnit: 0.12, supplierId: 'sup-03', supplierName: 'Hortifrútis Frescos da Manhiça', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-cebola', name: 'Cebola Roxa Fatiada', category: 'Vegetais', unit: 'g', currentStock: 4000, minStock: 800, costPerUnit: 0.08, supplierId: 'sup-03', supplierName: 'Hortifrútis Frescos da Manhiça', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-molho', name: 'Molho Secreto KOMA da Casa', category: 'Molhos', unit: 'ml', currentStock: 8000, minStock: 1500, costPerUnit: 0.25, supplierId: 'sup-01', supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-bacon', name: 'Bacon Fumado em Tiras', category: 'Carnes', unit: 'un', currentStock: 300, minStock: 50, costPerUnit: 25, supplierId: 'sup-01', supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-batata', name: 'Batata Palito Pré-Frita Crocante', category: 'Vegetais', unit: 'g', currentStock: 30000, minStock: 5000, costPerUnit: 0.09, supplierId: 'sup-01', supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-massa-pizza', name: 'Massa Artesanal de Pizza Média', category: 'Massas', unit: 'un', currentStock: 80, minStock: 20, costPerUnit: 50, supplierId: 'sup-02', supplierName: 'Padaria Central & Lacticínios Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-mozzarella', name: 'Queijo Mozzarella Ralado', category: 'Lacticínios', unit: 'g', currentStock: 10000, minStock: 2000, costPerUnit: 0.45, supplierId: 'sup-02', supplierName: 'Padaria Central & Lacticínios Polana', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-frango-piri', name: 'Frango Desfiado com Piri-Piri', category: 'Carnes', unit: 'g', currentStock: 7500, minStock: 1500, costPerUnit: 0.35, supplierId: 'sup-01', supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
  { id: 'ing-embalagem', name: 'Embalagem Térmica Takeaway KOMA', category: 'Descartáveis', unit: 'un', currentStock: 600, minStock: 100, costPerUnit: 10, supplierId: 'sup-01', supplierName: 'Distribuidora Alimentar de Maputo', isAvailable: true, status: 'active', createdAt: new Date().toISOString() },
];

// Initial Food Products with Images, Recipes, and Modifiers
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-koma-special',
    sku: 'BUR-001',
    barcode: '600200100001',
    name: 'Hambúrguer KOMA Especial',
    description: 'Pão brioche com sésamo, carne 150g grelhada no ponto, queijo cheddar derretido, alface fresca, tomate, cebola roxa e molho especial KOMA.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 150,
    sellingPrice: 320,
    currentStock: 95,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 10,
    displayOrder: 1,
    recipe: [
      { ingredientId: 'ing-pao', ingredientName: 'Pão de Hambúrguer com Sésamo', quantity: 1, unit: 'un', costContribution: 15 },
      { ingredientId: 'ing-carne', ingredientName: 'Hambúrguer Bovino 150g Fresco', quantity: 1, unit: 'un', costContribution: 70 },
      { ingredientId: 'ing-queijo', ingredientName: 'Queijo Cheddar em Fatias', quantity: 1, unit: 'un', costContribution: 12 },
      { ingredientId: 'ing-alface', ingredientName: 'Alface Americana Fresca', quantity: 25, unit: 'g', costContribution: 2.5 },
      { ingredientId: 'ing-tomate', ingredientName: 'Tomate Fresco em Rodelas', quantity: 30, unit: 'g', costContribution: 3.6 },
      { ingredientId: 'ing-cebola', ingredientName: 'Cebola Roxa Fatiada', quantity: 20, unit: 'g', costContribution: 1.6 },
      { ingredientId: 'ing-molho', ingredientName: 'Molho Secreto KOMA da Casa', quantity: 25, unit: 'ml', costContribution: 6.25 },
      { ingredientId: 'ing-embalagem', ingredientName: 'Embalagem Térmica Takeaway KOMA', quantity: 1, unit: 'un', costContribution: 10 },
    ],
    modifierGroups: [
      {
        id: 'mod-remover',
        name: 'Remover Ingredientes',
        required: false,
        minSelections: 0,
        maxSelections: 5,
        allowMultiple: true,
        options: [
          { id: 'rem-cebola', name: 'Sem Cebola', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-cebola' },
          { id: 'rem-tomate', name: 'Sem Tomate', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-tomate' },
          { id: 'rem-alface', name: 'Sem Alface', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-alface' },
          { id: 'rem-queijo', name: 'Sem Queijo', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-queijo' },
          { id: 'rem-molho', name: 'Sem Molho', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-molho' },
        ],
      },
      {
        id: 'mod-extras',
        name: 'Extras & Adicionais',
        required: false,
        minSelections: 0,
        maxSelections: 4,
        allowMultiple: true,
        options: [
          { id: 'add-queijo', name: 'Extra Queijo Cheddar (+30 MT)', type: 'add', priceAdjustment: 30, ingredientId: 'ing-queijo', inventoryEffectQuantity: 1 },
          { id: 'add-bacon', name: 'Extra Bacon Fumado (+80 MT)', type: 'add', priceAdjustment: 80, ingredientId: 'ing-bacon', inventoryEffectQuantity: 2 },
          { id: 'add-carne', name: 'Carne Extra 150g (+100 MT)', type: 'add', priceAdjustment: 100, ingredientId: 'ing-carne', inventoryEffectQuantity: 1 },
          { id: 'add-molho', name: 'Molho à Parte (+20 MT)', type: 'add', priceAdjustment: 20, ingredientId: 'ing-molho', inventoryEffectQuantity: 30 },
        ],
      },
      {
        id: 'mod-ponto',
        name: 'Ponto da Carne',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        allowMultiple: false,
        options: [
          { id: 'pt-bem', name: 'Bem Passado', type: 'choose', priceAdjustment: 0, isDefault: true },
          { id: 'pt-medio', name: 'Ao Ponto', type: 'choose', priceAdjustment: 0 },
          { id: 'pt-mal', name: 'Mal Passado', type: 'choose', priceAdjustment: 0 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cheeseburger-bacon',
    sku: 'BUR-002',
    barcode: '600200100002',
    name: 'Cheeseburger Duplo Bacon Crocante',
    description: 'Dois suculentos hambúrgueres bovinos, fatias duplas de queijo cheddar derretido, tiras de bacon crocante e cebola caramelizada.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 210,
    sellingPrice: 420,
    currentStock: 60,
    minStock: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 12,
    displayOrder: 2,
    recipe: [
      { ingredientId: 'ing-pao', ingredientName: 'Pão de Hambúrguer com Sésamo', quantity: 1, unit: 'un', costContribution: 15 },
      { ingredientId: 'ing-carne', ingredientName: 'Hambúrguer Bovino 150g Fresco', quantity: 2, unit: 'un', costContribution: 140 },
      { ingredientId: 'ing-queijo', ingredientName: 'Queijo Cheddar em Fatias', quantity: 2, unit: 'un', costContribution: 24 },
      { ingredientId: 'ing-bacon', ingredientName: 'Bacon Fumado em Tiras', quantity: 3, unit: 'un', costContribution: 75 },
      { ingredientId: 'ing-molho', ingredientName: 'Molho Secreto KOMA da Casa', quantity: 30, unit: 'ml', costContribution: 7.5 },
    ],
    modifierGroups: [
      {
        id: 'mod-remover-bacon',
        name: 'Remover Ingredientes',
        required: false,
        minSelections: 0,
        maxSelections: 3,
        allowMultiple: true,
        options: [
          { id: 'rem-bacon', name: 'Sem Bacon', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-bacon' },
          { id: 'rem-queijo2', name: 'Sem Queijo', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-queijo' },
          { id: 'rem-molho2', name: 'Sem Molho', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-molho' },
        ],
      },
      {
        id: 'mod-extras-bacon',
        name: 'Extras & Adicionais',
        required: false,
        minSelections: 0,
        maxSelections: 2,
        allowMultiple: true,
        options: [
          { id: 'add-queijo-b', name: 'Extra Queijo (+30 MT)', type: 'add', priceAdjustment: 30, ingredientId: 'ing-queijo', inventoryEffectQuantity: 1 },
          { id: 'add-bacon-b', name: 'Extra Bacon (+80 MT)', type: 'add', priceAdjustment: 80, ingredientId: 'ing-bacon', inventoryEffectQuantity: 2 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-pizza-piri',
    sku: 'PIZ-001',
    barcode: '600200100003',
    name: 'Pizza Moçambicana Frango Piri-Piri',
    description: 'Massa artesanal fina, molho de tomate temperado, bastante queijo mozzarella e frango desfiado com o autêntico piri-piri de Maputo.',
    categoryId: 'cat-pizzas',
    categoryName: 'Pizzas Artesanais',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 240,
    sellingPrice: 580,
    currentStock: 40,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 18,
    displayOrder: 3,
    recipe: [
      { ingredientId: 'ing-massa-pizza', ingredientName: 'Massa Artesanal de Pizza Média', quantity: 1, unit: 'un', costContribution: 50 },
      { ingredientId: 'ing-mozzarella', ingredientName: 'Queijo Mozzarella Ralado', quantity: 180, unit: 'g', costContribution: 81 },
      { ingredientId: 'ing-frango-piri', ingredientName: 'Frango Desfiado com Piri-Piri', quantity: 200, unit: 'g', costContribution: 70 },
      { ingredientId: 'ing-cebola', ingredientName: 'Cebola Roxa Fatiada', quantity: 30, unit: 'g', costContribution: 2.4 },
    ],
    modifierGroups: [
      {
        id: 'mod-picante',
        name: 'Nível de Piri-Piri (Picante)',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        allowMultiple: false,
        options: [
          { id: 'pic-medio', name: 'Picante Moderado', type: 'choose', priceAdjustment: 0, isDefault: true },
          { id: 'pic-forte', name: 'Muito Picante (Piri-Piri Extra)', type: 'choose', priceAdjustment: 0 },
          { id: 'pic-sem', name: 'Sem Piri-Piri (Suave)', type: 'choose', priceAdjustment: 0 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-batata-rustica',
    sku: 'ACO-001',
    barcode: '600200100004',
    name: 'Batatas Fritas Crocantes KOMA (Grande)',
    description: 'Porção generosa de batatas douradas e estaladiças, temperadas com sal marinho especial e ervas da casa.',
    categoryId: 'cat-acompanhamentos',
    categoryName: 'Acompanhamentos & Porções',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 45,
    sellingPrice: 120,
    currentStock: 150,
    minStock: 25,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 6,
    displayOrder: 4,
    recipe: [
      { ingredientId: 'ing-batata', ingredientName: 'Batata Palito Pré-Frita Crocante', quantity: 280, unit: 'g', costContribution: 25.2 },
      { ingredientId: 'ing-embalagem', ingredientName: 'Embalagem Térmica Takeaway KOMA', quantity: 1, unit: 'un', costContribution: 10 },
    ],
    modifierGroups: [
      {
        id: 'mod-batata-extras',
        name: 'Molho para Acompanhar',
        required: false,
        minSelections: 0,
        maxSelections: 2,
        allowMultiple: true,
        options: [
          { id: 'add-maionese', name: 'Molho de Alho Especial (+20 MT)', type: 'add', priceAdjustment: 20 },
          { id: 'add-queijo-melt', name: 'Queijo Cheddar Cremoso por Cima (+40 MT)', type: 'add', priceAdjustment: 40, ingredientId: 'ing-queijo', inventoryEffectQuantity: 1 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-combo-koma',
    sku: 'CMB-001',
    barcode: '600200100005',
    name: 'Combo KOMA Burger + Batata + Refresco',
    description: 'Menu completo com Hambúrguer KOMA Especial, batatas fritas crocantes quentinhas e refresco Coca-Cola 330ml gelado.',
    categoryId: 'cat-combos',
    categoryName: 'Combos & Menus KOMA',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 220,
    sellingPrice: 480,
    currentStock: 80,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFE4E6',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    isCombo: true,
    averagePrepMinutes: 10,
    displayOrder: 5,
    comboItems: [
      { productId: 'prod-koma-special', name: 'Hambúrguer KOMA Especial', quantity: 1 },
      { productId: 'prod-batata-rustica', name: 'Batatas Fritas Crocantes KOMA', quantity: 1 },
      { productId: 'prod-coca-330', name: 'Coca-Cola 330ml (Lata)', quantity: 1 },
    ],
    recipe: [
      { ingredientId: 'ing-pao', ingredientName: 'Pão de Hambúrguer com Sésamo', quantity: 1, unit: 'un', costContribution: 15 },
      { ingredientId: 'ing-carne', ingredientName: 'Hambúrguer Bovino 150g Fresco', quantity: 1, unit: 'un', costContribution: 70 },
      { ingredientId: 'ing-queijo', ingredientName: 'Queijo Cheddar em Fatias', quantity: 1, unit: 'un', costContribution: 12 },
      { ingredientId: 'ing-alface', ingredientName: 'Alface Americana Fresca', quantity: 20, unit: 'g', costContribution: 2 },
      { ingredientId: 'ing-tomate', ingredientName: 'Tomate Fresco em Rodelas', quantity: 20, unit: 'g', costContribution: 2.4 },
      { ingredientId: 'ing-cebola', ingredientName: 'Cebola Roxa Fatiada', quantity: 15, unit: 'g', costContribution: 1.2 },
      { ingredientId: 'ing-molho', ingredientName: 'Molho Secreto KOMA da Casa', quantity: 20, unit: 'ml', costContribution: 5 },
      { ingredientId: 'ing-batata', ingredientName: 'Batata Palito Pré-Frita Crocante', quantity: 200, unit: 'g', costContribution: 18 },
      { ingredientId: 'ing-embalagem', ingredientName: 'Embalagem Térmica Takeaway KOMA', quantity: 1, unit: 'un', costContribution: 10 },
    ],
    modifierGroups: [
      {
        id: 'mod-remover-combo',
        name: 'Personalizar Hambúrguer',
        required: false,
        minSelections: 0,
        maxSelections: 4,
        allowMultiple: true,
        options: [
          { id: 'rem-cebola-c', name: 'Sem Cebola', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-cebola' },
          { id: 'rem-tomate-c', name: 'Sem Tomate', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-tomate' },
          { id: 'rem-alface-c', name: 'Sem Alface', type: 'remove', priceAdjustment: 0, ingredientId: 'ing-alface' },
          { id: 'add-queijo-c', name: 'Extra Queijo (+30 MT)', type: 'add', priceAdjustment: 30, ingredientId: 'ing-queijo', inventoryEffectQuantity: 1 },
        ],
      },
      {
        id: 'mod-bebida-combo',
        name: 'Escolha da Bebida',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        allowMultiple: false,
        options: [
          { id: 'beb-coca', name: 'Coca-Cola 330ml', type: 'choose', priceAdjustment: 0, isDefault: true },
          { id: 'beb-fanta', name: 'Fanta Laranja 330ml', type: 'choose', priceAdjustment: 0 },
          { id: 'beb-sprite', name: 'Sprite Limão 330ml', type: 'choose', priceAdjustment: 0 },
          { id: 'beb-agua', name: 'Água Mineral Namaacha 500ml', type: 'choose', priceAdjustment: -10 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-coca-330',
    sku: 'BEB-001',
    barcode: '600100100010',
    name: 'Coca-Cola 330ml (Lata)',
    description: 'Refrigerante Coca-Cola original gelado em lata 330ml.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Coca-Cola',
    unit: 'un',
    costPrice: 45,
    sellingPrice: 70,
    currentStock: 140,
    minStock: 24,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-fanta-330',
    sku: 'BEB-002',
    barcode: '600100100020',
    name: 'Fanta Laranja 330ml (Lata)',
    description: 'Refrigerante Fanta com sabor natural a laranja bem fresca.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Coca-Cola',
    unit: 'un',
    costPrice: 45,
    sellingPrice: 70,
    currentStock: 90,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: false,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 1,
    displayOrder: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-agua-namaacha',
    sku: 'BEB-003',
    barcode: '600100100030',
    name: 'Água Mineral Namaacha 500ml',
    description: 'Água mineral natural das montanhas de Namaacha sem gás.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Namaacha',
    unit: 'un',
    costPrice: 25,
    sellingPrice: 45,
    currentStock: 200,
    minStock: 30,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#E0F2FE',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-donut-koma',
    sku: 'SOB-001',
    barcode: '600300100001',
    name: 'Donut Glaceado Clássico KOMA',
    description: 'Nosso icônico donut dourado macio e quentinho, com cobertura glaceada doce.',
    categoryId: 'cat-sobremesas',
    categoryName: 'Cafetaria & Sobremesas',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 40,
    sellingPrice: 90,
    currentStock: 45,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 2,
    displayOrder: 9,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cafe-expresso',
    sku: 'SOB-002',
    barcode: '600300100002',
    name: 'Café Expresso Moído na Hora',
    description: 'Café expresso encorpado com grãos arábica selecionados e creme aveludado.',
    categoryId: 'cat-sobremesas',
    categoryName: 'Cafetaria & Sobremesas',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 20,
    sellingPrice: 50,
    currentStock: 180,
    minStock: 30,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#F3E8FF',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 3,
    displayOrder: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-2m-lata',
    sku: 'CER-001',
    barcode: '600100200001',
    name: 'Cerveja 2M 330ml (Lata)',
    description: 'Cerveja nacional moçambicana 2M gelada em lata 330ml. O sabor tradicional mais amado de Moçambique.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: '2M (CDM)',
    unit: 'un',
    costPrice: 55,
    sellingPrice: 90,
    currentStock: 120,
    minStock: 24,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1608270195610-8b09340e4f7e?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 11,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-2m-garrafa',
    sku: 'CER-002',
    barcode: '600100200002',
    name: 'Cerveja 2M 550ml (Garrafa)',
    description: 'Cerveja 2M garrafa tradicional 550ml servida estupidamente gelada com abertura imediata.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: '2M (CDM)',
    unit: 'un',
    costPrice: 65,
    sellingPrice: 110,
    currentStock: 96,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-laurentina-preta',
    sku: 'CER-003',
    barcode: '600100200003',
    name: 'Cerveja Laurentina Preta 330ml',
    description: 'A lendária cerveja preta premiada de Moçambique. Encorpada, notas maltadas torradas e espuma densa.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: 'Laurentina (CDM)',
    unit: 'un',
    costPrice: 65,
    sellingPrice: 100,
    currentStock: 80,
    minStock: 18,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1518176258769-f227c798150e?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#1C1917',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 13,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-laurentina-clara',
    sku: 'CER-004',
    barcode: '600100200004',
    name: 'Cerveja Laurentina Clara 330ml',
    description: 'Cerveja premium Laurentina Clara em lata/garrafa bem gelada. Refrescante com toque suave de lúpulo nobre.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: 'Laurentina (CDM)',
    unit: 'un',
    costPrice: 60,
    sellingPrice: 95,
    currentStock: 84,
    minStock: 18,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF9C3',
    isFoodItem: false,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 1,
    displayOrder: 14,
    createdAt: new Date().toISOString(),
  },
  // --- NOVOS PRODUTOS DE TESTE ---
  {
    id: 'prod-burger-frango-crispy',
    sku: 'BUR-003',
    barcode: '600200100006',
    name: 'Hambúrguer de Frango Crispy Crocante',
    description: 'Filé de peito de frango super crocante empanado, queijo cheddar derretido, alface fresca e maionese especial de alho.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 130,
    sellingPrice: 290,
    currentStock: 75,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 11,
    displayOrder: 15,
    recipe: [
      { ingredientId: 'ing-pao', ingredientName: 'Pão de Hambúrguer com Sésamo', quantity: 1, unit: 'un', costContribution: 15 },
      { ingredientId: 'ing-frango-crispy', ingredientName: 'Filé de Frango Empanado Crispy', quantity: 1, unit: 'un', costContribution: 80 },
      { ingredientId: 'ing-queijo', ingredientName: 'Queijo Cheddar em Fatias', quantity: 1, unit: 'un', costContribution: 12 },
      { ingredientId: 'ing-alface', ingredientName: 'Alface Americana Fresca', quantity: 20, unit: 'g', costContribution: 2 },
      { ingredientId: 'ing-molho', ingredientName: 'Molho de Alho Especial', quantity: 20, unit: 'ml', costContribution: 5 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-prego-no-pao',
    sku: 'BUR-004',
    barcode: '600200100007',
    name: 'Prego no Pão Especial com Ovo a Cavalo',
    description: 'Bife bovino tenro marinado no alho e louro, servido no pão d’água quente com ovo estrelado e mostarda.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 115,
    sellingPrice: 260,
    currentStock: 80,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 8,
    displayOrder: 16,
    recipe: [
      { ingredientId: 'ing-pao-agua', ingredientName: 'Pão de Água Rústico', quantity: 1, unit: 'un', costContribution: 12 },
      { ingredientId: 'ing-bife', ingredientName: 'Bife Bovino Tenro da Vazia 130g', quantity: 1, unit: 'un', costContribution: 75 },
      { ingredientId: 'ing-ovo', ingredientName: 'Ovo Fresco Estrelado', quantity: 1, unit: 'un', costContribution: 12 },
      { ingredientId: 'ing-molho-prego', ingredientName: 'Manteiga de Alho e Mostarda', quantity: 15, unit: 'g', costContribution: 8 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-sandes-clube',
    sku: 'BUR-005',
    barcode: '600200100008',
    name: 'Sandes Club Sandwich Triplo KOMA',
    description: 'Três fatias de pão tostado recheadas com peito de frango desfiado, bacon crocante, ovo, queijo, alface e tomate.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 160,
    sellingPrice: 350,
    currentStock: 50,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: true,
    averagePrepMinutes: 10,
    displayOrder: 17,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-burger-veggie',
    sku: 'BUR-006',
    barcode: '600200100009',
    name: 'Hambúrguer Vegetariano de Grão & Ervas',
    description: 'Hambúrguer artesanal de grão-de-bico com especiarias, rúcula, tomate seco, cebola roxa e molho pesto.',
    categoryId: 'cat-burgers',
    categoryName: 'Hambúrgueres & Sanduíches',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 120,
    sellingPrice: 310,
    currentStock: 40,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#ECFDF5',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 9,
    displayOrder: 18,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-pizza-quatro-queijos',
    sku: 'PIZ-002',
    barcode: '600200200001',
    name: 'Pizza 4 Queijos Nobres',
    description: 'Massa artesanal fina com molho de tomate, combinação perfeita de queijo mozzarella, gorgonzola, parmesão e cheddar.',
    categoryId: 'cat-pizzas',
    categoryName: 'Pizzas Artesanais',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 260,
    sellingPrice: 620,
    currentStock: 45,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 16,
    displayOrder: 19,
    recipe: [
      { ingredientId: 'ing-massa-pizza', ingredientName: 'Massa Artesanal de Pizza Média', quantity: 1, unit: 'un', costContribution: 50 },
      { ingredientId: 'ing-mozzarella', ingredientName: 'Queijo Mozzarella Ralado', quantity: 150, unit: 'g', costContribution: 67.5 },
      { ingredientId: 'ing-gorgonzola', ingredientName: 'Queijo Gorgonzola Cremoso', quantity: 50, unit: 'g', costContribution: 45 },
      { ingredientId: 'ing-parmesao', ingredientName: 'Queijo Parmesão Ralado', quantity: 40, unit: 'g', costContribution: 35 },
      { ingredientId: 'ing-cheddar', ingredientName: 'Queijo Cheddar Cremoso', quantity: 50, unit: 'g', costContribution: 25 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-pizza-calabresa',
    sku: 'PIZ-003',
    barcode: '600200200002',
    name: 'Pizza Calabresa Artesanal & Cebola Roxa',
    description: 'Fatias generosas de linguiça calabresa defumada, mozzarella farta, rodelas de cebola roxa fresca e azeitonas pretas.',
    categoryId: 'cat-pizzas',
    categoryName: 'Pizzas Artesanais',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 220,
    sellingPrice: 540,
    currentStock: 50,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: true,
    averagePrepMinutes: 15,
    displayOrder: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-pizza-marisco',
    sku: 'PIZ-004',
    barcode: '600200200003',
    name: 'Pizza de Camarão & Frutos do Mar',
    description: 'Camarões nacionais salteados no azeite de alho, queijo mozzarella derretido, lulas tenras e orégãos aromáticos.',
    categoryId: 'cat-pizzas',
    categoryName: 'Pizzas Artesanais',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 320,
    sellingPrice: 750,
    currentStock: 35,
    minStock: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 20,
    displayOrder: 21,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-frango-zambeziana',
    sku: 'PRA-001',
    barcode: '600200300001',
    name: 'Meio Frango à Zambeziana com Leite de Coco',
    description: 'Tradição moçambicana: meio frango marinado com alho e piri-piri, grelhado na brasa e regado com molho rico de leite de coco.',
    categoryId: 'cat-pratos',
    categoryName: 'Pratos & Grelhados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 190,
    sellingPrice: 460,
    currentStock: 60,
    minStock: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 18,
    displayOrder: 22,
    recipe: [
      { ingredientId: 'ing-frango-meio', ingredientName: 'Meio Frango Fresco Inteiro', quantity: 1, unit: 'un', costContribution: 120 },
      { ingredientId: 'ing-leite-coco', ingredientName: 'Molho de Leite de Coco e Piri-Piri', quantity: 100, unit: 'ml', costContribution: 30 },
      { ingredientId: 'ing-batata', ingredientName: 'Batata Frita de Acompanhamento', quantity: 200, unit: 'g', costContribution: 18 },
      { ingredientId: 'ing-salada', ingredientName: 'Salada Mista de Tomate e Alface', quantity: 1, unit: 'dose', costContribution: 12 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-frango-piripiri-inteiro',
    sku: 'PRA-002',
    barcode: '600200300002',
    name: 'Frango Inteiro no Churrasco Piri-Piri',
    description: 'Frango inteiro da terra assado na brasa com tempero especial piri-piri de Maputo. Acompanha arroz de alho e batatas fritas.',
    categoryId: 'cat-pratos',
    categoryName: 'Pratos & Grelhados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 320,
    sellingPrice: 720,
    currentStock: 40,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 22,
    displayOrder: 23,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-bife-a-casa',
    sku: 'PRA-003',
    barcode: '600200300003',
    name: 'Bife da Vazia à KOMA com Ovo a Cavalo',
    description: 'Suculento bife de 250g grelhado no ponto certo com molho de cerveja e alho, ovo estrelado e batatas fritas caseiras.',
    categoryId: 'cat-pratos',
    categoryName: 'Pratos & Grelhados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 230,
    sellingPrice: 520,
    currentStock: 55,
    minStock: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 15,
    displayOrder: 24,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-peixe-grelhado',
    sku: 'PRA-004',
    barcode: '600200300004',
    name: 'Filete de Pescada ao Molho de Limão & Ervas',
    description: 'Peixe fresco grelhado na perfeição com emulsão de manteiga de limão, servido com legumes salteados e batatas cozidas.',
    categoryId: 'cat-pratos',
    categoryName: 'Pratos & Grelhados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 250,
    sellingPrice: 580,
    currentStock: 45,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#E0F2FE',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 16,
    displayOrder: 25,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-chamucas-carne',
    sku: 'PET-001',
    barcode: '600200400001',
    name: 'Chamuças de Carne Picante (Porção 4 un)',
    description: 'Chamuças artesanais com massa folhada estaladiça e recheio de carne picada com tempero afro-indiano bem picante.',
    categoryId: 'cat-petiscos',
    categoryName: 'Petiscos & Salgados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 45,
    sellingPrice: 120,
    currentStock: 100,
    minStock: 25,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 5,
    displayOrder: 26,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-rissois-camarao',
    sku: 'PET-002',
    barcode: '600200400002',
    name: 'Rissóis de Camarão Cremosos (Porção 4 un)',
    description: 'Rissóis tradicionais dourados e crocantes, recheados com generoso creme aveludado de camarão de Moçambique.',
    categoryId: 'cat-petiscos',
    categoryName: 'Petiscos & Salgados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 65,
    sellingPrice: 160,
    currentStock: 90,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 5,
    displayOrder: 27,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-asas-frango-bbq',
    sku: 'PET-003',
    barcode: '600200400003',
    name: 'Asinhas de Frango Glaceadas BBQ & Mel (8 un)',
    description: 'Asinhas de frango tenras e suculentas, caramelizadas no molho barbecue defumado com mel e sementes de gergelim tostadas.',
    categoryId: 'cat-petiscos',
    categoryName: 'Petiscos & Salgados',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 110,
    sellingPrice: 290,
    currentStock: 65,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: true,
    averagePrepMinutes: 10,
    displayOrder: 28,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-aros-cebola',
    sku: 'ACO-002',
    barcode: '600200500001',
    name: 'Aros de Cebola Empanados Crocantes',
    description: 'Rodelas grossas de cebola doce empanadas em massa crocante temperada. Acompanha molho barbecue.',
    categoryId: 'cat-acompanhamentos',
    categoryName: 'Acompanhamentos & Porções',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 50,
    sellingPrice: 150,
    currentStock: 80,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1639024471287-032f6644dd9f?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 6,
    displayOrder: 29,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-nuggets-frango',
    sku: 'ACO-003',
    barcode: '600200500002',
    name: 'Nuggets de Frango Dourados (10 un)',
    description: 'Empanados crocantes de puro peito de frango selecionado, quentinhos e crocantes com molho à escolha.',
    categoryId: 'cat-acompanhamentos',
    categoryName: 'Acompanhamentos & Porções',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 75,
    sellingPrice: 190,
    currentStock: 110,
    minStock: 25,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 6,
    displayOrder: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-batata-cheddar-bacon',
    sku: 'ACO-004',
    barcode: '600200500003',
    name: 'Batata Suprema com Cheddar Cremoso & Bacon',
    description: 'Porção grande de batatas fritas cobertas com queijo cheddar cremoso derretido e cubinhos estaladiços de bacon.',
    categoryId: 'cat-acompanhamentos',
    categoryName: 'Acompanhamentos & Porções',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 95,
    sellingPrice: 240,
    currentStock: 70,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 8,
    displayOrder: 31,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-mandioca-frita',
    sku: 'ACO-005',
    barcode: '600200500004',
    name: 'Mandioca Frita Especial com Piri-Piri',
    description: 'Pedaços macios por dentro e estaladiços por fora de mandioca fresca de Moçambique, com toque de flor de sal e piri-piri.',
    categoryId: 'cat-acompanhamentos',
    categoryName: 'Acompanhamentos & Porções',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 35,
    sellingPrice: 110,
    currentStock: 90,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF9C3',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 7,
    displayOrder: 32,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-combo-duplo-casal',
    sku: 'CMB-002',
    barcode: '600200600001',
    name: 'Combo Duplo Casal (2 Burgers + 2 Batatas + 2 Bebidas)',
    description: 'Menu completo para dois: 2 Hambúrgueres KOMA Especial, 2 Batatas Fritas Médias e 2 Bebidas geladas 330ml.',
    categoryId: 'cat-combos',
    categoryName: 'Combos & Menus KOMA',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 380,
    sellingPrice: 850,
    currentStock: 40,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    isCombo: true,
    averagePrepMinutes: 12,
    displayOrder: 33,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-combo-crispy-box',
    sku: 'CMB-003',
    barcode: '600200600002',
    name: 'Box Frango Crispy + Batata + Refrigerante',
    description: '1 Hambúrguer de Frango Crispy crocante, 1 Batata Frita palito estaladiça e 1 Refresco em lata 330ml bem gelado.',
    categoryId: 'cat-combos',
    categoryName: 'Combos & Menus KOMA',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 180,
    sellingPrice: 420,
    currentStock: 60,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: true,
    isCombo: true,
    averagePrepMinutes: 10,
    displayOrder: 34,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-sprite-330',
    sku: 'BEB-004',
    barcode: '600100100040',
    name: 'Sprite Limão 330ml (Lata)',
    description: 'Refrigerante gasoso refrescante com sabor natural de limão e lima.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Coca-Cola',
    unit: 'un',
    costPrice: 45,
    sellingPrice: 70,
    currentStock: 100,
    minStock: 24,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#ECFDF5',
    isFoodItem: false,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 1,
    displayOrder: 35,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-sumo-compal-laranja',
    sku: 'BEB-005',
    barcode: '600100100050',
    name: 'Sumo Compal Néctar de Laranja do Algarve 1L',
    description: 'Sumo natural néctar de laranja rico em vitamina C em embalagem Tetra Pak 1 Litro.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Compal',
    unit: 'un',
    costPrice: 85,
    sellingPrice: 140,
    currentStock: 60,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: false,
    isFavorite: false,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 36,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-sumo-manga-maracuja',
    sku: 'BEB-006',
    barcode: '600100100060',
    name: 'Sumo Natural de Manga & Maracujá 500ml',
    description: 'Sumo natural fresco feito na hora com mangas doces e polpa de maracujá fresco.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'KOMA Fresco',
    unit: 'un',
    costPrice: 40,
    sellingPrice: 120,
    currentStock: 50,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 3,
    displayOrder: 37,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-redbull',
    sku: 'BEB-007',
    barcode: '600100100070',
    name: 'Energético Red Bull Energy Drink 250ml',
    description: 'Bebida energética estimulante servida estupidamente gelada.',
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas & Refrigerantes',
    brand: 'Red Bull',
    unit: 'un',
    costPrice: 95,
    sellingPrice: 150,
    currentStock: 80,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#E0F2FE',
    isFoodItem: false,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 1,
    displayOrder: 38,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-manica',
    sku: 'CER-005',
    barcode: '600100200005',
    name: 'Cerveja Manica 550ml (Garrafa)',
    description: 'A cerveja do centro e norte de Moçambique com sabor encorpado inconfundível.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: 'Manica (CDM)',
    unit: 'un',
    costPrice: 60,
    sellingPrice: 100,
    currentStock: 90,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF3C7',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 1,
    displayOrder: 39,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cerveja-heineken',
    sku: 'CER-006',
    barcode: '600100200006',
    name: 'Cerveja Heineken Lager Premium 330ml',
    description: 'Cerveja pura malte premium internacional de renome mundial.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: 'Heineken',
    unit: 'un',
    costPrice: 80,
    sellingPrice: 130,
    currentStock: 72,
    minStock: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1618886614638-80e3c103d31a?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#ECFDF5',
    isFoodItem: false,
    isFavorite: false,
    isBestSeller: true,
    averagePrepMinutes: 1,
    displayOrder: 40,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-sidra-savanna',
    sku: 'CER-007',
    barcode: '600100200007',
    name: 'Sidra Savanna Dry 330ml com Limão',
    description: 'Sidra seca premium de maçã crocante, servida gelada com rodela de limão no gargalo.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: 'Savanna',
    unit: 'un',
    costPrice: 90,
    sellingPrice: 140,
    currentStock: 60,
    minStock: 18,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEF9C3',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 1,
    displayOrder: 41,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-tipo-tinto-r-and-r',
    sku: 'CER-008',
    barcode: '600100200008',
    name: 'Cocktail R&R Tradicional (Rum Tipo Tinto & Sparletta)',
    description: 'O famoso R&R de Moçambique: Rum Tipo Tinto nacional com refrigerante Sparletta Framboesa e muito gelo.',
    categoryId: 'cat-cervejas',
    categoryName: 'Cervejas & Bar',
    brand: 'Tipo Tinto (Licores de Moçambique)',
    unit: 'dose',
    costPrice: 80,
    sellingPrice: 150,
    currentStock: 50,
    minStock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FEE2E2',
    isFoodItem: false,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 2,
    displayOrder: 42,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cheesecake-frutos',
    sku: 'SOB-003',
    barcode: '600300100003',
    name: 'Cheesecake Cremoso de Frutos Silvestres',
    description: 'Fatia generosa de cheesecake com base de bolacha crocante e calda artesanal de amoras e framboesas.',
    categoryId: 'cat-sobremesas',
    categoryName: 'Cafetaria & Sobremesas',
    brand: 'KOMA',
    unit: 'fatia',
    costPrice: 75,
    sellingPrice: 180,
    currentStock: 35,
    minStock: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FCE7F3',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: true,
    averagePrepMinutes: 2,
    displayOrder: 43,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-petit-gateau',
    sku: 'SOB-004',
    barcode: '600300100004',
    name: 'Petit Gâteau de Chocolate com Gelado de Baunilha',
    description: 'Bolo quente de chocolate belga com recheio cremoso e bola de gelado artesanal de baunilha.',
    categoryId: 'cat-sobremesas',
    categoryName: 'Cafetaria & Sobremesas',
    brand: 'KOMA',
    unit: 'dose',
    costPrice: 85,
    sellingPrice: 220,
    currentStock: 30,
    minStock: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FFEDD5',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: true,
    averagePrepMinutes: 7,
    displayOrder: 44,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-milkshake-morango',
    sku: 'SOB-005',
    barcode: '600300100005',
    name: 'Milkshake Cremoso de Morango KOMA 400ml',
    description: 'Batido gelado cremoso preparado com gelado artesanal de morango, leite gordo e chantilly por cima.',
    categoryId: 'cat-sobremesas',
    categoryName: 'Cafetaria & Sobremesas',
    brand: 'KOMA',
    unit: 'un',
    costPrice: 60,
    sellingPrice: 160,
    currentStock: 40,
    minStock: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#FCE7F3',
    isFoodItem: true,
    isFavorite: true,
    isBestSeller: false,
    averagePrepMinutes: 4,
    displayOrder: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cappuccino',
    sku: 'SOB-006',
    barcode: '600300100006',
    name: 'Cappuccino Italiano com Canela & Espuma',
    description: 'Expresso encorpado com leite vaporizado, espuma aveludada e polvilhado com canela em pó.',
    categoryId: 'cat-sobremesas',
    categoryName: 'Cafetaria & Sobremesas',
    brand: 'KOMA',
    unit: 'chávena',
    costPrice: 35,
    sellingPrice: 90,
    currentStock: 150,
    minStock: 25,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    imageBgColor: '#F5F5F4',
    isFoodItem: true,
    isFavorite: false,
    isBestSeller: false,
    averagePrepMinutes: 3,
    displayOrder: 46,
    createdAt: new Date().toISOString(),
  },
];

// Initial Customers
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'customer-final',
    name: 'Consumidor Final',
    documentType: 'Outro',
    documentNumber: '999999999',
    totalSpent: 0,
    totalPurchases: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-001',
    name: 'António José Muchanga',
    documentType: 'BI',
    documentNumber: '110100234567M',
    phone: '+258 84 111 2233',
    email: 'antonio.muchanga@gmail.com',
    address: 'Bairro da Coop, Bloco 4, Flat 12',
    city: 'Maputo',
    notes: 'Cliente habitual do almoço, prefere hambúrguer bem passado',
    totalSpent: 3450,
    totalPurchases: 7,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-002',
    name: 'Luísa Fernanda Cumbane',
    documentType: 'NUIT',
    documentNumber: '400556677',
    phone: '+258 82 222 3344',
    email: 'luisa.cumbane@empresa.co.mz',
    address: 'Av. Julius Nyerere, Edifício JAT V, 6º andar',
    city: 'Maputo',
    notes: 'Fatura sempre com NUIT em nome da empresa',
    totalSpent: 8900,
    totalPurchases: 14,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export class DatabaseService {
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if users collection exists
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        console.log('Seeding initial data into Firestore...');
        const batch = writeBatch(db);

        // Seed Users
        for (const user of INITIAL_USERS) {
          batch.set(doc(db, 'users', user.id), user);
        }

        // Seed Categories
        for (const cat of INITIAL_CATEGORIES) {
          batch.set(doc(db, 'categories', cat.id), cat);
        }

        // Seed Suppliers
        for (const sup of INITIAL_SUPPLIERS) {
          batch.set(doc(db, 'suppliers', sup.id), sup);
        }

        // Seed Ingredients
        for (const ing of INITIAL_INGREDIENTS) {
          batch.set(doc(db, 'ingredients', ing.id), ing);
        }

        // Seed Products
        for (const prod of INITIAL_PRODUCTS) {
          batch.set(doc(db, 'products', prod.id), prod);
        }

        // Seed Customers
        for (const cust of INITIAL_CUSTOMERS) {
          batch.set(doc(db, 'customers', cust.id), cust);
        }

        // Seed Company Settings
        batch.set(doc(db, 'system_settings', 'config'), DEFAULT_SETTINGS);

        // Seed an initial open Cash Session
        const initialCashSession: CashSession = {
          id: 'session-caixa-01',
          cashRegisterName: 'Caixa Principal 01 (Balcão)',
          userId: 'user-admin',
          userName: 'Carlos Alberto Macamo',
          initialAmount: 5000,
          totalSales: 1250,
          totalInflows: 0,
          totalOutflows: 0,
          totalSangrias: 0,
          totalSuprimentos: 0,
          expectedAmount: 6250,
          status: 'open',
          openedAt: new Date().toISOString(),
          notes: 'Caixa aberto com fundo inicial conferido de 5.000,00 MT.',
        };
        batch.set(doc(db, 'cash_sessions', initialCashSession.id), initialCashSession);

        // Seed initial audit log
        const auditLog: AuditLog = {
          id: `aud-${Date.now()}`,
          userId: 'system',
          userName: 'Sistema KOMA',
          action: 'SISTEMA_INICIALIZADO',
          entity: 'DATABASE',
          description: 'Carga inicial do cardápio, ingredientes, receitas e usuários realizada com sucesso.',
          timestamp: new Date().toISOString(),
        };
        batch.set(doc(db, 'audit_logs', auditLog.id), auditLog);

        await batch.commit();
        console.log('Database successfully seeded with KOMA Food Service data!');
      }

      this.initialized = true;
    } catch (err) {
      console.warn('Database initialization note (offline mode active):', err);
    }
  }

  // --- SETTINGS ---
  public static async getSettings(): Promise<CompanySettings> {
    try {
      const snap = await getDoc(doc(db, 'system_settings', 'config'));
      if (snap.exists()) {
        return { ...DEFAULT_SETTINGS, ...snap.data() } as CompanySettings;
      }
    } catch (e) {
      console.warn('Could not read settings from Firestore:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public static async saveSettings(settings: CompanySettings): Promise<void> {
    await setDoc(doc(db, 'system_settings', 'config'), settings);
  }

  // --- USERS ---
  public static async getUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty) {
        INITIAL_USERS.forEach(u => {
          setDoc(doc(db, 'users', u.id), u).catch(() => {});
        });
        return INITIAL_USERS;
      }
      const users = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
      // Auto-sync any missing initial users to Firestore
      const missingUsers = INITIAL_USERS.filter(iu => !users.some(u => u.id === iu.id));
      if (missingUsers.length > 0) {
        for (const user of missingUsers) {
          setDoc(doc(db, 'users', user.id), user).catch(err => {
            console.warn('Could not sync user to Firestore:', err);
          });
          users.push(user);
        }
      }
      return users;
    } catch (e) {
      console.warn('Could not fetch users from Firestore, using initial:', e);
      return INITIAL_USERS;
    }
  }

  public static async saveUser(user: User): Promise<void> {
    await setDoc(doc(db, 'users', user.id), user);
  }

  public static async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId));
  }

  // --- CATEGORIES ---
  public static async getCategories(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (snap.empty) {
        INITIAL_CATEGORIES.forEach(c => {
          setDoc(doc(db, 'categories', c.id), c).catch(() => {});
        });
        return INITIAL_CATEGORIES;
      }
      const cats = snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
      // Auto-sync any missing initial categories to Firestore
      const missingCats = INITIAL_CATEGORIES.filter(ic => !cats.some(c => c.id === ic.id));
      if (missingCats.length > 0) {
        for (const cat of missingCats) {
          setDoc(doc(db, 'categories', cat.id), cat).catch(err => {
            console.warn('Could not sync category to Firestore:', err);
          });
          cats.push(cat);
        }
      }
      return cats;
    } catch (e) {
      console.warn('Could not fetch categories from Firestore, using initial:', e);
      return INITIAL_CATEGORIES;
    }
  }

  public static async saveCategory(category: Category): Promise<void> {
    await setDoc(doc(db, 'categories', category.id), category);
  }

  public static async deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, 'categories', categoryId));
  }

  // --- INGREDIENTS ---
  public static async getIngredients(): Promise<Ingredient[]> {
    const snap = await getDocs(collection(db, 'ingredients'));
    if (snap.empty) return INITIAL_INGREDIENTS;
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient));
  }

  public static async saveIngredient(ingredient: Ingredient): Promise<void> {
    await setDoc(doc(db, 'ingredients', ingredient.id), {
      ...ingredient,
      updatedAt: new Date().toISOString(),
    });
  }

  public static async deleteIngredient(ingredientId: string): Promise<void> {
    await deleteDoc(doc(db, 'ingredients', ingredientId));
  }

  public static async toggleIngredient86(ingredientId: string, isAvailable: boolean, user: User): Promise<void> {
    const ref = doc(db, 'ingredients', ingredientId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const ingData = snap.data() as Ingredient;

    await updateDoc(ref, {
      isAvailable,
      updatedAt: new Date().toISOString(),
    });

    await this.logAudit({
      userId: user.id,
      userName: user.name,
      action: isAvailable ? 'INGREDIENTE_DISPONIBILIZADO' : 'INGREDIENTE_ESGOTADO_86',
      entity: 'INGREDIENT',
      entityId: ingredientId,
      description: `Ingrediente "${ingData.name}" foi marcado como ${isAvailable ? 'DISPONÍVEL' : 'ESGOTADO (86)'}.`,
    });
  }

  // --- SUPPLIERS ---
  public static async getSuppliers(): Promise<Supplier[]> {
    const snap = await getDocs(collection(db, 'suppliers'));
    if (snap.empty) return INITIAL_SUPPLIERS;
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier));
  }

  public static async saveSupplier(supplier: Supplier): Promise<void> {
    await setDoc(doc(db, 'suppliers', supplier.id), supplier);
  }

  public static async deleteSupplier(supplierId: string): Promise<void> {
    await deleteDoc(doc(db, 'suppliers', supplierId));
  }

  // --- PRODUCTS ---
  public static async getProducts(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (snap.empty) {
        INITIAL_PRODUCTS.forEach(p => {
          setDoc(doc(db, 'products', p.id), p).catch(() => {});
        });
        return INITIAL_PRODUCTS;
      }
      const prods = snap.docs.map(d => ({ ...d.data(), id: d.id } as Product));
      
      // Auto-sync any missing products from INITIAL_PRODUCTS into Firestore
      const missingProds = INITIAL_PRODUCTS.filter(ip => !prods.some(p => p.id === ip.id));
      if (missingProds.length > 0) {
        for (const p of missingProds) {
          setDoc(doc(db, 'products', p.id), p).catch(err => {
            console.warn('Could not sync missing product to Firestore:', err);
          });
          prods.push(p);
        }
      }
      return prods;
    } catch (e) {
      console.warn('Could not fetch products from Firestore, using initial:', e);
      return INITIAL_PRODUCTS;
    }
  }

  public static async seedDemoProducts(): Promise<Product[]> {
    try {
      const batch = writeBatch(db);
      for (const cat of INITIAL_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }
      for (const prod of INITIAL_PRODUCTS) {
        batch.set(doc(db, 'products', prod.id), prod);
      }
      await batch.commit();
      return INITIAL_PRODUCTS;
    } catch (e) {
      console.warn('Error in seedDemoProducts:', e);
      return INITIAL_PRODUCTS;
    }
  }

  public static async saveProduct(product: Product): Promise<void> {
    await setDoc(doc(db, 'products', product.id), product);
  }

  public static async deleteProduct(productId: string): Promise<void> {
    await deleteDoc(doc(db, 'products', productId));
  }

  public static async toggleProduct86(
    productId: string,
    is86: boolean,
    user: User,
    reason?: string
  ): Promise<void> {
    const ref = doc(db, 'products', productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const prodData = snap.data() as Product;

    await updateDoc(ref, {
      is86,
      is86Reason: is86 ? (reason || 'Esgotado na cozinha') : null,
      is86By: is86 ? user.name : null,
      is86At: is86 ? new Date().toISOString() : null,
    });

    await this.logAudit({
      userId: user.id,
      userName: user.name,
      action: is86 ? 'PRODUTO_MARCADO_ESGOTADO_86' : 'PRODUTO_REATIVADO_DISPONIVEL',
      entity: 'PRODUCT',
      entityId: productId,
      description: `Produto "${prodData.name}" foi ${is86 ? `marcado como ESGOTADO (Motivo: ${reason || 'Sem estoque'})` : 'reativado como DISPONÍVEL'}.`,
    });
  }

  // --- KITCHEN DISPLAY SYSTEM (KDS) & ACTIVE ORDERS ---
  public static async getKitchenOrders(): Promise<KitchenOrder[]> {
    try {
      const snap = await getDocs(query(collection(db, 'kitchen_orders'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as KitchenOrder));
    } catch {
      return [];
    }
  }

  public static async updateKitchenOrderStatus(
    orderId: string,
    status: KitchenStatus,
    user?: User
  ): Promise<void> {
    const ref = doc(db, 'kitchen_orders', orderId);
    const nowIso = new Date().toISOString();
    const updateData: any = { status };

    if (status === 'em_preparo') {
      updateData.startedPrepAt = nowIso;
    } else if (status === 'pronto') {
      updateData.readyAt = nowIso;
    } else if (status === 'entregue') {
      updateData.deliveredAt = nowIso;
    } else if (status === 'cancelado') {
      updateData.cancelledAt = nowIso;
    }

    await updateDoc(ref, updateData);

    if (user) {
      await this.logAudit({
        userId: user.id,
        userName: user.name,
        action: `KDS_STATUS_${status.toUpperCase()}`,
        entity: 'KITCHEN_ORDER',
        entityId: orderId,
        description: `Pedido ${orderId} teve o estado atualizado para "${status}".`,
      });
    }
  }

  // Send an order directly to kitchen before or during dining (Mesa, Balcão, Takeaway)
  public static async sendOrderToKitchen(params: {
    cashier: User;
    customer: Customer;
    diningOption: DiningOption;
    tableNumber?: string;
    items: CartItem[];
    total: number;
    saleId?: string;
    isPaid: boolean;
  }): Promise<KitchenOrder> {
    const { cashier, customer, diningOption, tableNumber, items, total, saleId, isPaid } = params;
    const nowIso = new Date().toISOString();
    const orderSeq = Math.floor(Math.random() * 900) + 100;
    const orderNumber = `#${orderSeq}`;
    const kitchenOrderId = `kds-${Date.now()}`;

    const kitchenOrder: KitchenOrder = {
      id: kitchenOrderId,
      orderNumber,
      saleId,
      diningOption,
      tableNumber,
      customerName: customer.name,
      items: items.map(it => ({
        cartItemId: it.cartItemId,
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        selectedModifiers: it.selectedModifiers || [],
        notes: it.notes,
        averagePrepMinutes: it.product.averagePrepMinutes || 10,
      })),
      total,
      status: 'novo',
      isPaid,
      createdAt: nowIso,
    };

    await setDoc(doc(db, 'kitchen_orders', kitchenOrderId), kitchenOrder);

    await this.logAudit({
      userId: cashier.id,
      userName: cashier.name,
      action: 'PEDIDO_ENVIADO_COZINHA',
      entity: 'KITCHEN_ORDER',
      entityId: kitchenOrderId,
      description: `Pedido ${orderNumber} (${diningOption.toUpperCase()}${tableNumber ? ` - Mesa ${tableNumber}` : ''}) enviado para o KDS da cozinha.`,
    });

    return kitchenOrder;
  }

  // --- STOCK LOSSES & WASTAGE (DESPERDÍCIO) ---
  public static async getStockLosses(): Promise<StockLoss[]> {
    try {
      const snap = await getDocs(query(collection(db, 'stock_losses'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as StockLoss));
    } catch {
      return [];
    }
  }

  public static async registerStockLoss(params: {
    itemType: 'product' | 'ingredient';
    itemId: string;
    quantity: number;
    reason: any;
    cost: number;
    user: User;
    notes?: string;
  }): Promise<StockLoss> {
    const { itemType, itemId, quantity, reason, cost, user, notes } = params;

    return await runTransaction(db, async (transaction) => {
      const lossId = `loss-${Date.now()}`;
      const nowIso = new Date().toISOString();
      let itemName = '';
      let unit = 'un';
      let prevStock = 0;
      let nextStock = 0;

      if (itemType === 'product') {
        const prodRef = doc(db, 'products', itemId);
        const prodSnap = await transaction.get(prodRef);
        if (!prodSnap.exists()) throw new Error('Produto não encontrado');
        const prodData = prodSnap.data() as Product;
        itemName = prodData.name;
        unit = prodData.unit;
        prevStock = prodData.currentStock;
        nextStock = Math.max(0, prevStock - quantity);
        transaction.update(prodRef, { currentStock: nextStock });
      } else {
        const ingRef = doc(db, 'ingredients', itemId);
        const ingSnap = await transaction.get(ingRef);
        if (!ingSnap.exists()) throw new Error('Ingrediente não encontrado');
        const ingData = ingSnap.data() as Ingredient;
        itemName = ingData.name;
        unit = ingData.unit;
        prevStock = ingData.currentStock;
        nextStock = Math.max(0, prevStock - quantity);
        transaction.update(ingRef, { currentStock: nextStock });
      }

      const stockLoss: StockLoss = {
        id: lossId,
        itemType,
        itemId,
        itemName,
        quantity,
        unit,
        reason,
        cost,
        userId: user.id,
        userName: user.name,
        notes,
        createdAt: nowIso,
      };

      transaction.set(doc(db, 'stock_losses', lossId), stockLoss);

      // Register Kardex movement
      const smId = `sm-loss-${lossId}`;
      const stockMove: StockMovement = {
        id: smId,
        itemType,
        productId: itemType === 'product' ? itemId : undefined,
        ingredientId: itemType === 'ingredient' ? itemId : undefined,
        itemName,
        type: 'loss',
        quantity,
        previousStock: prevStock,
        nextStock,
        unit,
        reason: `Perda/Desperdício: ${reason}${notes ? ` - ${notes}` : ''}`,
        referenceId: lossId,
        userId: user.id,
        userName: user.name,
        createdAt: nowIso,
      };
      transaction.set(doc(db, 'stock_movements', smId), stockMove);

      // Register financial loss outflow
      const finId = `fin-loss-${lossId}`;
      const finTrans: FinancialTransaction = {
        id: finId,
        type: 'outflow',
        category: 'Desperdício & Perdas',
        description: `Perda registrada: ${quantity} ${unit} de "${itemName}" (${reason})`,
        amount: cost,
        paymentMethod: 'Ajuste Estoque',
        date: nowIso.slice(0, 10),
        userId: user.id,
        userName: user.name,
        createdAt: nowIso,
      };
      transaction.set(doc(db, 'financial_transactions', finId), finTrans);

      // Audit log
      const auditId = `aud-loss-${lossId}`;
      const audit: AuditLog = {
        id: auditId,
        userId: user.id,
        userName: user.name,
        action: 'PERDA_ESTOQUE_REGISTRADA',
        entity: 'STOCK_LOSS',
        entityId: lossId,
        description: `Perda de ${quantity} ${unit} do item "${itemName}" pelo motivo "${reason}". Custo estimado: ${cost} MT.`,
        timestamp: nowIso,
      };
      transaction.set(doc(db, 'audit_logs', auditId), audit);

      return stockLoss;
    });
  }

  // --- PHYSICAL INVENTORY COUNTS (CONTAGEM DE ESTOQUE) ---
  public static async getStockCounts(): Promise<StockCount[]> {
    try {
      const snap = await getDocs(query(collection(db, 'stock_counts'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as StockCount));
    } catch {
      return [];
    }
  }

  public static async saveStockCount(count: StockCount): Promise<void> {
    await setDoc(doc(db, 'stock_counts', count.id), count);
  }

  public static async applyStockCountAdjustment(countId: string, user: User): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      const countRef = doc(db, 'stock_counts', countId);
      const countSnap = await transaction.get(countRef);
      if (!countSnap.exists()) throw new Error('Contagem de estoque não encontrada');
      const countData = countSnap.data() as StockCount;
      const nowIso = new Date().toISOString();

      for (const item of countData.items) {
        if (item.diff !== 0) {
          if (item.itemType === 'product') {
            const pRef = doc(db, 'products', item.id);
            const pSnap = await transaction.get(pRef);
            if (pSnap.exists()) {
              const prev = (pSnap.data() as Product).currentStock;
              transaction.update(pRef, { currentStock: item.countedQty });

              const smId = `sm-count-${countId}-${item.id}`;
              transaction.set(doc(db, 'stock_movements', smId), {
                id: smId,
                itemType: 'product',
                productId: item.id,
                itemName: item.name,
                type: 'inventory',
                quantity: Math.abs(item.diff),
                previousStock: prev,
                nextStock: item.countedQty,
                unit: item.unit,
                reason: `Ajuste de Balanço Físico (Dif: ${item.diff > 0 ? `+${item.diff}` : item.diff})`,
                referenceId: countId,
                userId: user.id,
                userName: user.name,
                createdAt: nowIso,
              });
            }
          } else {
            const ingRef = doc(db, 'ingredients', item.id);
            const ingSnap = await transaction.get(ingRef);
            if (ingSnap.exists()) {
              const prev = (ingSnap.data() as Ingredient).currentStock;
              transaction.update(ingRef, { currentStock: item.countedQty });

              const smId = `sm-count-${countId}-${item.id}`;
              transaction.set(doc(db, 'stock_movements', smId), {
                id: smId,
                itemType: 'ingredient',
                ingredientId: item.id,
                itemName: item.name,
                type: 'inventory',
                quantity: Math.abs(item.diff),
                previousStock: prev,
                nextStock: item.countedQty,
                unit: item.unit,
                reason: `Ajuste de Balanço de Ingredientes (Dif: ${item.diff > 0 ? `+${item.diff}` : item.diff})`,
                referenceId: countId,
                userId: user.id,
                userName: user.name,
                createdAt: nowIso,
              });
            }
          }
        }
      }

      transaction.update(countRef, {
        status: 'completed',
        completedAt: nowIso,
      });

      const auditId = `aud-count-${countId}`;
      transaction.set(doc(db, 'audit_logs', auditId), {
        id: auditId,
        userId: user.id,
        userName: user.name,
        action: 'INVENTARIO_FISICO_APLICADO',
        entity: 'STOCK_COUNT',
        entityId: countId,
        description: `Balanço físico de estoque nº ${countId} concluído e ajustado nos estoques.`,
        timestamp: nowIso,
      });
    });
  }

  // --- CUSTOMERS ---
  public static async getCustomers(): Promise<Customer[]> {
    const snap = await getDocs(collection(db, 'customers'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
  }

  public static async saveCustomer(customer: Customer): Promise<void> {
    await setDoc(doc(db, 'customers', customer.id), customer);
  }

  public static async deleteCustomer(customerId: string): Promise<void> {
    await deleteDoc(doc(db, 'customers', customerId));
  }

  // --- CASH SESSIONS ---
  public static async getActiveCashSession(userId?: string): Promise<CashSession | null> {
    const snap = await getDocs(collection(db, 'cash_sessions'));
    const sessions = snap.docs.map(d => ({ ...d.data(), id: d.id } as CashSession));
    const openSessions = sessions.filter(s => s.status === 'open');
    if (userId) {
      const userSession = openSessions.find(s => s.userId === userId);
      if (userSession) return userSession;
    }
    return openSessions[0] || null;
  }

  public static async getCashSessions(): Promise<CashSession[]> {
    const snap = await getDocs(query(collection(db, 'cash_sessions'), orderBy('openedAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as CashSession));
  }

  public static async openCashSession(
    registerNameOrParams:
      | string
      | {
          cashRegisterName: string;
          userId: string;
          userName: string;
          initialAmount: number;
          notes?: string;
        },
    initialAmount?: number,
    user?: User,
    notes?: string
  ): Promise<CashSession> {
    const params =
      typeof registerNameOrParams === 'string'
        ? {
            cashRegisterName: registerNameOrParams,
            userId: user?.id || 'unknown',
            userName: user?.name || 'Operador',
            initialAmount: initialAmount || 0,
            notes,
          }
        : registerNameOrParams;

    const id = `session-${Date.now()}`;
    const newSession: CashSession = {
      id,
      cashRegisterName: params.cashRegisterName,
      userId: params.userId,
      userName: params.userName,
      initialAmount: params.initialAmount,
      totalSales: 0,
      totalInflows: 0,
      totalOutflows: 0,
      totalSangrias: 0,
      totalSuprimentos: 0,
      expectedAmount: params.initialAmount,
      status: 'open',
      openedAt: new Date().toISOString(),
      notes: params.notes,
    };

    await setDoc(doc(db, 'cash_sessions', id), newSession);

    await this.logAudit({
      userId: params.userId,
      userName: params.userName,
      action: 'ABERTURA_CAIXA',
      entity: 'CASH_SESSION',
      entityId: id,
      description: `Abertura do caixa "${params.cashRegisterName}" com fundo de troco de ${params.initialAmount} MT.`,
    });

    return newSession;
  }

  public static async closeCashSession(
    sessionId: string,
    countedAmount: number,
    user: User,
    notes?: string
  ): Promise<CashSession> {
    return await runTransaction(db, async (transaction) => {
      const sessionRef = doc(db, 'cash_sessions', sessionId);
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) throw new Error('Sessão de caixa não encontrada');
      const sessionData = sessionSnap.data() as CashSession;

      const difference = countedAmount - sessionData.expectedAmount;
      const closedAt = new Date().toISOString();

      const updatedSession: CashSession = {
        ...sessionData,
        countedAmount,
        difference,
        status: 'closed',
        closedAt,
        notes: notes ? `${sessionData.notes || ''} [Fechamento]: ${notes}` : sessionData.notes,
      };

      transaction.update(sessionRef, {
        countedAmount,
        difference,
        status: 'closed',
        closedAt,
        notes: updatedSession.notes,
      });

      const auditId = `aud-${Date.now()}`;
      transaction.set(doc(db, 'audit_logs', auditId), {
        id: auditId,
        userId: user.id,
        userName: user.name,
        action: 'FECHAMENTO_CAIXA',
        entity: 'CASH_SESSION',
        entityId: sessionId,
        description: `Fechamento cego do caixa "${sessionData.cashRegisterName}". Esperado: ${sessionData.expectedAmount} MT, Contado: ${countedAmount} MT (Diferença: ${difference} MT).`,
        timestamp: closedAt,
      });

      return updatedSession;
    });
  }

  public static async getCashMovements(sessionId?: string): Promise<CashMovement[]> {
    const snap = await getDocs(query(collection(db, 'cash_movements'), orderBy('createdAt', 'desc')));
    const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as CashMovement));
    if (sessionId) {
      return all.filter(m => m.cashSessionId === sessionId);
    }
    return all;
  }

  public static async registerSangria(
    sessionId: string,
    amount: number,
    reason: string,
    user: User
  ): Promise<CashMovement> {
    return await runTransaction(db, async (transaction) => {
      const sessionRef = doc(db, 'cash_sessions', sessionId);
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) throw new Error('Caixa não encontrado');
      const sessionData = sessionSnap.data() as CashSession;

      if (sessionData.expectedAmount < amount) {
        throw new Error(
          `Saldo insuficiente no caixa para realizar sangria de ${amount} MT. Saldo disponível: ${sessionData.expectedAmount} MT.`
        );
      }

      const movementId = `cm-sangria-${Date.now()}`;
      const movement: CashMovement = {
        id: movementId,
        cashSessionId: sessionId,
        type: 'sangria',
        amount,
        reason,
        userId: user.id,
        userName: user.name,
        createdAt: new Date().toISOString(),
      };

      const newSangrias = (sessionData.totalSangrias || 0) + amount;
      const newExpected = sessionData.expectedAmount - amount;

      transaction.set(doc(db, 'cash_movements', movementId), movement);
      transaction.update(sessionRef, {
        totalSangrias: newSangrias,
        expectedAmount: newExpected,
      });

      return movement;
    });
  }

  public static async registerSuprimento(
    sessionId: string,
    amount: number,
    reason: string,
    user: User
  ): Promise<CashMovement> {
    return await runTransaction(db, async (transaction) => {
      const sessionRef = doc(db, 'cash_sessions', sessionId);
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) throw new Error('Caixa não encontrado');
      const sessionData = sessionSnap.data() as CashSession;

      const movementId = `cm-sup-${Date.now()}`;
      const movement: CashMovement = {
        id: movementId,
        cashSessionId: sessionId,
        type: 'suprimento',
        amount,
        reason,
        userId: user.id,
        userName: user.name,
        createdAt: new Date().toISOString(),
      };

      const newSuprimentos = (sessionData.totalSuprimentos || 0) + amount;
      const newExpected = sessionData.expectedAmount + amount;

      transaction.set(doc(db, 'cash_movements', movementId), movement);
      transaction.update(sessionRef, {
        totalSuprimentos: newSuprimentos,
        expectedAmount: newExpected,
      });

      return movement;
    });
  }

  // --- SALES (TRANSACTIONAL CHECKOUT WITH RECIPE & MODIFIER INVENTORY DEDUCTIONS) ---
  public static async getSales(): Promise<Sale[]> {
    const snap = await getDocs(query(collection(db, 'sales'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Sale));
  }

  public static async executeSaleTransaction(params: {
    cashSessionId: string;
    cashier: User;
    customer: Customer;
    diningOption?: DiningOption;
    tableNumber?: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    total: number;
    payments: PaymentItem[];
  }): Promise<Sale> {
    const {
      cashSessionId,
      cashier,
      customer,
      diningOption = 'balcao',
      tableNumber,
      items,
      subtotal,
      discount,
      discountType,
      discountValue,
      total,
      payments
    } = params;

    return await runTransaction(db, async (transaction) => {
      // 1. Fetch cash session if present
      let cashSessionSnap = null;
      let cashSessionData: CashSession | null = null;
      if (cashSessionId && cashSessionId !== 'sem-caixa') {
        const csRef = doc(db, 'cash_sessions', cashSessionId);
        cashSessionSnap = await transaction.get(csRef);
        if (cashSessionSnap.exists()) {
          cashSessionData = cashSessionSnap.data() as CashSession;
        }
      }

      // 2. Generate unique sale number
      const saleId = `sale-${Date.now()}`;
      const saleSeq = Math.floor(Math.random() * 900000) + 100000;
      const saleNumber = generateSaleNumber(saleSeq);
      const nowIso = new Date().toISOString();

      // 3. Process each cart item: deduct direct product stock OR deduct ingredients from recipes
      for (const item of items) {
        const prodRef = doc(db, 'products', item.product.id);
        const prodSnap = await transaction.get(prodRef);
        if (!prodSnap.exists()) {
          throw new Error(`Produto não encontrado: ${item.product.name}`);
        }
        const prodData = prodSnap.data() as Product;

        // If product has a technical recipe, deduct individual ingredients
        if (prodData.recipe && prodData.recipe.length > 0) {
          // Identify removed ingredients
          const removedIngredientIds = new Set(
            (item.selectedModifiers || [])
              .filter(m => m.type === 'remove' && m.ingredientId)
              .map(m => m.ingredientId as string)
          );

          // Deduct base ingredients
          for (const recipeItem of prodData.recipe) {
            if (removedIngredientIds.has(recipeItem.ingredientId)) {
              // Rule 9: "Sem cebola / Sem tomate" -> NÃO DESCONTAR!
              continue;
            }

            const ingRef = doc(db, 'ingredients', recipeItem.ingredientId);
            const ingSnap = await transaction.get(ingRef);
            if (ingSnap.exists()) {
              const ingData = ingSnap.data() as Ingredient;
              const deductQty = recipeItem.quantity * item.quantity;
              const nextIngStock = Math.max(0, ingData.currentStock - deductQty);

              transaction.update(ingRef, { currentStock: nextIngStock });

              const smId = `sm-ing-${saleId}-${recipeItem.ingredientId}-${Date.now()}`;
              const stockMove: StockMovement = {
                id: smId,
                itemType: 'ingredient',
                ingredientId: recipeItem.ingredientId,
                itemName: ingData.name,
                type: 'sale',
                quantity: deductQty,
                previousStock: ingData.currentStock,
                nextStock: nextIngStock,
                unit: ingData.unit,
                reason: `Consumo receita venda ${saleNumber} (${item.product.name} x${item.quantity})`,
                referenceId: saleId,
                userId: cashier.id,
                userName: cashier.name,
                createdAt: nowIso,
              };
              transaction.set(doc(db, 'stock_movements', smId), stockMove);
            }
          }

          // Process ADDED modifiers (e.g. Extra Queijo, Extra Bacon)
          const addedModifiers = (item.selectedModifiers || []).filter(
            m => m.type === 'add' && m.ingredientId
          );
          for (const addMod of addedModifiers) {
            const extraIngRef = doc(db, 'ingredients', addMod.ingredientId as string);
            const extraIngSnap = await transaction.get(extraIngRef);
            if (extraIngSnap.exists()) {
              const extraIngData = extraIngSnap.data() as Ingredient;
              const extraDeductQty = (addMod.inventoryEffectQuantity || 1) * item.quantity;
              const nextExtraStock = Math.max(0, extraIngData.currentStock - extraDeductQty);

              transaction.update(extraIngRef, { currentStock: nextExtraStock });

              const smId = `sm-extra-${saleId}-${addMod.id}-${Date.now()}`;
              const stockMove: StockMovement = {
                id: smId,
                itemType: 'ingredient',
                ingredientId: addMod.ingredientId,
                itemName: extraIngData.name,
                type: 'sale',
                quantity: extraDeductQty,
                previousStock: extraIngData.currentStock,
                nextStock: nextExtraStock,
                unit: extraIngData.unit,
                reason: `Adicional de venda ${saleNumber} (${addMod.name} x${item.quantity})`,
                referenceId: saleId,
                userId: cashier.id,
                userName: cashier.name,
                createdAt: nowIso,
              };
              transaction.set(doc(db, 'stock_movements', smId), stockMove);
            }
          }
        } else {
          // Standard retail product direct stock deduction
          const nextStock = Math.max(0, prodData.currentStock - item.quantity);
          transaction.update(prodRef, { currentStock: nextStock });

          const smId = `sm-sale-${saleId}-${item.product.id}`;
          const stockMove: StockMovement = {
            id: smId,
            itemType: 'product',
            productId: item.product.id,
            productName: item.product.name,
            itemName: item.product.name,
            sku: item.product.sku,
            type: 'sale',
            quantity: item.quantity,
            previousStock: prodData.currentStock,
            nextStock,
            unit: item.product.unit || 'un',
            reason: `Venda no PDV nº ${saleNumber}`,
            referenceId: saleId,
            userId: cashier.id,
            userName: cashier.name,
            createdAt: nowIso,
          };
          transaction.set(doc(db, 'stock_movements', smId), stockMove);
        }
      }

      // 4. Create and link Kitchen Order (KDS)
      const hasFoodItems = items.some(it => it.product.isFoodItem || (it.product.recipe && it.product.recipe.length > 0));
      const orderSeq = Math.floor(Math.random() * 900) + 100;
      const orderNumber = `#${orderSeq}`;
      const kitchenOrderId = `kds-${Date.now()}`;

      const kitchenOrder: KitchenOrder = {
        id: kitchenOrderId,
        orderNumber,
        saleId,
        diningOption,
        tableNumber,
        customerName: customer.name,
        items: items.map(it => ({
          cartItemId: it.cartItemId,
          productName: it.product.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          selectedModifiers: it.selectedModifiers || [],
          notes: it.notes,
          averagePrepMinutes: it.product.averagePrepMinutes || 10,
        })),
        total,
        status: hasFoodItems ? 'novo' : 'pronto',
        isPaid: true,
        createdAt: nowIso,
      };
      transaction.set(doc(db, 'kitchen_orders', kitchenOrderId), kitchenOrder);

      // 5. Record the Sale snapshot
      const newSale: Sale = {
        id: saleId,
        saleNumber,
        cashSessionId: cashSessionId || 'sem-caixa',
        cashierId: cashier.id,
        cashierName: cashier.name,
        customerId: customer.id,
        customerName: customer.name,
        diningOption,
        tableNumber,
        items,
        subtotal,
        discount,
        discountType,
        discountValue,
        total,
        payments,
        status: 'completed',
        kitchenOrderId,
        taxCertification: (params as any).taxCertification,
        mpesaTransactionId: (params as any).mpesaTransactionId,
        mpesaPhone: (params as any).mpesaPhone,
        createdAt: nowIso,
      };
      transaction.set(doc(db, 'sales', saleId), newSale);

      // 6. Update Cash Session totals & log movement
      if (cashSessionData && cashSessionSnap) {
        const cashAmount = payments
          .filter(p => p.method === 'dinheiro')
          .reduce((sum, p) => sum + p.amount, 0);

        const newTotalSales = (cashSessionData.totalSales || 0) + total;
        const newExpected = (cashSessionData.expectedAmount || 0) + cashAmount;

        transaction.update(doc(db, 'cash_sessions', cashSessionId), {
          totalSales: newTotalSales,
          expectedAmount: newExpected,
        });

        const cashMoveId = `cm-sale-${saleId}`;
        const cashMovement: CashMovement = {
          id: cashMoveId,
          cashSessionId,
          type: 'sale',
          amount: total,
          reason: `Venda PDV nº ${saleNumber} (${diningOption.toUpperCase()})`,
          userId: cashier.id,
          userName: cashier.name,
          paymentMethod: payments.map(p => p.label).join(', '),
          createdAt: nowIso,
        };
        transaction.set(doc(db, 'cash_movements', cashMoveId), cashMovement);
      }

      // 7. Update Customer metrics
      if (customer.id && customer.id !== 'customer-final') {
        const custRef = doc(db, 'customers', customer.id);
        const custSnap = await transaction.get(custRef);
        if (custSnap.exists()) {
          const custData = custSnap.data() as Customer;
          transaction.update(custRef, {
            totalSpent: (custData.totalSpent || 0) + total,
            totalPurchases: (custData.totalPurchases || 0) + 1,
          });
        }
      }

      // 8. Register financial ledger transaction
      const finId = `fin-${saleId}`;
      const finTrans: FinancialTransaction = {
        id: finId,
        type: 'inflow',
        category: 'Vendas PDV & Takeaway',
        description: `Receita Venda #${saleNumber} [${diningOption.toUpperCase()}${tableNumber ? ` - Mesa ${tableNumber}` : ''}] (${customer.name})`,
        amount: total,
        paymentMethod: payments.map(p => p.label).join(' / '),
        date: nowIso.slice(0, 10),
        userId: cashier.id,
        userName: cashier.name,
        createdAt: nowIso,
      };
      transaction.set(doc(db, 'financial_transactions', finId), finTrans);

      // 9. Audit log
      const auditId = `aud-${saleId}`;
      const audit: AuditLog = {
        id: auditId,
        userId: cashier.id,
        userName: cashier.name,
        action: 'VENDA_FINALIZADA',
        entity: 'SALE',
        entityId: saleId,
        description: `Venda #${saleNumber} de ${total} MT finalizada (${items.length} itens, Atendimento: ${diningOption}).`,
        timestamp: nowIso,
      };
      transaction.set(doc(db, 'audit_logs', auditId), audit);

      return newSale;
    });
  }

  // --- CANCEL SALE (ESTORNO DE VENDA) ---
  public static async cancelSale(
    saleId: string,
    reasonOrUser: string | User,
    userOrReason: User | string
  ): Promise<void> {
    const reason = typeof reasonOrUser === 'string' ? reasonOrUser : (userOrReason as string);
    const user = typeof reasonOrUser === 'object' ? (reasonOrUser as User) : (userOrReason as User);
    return await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', saleId);
      const saleSnap = await transaction.get(saleRef);
      if (!saleSnap.exists()) throw new Error('Venda não encontrada');
      const saleData = saleSnap.data() as Sale;

      if (saleData.status === 'cancelled') {
        throw new Error('Esta venda já foi cancelada anteriormente');
      }

      const nowIso = new Date().toISOString();

      // 1. Mark sale as cancelled
      transaction.update(saleRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: nowIso,
        cancelledBy: user.name,
      });

      // 2. Return stock for products and ingredients
      for (const item of saleData.items) {
        if (item.product.recipe && item.product.recipe.length > 0) {
          // Return base ingredients (except removed)
          const removedIngredientIds = new Set(
            (item.selectedModifiers || [])
              .filter(m => m.type === 'remove' && m.ingredientId)
              .map(m => m.ingredientId as string)
          );

          for (const recipeItem of item.product.recipe) {
            if (removedIngredientIds.has(recipeItem.ingredientId)) continue;
            const ingRef = doc(db, 'ingredients', recipeItem.ingredientId);
            const ingSnap = await transaction.get(ingRef);
            if (ingSnap.exists()) {
              const ingData = ingSnap.data() as Ingredient;
              const retQty = recipeItem.quantity * item.quantity;
              const nextStock = ingData.currentStock + retQty;
              transaction.update(ingRef, { currentStock: nextStock });

              const smId = `sm-cancel-ing-${saleId}-${recipeItem.ingredientId}`;
              transaction.set(doc(db, 'stock_movements', smId), {
                id: smId,
                itemType: 'ingredient',
                ingredientId: recipeItem.ingredientId,
                itemName: ingData.name,
                type: 'return',
                quantity: retQty,
                previousStock: ingData.currentStock,
                nextStock,
                unit: ingData.unit,
                reason: `Estorno de venda cancelada nº ${saleData.saleNumber}`,
                referenceId: saleId,
                userId: user.id,
                userName: user.name,
                createdAt: nowIso,
              });
            }
          }
        } else {
          const prodRef = doc(db, 'products', item.product.id);
          const prodSnap = await transaction.get(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data() as Product;
            const nextStock = prodData.currentStock + item.quantity;
            transaction.update(prodRef, { currentStock: nextStock });

            const smId = `sm-cancel-${saleId}-${item.product.id}`;
            transaction.set(doc(db, 'stock_movements', smId), {
              id: smId,
              itemType: 'product',
              productId: item.product.id,
              productName: item.product.name,
              sku: item.product.sku,
              type: 'return',
              quantity: item.quantity,
              previousStock: prodData.currentStock,
              nextStock,
              unit: item.product.unit || 'un',
              reason: `Estorno de venda cancelada nº ${saleData.saleNumber}`,
              referenceId: saleId,
              userId: user.id,
              userName: user.name,
              createdAt: nowIso,
            });
          }
        }
      }

      // 3. Cancel Kitchen Order if linked
      if (saleData.kitchenOrderId) {
        const kRef = doc(db, 'kitchen_orders', saleData.kitchenOrderId);
        transaction.update(kRef, { status: 'cancelado', cancelledAt: nowIso });
      }

      // 4. Update Cash session if applicable
      if (saleData.cashSessionId && saleData.cashSessionId !== 'sem-caixa') {
        const csRef = doc(db, 'cash_sessions', saleData.cashSessionId);
        const csSnap = await transaction.get(csRef);
        if (csSnap.exists()) {
          const csData = csSnap.data() as CashSession;
          const cashAmount = (saleData.payments || [])
            .filter(p => p.method === 'dinheiro')
            .reduce((sum, p) => sum + p.amount, 0);

          transaction.update(csRef, {
            totalSales: Math.max(0, (csData.totalSales || 0) - saleData.total),
            expectedAmount: Math.max(0, (csData.expectedAmount || 0) - cashAmount),
          });
        }
      }

      // 5. Register financial outflow reversal
      const finId = `fin-cancel-${saleId}`;
      transaction.set(doc(db, 'financial_transactions', finId), {
        id: finId,
        type: 'outflow',
        category: 'Cancelamento de Venda',
        description: `Estorno de Venda cancelada #${saleData.saleNumber} (${reason})`,
        amount: saleData.total,
        paymentMethod: 'Estorno',
        date: nowIso.slice(0, 10),
        userId: user.id,
        userName: user.name,
        createdAt: nowIso,
      });

      // 6. Audit log
      const auditId = `aud-cancel-${saleId}`;
      transaction.set(doc(db, 'audit_logs', auditId), {
        id: auditId,
        userId: user.id,
        userName: user.name,
        action: 'VENDA_CANCELADA',
        entity: 'SALE',
        entityId: saleId,
        description: `Venda #${saleData.saleNumber} cancelada por ${user.name}. Motivo: ${reason}`,
        timestamp: nowIso,
      });
    });
  }

  // --- WAREHOUSES (ARMAZÉNS & LOCAIS DE ESTOQUE - FASE 4) ---
  public static async getWarehouses(): Promise<Warehouse[]> {
    const snap = await getDocs(collection(db, 'warehouses'));
    if (snap.empty) {
      // Seed default warehouses
      const batch = writeBatch(db);
      for (const wh of DEFAULT_WAREHOUSES) {
        batch.set(doc(db, 'warehouses', wh.id), wh);
      }
      await batch.commit();
      return DEFAULT_WAREHOUSES;
    }
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Warehouse));
  }

  public static async saveWarehouse(warehouse: Warehouse): Promise<void> {
    await setDoc(doc(db, 'warehouses', warehouse.id), warehouse, { merge: true });
  }

  public static async deleteWarehouse(id: string): Promise<void> {
    await deleteDoc(doc(db, 'warehouses', id));
  }

  // --- STOCK MOVEMENTS KARDEX ---
  public static async getStockMovements(productId?: string): Promise<StockMovement[]> {
    const snap = await getDocs(query(collection(db, 'stock_movements'), orderBy('createdAt', 'desc')));
    const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as StockMovement));
    if (productId) {
      return all.filter(m => m.productId === productId || m.ingredientId === productId);
    }
    return all;
  }

  public static async registerManualStockMovement(params: {
    itemType: 'product' | 'ingredient';
    id: string;
    type: StockMovementType;
    quantity: number;
    reason: string;
    user: User;
    costPerUnit?: number;
    documentRef?: string;
    warehouseId?: string;
    warehouseName?: string;
    targetWarehouseId?: string;
    targetWarehouseName?: string;
  }): Promise<StockMovement> {
    const {
      itemType,
      id,
      type,
      quantity,
      reason,
      user,
      costPerUnit: customCost,
      documentRef,
      warehouseId,
      warehouseName,
      targetWarehouseId,
      targetWarehouseName
    } = params;

    return await runTransaction(db, async (transaction) => {
      const nowIso = new Date().toISOString();
      let itemName = '';
      let sku = '';
      let prevStock = 0;
      let nextStock = 0;
      let unit = 'un';
      let itemCost = customCost || 0;

      if (itemType === 'product') {
        const prodRef = doc(db, 'products', id);
        const prodSnap = await transaction.get(prodRef);
        if (!prodSnap.exists()) throw new Error('Produto não encontrado');
        const prodData = prodSnap.data() as Product;
        itemName = prodData.name;
        sku = prodData.sku;
        unit = prodData.unit || 'un';
        prevStock = prodData.currentStock;
        if (!customCost) itemCost = prodData.costPrice || 0;

        if (type === 'entry') nextStock = prevStock + quantity;
        else if (type === 'exit' || type === 'loss') nextStock = Math.max(0, prevStock - quantity);
        else if (type === 'transfer') nextStock = prevStock; // Total balance remains constant
        else nextStock = quantity;

        transaction.update(prodRef, { currentStock: nextStock });
      } else {
        const ingRef = doc(db, 'ingredients', id);
        const ingSnap = await transaction.get(ingRef);
        if (!ingSnap.exists()) throw new Error('Ingrediente não encontrado');
        const ingData = ingSnap.data() as Ingredient;
        itemName = ingData.name;
        unit = ingData.unit || 'un';
        prevStock = ingData.currentStock;
        if (!customCost) itemCost = ingData.costPerUnit || 0;

        if (type === 'entry') nextStock = prevStock + quantity;
        else if (type === 'exit' || type === 'loss') nextStock = Math.max(0, prevStock - quantity);
        else if (type === 'transfer') nextStock = prevStock; // Total balance remains constant
        else nextStock = quantity;

        transaction.update(ingRef, { currentStock: nextStock });
      }

      const totalCost = itemCost * quantity;
      const smId = `sm-${type}-${Date.now()}`;
      const stockMove: StockMovement = {
        id: smId,
        itemType,
        productId: itemType === 'product' ? id : undefined,
        ingredientId: itemType === 'ingredient' ? id : undefined,
        itemName,
        sku,
        type,
        quantity,
        previousStock: prevStock,
        nextStock,
        unit,
        costPerUnit: itemCost,
        totalCost,
        warehouseId: warehouseId || 'wh-central',
        warehouseName: warehouseName || 'Armazém Geral',
        targetWarehouseId,
        targetWarehouseName,
        reason,
        documentRef,
        userId: user.id,
        userName: user.name,
        createdAt: nowIso,
      };

      transaction.set(doc(db, 'stock_movements', smId), stockMove);

      // Audit log
      const auditId = `aud-${Date.now()}`;
      transaction.set(doc(db, 'audit_logs', auditId), {
        id: auditId,
        userId: user.id,
        userName: user.name,
        action: `ESTOQUE_${type.toUpperCase()}`,
        entity: itemType === 'product' ? 'PRODUCT' : 'INGREDIENT',
        entityId: id,
        description: `Movimento de estoque (${type.toUpperCase()}): "${itemName}" - Qtd: ${quantity} ${unit} (Anterior: ${prevStock}, Novo: ${nextStock}) - Motivo: ${reason}${documentRef ? ` [Doc: ${documentRef}]` : ''}.`,
        timestamp: nowIso,
      });

      return stockMove;
    });
  }

  public static async registerStockMovement(params: {
    productId?: string;
    ingredientId?: string;
    itemType?: 'product' | 'ingredient';
    type: StockMovementType;
    quantity: number;
    reason: string;
    user: User;
    costPerUnit?: number;
    documentRef?: string;
    warehouseId?: string;
    warehouseName?: string;
    targetWarehouseId?: string;
    targetWarehouseName?: string;
  }): Promise<StockMovement> {
    return this.registerManualStockMovement({
      itemType: params.itemType || (params.ingredientId ? 'ingredient' : 'product'),
      id: params.productId || params.ingredientId || '',
      type: params.type,
      quantity: params.quantity,
      reason: params.reason,
      user: params.user,
      costPerUnit: params.costPerUnit,
      documentRef: params.documentRef,
      warehouseId: params.warehouseId,
      warehouseName: params.warehouseName,
      targetWarehouseId: params.targetWarehouseId,
      targetWarehouseName: params.targetWarehouseName,
    });
  }

  public static async applyStockCountAdjustments(stockCountId: string, user: User): Promise<void> {
    return this.applyStockCountAdjustment(stockCountId, user);
  }

  // --- FINANCIAL TRANSACTIONS ---
  public static async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    const snap = await getDocs(query(collection(db, 'financial_transactions'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as FinancialTransaction));
  }

  public static async createFinancialTransaction(params: {
    type: 'inflow' | 'outflow';
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
    date: string;
    userId: string;
    userName: string;
    notes?: string;
  }): Promise<FinancialTransaction> {
    const id = `fin-${Date.now()}`;
    const newTrans: FinancialTransaction = {
      id,
      type: params.type,
      category: params.category,
      description: params.description,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      date: params.date,
      userId: params.userId,
      userName: params.userName,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'financial_transactions', id), newTrans);
    return newTrans;
  }

  public static async addFinancialTransaction(params: {
    type: 'inflow' | 'outflow';
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
    date: string;
    user: User;
    notes?: string;
  }): Promise<FinancialTransaction> {
    const id = `fin-${Date.now()}`;
    const newTrans: FinancialTransaction = {
      id,
      type: params.type,
      category: params.category,
      description: params.description,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      date: params.date,
      userId: params.user.id,
      userName: params.user.name,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'financial_transactions', id), newTrans);

    await this.logAudit({
      userId: params.user.id,
      userName: params.user.name,
      action: params.type === 'inflow' ? 'RECEITA_LANCADA' : 'DESPESA_LANCADA',
      entity: 'FINANCIAL_TRANSACTION',
      entityId: id,
      description: `Lançamento financeiro de ${params.amount} MT em "${params.category}": ${params.description}`,
    });

    return newTrans;
  }

  // --- AUDIT LOGS ---
  public static async getAuditLogs(): Promise<AuditLog[]> {
    const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
  }

  public static async logAudit(params: {
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId?: string;
    description: string;
    timestamp?: string;
  }): Promise<void> {
    try {
      const id = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const log: AuditLog = {
        id,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        timestamp: params.timestamp || new Date().toISOString(),
      };
      await setDoc(doc(db, 'audit_logs', id), log);
    } catch (e) {
      console.warn('Failed to write audit log:', e);
    }
  }

  // --- FASE 5: MESAS & COMANDAS (TABLE & TAB MANAGEMENT) ---
  public static async getTables(): Promise<DiningTable[]> {
    try {
      const snap = await getDocs(collection(db, 'tables'));
      if (snap.empty) {
        const batch = writeBatch(db);
        for (const tbl of DEFAULT_TABLES) {
          batch.set(doc(db, 'tables', tbl.id), tbl);
        }
        await batch.commit();
        return DEFAULT_TABLES;
      }
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as DiningTable));
    } catch {
      return DEFAULT_TABLES;
    }
  }

  public static async saveTable(table: DiningTable): Promise<void> {
    await setDoc(doc(db, 'tables', table.id), table, { merge: true });
  }

  public static async getComandas(): Promise<ComandaTab[]> {
    try {
      const snap = await getDocs(query(collection(db, 'comandas'), orderBy('openedAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as ComandaTab));
    } catch {
      return [];
    }
  }

  public static async saveComanda(comanda: ComandaTab): Promise<void> {
    await setDoc(doc(db, 'comandas', comanda.id), comanda, { merge: true });
  }

  // --- FASE 7: KITCHEN DISPLAY SYSTEM (KDS) ALIAS ---
  public static async updateKitchenStatus(orderId: string, status: KitchenStatus, user?: User): Promise<void> {
    return this.updateKitchenOrderStatus(orderId, status, user);
  }

  // --- FASE 8: COMPRAS & FORNECEDORES ---
  public static async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const snap = await getDocs(query(collection(db, 'purchase_orders'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseOrder));
    } catch {
      return [];
    }
  }

  public static async savePurchaseOrder(order: PurchaseOrder): Promise<void> {
    await setDoc(doc(db, 'purchase_orders', order.id), order, { merge: true });
  }

  public static async receivePurchaseOrder(orderId: string, user: User, invoiceNumber?: string): Promise<void> {
    const poRef = doc(db, 'purchase_orders', orderId);
    const snap = await getDoc(poRef);
    if (!snap.exists()) throw new Error('Ordem de compra não encontrada.');
    const po = snap.data() as PurchaseOrder;

    if (po.status === 'received') throw new Error('Esta ordem de compra já foi recebida.');

    const nowIso = new Date().toISOString();

    // 1. Add each received item to stock as an entry movement
    for (const item of po.items) {
      await this.registerManualStockMovement({
        itemType: item.itemType,
        id: item.itemId,
        type: 'entry',
        quantity: item.orderedQty,
        costPerUnit: item.unitCost,
        documentRef: invoiceNumber || po.invoiceNumber || po.orderNumber,
        warehouseId: po.targetWarehouseId || 'wh-central',
        warehouseName: po.targetWarehouseName || 'Armazém Geral',
        reason: `Recebimento de Compra: ${po.supplierName} (${po.orderNumber})`,
        user,
      });
    }

    // 2. Register financial transaction (outflow)
    await this.createFinancialTransaction({
      type: 'outflow',
      category: 'Compras de Mercadoria & Insumos',
      description: `Pagamento/Fatura Fornecedor ${po.supplierName} - Ordem #${po.orderNumber}`,
      amount: po.total,
      paymentMethod: 'Transferência Bancária',
      date: nowIso.slice(0, 10),
      userId: user.id,
      userName: user.name,
      notes: `Ordem ${po.orderNumber} recebida por ${user.name}.`,
    });

    // 3. Update PO status
    po.status = 'received';
    po.receivedDate = nowIso;
    if (invoiceNumber) po.invoiceNumber = invoiceNumber;
    await setDoc(poRef, po, { merge: true });
  }

  // --- FASE 10: FIDELIDADE & CUPONS DE PROMOÇÃO ---
  public static async getLoyaltyAccount(customerId: string): Promise<LoyaltyAccount | null> {
    try {
      const snap = await getDoc(doc(db, 'loyalty_accounts', customerId));
      return snap.exists() ? (snap.data() as LoyaltyAccount) : null;
    } catch {
      return null;
    }
  }

  public static async saveLoyaltyAccount(account: LoyaltyAccount): Promise<void> {
    await setDoc(doc(db, 'loyalty_accounts', account.customerId), account, { merge: true });
  }

  public static async getCoupons(): Promise<PromotionCoupon[]> {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      if (snap.empty) {
        const batch = writeBatch(db);
        for (const c of DEFAULT_COUPONS) {
          batch.set(doc(db, 'coupons', c.id), c);
        }
        await batch.commit();
        return DEFAULT_COUPONS;
      }
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as PromotionCoupon));
    } catch {
      return DEFAULT_COUPONS;
    }
  }

  public static async saveCoupon(coupon: PromotionCoupon): Promise<void> {
    await setDoc(doc(db, 'coupons', coupon.id), coupon, { merge: true });
  }

  // --- FASE 11: DELIVERY & TAXAS DE ZONA ---
  public static async getDeliveryZones(): Promise<DeliveryZone[]> {
    try {
      const snap = await getDocs(collection(db, 'delivery_zones'));
      if (snap.empty) {
        const batch = writeBatch(db);
        for (const z of DEFAULT_DELIVERY_ZONES) {
          batch.set(doc(db, 'delivery_zones', z.id), z);
        }
        await batch.commit();
        return DEFAULT_DELIVERY_ZONES;
      }
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as DeliveryZone));
    } catch {
      return DEFAULT_DELIVERY_ZONES;
    }
  }

  public static async saveDeliveryZone(zone: DeliveryZone): Promise<void> {
    await setDoc(doc(db, 'delivery_zones', zone.id), zone, { merge: true });
  }

  public static async getDeliveryOrders(): Promise<DeliveryOrder[]> {
    try {
      const snap = await getDocs(query(collection(db, 'delivery_orders'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as DeliveryOrder));
    } catch {
      return [];
    }
  }

  public static async saveDeliveryOrder(order: DeliveryOrder): Promise<void> {
    await setDoc(doc(db, 'delivery_orders', order.id), order, { merge: true });
  }

  public static async updateDeliveryStatus(orderId: string, status: DeliveryOrder['status']): Promise<void> {
    const updates: Partial<DeliveryOrder> = { status };
    if (status === 'delivered') updates.deliveredAt = new Date().toISOString();
    await updateDoc(doc(db, 'delivery_orders', orderId), updates);
  }

  // --- OFFLINE SYNC QUEUE (LOCALSTORAGE BACKUP & RETRY) ---
  public static getSyncQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem('koma_sync_queue');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static addToSyncQueue(item: Omit<SyncQueueItem, 'syncStatus' | 'retryCount'>): void {
    try {
      const queue = this.getSyncQueue();
      // Idempotency: avoid duplicates with same localId
      if (queue.some(q => q.localId === item.localId)) return;
      queue.push({
        ...item,
        syncStatus: 'pending',
        retryCount: 0,
      });
      localStorage.setItem('koma_sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('Could not store to sync queue:', e);
    }
  }

  public static async processSyncQueue(): Promise<{ synced: number; failed: number }> {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'sale') {
          await this.executeSaleTransaction(item.payload);
          synced++;
        } else if (item.type === 'kitchen_order') {
          await this.sendOrderToKitchen(item.payload);
          synced++;
        } else if (item.type === 'stock_loss') {
          await this.registerStockLoss(item.payload);
          synced++;
        }
      } catch (err: any) {
        failed++;
        item.retryCount = (item.retryCount || 0) + 1;
        item.errorMessage = err.message;
        item.syncStatus = 'failed';
        remaining.push(item);
      }
    }

    localStorage.setItem('koma_sync_queue', JSON.stringify(remaining));
    return { synced, failed };
  }

  // --- MULTI-TENANT SAAS: EMPRESAS & ORGANIZAÇÕES ---
  public static async getCompanies(): Promise<Company[]> {
    try {
      const snap = await getDocs(collection(db, 'companies'));
      if (snap.empty) {
        INITIAL_COMPANIES.forEach(c => {
          setDoc(doc(db, 'companies', c.id), c).catch(() => {});
        });
        return INITIAL_COMPANIES;
      }
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Company));
    } catch {
      return INITIAL_COMPANIES;
    }
  }

  public static async saveCompany(company: Company): Promise<void> {
    await setDoc(doc(db, 'companies', company.id), company, { merge: true });
  }

  public static async updateCompanyStatus(companyId: string, status: CompanyStatus): Promise<void> {
    await updateDoc(doc(db, 'companies', companyId), { status });
  }

  public static async deleteCompany(companyId: string): Promise<void> {
    await deleteDoc(doc(db, 'companies', companyId));
  }

  // --- MULTI-TENANT: ORGANIZAÇÕES, MARCAS & FILIAIS ---
  public static async getOrganizations(): Promise<Organization[]> {
    return INITIAL_ORGANIZATIONS;
  }

  public static async getBrands(companyId?: string): Promise<Brand[]> {
    if (!companyId) return INITIAL_BRANDS;
    return INITIAL_BRANDS.filter(b => b.companyId === companyId);
  }

  public static async getLocations(companyId?: string): Promise<Location[]> {
    try {
      const snap = await getDocs(collection(db, 'locations'));
      if (snap.empty) {
        INITIAL_LOCATIONS.forEach(l => {
          setDoc(doc(db, 'locations', l.id), l).catch(() => {});
        });
        return companyId ? INITIAL_LOCATIONS.filter(l => l.companyId === companyId) : INITIAL_LOCATIONS;
      }
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Location));
      return companyId ? list.filter(l => l.companyId === companyId) : list;
    } catch {
      return companyId ? INITIAL_LOCATIONS.filter(l => l.companyId === companyId) : INITIAL_LOCATIONS;
    }
  }

  public static async saveLocation(loc: Location): Promise<void> {
    await setDoc(doc(db, 'locations', loc.id), loc, { merge: true });
  }

  public static async getRegisters(locationId?: string): Promise<Register[]> {
    if (!locationId) return INITIAL_REGISTERS;
    return INITIAL_REGISTERS.filter(r => r.locationId === locationId);
  }

  public static async getPlans(): Promise<Plan[]> {
    return INITIAL_PLANS;
  }

  public static async getUserMemberships(userId: string): Promise<UserCompanyMembership[]> {
    const list = INITIAL_MEMBERSHIPS.filter(m => m.userId === userId);
    if (list.length === 0) {
      // Default to koma for standard accounts
      return [
        {
          id: `mem-${userId}-koma`,
          userId,
          companyId: 'company-koma',
          role: 'cashier',
          isDefault: true,
          status: 'active',
        }
      ];
    }
    return list;
  }

  public static async getTenantContext(
    userId: string,
    requestedCompanyId?: string,
    requestedLocationId?: string
  ): Promise<TenantContext> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId) || users[0];
    const memberships = await this.getUserMemberships(user.id);
    const allCompanies = await this.getCompanies();

    // Determine allowed companies
    const allowedCompanyIds = new Set(memberships.map(m => m.companyId));
    let authorizedCompanies = allCompanies.filter(c => allowedCompanyIds.has(c.id));
    if (authorizedCompanies.length === 0 || user.role === 'super_admin' || user.role === 'admin') {
      authorizedCompanies = allCompanies;
    }

    // Determine active company
    let activeCompany = authorizedCompanies.find(c => c.id === requestedCompanyId);
    if (!activeCompany) {
      const defaultMembership = memberships.find(m => m.isDefault);
      activeCompany =
        authorizedCompanies.find(c => c.id === defaultMembership?.companyId) ||
        authorizedCompanies[0] ||
        INITIAL_COMPANIES[0];
    }

    // Determine locations for active company
    const companyLocations = await this.getLocations(activeCompany.id);
    let activeLocation = companyLocations.find(l => l.id === requestedLocationId);
    if (!activeLocation) {
      activeLocation = companyLocations.find(l => l.isMatrix) || companyLocations[0] || INITIAL_LOCATIONS[0];
    }

    // Determine registers
    const registers = await this.getRegisters(activeLocation.id);
    const activeRegister = registers[0];

    // Determine plan
    const plans = await this.getPlans();
    const plan =
      plans.find(p => p.code === activeCompany.subscriptionPlan) ||
      plans.find(p => p.code === 'professional') ||
      plans[0];

    // Usage calculation
    const products = await this.getProducts();
    const sales = await this.getSales();
    const usage: CompanyUsage = {
      companyId: activeCompany.id,
      usersCount: users.length,
      locationsCount: companyLocations.length,
      registersCount: registers.length,
      productsCount: products.length,
      monthlyOrdersCount: sales.length,
      lastCalculatedAt: new Date().toISOString(),
    };

    const orgs = await this.getOrganizations();
    const organization = orgs.find(o => o.id === activeCompany.organizationId);

    return {
      user,
      organization,
      companies: authorizedCompanies,
      activeCompany,
      locations: companyLocations,
      activeLocation,
      registers,
      activeRegister,
      permissions: user.permissions || [],
      entitlements: plan.features,
      plan,
      usage,
    };
  }
}
