import { AppState, DomainPackage } from './types';
import { buildDomainPackage } from '../services/domain-packages';

/**
 * High-level selectors for Domain Packages.
 * These depend on the Domain Package service which in turn depends on base selectors.
 */

export const selectSleepDomainPackage = (state: AppState, permissions: any[]): DomainPackage => 
  buildDomainPackage('sleep', state, permissions);

export const selectNutritionDomainPackage = (state: AppState, permissions: any[]): DomainPackage => 
  buildDomainPackage('nutrition', state, permissions);

export const selectGeneralWellnessPackage = (state: AppState, permissions: any[]): DomainPackage => 
  buildDomainPackage('general', state, permissions);
