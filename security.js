/**
 * Security constants and utility functions for input validation and bounds checking.
 * Prevents resource exhaustion attacks from user-controlled input.
 */

// Maximum bounds for loop iterations and array sizes
const SECURITY_LIMITS = {
  // Maximum iterations for prep/tick calculations
  MAX_PREP_ITERATIONS: 200,

  // Maximum XP value for merge calculations
  MAX_XP_VALUE: 100,

  // Maximum troops for calculations (prevents extreme values)
  MAX_TROOPS: 10_000_000,

  // Maximum city size
  MAX_CITY_SIZE: 100,

  // Maximum OP/DP values
  MAX_OP_DP: 100_000_000,

  // Maximum loop iterations for resource calculations
  MAX_RESOURCE_TICKS: 10_000,

  // Maximum array size for any operation
  MAX_ARRAY_SIZE: 1000,

  // Maximum reminder time (7 days in hours)
  MAX_REMINDER_HOURS: 168,

  // Maximum reminder minutes
  MAX_REMINDER_MINUTES: 59,

  // Maximum string length for city page parsing (1MB)
  MAX_CITY_PAGE_LENGTH: 1_000_000,

  // Chance bounds
  MIN_CHANCE: 1,
  MAX_CHANCE: 99,
};

/**
 * Validates and clamps an integer to a safe range
 * @param {number} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Safe, clamped value
 */
function safeInteger(value, min, max, defaultValue = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Validates and clamps a float to a safe range
 * @param {number} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Safe, clamped value
 */
function safeFloat(value, min, max, defaultValue = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Ensures a value is a positive integer greater than zero (for use as divisor)
 * @param {number} value - The value to validate
 * @param {number} defaultValue - Default value if invalid or zero
 * @returns {number} - Safe positive value for division
 */
function safeDivisor(value, defaultValue = 1) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

/**
 * Validates prep values extracted from battle messages
 * @param {number} prep - The prep value to validate
 * @returns {number} - Safe prep value clamped to MAX_PREP_ITERATIONS
 */
function safePrep(prep) {
  return safeInteger(prep, 0, SECURITY_LIMITS.MAX_PREP_ITERATIONS, 0);
}

/**
 * Validates troops count
 * @param {number} troops - The troops value to validate
 * @returns {number} - Safe troops value
 */
function safeTroops(troops) {
  return safeInteger(troops, 0, SECURITY_LIMITS.MAX_TROOPS, 0);
}

/**
 * Validates city size
 * @param {number} citySize - The city size to validate
 * @returns {number} - Safe city size value
 */
function safeCitySize(citySize) {
  return safeInteger(citySize, 1, SECURITY_LIMITS.MAX_CITY_SIZE, 1);
}

/**
 * Validates OP or DP values
 * @param {number} value - The OP/DP value to validate
 * @returns {number} - Safe OP/DP value
 */
function safeOPDP(value) {
  return safeInteger(value, 0, SECURITY_LIMITS.MAX_OP_DP, 0);
}

/**
 * Validates chance percentage (1-99 to avoid division by zero)
 * @param {number} chance - The chance percentage to validate
 * @returns {number} - Safe chance value between 1 and 99
 */
function safeChance(chance) {
  return safeInteger(chance, SECURITY_LIMITS.MIN_CHANCE, SECURITY_LIMITS.MAX_CHANCE, 50);
}

/**
 * Validates XP value for merge calculations
 * @param {number} xp - The XP value to validate
 * @returns {number} - Safe XP value
 */
function safeXP(xp) {
  return safeInteger(xp, 1, SECURITY_LIMITS.MAX_XP_VALUE, 1);
}

/**
 * Logs when a security limit is hit (for monitoring attack attempts)
 * @param {string} context - The command or function context
 * @param {string} paramName - The parameter that was clamped
 * @param {number} originalValue - The original unsafe value
 * @param {number} clampedValue - The clamped safe value
 */
function logSecurityLimit(context, paramName, originalValue, clampedValue) {
  console.warn(`[SECURITY] ${context}: ${paramName} clamped from ${originalValue} to ${clampedValue}`);
}

/**
 * Validates and logs if a value was clamped
 * @param {string} context - The command context
 * @param {string} paramName - Parameter name for logging
 * @param {number} value - Original value
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @param {number} defaultValue - Default if invalid
 * @returns {number} - Safe value
 */
function validateAndLog(context, paramName, value, min, max, defaultValue = 0) {
  const safeValue = safeInteger(value, min, max, defaultValue);
  if (value !== safeValue && value !== null && value !== undefined) {
    logSecurityLimit(context, paramName, value, safeValue);
  }
  return safeValue;
}

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {object} defaultValue - Default value if parsing fails
 * @returns {object} - Parsed object or default
 */
function safeJSONParse(jsonString, defaultValue = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('[SECURITY] JSON parse error:', e.message);
    return defaultValue;
  }
}

/**
 * Validates string length to prevent extremely long inputs
 * @param {string} str - The string to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Truncated string if too long
 */
function safeString(str, maxLength = SECURITY_LIMITS.MAX_CITY_PAGE_LENGTH) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.slice(0, maxLength);
}

module.exports = {
  SECURITY_LIMITS,
  safeInteger,
  safeFloat,
  safeDivisor,
  safePrep,
  safeTroops,
  safeCitySize,
  safeOPDP,
  safeChance,
  safeXP,
  logSecurityLimit,
  validateAndLog,
  safeJSONParse,
  safeString,
};
