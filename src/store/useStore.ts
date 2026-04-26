import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';
import { AppState } from './state-types';
import { createProfileSlice } from './slices/profile';
import { createMeasurementsSlice } from './slices/measurements';
import { createAnalysesSlice } from './slices/analyses';
import { createAppRuntimeSlice } from './slices/appRuntime';
import { createPermissionsSlice } from './slices/permissions';
import { createContributionsSlice } from './slices/contributions';
import { createUiOperationalSlice } from './slices/uiOperational';
import { createEcosystemSlice } from './slices/ecosystem';

// Combine all slice creators into a single unified store with persistence
export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createProfileSlice(...a),
      ...createMeasurementsSlice(...a),
      ...createAnalysesSlice(...a),
      ...createAppRuntimeSlice(...a),
      ...createPermissionsSlice(...a),
      ...createContributionsSlice(...a),
      ...createUiOperationalSlice(...a),
      ...createEcosystemSlice(...a),
    }),
    {
      name: 'ablute-wellness-storage',
      storage: createJSONStorage(() => (Platform.OS === 'web' ? window.localStorage as any : AsyncStorage)),
      // Only persist Guest and system-level metadata. 
      // Authenticated 'user' profile is NOT persisted to ensure security and cloud-sync on boot.
      partialize: (state) => ({
        isGuestMode: state.isGuestMode,
        guestProfile: state.guestProfile,
        isDemoMode: state.isDemoMode,
        credits: state.credits,
        installedAppIds: state.installedAppIds,
        lastContextBundle: state.lastContextBundle, // Cache do último bundle útil (Fallback)
        longitudinalMemory: state.longitudinalMemory, // Resumo histórico por domínio
        processedEventIds: state.processedEventIds, // Histórico para deduplicação
        ecosystemConfig: state.ecosystemConfig, // Governação granular
      }),
      onRehydrateStorage: (state) => {
        return (rehydratedState, error) => {
          if (error) {
            console.warn('[Store] Hydration error:', error);
          }
          if (rehydratedState) {
            rehydratedState.setHasHydrated(true);
          } else if (state) {
            // Secure access to store actions completely bypassing Temporal Dead Zone
            state.setHasHydrated(true);
          }
        };
      },
    }
  )
);

export * from './types';

