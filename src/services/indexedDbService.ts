import { Product, Category } from '../types';
import {
  LocalPersistenceService,
  PendingTransaction,
} from './localPersistence';

export interface OfflineSaleRecord {
  id: string;
  payload: any;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  lastError?: string;
}

/**
 * IndexedDbService delegator utilizando a biblioteca moderna 'idb'
 * Mantém total retrocompatibilidade com telas existentes (PDV, Dashboard).
 */
export class IndexedDbService {
  /**
   * Salva uma venda concluída em modo offline no IndexedDB usando 'idb'
   */
  public static async saveOfflineSale(salePayload: any): Promise<string> {
    return LocalPersistenceService.savePendingTransaction({
      type: 'sale',
      payload: salePayload,
    });
  }

  /**
   * Recupera todas as vendas pendentes de sincronização
   */
  public static async getPendingSales(): Promise<OfflineSaleRecord[]> {
    const pending = await LocalPersistenceService.getPendingTransactions();
    return pending.map((t: PendingTransaction) => ({
      id: t.id,
      payload: t.payload,
      createdAt: t.createdAt,
      syncStatus: t.status,
      retryCount: t.retryCount,
      lastError: t.lastError,
    }));
  }

  /**
   * Remove uma venda sincronizada com sucesso
   */
  public static async deleteOfflineSale(id: string): Promise<void> {
    return LocalPersistenceService.deletePendingTransaction(id);
  }

  /**
   * Recupera a quantidade de vendas pendentes de sincronização
   */
  public static async getPendingCount(): Promise<number> {
    return LocalPersistenceService.getPendingCount();
  }

  /**
   * Dispara notificação no Service Worker para tentar sincronização em background
   */
  public static triggerBackgroundSync(): void {
    LocalPersistenceService.triggerBackgroundSync();
  }

  /**
   * Sincroniza todas as vendas pendentes com o banco Firestore
   */
  public static async syncPendingSales(): Promise<{ synced: number; failed: number }> {
    const result = await LocalPersistenceService.syncPendingWithFirestore();
    return { synced: result.synced, failed: result.failed };
  }

  /**
   * Armazena cópia local do catálogo para permitir navegação do PDV offline
   */
  public static async cacheCatalog(products: Product[], categories: Category[]): Promise<void> {
    return LocalPersistenceService.cacheCatalog(products, categories);
  }

  /**
   * Recupera o catálogo salvo em IndexedDB quando offline
   */
  public static async getCachedCatalog(): Promise<{ products: Product[]; categories: Category[] } | null> {
    return LocalPersistenceService.getCachedCatalog();
  }
}

export { LocalPersistenceService };
export type { PendingTransaction };
