import { PRE, LOWER, UPPER, JSS, SENIOR } from './cbe';

export { PRE, LOWER, UPPER, JSS, SENIOR };

/**
 * Centeralized function to get annual fee for a grade.
 * If feeCfg is provided, it uses it; otherwise returns a default.
 */
export function getAnnualFee(grade, feeCfg = {}) {
  const cfg = feeCfg[grade] || {};
  const sum = (cfg.t1 || 0) + (cfg.t2 || 0) + (cfg.t3 || 0);
  return sum || cfg.annual || 5000;
}
