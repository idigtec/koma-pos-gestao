export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'stock_manager' | 'finance' | 'super_admin';

export type PermissionKey =
  | 'sales.create'
  | 'sales.cancel'
  | 'sales.refund'
  | 'sales.discount'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'products.change_price'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.transfer'
  | 'inventory.count'
  | 'cash.open'
  | 'cash.close'
  | 'cash.sangria'
  | 'cash.suprimento'
  | 'cash.view'
  | 'kitchen.view'
  | 'kitchen.update'
  | 'customers.manage'
  | 'finance.view'
  | 'reports.view'
  | 'users.manage'
  | 'settings.manage'
  | 'audit.view';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  passwordHash?: string;
  permissions?: PermissionKey[];
  avatar?: string;
  companyId?: string;
  companyName?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string; // emoji or icon name (e.g. 🍔, 🍕, 🍟, 🥤, 🍰, ☕, 🔥)
  description?: string;
  status: 'active' | 'inactive';
  color?: string;
}

// --- RESTAURANT & INGREDIENT RECIPE SYSTEM ---

export type UnitOfMeasure = 'un' | 'kg' | 'g' | 'L' | 'ml' | 'dose' | 'cx' | 'pct' | 'fardo';

export interface Ingredient {
  id: string;
  name: string;
  category?: string; // carnes, vegetais, laticinios, paes, bebidas, descartaveis
  unit: UnitOfMeasure;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierId?: string;
  supplierName?: string;
  isAvailable: boolean; // 86 status (false = Esgotado)
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitOfMeasure;
  costContribution?: number;
  wastePercent?: number; // % desperdício estimado
}

export type ModifierType = 'remove' | 'add' | 'substitute' | 'choose';

export interface ModifierOption {
  id: string;
  name: string; // e.g. "Sem cebola", "Extra Queijo (+30 MT)", "Pão Brioche (+50 MT)"
  type: ModifierType;
  priceAdjustment: number; // in MZN (e.g. 0 for removal, +30 for extra cheese)
  ingredientId?: string; // links to ingredient in stock
  inventoryEffectQuantity?: number; // e.g. +1 fatia de queijo or -1 (no deduction on remove)
  isDefault?: boolean;
  isAvailable?: boolean; // if false, greyed out (e.g. out of bacon)
}

export interface ModifierGroup {
  id: string;
  name: string; // e.g. "Remover Ingredientes", "Extras & Adicionais", "Tipo de Pão", "Molho Especial"
  required: boolean;
  minSelections: number;
  maxSelections: number;
  allowMultiple: boolean;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  unit: string; // un, dose, kg, etc.
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  status: 'active' | 'inactive';
  image?: string;
  imageBgColor?: string;
  isFoodItem?: boolean; // True for composed kitchen food items
  isFavorite?: boolean; // Featured on top POS
  isBestSeller?: boolean; // Best seller badge
  is86?: boolean; // 86 status = Esgotado temporariamente
  is86Reason?: string;
  is86By?: string;
  is86At?: string;
  averagePrepMinutes?: number; // Estimated kitchen prep time in mins (e.g. 10m)
  recipe?: RecipeItem[]; // Technical sheet of ingredients
  modifierGroups?: ModifierGroup[]; // Groups of customizations
  isCombo?: boolean;
  comboItems?: { productId: string; name: string; quantity: number }[];
  displayOrder?: number;
  locationPrices?: Record<string, number>; // Sobrescrita de preço por filial
  locationStatus86?: Record<string, boolean>; // Esgotado apenas na filial especificada
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  documentType: 'BI' | 'NUIT' | 'Passaporte' | 'Outro';
  documentNumber?: string;
  phone?: string;
  secondaryPhone?: string; // Telefone Secundário / Alternativo
  email?: string;
  address?: string; // Morada / Endereço / Bairro
  city?: string;
  notes?: string;
  totalSpent: number;
  totalPurchases: number;
  status: 'active' | 'inactive';
  customerType?: 'singular' | 'empresa';
  createdAt: string;
}

export type PaymentMethod = 'dinheiro' | 'cartao' | 'transferencia' | 'carteira_movel' | 'misto';

export interface PaymentItem {
  method: PaymentMethod;
  label: string;
  amount: number;
  receivedAmount?: number;
  change?: number;
}

export interface SelectedModifier {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  type: ModifierType;
  priceAdjustment: number;
  ingredientId?: string;
  inventoryEffectQuantity?: number;
}

export interface CartItem {
  cartItemId: string; // unique instance in cart (to allow two same burgers with different mods)
  product: Product;
  quantity: number;
  unitPrice: number;
  selectedModifiers: SelectedModifier[];
  removedIngredients?: string[]; // Ex: ["Cebola", "Tomate", "Queijo"]
  notes?: string; // free text: "bem passado", "sem pimenta", "cortar ao meio"
  discount: number; // in currency MT
  subtotal: number;
}

