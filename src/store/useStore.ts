import { create } from 'zustand';
import { AppState } from './types';
import { createProfileSlice } from './slices/profile';
import { createMeasurementsSlice } from './slices/measurements';
import { createInsightsSlice } from './slices/insights';
import { createAppRuntimeSlice } from './slices/appRuntime';
import { createPermissionsSlice } from './slices/permissions';
import { createContributionsSlice } from './slices/contributions';
import { createUiOperationalSlice } from './slices/uiOperational';

export const useStore = create<AppState>()((...a) => ({
  ...createProfileSlice(...a),
  ...createMeasurementsSlice(...a),
  ...createInsightsSlice(...a),
  ...createAppRuntimeSlice(...a),
  ...createPermissionsSlice(...a),
  ...createContributionsSlice(...a),
  ...createUiOperationalSlice(...a),
}));

// Export types and interfaces for convenience (API compatibility)
export * from './types';
