import { StateCreator } from 'zustand';
import { AppState, Measurement } from '../types';

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
    const { semanticOutputService } = require('../../services/semantic-output');
    semanticOutputService.markDirtyFromMeasurement(userId, measurement.type);
  }
});
