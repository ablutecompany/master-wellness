import { AppState, Measurement } from '../state-types';

export interface MeasurementsSlice {
  measurements: Measurement[];
  addMeasurement: (measurement: Measurement) => void;
}

export const createMeasurementsSlice: StateCreator<AppState, [], [], MeasurementsSlice> = (set, get) => ({
  measurements: [],
  addMeasurement: (measurement) => {
    set((state) => ({ measurements: [measurement, ...state.measurements] }));
    
    // Governed Invalidation v1.2.0: Resolução por Afinidade Determinística
    const userId = 'user_current_session_1'; 
    
    // Dynamic import is resilient against synchronous cyclic TDZ crashes across all bundlers
    import('../../services/semantic-output')
      .then(({ semanticOutputService }) => {
        semanticOutputService.markDirtyFromMeasurement(userId, measurement.type);
      })
      .catch((err) => console.warn('[StrictCycleGuard] falha ao carregar semanticOutputService:', err));
  }
});
