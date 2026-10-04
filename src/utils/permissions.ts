import { User, UserRole, PermissionKey } from '../types';

export interface RoleInfo {
  role: UserRole;
  name: string;
  badgeColor: string;
  description: string;
  defaultPermissions: PermissionKey[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  super_admin: {
    role: 'super_admin',
    name: 'Super Administrador',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    description: 'Acesso irrestrito a todas as configurações, filiais, usuários e auditoria do sistema.',
    defaultPermissions: [
      'sales.create', 'sales.cancel', 'sales.refund', 'sales.discount',
      'products.create', 'products.edit', 'products.delete', 'products.change_price',
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.view',
      'kitchen.view', 'kitchen.update',
      'customers.manage', 'finance.view', 'reports.view',
      'users.manage', 'settings.manage', 'audit.view'
    ],
  },
  admin: {
    role: 'admin',
    name: 'Administrador',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Gestão operacional completa, controle de equipe, cancelamentos e relatórios gerenciais.',
    defaultPermissions: [
      'sales.create', 'sales.cancel', 'sales.refund', 'sales.discount',
      'products.create', 'products.edit', 'products.delete', 'products.change_price',
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.view',
      'kitchen.view', 'kitchen.update',
      'customers.manage', 'finance.view', 'reports.view',
      'users.manage', 'settings.manage', 'audit.view'
    ],
  },
  manager: {
    role: 'manager',
    name: 'Gerente Operacional',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Supervisão de turno, autorização de descontos, estoque, compras e relatórios de vendas.',
    defaultPermissions: [
      'sales.create', 'sales.cancel', 'sales.refund', 'sales.discount',
      'products.create', 'products.edit', 'products.change_price',
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.view',
      'kitchen.view', 'kitchen.update',
      'customers.manage', 'finance.view', 'reports.view', 'audit.view'
    ],
  },
  cashier: {
    role: 'cashier',
    name: 'Operador de Caixa (PDV)',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
    description: 'Abertura de caixa, emissão de tickets, fechamento de turno e atendimento ao balcão.',
    defaultPermissions: [
      'sales.create', 'sales.discount',
      'cash.open', 'cash.close', 'cash.view',
      'customers.manage'
    ],
  },
  kitchen: {
    role: 'kitchen',
    name: 'Chefe / Operador de Cozinha (KDS)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Acompanhamento do painel KDS, preparo de pedidos, tempos de cozinha e conferência de ingredientes.',
    defaultPermissions: [
      'kitchen.view', 'kitchen.update',
      'inventory.view'
    ],
  },
  stock_manager: {
    role: 'stock_manager',
    name: 'Gestor de Estoque',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    description: 'Controle de armazém, inventário físico, conferência de compras e perdas/desperdícios.',
    defaultPermissions: [
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count',
      'products.create', 'products.edit', 'reports.view'
    ],
  },
  finance: {
    role: 'finance',
    name: 'Analista Financeiro',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    description: 'Fluxo de caixa, receitas, despesas operacionais, conferência de sangrias e relatórios fiscais.',
    defaultPermissions: [
      'finance.view', 'reports.view', 'cash.view', 'audit.view'
    ],
  },
};

export const ALL_PERMISSIONS_LIST: { key: PermissionKey; name: string; category: string }[] = [
  // Vendas
  { key: 'sales.create', name: 'Realizar Vendas no PDV', category: 'Vendas' },
  { key: 'sales.cancel', name: 'Cancelar Vendas & Pedidos', category: 'Vendas' },
  { key: 'sales.refund', name: 'Processar Reembolsos & Devoluções', category: 'Vendas' },
  { key: 'sales.discount', name: 'Aplicar Descontos em Vendas', category: 'Vendas' },

  // Produtos & Cardápio
  { key: 'products.create', name: 'Cadastrar Produtos & Fichas', category: 'Cardápio' },
  { key: 'products.edit', name: 'Editar Produtos & Preços', category: 'Cardápio' },
  { key: 'products.delete', name: 'Excluir Produtos', category: 'Cardápio' },
  { key: 'products.change_price', name: 'Alterar Preço Direto no Caixa', category: 'Cardápio' },

  // Estoque
  { key: 'inventory.view', name: 'Visualizar Estoque & Insumos', category: 'Estoque' },
  { key: 'inventory.adjust', name: 'Realizar Ajustes de Estoque', category: 'Estoque' },
  { key: 'inventory.transfer', name: 'Transferências entre Locais', category: 'Estoque' },
  { key: 'inventory.count', name: 'Efetuar Contagem de Inventário', category: 'Estoque' },

  // Caixa
  { key: 'cash.open', name: 'Abrir Turno de Caixa', category: 'Caixa' },
  { key: 'cash.close', name: 'Fechar Caixa & Conferência', category: 'Caixa' },
  { key: 'cash.sangria', name: 'Efetuar Sangrias / Retiradas', category: 'Caixa' },
  { key: 'cash.suprimento', name: 'Efetuar Suprimentos / Entradas', category: 'Caixa' },
  { key: 'cash.view', name: 'Consultar Movimentos de Caixa', category: 'Caixa' },

  // Cozinha
  { key: 'kitchen.view', name: 'Acessar Painel KDS de Cozinha', category: 'Cozinha' },
  { key: 'kitchen.update', name: 'Alterar Status de Preparo (KDS)', category: 'Cozinha' },

  // Outros
  { key: 'customers.manage', name: 'Gerenciar Cadastro de Clientes', category: 'Clientes' },
  { key: 'finance.view', name: 'Acessar Módulo Financeiro', category: 'Financeiro' },
  { key: 'reports.view', name: 'Acessar Relatórios & Exportações', category: 'Relatórios' },
  { key: 'users.manage', name: 'Gerenciar Usuários & Perfis', category: 'Administração' },
  { key: 'settings.manage', name: 'Gerenciar Configurações Gerais', category: 'Administração' },
  { key: 'audit.view', name: 'Visualizar Logs de Auditoria', category: 'Administração' },
];

export function hasPermission(user: User | null, permission: PermissionKey): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  // Check explicit permissions array on user
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }

  // Fallback to role definition defaults
  const roleDef = ROLE_DEFINITIONS[user.role];
  if (roleDef && roleDef.defaultPermissions.includes(permission)) {
    return true;
  }

  return false;
}