export type DiningOption = 'balcao' | 'mesa' | 'takeaway' | 'delivery';

export interface Sale {
  id: string;
  saleNumber: string;
  cashSessionId: string;
  cashierId: string;
  cashierName: string;
  customerId: string;
  customerName: string;
  diningOption: DiningOption;
  tableNumber?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  total: number;
  payments: PaymentItem[];
  status: 'completed' | 'cancelled';
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  kitchenOrderId?: string;
  taxCertification?: {
    certNumber: string;
    hash4Chars: string;
    fullHash: string;
    vatRate: number; // 16%
    vatAmount: number;
    qrCodeString: string;
  };
  mpesaTransactionId?: string;
  mpesaPhone?: string;
  createdAt: string;
}

export interface SupportSession {
  id: string;
  supportUserId: string;
  supportUserName: string;
  targetCompanyId: string;
  targetCompanyName: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
}

export type KitchenStatus = 'novo' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';

export interface KitchenOrder {
  id: string;
  orderNumber: string; // e.g. #1024
  saleId?: string;
  cashSessionId?: string;
  diningOption: DiningOption;
  tableNumber?: string;
  customerName?: string;
  items: {
    cartItemId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    selectedModifiers: SelectedModifier[];
    notes?: string;
    averagePrepMinutes?: number;
  }[];
  total: number;
  status: KitchenStatus;
  isPaid: boolean;
  createdAt: string;
  startedPrepAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface SuspendedSale {
  id: string;
  identifier: string;
  customer: Customer;
  diningOption?: DiningOption;
  tableNumber?: string;
  items: CartItem[];
  discount: number;
  savedAt: string;
}

export interface CashSession {
  id: string;
  cashRegisterName: string;
  userId: string;
  userName: string;
  initialAmount: number;
  totalSales: number;
  totalInflows: number;
  totalOutflows: number;
  totalSangrias: number;
  totalSuprimentos: number;
  expectedAmount: number;
  countedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

export type CashMovementType = 'sangria' | 'suprimento' | 'sale' | 'inflow' | 'outflow';

export interface CashMovement {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  userId: string;
  userName: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string; // Ex: "ALM-01", "BAR-01", "COZ-01"
  description?: string;
  isDefault?: boolean;
  status: 'active' | 'inactive';
  location?: string;
  createdAt: string;
}

export type StockMovementType = 'entry' | 'exit' | 'adjustment' | 'sale' | 'return' | 'loss' | 'inventory' | 'transfer';

export interface StockMovement {
  id: string;
  itemType: 'product' | 'ingredient';
  productId?: string;
  ingredientId?: string;
  itemName: string;
  productName?: string;
  sku?: string;
  type: StockMovementType;
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
  referenceId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  nuit: string; // Tax number in Mozambique
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type StockLossReason = 'vencido' | 'estragado' | 'danificado' | 'quebra' | 'consumo_interno' | 'erro_producao' | 'outro';

export interface StockLoss {
  id: string;
  itemType: 'product' | 'ingredient';
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: StockLossReason;
  cost: number;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: string;
}

export interface StockCountItem {
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

export interface StockCount {
  id: string;
  title: string;
  warehouseId?: string;
  warehouseName?: string;
  date: string;
  performedBy: string;
  status: 'draft' | 'completed';
  notes?: string;
  items: StockCountItem[];
  createdAt: string;
  completedAt?: string;
}

export type FinancialType = 'inflow' | 'outflow';

export interface FinancialTransaction {
  id: string;
  type: FinancialType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: string;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  timestamp: string;
  ip?: string;
}

export interface CompanySettings {
  companyName: string;
  tradingName: string;
  nuit: string; // Tax ID in Mozambique
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  currency: string;
  receiptFooterMessage: string;
  defaultMinStockAlert: number;
  // POS Preferences
  posMode: 'commercial' | 'restaurant';
  posUiMode: 'touch' | 'compact';
  posCardSize: 'normal' | 'large';
  posShowImages: boolean;
  posShowStock: boolean;
  posSoundEnabled: boolean;
  posAutoSendKitchen: boolean;
}

export interface SyncQueueItem {
  localId: string;
  type: 'sale' | 'kitchen_order' | 'stock_loss' | 'stock_count';
  payload: any;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

// --- FASE 5: MESAS & COMANDAS ---
export interface DiningTable {
  id: string;
  number: string; // Ex: "Mesa 01", "Mesa 02", "Esplanada 05", "Balcão 03"
  zone: 'salao' | 'esplanada' | 'balcao' | 'vip';
  capacity: number;
  status: 'free' | 'occupied' | 'billing' | 'reserved';
  currentTabId?: string;
  openedAt?: string;
  totalAmount?: number;
  customerName?: string;
  waiterName?: string;
}

export interface ComandaTab {
  id: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  waiterId: string;
  waiterName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'open' | 'closed' | 'billing';
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
}

// --- FASE 8: COMPRAS & FORNECEDORES ---
export interface PurchaseOrderItem {
  id: string;
  itemType: 'product' | 'ingredient';
  itemId: string;
  itemName: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // Ex: "OC-2026/001"
  supplierId: string;
  supplierName: string;
  supplierNuit?: string;
  targetWarehouseId: string;
  targetWarehouseName: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  expectedDeliveryDate?: string;
  receivedDate?: string;
  invoiceNumber?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentCondition?: 'a_vista' | '30_dias' | '60_dias';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

// --- FASE 10: FIDELIDADE & PROMOÇÕES ---
export interface LoyaltyAccount {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  pointsBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  cashbackBalance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'black';
  updatedAt: string;
}

export interface PromotionCoupon {
  id: string;
  code: string; // Ex: "KOMA10", "HAPPYHOUR", "MOZ20"
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10% or 100 MT
  minOrderValue?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  timesUsed: number;
  status: 'active' | 'expired' | 'inactive';
}

// --- FASE 11: DELIVERY & TAXAS ---
export interface DeliveryZone {
  id: string;
  name: string; // Ex: "Polana Cimento", "Sommerschield", "Baixa de Maputo", "Costa do Sol", "Matola Central"
  fee: number; // in MT (e.g. 100 MT, 150 MT, 250 MT)
  estimatedMinutes: number;
  active: boolean;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  zoneId?: string;
  zoneName?: string;
  deliveryFee: number;
  driverName?: string;
  driverPhone?: string;
  status: 'pending' | 'kitchen' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  items: CartItem[];
  total: number;
  paymentMethod: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
}

// --- MULTI-TENANT / MULTI-EMPRESA SAAS ---
export type CompanyStatus =
  | 'active'
  | 'suspended'
  | 'trial'
  | 'provisioning'
  | 'past_due'
  | 'grace'
  | 'archived'
  | 'cancelled';

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  country: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Brand {
  id: string;
  companyId: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  status: 'active' | 'inactive';
}

export type LocationType =
  | 'STORE'
  | 'RESTAURANT'
  | 'WAREHOUSE'
  | 'OFFICE'
  | 'KIOSK'
  | 'DARK_KITCHEN'
  | 'OTHER';

export interface LocationOpeningHours {
  day: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface Location {
  id: string;
  companyId: string;
  brandId?: string;
  name: string;
  code: string;
  type: LocationType;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  province?: string;
  district?: string;
  status: 'ACTIVE' | 'TEMPORARILY_CLOSED' | 'SUSPENDED' | 'ARCHIVED';
  openingHours?: LocationOpeningHours[];
  timezone: string;
  isMatrix?: boolean;
}

export interface Register {
  id: string;
  locationId: string;
  companyId: string;
  code: string;
  name: string;
  status: 'CLOSED' | 'OPEN' | 'LOCKED' | 'MAINTENANCE';
  currentCashSessionId?: string;
  createdAt: string;
}

export interface UserCompanyMembership {
  id: string;
  userId: string;
  companyId: string;
  role: UserRole;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export interface UserLocationMembership {
  id: string;
  userId: string;
  locationId: string;
  companyId: string;
  role: UserRole;
}

export interface PlanLimit {
  maxUsers: number;
  maxLocations: number;
  maxRegisters: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
}

export interface Plan {
  id: string;
  name: string;
  code: string; // starter | professional | enterprise
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: PlanLimit;
  status: 'active' | 'inactive';
}

export interface CompanyUsage {
  companyId: string;
  usersCount: number;
  locationsCount: number;
  registersCount: number;
  productsCount: number;
  monthlyOrdersCount: number;
  lastCalculatedAt: string;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  planCode: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'GRACE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  startedAt: string;
  validUntil: string;
  trialEndsAt?: string;
  monthlyPrice: number;
  currency: string;
  autoRenew: boolean;
}

export interface TenantContext {
  user: User;
  organization?: Organization;
  companies: Company[];
  activeCompany: Company;
  locations: Location[];
  activeLocation: Location;
  registers: Register[];
  activeRegister?: Register;
  permissions: PermissionKey[];
  entitlements: string[];
  plan: Plan;
  usage: CompanyUsage;
}

export interface Company {
  id: string;
  organizationId?: string;
  name: string; // Razão Social
  tradeName: string; // Nome Fantasia
  nuit: string; // NUIT Moçambique (9 dígitos)
  email: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  province?: string;
  district?: string;
  logoUrl?: string;
  status: CompanyStatus;
  subscriptionPlan: SubscriptionPlan;
  maxUsers: number;
  maxBranches: number;
  branchesCount?: number;
  currency: string;
  timezone?: string;
  createdAt: string;
  validUntil?: string;
  notes?: string;
}
