import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppState } from './types';
import { createProfileSlice } from './slices/profile';
import { createMeasurementsSlice } from './slices/measurements';
import { createAnalysesSlice } from './slices/analyses';
import { createAppRuntimeSlice } from './slices/appRuntime';
import { createPermissionsSlice } from './slices/permissions';
import { createContributionsSlice } from './slices/contributions';
import { createUiOperationalSlice } from './slices/uiOperational';

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
    }),
    {
      name: 'ablute-wellness-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist Guest and system-level metadata. 
      // Authenticated 'user' profile is NOT persisted to ensure security and cloud-sync on boot.
      partialize: (state) => ({
        isGuestMode: state.isGuestMode,
        guestProfile: state.guestProfile,
        credits: state.credits,
        installedAppIds: state.installedAppIds,
      }),
    }
  )
);

export * from './types';

