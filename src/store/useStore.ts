import { create } from 'zustand';
import { AppState } from './types';
import { createProfileSlice } from './slices/profile';
import { createMeasurementsSlice } from './slices/measurements';

import { createAppRuntimeSlice } from './slices/appRuntime';
import { createPermissionsSlice } from './slices/permissions';
import { createContributionsSlice } from './slices/contributions';
import { createUiOperationalSlice } from './slices/uiOperational';
import { semanticOutputService } from '../services/semantic-output';

export const useStore = create<AppState>()((...a) => ({
  ...createProfileSlice(...a),
  ...createMeasurementsSlice(...a),

  ...createAppRuntimeSlice(...a),
  ...createPermissionsSlice(...a),
  ...createContributionsSlice(...a),
  ...createUiOperationalSlice(...a),
}));

// Inicialização Global da Governança Semântica (v1.2.0)
// Garante Lifecycle persistente (Foreground/Reconnect/Selective Invalidation)
const userId = 'user_current_session_1'; 
semanticOutputService.init(userId);

// Export types and interfaces for convenience (API compatibility)
export * from './types';
