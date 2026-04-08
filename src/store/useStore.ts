import { create } from 'zustand';
import { AppState } from './types';
import { createProfileSlice } from './slices/profile';
import { createMeasurementsSlice } from './slices/measurements';
import { createAnalysesSlice } from './slices/analyses';
import { createAppRuntimeSlice } from './slices/appRuntime';
import { createPermissionsSlice } from './slices/permissions';
import { createContributionsSlice } from './slices/contributions';
import { createUiOperationalSlice } from './slices/uiOperational';

// Combine all slice creators into a single unified store
export const useStore = create<AppState>()((...a) => ({
  ...createProfileSlice(...a),
  ...createMeasurementsSlice(...a),
  ...createAnalysesSlice(...a),
  ...createAppRuntimeSlice(...a),
  ...createPermissionsSlice(...a),
  ...createContributionsSlice(...a),
  ...createUiOperationalSlice(...a),
}));

export * from './types';

