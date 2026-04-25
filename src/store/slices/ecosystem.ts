import { StateCreator } from 'zustand';
import { AppState } from '../state-types';
import { ECOSYSTEM_REGISTRY } from '../../services/ecosystem/registry';
import { resolveMotionContextBundle } from '../../services/ecosystem/contextResolver';

/**
 * @file ecosystem.ts
 * @description Slice para gestão do ecossistema e contratos de contexto da shell.
 */

export const createEcosystemSlice: StateCreator<AppState, [], [], any> = (set, get) => ({
  miniAppRegistry: ECOSYSTEM_REGISTRY,
  lastContextBundle: null,

  refreshContextBundle: () => {
    const bundle = resolveMotionContextBundle(get());
    set({ lastContextBundle: bundle });
    console.warn('[Shell] Context Bundle Refreshed:', bundle.bundle_status);
  },
});
