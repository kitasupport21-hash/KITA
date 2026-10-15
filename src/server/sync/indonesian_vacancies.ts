/**
 * External job portals are linked from the UI instead of being represented as
 * fabricated individual vacancies. Only import a vacancy here after its exact
 * public listing URL, publication date, employer, and active status can be
 * checked from a trusted source or an authorized API/feed.
 */
import type { RawExternalVacancy } from './importer.js';

export const VERIFIED_INDONESIAN_VACANCIES_DATASET: RawExternalVacancy[] = [];
