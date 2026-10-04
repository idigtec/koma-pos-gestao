import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Product, Customer, Category } from '../types';
import { DatabaseService } from './db';

export const DB_NAME = 'pos_omnichannel_idb';
export const DB_VERSION = 1;

export interface PendingTransaction {
  id: string; // e.g. off-sale-17123456789
  type: 'sale' | 'customer' | 'financial';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  lastError?: string;
}

export interface POSDatabaseSchema extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: {
      'by-category': string;
      'by-name': string;
      'by-barcode': string;
    };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: {
      'by-phone': string;
      'by-name': string;
      'by-document': string;
    };
  };
  pending_transactions: {
    key: string;
    value: PendingTransaction;
    indexes: {
      'by-status': string;
      'by-created': string;
      'by-type': string;
    };
  };
  catalog_cache: {
    key: string;
    value: {
      key: string;
      data: any;
      updatedAt: string;
    };
  };
}

/**
 * Utilitário de persistência local construído com a biblioteca 'idb'
 * Gerencia produtos, clientes e transações pendentes de sincronização com o Firestore.
 */
export class LocalPersistenceService {
  private static dbPromise: Promise<IDBPDatabase<POSDatabaseSchema>> | null = null;
  private static isAutoSyncInitialized = false;

  /**
   * Inicializa e retorna a instância de banco de dados 'idb'
   */
  public static async getDB(): Promise<IDBPDatabase<POSDatabaseSchema>> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB não suportado neste ambiente.');
    }

    this.dbPromise = openDB<POSDatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // 1. Object Store de Produtos
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-category', 'categoryId');
          productStore.createIndex('by-name', 'name');
          productStore.createIndex('by-barcode', 'barcode');
        }

        // 2. Object Store de Clientes
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-phone', 'phone');
          customerStore.createIndex('by-name', 'name');
          customerStore.createIndex('by-document', 'documentNumber');
        }

        // 3. Object Store de Transações / Vendas Pendentes de Sincronização
        if (!db.objectStoreNames.contains('pending_transactions')) {
          const pendingStore = db.createObjectStore('pending_transactions', { keyPath: 'id' });
          pendingStore.createIndex('by-status', 'status');
          pendingStore.createIndex('by-created', 'createdAt');
          pendingStore.createIndex('by-type', 'type');
        }

        // 4. Object Store de Cache de Catálogo & Metadados
        if (!db.objectStoreNames.contains('catalog_cache')) {
          db.createObjectStore('catalog_cache', { keyPath: 'key' });
        }
      },
    });

    return this.dbPromise;
  }

  // ==========================================
  // 1. GERENCIAMENTO DE PRODUTOS
  // ==========================================

  /**
   * Salva ou atualiza um produto no armazenamento local
   */
  public static async saveProduct(product: Product): Promise<string> {
    const db = await this.getDB();
    await db.put('products', product);
    return product.id;
  }

  /**
   * Salva um lote de produtos no armazenamento local
   */
  public static async saveProducts(products: Product[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('products', 'readwrite');
    await Promise.all([
      ...products.map((p) => tx.store.put(p)),
      tx.done,
    ]);
  }

  /**
   * Retorna todos os produtos persistidos localmente
   */
  public static async getProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return db.getAll('products');
  }

  /**
   * Retorna um produto pelo ID
   */
  public static async getProductById(id: string): Promise<Product | undefined> {
    const db = await this.getDB();
    return db.get('products', id);
  }

  /**
   * Remove um produto pelo ID
   */
  public static async deleteProduct(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('products', id);
  }

  /**
   * Limpa o repositório local de produtos
   */
  public static async clearProducts(): Promise<void> {
    const db = await this.getDB();
    await db.clear('products');
  }

  // ==========================================
  // 2. GERENCIAMENTO DE CLIENTES
  // ==========================================

  /**
   * Salva ou atualiza um cliente no armazenamento local
   */
  public static async saveCustomer(customer: Customer): Promise<string> {
    const db = await this.getDB();
    await db.put('customers', customer);
    return customer.id;
  }

  /**
   * Salva um lote de clientes no armazenamento local
   */
  public static async saveCustomers(customers: Customer[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('customers', 'readwrite');
    await Promise.all([
      ...customers.map((c) => tx.store.put(c)),
      tx.done,
    ]);
  }

  /**
   * Retorna todos os clientes salvos localmente
   */
  public static async getCustomers(): Promise<Customer[]> {
    const db = await this.getDB();
    return db.getAll('customers');
  }

  /**
   * Retorna um cliente pelo ID
   */
  public static async getCustomerById(id: string): Promise<Customer | undefined> {
    const db = await this.getDB();
    return db.get('customers', id);
  }

  /**
   * Remove um cliente pelo ID
   */
  public static async deleteCustomer(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('customers', id);
  }

  /**
   * Limpa o repositório local de clientes
   */
  public static async clearCustomers(): Promise<void> {
    const db = await this.getDB();
    await db.clear('customers');
  }

  // ==========================================
  // 3. TRANSAÇÕES PENDENTES DE SINCRONIZAÇÃO
  // ==========================================

  /**
   * Registra uma transação pendente gerada offline no IndexedDB usando 'idb'
   */
  public static async savePendingTransaction(params: {
    id?: string;
    type?: 'sale' | 'customer' | 'financial';
    payload: any;
  }): Promise<string> {
    const db = await this.getDB();
    const id = params.id || `off-tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transactionRecord: PendingTransaction = {
      id,
      type: params.type || 'sale',
      payload: params.payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    await db.put('pending_transactions', transactionRecord);

    // Registra tag no Background Sync se suportado
    this.triggerBackgroundSync();

    return id;
  }

  /**
   * Retorna todas as transações pendentes de sincronização
   */
  public static async getPendingTransactions(): Promise<PendingTransaction[]> {
    try {
      const db = await this.getDB();
      const all = await db.getAll('pending_transactions');
      return all.filter((t) => t.status === 'pending' || t.status === 'failed');
    } catch {
      return [];
    }
  }

  /**
   * Retorna a quantidade de transações pendentes
   */
  public static async getPendingCount(): Promise<number> {
    try {
      const pending = await this.getPendingTransactions();
      return pending.length;
    } catch {
      return 0;
    }
  }

  /**
   * Remove uma transação pendente após sincronização bem-sucedida
   */
  public static async deletePendingTransaction(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('pending_transactions', id);
  }

  /**
   * Atualiza o status de uma transação pendente
   */
  public static async updatePendingStatus(
    id: string,
    status: PendingTransaction['status'],
    errorMsg?: string
  ): Promise<void> {
    const db = await this.getDB();
    const record = await db.get('pending_transactions', id);
    if (!record) return;

    record.status = status;
    if (errorMsg) {
      record.lastError = errorMsg;
      record.retryCount = (record.retryCount || 0) + 1;
    }
    await db.put('pending_transactions', record);
  }

  // ==========================================
  // 4. SINCRONIZAÇÃO COM O FIRESTORE
  // ==========================================

  /**
   * Sincroniza todas as transações pendentes com o Firestore quando a conexão é restabelecida
   */
  public static async syncPendingWithFirestore(): Promise<{
    synced: number;
    failed: number;
    total: number;
  }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0, total: await this.getPendingCount() };
    }

    const pending = await this.getPendingTransactions();
    if (pending.length === 0) {
      return { synced: 0, failed: 0, total: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const record of pending) {
      try {
        await this.updatePendingStatus(record.id, 'syncing');

        if (record.type === 'sale') {
          // Sincroniza venda executando a transação completa no Firestore
          await DatabaseService.executeSaleTransaction(record.payload);
        } else if (record.type === 'customer') {
          await DatabaseService.saveCustomer(record.payload);
        } else if (record.type === 'financial') {
          await DatabaseService.addFinancialTransaction(record.payload);
        } else {
          // Fallback para venda padrão
          await DatabaseService.executeSaleTransaction(record.payload);
        }

        // Removido da fila local após sucesso absoluto
        await this.deletePendingTransaction(record.id);
        synced++;
      } catch (err: any) {
        failed++;
        console.warn(`[LocalPersistence] Falha ao sincronizar registro ${record.id}:`, err);
        await this.updatePendingStatus(
          record.id,
          'failed',
          err?.message || 'Falha de comunicação com o Firestore'
        );
      }
    }

    // Notifica a interface sobre a sincronização
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pos-sales-synced', {
          detail: { synced, failed, remaining: await this.getPendingCount() },
        })
      );
      window.dispatchEvent(
        new CustomEvent('pos-offline-sync-complete', {
          detail: { synced, failed },
        })
      );
    }

    return { synced, failed, total: pending.length };
  }

  // ==========================================
  // 5. CACHE DE CATÁLOGO & METADADOS
  // ==========================================

  /**
   * Armazena cópia local do catálogo (produtos e categorias) para navegação offline do PDV
   */
  public static async cacheCatalog(products: Product[], categories: Category[]): Promise<void> {
    try {
      const db = await this.getDB();
      const updatedAt = new Date().toISOString();

      await db.put('catalog_cache', { key: 'products', data: products, updatedAt });
      await db.put('catalog_cache', { key: 'categories', data: categories, updatedAt });

      // Atualiza também os produtos no store individual
      await this.saveProducts(products);
    } catch (e) {
      console.warn('[LocalPersistence] Erro ao salvar catálogo em cache:', e);
    }
  }

  /**
   * Recupera o catálogo salvo localmente quando offline
   */
  public static async getCachedCatalog(): Promise<{
    products: Product[];
    categories: Category[];
  } | null> {
    try {
      const db = await this.getDB();
      const prodsEntry = await db.get('catalog_cache', 'products');
      const catsEntry = await db.get('catalog_cache', 'categories');

      if (prodsEntry && catsEntry) {
        return {
          products: prodsEntry.data || [],
          categories: catsEntry.data || [],
        };
      }

      // Fallback: carregar diretamente do store de produtos
      const prods = await this.getProducts();
      if (prods.length > 0) {
        return {
          products: prods,
          categories: catsEntry?.data || [],
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Puxa produtos e clientes do Firestore e atualiza a persistência local
   */
  public static async pullAndCacheFromFirestore(): Promise<{
    productsCount: number;
    customersCount: number;
  }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const prods = await this.getProducts();
      const custs = await this.getCustomers();
      return { productsCount: prods.length, customersCount: custs.length };
    }

    try {
      const [prods, custs, cats] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getCustomers(),
        DatabaseService.getCategories(),
      ]);

      await this.saveProducts(prods);
      await this.saveCustomers(custs);
      await this.cacheCatalog(prods, cats);

      return { productsCount: prods.length, customersCount: custs.length };
    } catch (err) {
      console.warn('[LocalPersistence] Erro ao atualizar cache a partir do Firestore:', err);
      const prods = await this.getProducts();
      const custs = await this.getCustomers();
      return { productsCount: prods.length, customersCount: custs.length };
    }
  }

  // ==========================================
  // 6. AUTO-SYNC & SERVICE WORKER TRIGGERS
  // ==========================================

  /**
   * Inicializa ouvintes automáticos de retorno de rede (online) e mensagens do Service Worker
   */
  public static initAutoSync(): void {
    if (this.isAutoSyncInitialized || typeof window === 'undefined') return;
    this.isAutoSyncInitialized = true;

    // 1. Evento nativo do navegador quando a conexão é restaurada
    window.addEventListener('online', () => {
      console.log('[LocalPersistence] Conexão restabelecida! Iniciando sincronização com Firestore...');
      this.syncPendingWithFirestore().catch((err) => {
        console.error('[LocalPersistence] Erro no auto-sync online:', err);
      });
    });

    // 2. Mensagens enviadas pelo Service Worker (ex: Background Sync / Periodic Sync)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && (event.data.type === 'TRIGGER_OFFLINE_SYNC' || event.data.type === 'TRIGGER_SYNC_NOW')) {
          console.log('[LocalPersistence] Comando de sincronização recebido do Service Worker.');
          this.syncPendingWithFirestore().catch(() => {});
        }
      });
    }

    // 3. Verificação inicial caso já existam vendas pendentes acumuladas
    if (navigator.onLine) {
      setTimeout(() => {
        this.syncPendingWithFirestore().catch(() => {});
      }, 2500);
    }
  }

  /**
   * Aciona registro de Background Sync no Service Worker
   */
  public static triggerBackgroundSync(): void {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      if ('SyncManager' in window) {
        navigator.serviceWorker.ready
          .then((reg: any) => {
            if (reg.sync) {
              reg.sync.register('pos-sync-sales').catch(() => {});
            }
          })
          .catch(() => {});
      }
      navigator.serviceWorker.controller?.postMessage({ type: 'TRIGGER_SYNC_NOW' });
    }
  }
}

// Inicializa automaticamente os ouvintes no carregamento
if (typeof window !== 'undefined') {
  LocalPersistenceService.initAutoSync();
}
