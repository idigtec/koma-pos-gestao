import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  AlertCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  Receipt,
  X,
  Check,
  Package,
  Percent,
  Coins,
  Sparkles,
  SlidersHorizontal,
  UserPlus,
  Phone,
  MapPin,
  UtensilsCrossed,
  Star,
  ArrowUpDown,
  FolderTree,
  Edit3,
  Layers,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DatabaseService } from '../services/db';
import {
  Product,
  Category,
  Customer,
  CartItem,
  PaymentItem,
  PaymentMethod,
  SuspendedSale,
  CompanySettings,
  Sale,
  SelectedModifier,
  DiningOption
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { TaxService } from '../utils/taxService';
import { IndexedDbService } from '../services/indexedDbService';
import { LocalPersistenceService } from '../services/localPersistence';
import { useAuth } from '../contexts/AuthContext';
import { useCash } from '../contexts/CashContext';
import { useToast } from '../contexts/ToastContext';
import { ReceiptModal } from '../components/modals/ReceiptModal';
import { DiscountModal } from '../components/modals/DiscountModal';
import { ProductIllustration } from '../components/ProductIllustration';
import { ItemCompositionModal } from '../components/modals/ItemCompositionModal';
import { QuickCustomerModal } from '../components/modals/QuickCustomerModal';
import { EditCartItemPriceModal } from '../components/modals/EditCartItemPriceModal';
import { ProductCustomizerModal } from '../components/modals/ProductCustomizerModal';
import { TableMapModal } from '../components/modals/TableMapModal';

export const PDV: React.FC = () => {
  const { user, activeLocation, activeCompany } = useAuth();
  const { activeSession, isOpen: isCashOpen } = useCash();
  const { success, error, warning, info } = useToast();

  // M-Pesa / Mobile Payment state
  const [mobileProvider, setMobileProvider] = useState<'mpesa' | 'emola' | 'ponto24'>('mpesa');
  const [mobilePhone, setMobilePhone] = useState('+258 84 ');
  const [isMpesaPushing, setIsMpesaPushing] = useState(false);
  const [mpesaTxId, setMpesaTxId] = useState<string | null>(null);

  const handleTriggerMpesaPush = () => {
    if (!mobilePhone || mobilePhone.replace(/\D/g, '').length < 9) {
      warning('Número Inválido', 'Insira um número de telemóvel moçambicano válido para disparar o STK Push.');
      return;
    }
    setIsMpesaPushing(true);
    info('M-Pesa STK Push Enviado', `Prompt USSD enviado para ${mobilePhone}. Aguarde a inserção do PIN pelo cliente.`);
    setTimeout(() => {
      setIsMpesaPushing(false);
      const generatedTx = `MP${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${Math.floor(1000 + Math.random() * 9000)}.MZ`;
      setMpesaTxId(generatedTx);
      success('Pagamento Aprovado pelo Cliente!', `M-Pesa confirmou o débito com sucesso. Transação: ${generatedTx}`);
    }, 2000);
  };

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  
  // Default Category preference stored in localStorage
  const [defaultCategory, setDefaultCategory] = useState<string>(() => {
    return localStorage.getItem('koma_default_category') || 'all';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return localStorage.getItem('koma_default_category') || 'all';
  });

  // Organization / Sort option ("E em todos eu posso organizar")
  type SortOption = 'popular' | 'name_asc' | 'price_asc' | 'price_desc' | 'stock_desc';
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([]);
  
  // Discount states (Valor Fixo first and standard)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Dining Option & Table Mapping
  const [diningOption, setDiningOption] = useState<DiningOption>('mesa');
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Modals & Panels
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);
  const [compositionModalItem, setCompositionModalItem] = useState<CartItem | null>(null);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<CartItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [mistoCash, setMistoCash] = useState<string>('');
  const [mistoCard, setMistoCard] = useState<string>('');
  const [mistoMobile, setMistoMobile] = useState<string>('');

  // Offline & IndexedDB states
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load initial data with IndexedDB cache fallback
  const loadData = async () => {
    try {
      const [prods, custs, sett, cats] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getCustomers(),
        DatabaseService.getSettings(),
        DatabaseService.getCategories(),
      ]);
      setProducts(prods);
      setCustomers(custs);
      setSettings(sett);
      setCategoriesList(cats);

      // Cache to IndexedDB using 'idb' for offline access
      IndexedDbService.cacheCatalog(prods, cats).catch(() => {});
      LocalPersistenceService.saveCustomers(custs).catch(() => {});

      // Refresh pending count
      IndexedDbService.getPendingCount().then(setPendingOfflineCount).catch(() => {});

      // Default customer: "Consumidor Final"
      const defaultCust = custs.find(c => c.id === 'customer-final') || custs[0] || {
        id: 'customer-final',
        name: 'Consumidor Final',
        documentType: 'Outro',
        totalSpent: 0,
        totalPurchases: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setSelectedCustomer(defaultCust);
    } catch (err) {
      console.warn('Network load failed, falling back to IndexedDB catalog:', err);
      const [cached, cachedCusts] = await Promise.all([
        IndexedDbService.getCachedCatalog(),
        LocalPersistenceService.getCustomers().catch(() => [])
      ]);

      if (cached && cached.products.length > 0) {
        setProducts(cached.products);
        setCategoriesList(cached.categories);
        info('Modo Offline', 'Catálogo carregado a partir do cache local do IndexedDB.');
      }
      if (cachedCusts && cachedCusts.length > 0) {
        setCustomers(cachedCusts);
      }
      IndexedDbService.getPendingCount().then(setPendingOfflineCount).catch(() => {});
    }
  };

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      warning('Sem Conexão', 'Conecte-se à internet para sincronizar com o servidor.');
      return;
    }
    try {
      setIsSyncingOffline(true);
      const { synced, failed } = await IndexedDbService.syncPendingSales();
      if (synced > 0) {
        success('Sincronização Concluída', `${synced} venda(s) offline sincronizada(s) com sucesso!`);
        await loadData();
      } else if (failed > 0) {
        warning('Atenção', `${failed} venda(s) não puderam ser sincronizadas. Tentaremos novamente.`);
      } else {
        info('Tudo Atualizado', 'Todas as vendas já estão sincronizadas com o banco de dados.');
      }
      const count = await IndexedDbService.getPendingCount();
      setPendingOfflineCount(count);
    } catch (err: any) {
      error('Erro ao sincronizar', err.message || 'Falha ao sincronizar vendas offline.');
    } finally {
      setIsSyncingOffline(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto focus search
    setTimeout(() => searchInputRef.current?.focus(), 200);

    // Automatic Synchronization of Offline Sales when connection restores
    const handleOnlineSync = async () => {
      setIsOnline(true);
      try {
        const { synced, failed } = await IndexedDbService.syncPendingSales();
        if (synced > 0) {
          success(
            'Sincronização Concluída',
            `${synced} venda(s) registrada(s) no modo offline foram sincronizadas com sucesso!`
          );
          await loadData();
        }
        const count = await IndexedDbService.getPendingCount();
        setPendingOfflineCount(count);
      } catch (err) {
        console.warn('Erro ao sincronizar vendas offline:', err);
      }
    };

    const handleOfflineEvent = () => {
      setIsOnline(false);
      IndexedDbService.getPendingCount().then(setPendingOfflineCount).catch(() => {});
    };

    window.addEventListener('online', handleOnlineSync);
    window.addEventListener('offline', handleOfflineEvent);

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TRIGGER_OFFLINE_SYNC') {
        handleOnlineSync();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSwMessage);

    // Initial check on mount
    if (navigator.onLine) {
      handleOnlineSync();
    } else {
      IndexedDbService.getPendingCount().then(setPendingOfflineCount).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnlineSync);
      window.removeEventListener('offline', handleOfflineEvent);
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
    };
  }, []);

  // Global Keyboard shortcuts (F2, F4, F6, F8, F10, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) setIsDiscountModalOpen(true);
      } else if (e.key === 'F8' || e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentModalOpen(true);
        } else {
          warning('Carrinho Vazio', 'Adicione pelo menos um item para prosseguir com a venda.');
        }
      } else if (e.key === 'Escape') {
        setIsCustomerModalOpen(false);
        setIsDiscountModalOpen(false);
        setIsPaymentModalOpen(false);
        setIsSuspendedModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, warning]);

  // Categories chips with icons and product counts
  const categoryChips = useMemo(() => {
    const list: { id: string; name: string; icon: string; count: number }[] = [
      { id: 'all', name: 'Todos', icon: '🍽️', count: products.length }
    ];

    if (categoriesList.length > 0) {
      categoriesList
        .filter(c => c.status === 'active')
        .forEach(c => {
          const count = products.filter(
            p => p.categoryId === c.id || p.categoryName?.toLowerCase() === c.name.toLowerCase()
          ).length;
          list.push({
            id: c.id,
            name: c.name,
            icon: c.icon || '🏷️',
            count,
          });
        });
    } else {
      const set = new Set<string>();
      products.forEach(p => {
        if (p.categoryName) set.add(p.categoryName);
      });
      set.forEach(name => {
        list.push({
          id: name,
          name,
          icon: '🏷️',
          count: products.filter(p => p.categoryName === name).length,
        });
      });
    }
    return list;
  }, [categoriesList, products]);

  // Set or toggle default category
  const handleToggleDefaultCategory = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    const newDefault = defaultCategory === catId ? 'all' : catId;
    setDefaultCategory(newDefault);
    localStorage.setItem('koma_default_category', newDefault);
    const catName = categoryChips.find(c => c.id === newDefault)?.name || 'Todos';
    success(
      'Categoria Padrão Salva',
      `"${catName}" foi definida como padrão ao abrir o Frente de Caixa.`
    );
  };

  // Sort products helper ("E em todos eu posso organizar")
  const sortProducts = (items: Product[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'popular') {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (a.displayOrder || 99) - (b.displayOrder || 99);
      }
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'stock_desc') return b.currentStock - a.currentStock;
      return 0;
    });
  };

  // Group products by category when "Todos" is selected
  const productsByCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const groups: { categoryId: string; categoryName: string; categoryIcon: string; items: Product[] }[] = [];

    categoryChips.forEach(cat => {
      if (cat.id === 'all') return;
      const items = products.filter(p => {
        if (p.status !== 'active') return false;
        const matchesCat =
          p.categoryId === cat.id ||
          p.categoryName?.toLowerCase() === cat.name.toLowerCase() ||
          p.categoryName?.toLowerCase() === cat.id.toLowerCase();
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q);
        return matchesCat && matchesQuery;
      });

      if (items.length > 0) {
        groups.push({
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          items: sortProducts(items),
        });
      }
    });

    return groups;
  }, [products, categoryChips, searchQuery, sortBy]);

  // Filtered products for single category view
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const items = products.filter(p => {
      if (p.status !== 'active') return false;
      const matchesCat =
        selectedCategory === 'all' ||
        p.categoryId === selectedCategory ||
        p.categoryName?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.categoryName === selectedCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchesCat && matchesQuery;
    });
    return sortProducts(items);
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleOpenEditPriceModal = (item: CartItem) => {
    setEditingPriceItem(item);
    setIsEditPriceModalOpen(true);
  };

  const handleSaveItemPrice = (
    cartItemId: string,
    newUnitPrice: number,
    newQuantity: number,
    newDiscount: number
  ) => {
    setCart(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              unitPrice: newUnitPrice,
              quantity: newQuantity,
              discount: newDiscount,
              subtotal: Math.max(0, newUnitPrice * newQuantity - newDiscount),
            }
          : item
      )
    );
    success('Preço Atualizado', 'O preço e subtotal do item foram recalculados.');
  };

  // Cart totals calculation
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const itemsDiscount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.discount, 0);
  }, [cart]);

  const calculatedGlobalDiscount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const totalDiscount = itemsDiscount + calculatedGlobalDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const handleApplyDiscount = (type: 'fixed' | 'percentage', val: number) => {
    setDiscountType(type);
    setDiscountValue(val);
    success(
      'Desconto Aplicado',
      `Desconto de ${type === 'fixed' ? formatCurrency(val) : `${val}%`} aplicado no total.`
    );
  };

  const handleRemoveDiscount = () => {
    setDiscountValue(0);
    info('Desconto Removido', 'O desconto foi removido do total.');
  };

  // Filtered customers for customer picker modal
  const filteredCustomers = useMemo(() => {
    const term = customerSearchTerm.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.secondaryPhone && c.secondaryPhone.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.documentNumber && c.documentNumber.includes(term))
    );
  }, [customers, customerSearchTerm]);

  const handleOpenCompositionModal = (item: CartItem) => {
    setCompositionModalItem(item);
    setIsCompositionModalOpen(true);
  };

  const handleSaveItemComposition = (cartItemId: string, removedIngredients: string[], notes: string) => {
    setCart(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, removedIngredients, notes }
          : item
      )
    );
    success('Personalização Salva', 'Composição do prato atualizada para a cozinha.');
  };

  const handleCustomerCreated = (newCust: Customer) => {
    setCustomers(prev => [newCust, ...prev]);
    setSelectedCustomer(newCust);
  };

  const handleCustomizerConfirm = (customizedData: {
    selectedModifiers: SelectedModifier[];
    notes: string;
    quantity: number;
    unitPrice: number;
  }) => {
    if (!customizingProduct) return;
    const subtotal = customizedData.unitPrice * customizedData.quantity;
    const newCartItem: CartItem = {
      cartItemId: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product: customizingProduct,
      quantity: customizedData.quantity,
      unitPrice: customizedData.unitPrice,
      selectedModifiers: customizedData.selectedModifiers,
      notes: customizedData.notes,
      discount: 0,
      subtotal,
    };
    setCart(prev => [...prev, newCartItem]);
    setIsCustomizerModalOpen(false);
    setCustomizingProduct(null);
    success('Adicionado ao Pedido', `${customizedData.quantity}x "${customizingProduct.name}" com customizações.`);
  };

  // Cart operations
  const addToCart = (product: Product, qty: number = 1) => {
    if (product.currentStock <= 0) {
      error('Estoque Esgotado', `O produto "${product.name}" está sem estoque.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > product.currentStock) {
          warning(
            'Limite de Estoque',
            `Estoque disponível para "${product.name}": ${product.currentStock} ${product.unit}.`
          );
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice - item.discount }
            : item
        );
      }

      if (qty > product.currentStock) {
        warning(
          'Limite de Estoque',
          `Estoque disponível para "${product.name}": ${product.currentStock} ${product.unit}.`
        );
        return prev;
      }

      const effectivePrice = (activeLocation && product.locationPrices?.[activeLocation.id]) ?? product.sellingPrice;
      const newItem: CartItem = {
        cartItemId: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        product,
        quantity: qty,
        unitPrice: effectivePrice,
        selectedModifiers: [],
        discount: 0,
        subtotal: effectivePrice * qty,
      };
      return [...prev, newItem];
    });

    setSearchQuery('');
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (prod && newQty > prod.currentStock) {
      warning('Limite de Estoque', `Disponível em estoque: ${prod.currentStock} ${prod.unit}.`);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice - item.discount }
          : item
      )
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, discount, subtotal: item.quantity * item.unitPrice - discount }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
  };

  // Barcode / Direct Search Enter Handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (!q) return;

      // Exact barcode or SKU match
      const exact = products.find(
        p => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase()
      );

      if (exact) {
        addToCart(exact);
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Suspend Cart (hold sale)
  const handleSuspendSale = () => {
    if (cart.length === 0) return;
    const suspended: SuspendedSale = {
      id: `susp-${Date.now()}`,
      identifier: `Venda em Espera #${suspendedSales.length + 1} (${cart.length} itens)`,
      customer: selectedCustomer!,
      items: cart,
      discount: calculatedGlobalDiscount,
      savedAt: new Date().toISOString(),
    };
    setSuspendedSales(prev => [...prev, suspended]);
    clearCart();
    info('Venda Suspensa', 'A venda foi salva em espera. Você pode atendê-la a qualquer momento.');
  };

  const handleResumeSale = (susp: SuspendedSale) => {
    if (cart.length > 0) {
      warning('Atenção', 'Conclua ou cancele o carrinho atual antes de retomar outra venda.');
      return;
    }
    setCart(susp.items);
    setSelectedCustomer(susp.customer);
    setDiscountType('fixed');
    setDiscountValue(susp.discount);
    setSuspendedSales(prev => prev.filter(s => s.id !== susp.id));
    setIsSuspendedModalOpen(false);
    success('Venda Retomada', 'Carrinho restaurado com sucesso.');
  };

  // Open Payment modal with default calculated total
  const handleOpenPayment = () => {
    if (cart.length === 0) {
      warning('Carrinho Vazio', 'Adicione produtos para finalizar.');
      return;
    }
    setReceivedCash(grandTotal.toString());
    setMistoCash((grandTotal / 2).toFixed(2));
    setMistoMobile((grandTotal / 2).toFixed(2));
    setIsPaymentModalOpen(true);
  };

  // Finalize Sale Transaction
  const handleFinalizeSale = async () => {
    if (!user) {
      error('Usuário não autenticado');
      return;
    }
    if (cart.length === 0) {
      error('Carrinho vazio');
      return;
    }

    // Build payment items
    let paymentItems: PaymentItem[] = [];

    if (paymentMethod === 'dinheiro') {
      const rec = parseFloat(receivedCash) || grandTotal;
      if (rec < grandTotal) {
        error('Valor Insuficiente', 'O valor recebido em dinheiro é inferior ao total a pagar.');
        return;
      }
      paymentItems.push({
        method: 'dinheiro',
        label: 'Dinheiro (Espécie)',
        amount: grandTotal,
        receivedAmount: rec,
        change: rec - grandTotal,
      });
    } else if (paymentMethod === 'cartao') {
      paymentItems.push({
        method: 'cartao',
        label: 'Cartão Débito/Crédito (POS)',
        amount: grandTotal,
      });
    } else if (paymentMethod === 'carteira_movel') {
      paymentItems.push({
        method: 'carteira_movel',
        label: 'Carteira Móvel (M-Pesa / e-Mola)',
        amount: grandTotal,
      });
    } else if (paymentMethod === 'transferencia') {
      paymentItems.push({
        method: 'transferencia',
        label: 'Transferência Bancária (BIM/BCI)',
        amount: grandTotal,
      });
    } else if (paymentMethod === 'misto') {
      const cashVal = parseFloat(mistoCash) || 0;
      const cardVal = parseFloat(mistoCard) || 0;
      const mobVal = parseFloat(mistoMobile) || 0;
      const sum = cashVal + cardVal + mobVal;

      if (Math.abs(sum - grandTotal) > 0.05) {
        error(
          'Valores Divergentes',
          `A soma dos pagamentos mistos (${formatCurrency(sum)}) deve ser exatamente igual ao total (${formatCurrency(grandTotal)}).`
        );
        return;
      }

      if (cashVal > 0) paymentItems.push({ method: 'dinheiro', label: 'Dinheiro', amount: cashVal });
      if (cardVal > 0) paymentItems.push({ method: 'cartao', label: 'Cartão', amount: cardVal });
      if (mobVal > 0) paymentItems.push({ method: 'carteira_movel', label: 'M-Pesa / Móvel', amount: mobVal });
    }

    try {
      setIsSubmitting(true);
      const taxSig = TaxService.generateDocumentSignature({
        saleNumber: `TEMP`,
        total: grandTotal,
        createdAt: new Date().toISOString(),
      });

      const salePayload = {
        cashSessionId: activeSession ? activeSession.id : '',
        cashier: user,
        customer: selectedCustomer || { id: 'customer-final', name: 'Consumidor Final' } as Customer,
        diningOption,
        tableNumber: selectedTableNumber || undefined,
        items: cart,
        subtotal,
        discount: totalDiscount,
        discountType,
        discountValue,
        total: grandTotal,
        payments: paymentItems,
        taxCertification: taxSig,
        mpesaTransactionId: mpesaTxId || undefined,
        mpesaPhone: paymentMethod === 'carteira_movel' ? mobilePhone : undefined,
      };

      // Check if browser is offline
      if (!navigator.onLine) {
        const offId = await IndexedDbService.saveOfflineSale(salePayload);
        const offlineSale: Sale = {
          ...salePayload,
          id: offId,
          saleNumber: `OFF-${Date.now().toString().slice(-6)}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        } as any;

        setIsPaymentModalOpen(false);
        clearCart();
        setCompletedSale(offlineSale);
        setIsReceiptModalOpen(true);
        warning(
          'Venda Salva em IndexedDB (Offline)',
          'A venda foi gravada com segurança no armazenamento local e será sincronizada assim que a internet for restabelecida.'
        );
        return;
      }

      const sale = await DatabaseService.executeSaleTransaction(salePayload as any);

      // Reload products to get updated stock
      await loadData();

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });

      setIsPaymentModalOpen(false);
      clearCart();
      setCompletedSale(sale);
      setIsReceiptModalOpen(true);
      success('Venda Concluída com Sucesso!', `Venda Nº ${sale.saleNumber} registrada no sistema.`);
    } catch (err: any) {
      // In case of transient network failure during transaction, fallback to IndexedDB
      console.warn('Network transaction failed, falling back to IndexedDB:', err);
      try {
        const taxSig = TaxService.generateDocumentSignature({
          saleNumber: `TEMP`,
          total: grandTotal,
          createdAt: new Date().toISOString(),
        });
        const fallbackPayload = {
          cashSessionId: activeSession ? activeSession.id : '',
          cashier: user,
          customer: selectedCustomer || { id: 'customer-final', name: 'Consumidor Final' } as Customer,
          diningOption,
          tableNumber: selectedTableNumber || undefined,
          items: cart,
          subtotal,
          discount: totalDiscount,
          discountType,
          discountValue,
          total: grandTotal,
          payments: paymentItems,
          taxCertification: taxSig,
        };
        const offId = await IndexedDbService.saveOfflineSale(fallbackPayload);
        const offlineSale: Sale = {
          ...fallbackPayload,
          id: offId,
          saleNumber: `OFF-${Date.now().toString().slice(-6)}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        } as any;

        setIsPaymentModalOpen(false);
        clearCart();
        setCompletedSale(offlineSale);
        setIsReceiptModalOpen(true);
        warning(
          'Venda Salva em IndexedDB (Contingência)',
          'Instabilidade de rede detectada. Venda guardada localmente para sincronização posterior.'
        );
      } catch (innerErr: any) {
        error('Erro ao finalizar venda', err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProductCard = (product: Product) => {
    const isLocation86 = Boolean(activeLocation && product.locationStatus86?.[activeLocation.id]);
    const is86 = Boolean(product.is86) || isLocation86;
    const isOutOfStock = product.currentStock <= 0 || is86;
    const isLowStock = !isOutOfStock && product.currentStock <= product.minStock;
    const effectivePrice = (activeLocation && product.locationPrices?.[activeLocation.id]) ?? product.sellingPrice;

    const handleClickCard = () => {
      if (is86) {
        warning(
          'Produto Esgotado (Status 86)',
          product.is86Reason
            ? `Este item foi marcado como 86: "${product.is86Reason}". Venda temporariamente bloqueada.`
            : 'Este item está temporariamente marcado como 86 (Esgotado) na cozinha.'
        );
        return;
      }
      if (product.currentStock <= 0) {
        warning('Sem Estoque', 'Este produto está sem saldo em estoque.');
        return;
      }
      if (product.modifierGroups && product.modifierGroups.length > 0) {
        setCustomizingProduct(product);
        setIsCustomizerModalOpen(true);
        return;
      }
      addToCart(product);
    };

    return (
      <div
        key={product.id}
        onClick={handleClickCard}
        className={`p-3 rounded-2xl border flex flex-col justify-between transition-all duration-150 text-left relative group ${
          is86
            ? 'opacity-60 bg-rose-50/40 border-rose-200 cursor-not-allowed'
            : isOutOfStock
            ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
            : 'bg-white border-slate-200 hover:border-orange-500 hover:shadow-lg cursor-pointer hover:-translate-y-0.5'
        }`}
      >
        <div>
          {/* Top Illustration or Photo */}
          <div className="mb-2 flex items-center justify-center bg-slate-50 rounded-xl p-2 relative overflow-hidden border border-slate-100 group-hover:border-orange-200 transition-colors">
            <ProductIllustration
              productName={product.name}
              sku={product.sku}
              imageUrl={product.image}
              categoryName={product.categoryName}
              size="lg"
            />

            {/* 86 or Stock badge overlay */}
            {is86 ? (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs animate-pulse">
                86 • Esgotado
              </span>
            ) : (
              <span
                className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
                  product.currentStock <= 0
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : isLowStock
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-white/90 text-slate-700 border border-slate-200 backdrop-blur-xs'
                }`}
              >
                {product.currentStock <= 0 ? 'Sem estoque' : `${product.currentStock} ${product.unit}`}
              </span>
            )}

            {product.isBestSeller && !is86 && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500 text-white shadow-2xs">
                Top ⭐
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span className="font-mono font-bold">{product.sku}</span>
            {product.brand && (
              <span className="truncate max-w-[90px] text-slate-500 font-medium">
                {product.brand}
              </span>
            )}
          </div>

          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
            {product.name}
          </h4>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm font-black text-orange-950 font-mono">
            {formatCurrency(effectivePrice)}
            {activeLocation && product.locationPrices?.[activeLocation.id] && (
              <span className="text-[9px] font-bold text-orange-600 block leading-none">Preço Filial</span>
            )}
          </div>
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
              is86
                ? 'bg-rose-100 text-rose-600 cursor-not-allowed'
                : isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-orange-50 group-hover:bg-orange-600 group-hover:text-white text-orange-600'
            }`}
          >
            {is86 ? <span className="text-[10px] font-black">86</span> : <Plus className="w-4 h-4" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-3 select-none">
      {/* 1. LEFT PANEL: Categories Sidebar (Todos + Categorias com Predefinição Padrão) */}
      <div className="w-full lg:w-56 xl:w-60 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden shrink-0">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-orange-600" />
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              Categorias
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800">
            {categoryChips.length - 1} grupos
          </span>
        </div>

        {/* Info hint on default */}
        <div className="px-3 py-1.5 bg-amber-50/70 border-b border-amber-200 text-[10px] text-amber-900 flex items-center justify-between">
          <span>Clique na ⭐ para definir categoria padrão</span>
        </div>

        {/* Categories Vertical Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categoryChips.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const isDefault = defaultCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group select-none ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-500'
                    : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <span className="truncate leading-tight">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/25 text-white font-bold'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {cat.count}
                  </span>

                  {/* Set as Default Category Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleDefaultCategory(e, cat.id)}
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      isDefault
                        ? 'text-amber-300 hover:text-amber-200'
                        : isSelected
                        ? 'text-white/50 hover:text-white'
                        : 'text-slate-300 hover:text-amber-500 opacity-60 group-hover:opacity-100'
                    }`}
                    title={
                      isDefault
                        ? 'Categoria padrão atual ao abrir o PDV (Clique para desmarcar)'
                        : `Definir "${cat.name}" como padrão ao abrir o PDV`
                    }
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isDefault ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Default Info footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Padrão do Caixa:</span>
          <span className="font-bold text-orange-700 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {categoryChips.find(c => c.id === defaultCategory)?.name || 'Todos'}
          </span>
        </div>
      </div>

      {/* 2. CENTER PANEL: Catalog, Barcode Search, Organize & Products */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
        {/* Offline Status & Pending IndexedDB Sales Banner */}
        {(!isOnline || pendingOfflineCount > 0) && (
          <div
            className={`px-4 py-2.5 flex items-center justify-between text-xs font-semibold border-b transition-colors ${
              !isOnline
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-white" />
              ) : (
                <Wifi className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>
                {!isOnline
                  ? 'Modo Offline: Operando com catálogo local em cache. Vendas salvas em IndexedDB e sincronizadas automaticamente ao reconectar.'
                  : `${pendingOfflineCount} venda(s) registrada(s) no modo offline armazenadas em IndexedDB.`}
              </span>
            </div>
            {isOnline && pendingOfflineCount > 0 && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncingOffline}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                {isSyncingOffline ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
            )}
          </div>
        )}

        {/* Top Search Bar & Organize Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Pesquisar produto por Nome, Código SKU ou Código de Barras (F2)..."
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium text-slate-900 shadow-2xs"
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                <Barcode className="w-4 h-4" />
              </div>
            </div>

            {/* Organize / Sort Dropdown ("E em todos eu posso organizar") */}
            <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Organizar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="popular">🔥 Mais Populares</option>
                <option value="name_asc">🔤 Nome (A - Z)</option>
                <option value="price_asc">💰 Menor Preço</option>
                <option value="price_desc">💎 Maior Preço</option>
                <option value="stock_desc">📦 Maior Estoque</option>
              </select>
            </div>

            {/* Suspended sales button badge */}
            {suspendedSales.length > 0 && (
              <button
                onClick={() => setIsSuspendedModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors shrink-0"
                title="Vendas em Espera"
              >
                <PauseCircle className="w-4 h-4 text-amber-600" />
                <span className="hidden md:inline">{suspendedSales.length} em espera</span>
              </button>
            )}
          </div>

          {/* Current Category Banner if filtered */}
          {selectedCategory !== 'all' && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{categoryChips.find(c => c.id === selectedCategory)?.icon}</span>
                <span className="font-black text-orange-950">
                  Trabalhando na categoria: <strong className="text-orange-700">{categoryChips.find(c => c.id === selectedCategory)?.name}</strong>
                </span>
                <span className="text-[11px] text-slate-500">
                  ({filteredProducts.length} itens)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-bold text-orange-700 hover:text-orange-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todas as Categorias</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Main Products Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {/* If viewing ALL: Grouped by category list */}
          {selectedCategory === 'all' ? (
            productsByCategory.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">🍽️</span>
                <p className="font-bold text-slate-600">Nenhum produto encontrado</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tente buscar por outro termo.</p>
              </div>
            ) : (
              productsByCategory.map(group => (
                <div key={group.categoryId} className="space-y-3 pb-4 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs py-2 px-1 z-10 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{group.categoryIcon}</span>
                      <h3 className="font-black text-slate-900 text-sm tracking-tight">
                        {group.categoryName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                        {group.items.length} {group.items.length === 1 ? 'produto' : 'produtos'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory(group.categoryId)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-xl border border-orange-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title={`Trabalhar apenas com ${group.categoryName}`}
                    >
                      <span>Trabalhar só com esta</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.items.map(product => renderProductCard(product))}
                  </div>
                </div>
              ))
            )
          ) : (
            /* If viewing a single selected category */
            filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">🍽️</span>
                <p className="font-bold text-slate-600">Nenhum produto nesta categoria</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tente buscar por outro termo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(product => renderProductCard(product))}
              </div>
            )
          )}
        </div>

        {/* Keyboard Shortcuts Helper Bar */}
        <div className="p-2.5 bg-stone-900 text-stone-300 text-[11px] flex flex-wrap items-center justify-between px-4 border-t border-stone-800 font-mono">
          <div className="flex items-center gap-3">
            <span><strong className="text-orange-400">F2</strong> Buscar</span>
            <span><strong className="text-orange-400">F4</strong> Cliente</span>
            <span><strong className="text-orange-400">F6</strong> Desconto</span>
            <span><strong className="text-orange-400">F8 / F10</strong> Pagamento</span>
          </div>
          <div className="text-stone-500 hidden sm:block">
            <span>ESC: Cancelar Modal</span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL: Caixa, Preços, Edição e Checkout */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden shrink-0">
        {/* Cart Top Bar: Customer Selector & Quick Register */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Customer Picker Button */}
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-orange-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors truncate shadow-2xs cursor-pointer flex-1 min-w-0"
              title="Pesquisar / Selecionar Cliente Cadastrado (F4)"
            >
              <User className="w-4 h-4 text-orange-600 shrink-0" />
              <div className="truncate text-left flex-1 min-w-0">
                <span className="truncate block font-black text-slate-900 leading-tight">
                  {selectedCustomer ? selectedCustomer.name : 'Selecionar Cliente'}
                </span>
                {selectedCustomer?.phone && (
                  <span className="text-[10px] text-slate-500 font-mono block leading-none truncate">
                    {selectedCustomer.phone}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded shrink-0">
                F4
              </span>
            </button>

            {/* Quick Customer Register Button */}
            <button
              type="button"
              onClick={() => setIsQuickCustomerModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
              title="Cadastro Rápido de Cliente Singular"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Rápido</span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSuspendSale}
              disabled={cart.length === 0}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              title="Suspender Venda (Colocar em Espera)"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              title="Limpar Carrinho"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dining Option & Table Selector (Fase 5) */}
        <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDiningOption('mesa')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                diningOption === 'mesa'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              🍽️ Mesa / Local
            </button>
            <button
              type="button"
              onClick={() => {
                setDiningOption('takeaway');
                setSelectedTableNumber('');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                diningOption === 'takeaway'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              🛍️ Takeaway
            </button>
            <button
              type="button"
              onClick={() => {
                setDiningOption('delivery');
                setSelectedTableNumber('');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                diningOption === 'delivery'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              🛵 Delivery
            </button>
          </div>

          {diningOption === 'mesa' && (
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                selectedTableNumber
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-orange-400'
              }`}
              title="Abrir mapa de mesas e comandas"
            >
              <UtensilsCrossed className="w-3 h-3 text-orange-600" />
              <span>{selectedTableNumber || 'Escolher Mesa'}</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs py-12">
              <ShoppingCart className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
              <p className="font-semibold text-slate-500">Carrinho Vazio</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bipe um código de barras ou selecione itens do catálogo ao lado.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.cartItemId || item.product.id}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col gap-1.5 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <ProductIllustration
                    productName={item.product.name}
                    sku={item.product.sku}
                    imageUrl={item.product.image}
                    categoryName={item.product.categoryName}
                    size="sm"
                    className="w-9 h-9"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 block leading-tight truncate">
                      {item.product.name}
                    </span>

                    {/* Clickable Unit Price to Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditPriceModal(item)}
                      className="group/price inline-flex items-center gap-1 text-[11px] text-slate-600 font-mono hover:text-orange-700 bg-white hover:bg-orange-50 px-1.5 py-0.5 rounded border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer mt-0.5"
                      title="Clique para editar o preço unitário deste item"
                    >
                      <span>{formatCurrency(item.unitPrice)} / {item.product.unit}</span>
                      <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover/price:text-orange-600" />
                    </button>

                    {/* Selected Modifiers & Extras Tags */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedModifiers.map((mod) => (
                          <span
                            key={mod.id}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              mod.type === 'remove'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : mod.priceAdjustment > 0
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {mod.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Removed Ingredients & Notes Tags */}
                    {((item.removedIngredients && item.removedIngredients.length > 0) || item.notes) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.removedIngredients?.map((ing) => (
                          <span
                            key={ing}
                            className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200"
                          >
                            ❌ Sem {ing}
                          </span>
                        ))}
                        {item.notes && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200 truncate max-w-[200px]">
                            📝 {item.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 font-mono text-sm block">
                      {formatCurrency(item.subtotal)}
                    </span>
                    {item.discount > 0 && (
                      <span className="text-[10px] text-orange-700 font-bold">
                        -{formatCurrency(item.discount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Line Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-slate-900 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Actions: Edit Price, Composition, Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPriceModal(item)}
                      className="p-1 rounded-lg text-slate-500 hover:text-orange-700 hover:bg-orange-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Editar Preço e Desconto do Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCompositionModal(item)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        (item.removedIngredients && item.removedIngredients.length > 0) || item.notes
                          ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
                          : 'bg-white hover:bg-orange-50 border border-slate-200 text-slate-700 hover:text-orange-700'
                      }`}
                      title="Personalizar Ingredientes / Composição (Ex: Sem cebola, sem tomate)"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-orange-600" />
                      <span>Composição</span>
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <span className="px-1 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none">
                          {item.removedIngredients.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Remover produto do carrinho"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary Box with Discount Indicator */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal ({cart.length} itens):</span>
            <span className="font-semibold text-slate-800 font-mono">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount Card with % or MT Indicator */}
          <div className="p-2.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/70 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-2xs">
                {discountType === 'percentage' ? (
                  <Percent className="w-3.5 h-3.5" />
                ) : (
                  <Coins className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Desconto (F6)</span>
                  {calculatedGlobalDiscount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-orange-600 text-white shadow-2xs">
                      {discountType === 'percentage' ? `${discountValue}% OFF` : 'VALOR FIXO'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {calculatedGlobalDiscount > 0
                    ? discountType === 'percentage'
                      ? `${discountValue}% sobre o total`
                      : 'Abatimento em Meticais'
                    : 'Porcentagem (%) ou Valor (MT)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-orange-700">
                {calculatedGlobalDiscount > 0
                  ? `-${formatCurrency(calculatedGlobalDiscount)}`
                  : '0,00 MT'}
              </span>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-orange-100 border border-orange-200 text-orange-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {calculatedGlobalDiscount > 0 ? 'Alterar' : '+ Inserir'}
              </button>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-1 border-t border-slate-200 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total a Pagar
              </span>
              <span className="text-[10px] text-slate-400">Moeda Metical (MZN)</span>
            </div>
            <div className="text-2xl font-black text-orange-950 font-mono tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Finalize Button */}
          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-950/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>PAGAMENTO &amp; FINALIZAR (F8)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- MODAL 1: PAYMENT MODAL --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Recebimento &amp; Pagamento</h3>
                <span className="text-xs text-slate-400">Total da Venda: {formatCurrency(grandTotal)}</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Methods selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === 'dinheiro'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-orange-600" />
                    <span>Dinheiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === 'cartao'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>Cartão POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('carteira_movel')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === 'carteira_movel'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-600" />
                    <span>M-Pesa / e-Mola</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === 'transferencia'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Receipt className="w-5 h-5 text-purple-600" />
                    <span>Transferência</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('misto')}
                    className={`col-span-2 sm:col-span-2 p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                      paymentMethod === 'misto'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="w-5 h-5 text-amber-600" />
                    <span>Pagamento Misto (Dividir Formas)</span>
                  </button>
                </div>
              </div>

              {/* Conditional Inputs based on Method */}
              {paymentMethod === 'dinheiro' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Valor Entregue pelo Cliente (MT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receivedCash}
                    onChange={(e) => setReceivedCash(e.target.value)}
                    className="w-full px-4 py-2.5 text-base font-black font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white text-slate-900"
                    placeholder="0.00"
                    autoFocus
                  />

                  {/* Change display */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Troco a Devolver:</span>
                    <span className="text-base font-black font-mono text-orange-700">
                      {formatCurrency(Math.max(0, (parseFloat(receivedCash) || 0) - grandTotal))}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'carteira_movel' && (
                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Provedor Móvel:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => { setMobileProvider('mpesa'); setMobilePhone('+258 84 '); }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                          mobileProvider === 'mpesa' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        M-Pesa (Vodacom)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMobileProvider('emola'); setMobilePhone('+258 86 '); }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                          mobileProvider === 'emola' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        e-Mola (Movitel)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMobileProvider('ponto24'); setMobilePhone('+258 82 '); }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                          mobileProvider === 'ponto24' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        SIMO Ponto24
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Número do Cliente ({mobileProvider === 'mpesa' ? '84/85' : mobileProvider === 'emola' ? '86/87' : '82/83'}):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        placeholder="+258 84 000 0000"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={isMpesaPushing || !!mpesaTxId}
                        onClick={handleTriggerMpesaPush}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        {isMpesaPushing ? 'Disparando...' : mpesaTxId ? 'Confirmado ✓' : 'Disparar STK Push'}
                      </button>
                    </div>
                  </div>

                  {isMpesaPushing && (
                    <div className="p-3 bg-white border border-rose-200 rounded-xl text-slate-700 animate-pulse flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium">Prompt USSD enviado! Aguardando o cliente digitar o PIN no telemóvel...</span>
                    </div>
                  )}

                  {mpesaTxId && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between font-mono">
                      <span>Transação Aprovada: <strong>{mpesaTxId}</strong></span>
                      <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded font-bold">SUCESSO</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'misto' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-800">Dividir Valores por Método:</div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Em Dinheiro (MT):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mistoCash}
                      onChange={(e) => setMistoCash(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Cartão POS (MT):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mistoCard}
                      onChange={(e) => setMistoCard(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Carteira Móvel / M-Pesa (MT):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mistoMobile}
                      onChange={(e) => setMistoMobile(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Voltar (ESC)
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalizeSale}
                  className="flex-1 py-3 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Processando Venda...' : 'Confirmar & Finalizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ENHANCED CUSTOMER SELECTOR MODAL --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm">Selecionar Cliente (F4)</h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Quick Add Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome, telefone ou morada..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setIsQuickCustomerModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Cliente (Singular)</span>
              </button>
            </div>

            {/* List */}
            <div className="p-3 space-y-2 overflow-y-auto flex-1 text-xs">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-slate-600">Nenhum cliente encontrado</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Não encontramos clientes com "{customerSearchTerm}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerModalOpen(false);
                      setIsQuickCustomerModalOpen(true);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Cadastrar "{customerSearchTerm}"</span>
                  </button>
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setIsCustomerModalOpen(false);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold text-xs truncate">{c.name}</span>
                          {c.customerType === 'singular' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                              Singular
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                          {c.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {c.phone}
                            </span>
                          )}
                          {c.secondaryPhone && (
                            <span className="flex items-center gap-1 font-mono text-slate-400">
                              (Alt: {c.secondaryPhone})
                            </span>
                          )}
                          {c.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{c.address}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-orange-100 hover:text-orange-800 rounded-lg transition-colors">
                            Selecionar
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2.5: QUICK CUSTOMER MODAL --- */}
      <QuickCustomerModal
        isOpen={isQuickCustomerModalOpen}
        onClose={() => setIsQuickCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* --- MODAL 2.6: ITEM COMPOSITION & INGREDIENT REMOVAL MODAL --- */}
      <ItemCompositionModal
        isOpen={isCompositionModalOpen}
        onClose={() => setIsCompositionModalOpen(false)}
        item={compositionModalItem}
        onSaveComposition={handleSaveItemComposition}
      />

      {/* --- MODAL 2.65: PRODUCT CUSTOMIZER MODAL (EXTRAS, REMOVALS, RECIPES) --- */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          isOpen={isCustomizerModalOpen}
          onClose={() => {
            setIsCustomizerModalOpen(false);
            setCustomizingProduct(null);
          }}
          onConfirm={handleCustomizerConfirm}
        />
      )}

      {/* --- MODAL 2.7: EDIT CART ITEM PRICE & DISCOUNT MODAL --- */}
      <EditCartItemPriceModal
        isOpen={isEditPriceModalOpen}
        onClose={() => setIsEditPriceModalOpen(false)}
        item={editingPriceItem}
        onSavePrice={handleSaveItemPrice}
      />

      {/* --- MODAL 3: DISCOUNT MODAL (% or MT) --- */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotal={subtotal}
        initialType={discountType}
        initialValue={discountValue}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
      />

      {/* --- MODAL 4: SUSPENDED SALES MODAL --- */}
      {isSuspendedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Vendas em Espera / Suspensas</h3>
              <button onClick={() => setIsSuspendedModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {suspendedSales.map(s => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{s.identifier}</div>
                    <div className="text-[11px] text-slate-500">Cliente: {s.customer.name}</div>
                  </div>
                  <button
                    onClick={() => handleResumeSale(s)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Retomar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: RECEIPT PREVIEW & PDF DOWNLOAD --- */}
      <ReceiptModal
        sale={completedSale}
        settings={settings}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          searchInputRef.current?.focus();
        }}
      />

      {/* --- MODAL 6: TABLE MAP & COMANDAS MODAL --- */}
      <TableMapModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        currentTableNumber={selectedTableNumber}
        onSelectTable={(tableNumber) => {
          setSelectedTableNumber(tableNumber);
          setIsTableModalOpen(false);
          success('Mesa Vinculada', `Pedido vinculado à ${tableNumber}.`);
        }}
      />
    </div>
  );
};
