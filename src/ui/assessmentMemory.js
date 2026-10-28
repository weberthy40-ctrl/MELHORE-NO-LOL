import { readonlySnapshot } from '../training/snapshot.js';
import { calculatePrecisionGuidedAssessment } from '../training/assessment/precisionAssessment.js';
import { calculateKitingGuidedAssessment } from '../training/assessment/kitingAssessment.js';
import { calculateReflexGuidedAssessment } from '../training/assessment/reflexAssessment.js';

const calculators = Object.freeze({precision:calculatePrecisionGuidedAssessment,kiting:calculateKitingGuidedAssessment,reflex:calculateReflexGuidedAssessment});
/** Application-owned, bounded memory. Never reads or writes browser storage. */
export function createAssessmentMemory() {
  const results = new Map();
  let active = true;
  return Object.freeze({
    get(modality) { return active ? results.get(modality) ?? null : null; },
    save(modality, attempts) {
      if (!active || !Object.hasOwn(calculators,modality)) return false;
      const result = calculators[modality](attempts);
      if (result.status === 'invalid-data' || result.status === 'invalid-config') return false;
      results.set(modality,readonlySnapshot(attempts));
      return true;
    },
    dispose() { active = false; results.clear(); }
  });
}
