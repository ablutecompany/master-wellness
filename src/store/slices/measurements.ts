import { StateCreator } from 'zustand';
import { AppState, Measurement } from '../types';

export interface MeasurementsSlice {
  measurements: Measurement[];
  addMeasurement: (measurement: Measurement) => void;
}

export const createMeasurementsSlice: StateCreator<AppState, [], [], MeasurementsSlice> = (set) => ({
  measurements: [],
  addMeasurement: (measurement) =>
    set((state) => ({ measurements: [measurement, ...state.measurements] })),
});
