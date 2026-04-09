/**
 * SEMANTIC OUTPUT STORE v1.2.0
 * Hardened Operational State Management - Selective Invalidation
 */

import { SemanticOutputState, SemanticOutputStatus, SemanticMetadata } from './types';

export class SemanticOutputStore {
  private static state: SemanticOutputState = {
    version: '1.2.0',
    generatedAt: 0,
    domains: {},
    status: 'idle',
    isLive: false,
    metadata: {
      lastUpdatedAt: 0,
      lastRequestedAt: 0,
      isDirty: false,
      dirtyDomains: {}, // NOVO
      staleAfterMs: 300000,
      version: '1.2.0',
      retryCount: 0
    },
    // ── AI Gateway Enrichment (v1.3.0) ──
    aiStatus: 'idle',
    aiInsight: undefined,
    aiError: undefined
  };

  private static refreshTimer: any = null;
  private static subscribers: Array<() => void> = [];

  static getState(): SemanticOutputState {
    return this.state;
  }

  static updateState(newState: Partial<SemanticOutputState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  static updateMetadata(meta: Partial<SemanticMetadata>) {
    this.state.metadata = { ...this.state.metadata, ...meta };
    this.notify();
  }

  /**
   * Marcar Domínio como Dirty e Coalescing Seletivo.
   */
  static markDirty(domain: string, triggerRefresh: () => void) {
    const { dirtyDomains } = this.state.metadata;
    
    this.state.metadata.dirtyDomains[domain] = true;
    this.state.metadata.isDirty = true;

    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    
    // Coalescing: 1.5s
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      triggerRefresh();
    }, 1500);

    this.notify();
  }

  static clearDirty() {
    this.state.metadata.isDirty = false;
    this.state.metadata.dirtyDomains = {};
    this.notify();
  }

  static setStatus(status: SemanticOutputStatus) {
    this.state.status = status;
    this.notify();
  }

  static subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private static notify() {
    this.subscribers.forEach(sub => sub());
  }

  static getDirtyDomains() {
    return Object.keys(this.state.metadata.dirtyDomains).filter(d => this.state.metadata.dirtyDomains[d]);
  }
}
