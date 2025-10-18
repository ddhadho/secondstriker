/**
 * Validates input data against required fields and optional rules.
 * @param {Object} data - The input data to validate.
 * @param {Array} requiredFields - Array of required field names.
 * @param {Object} [rules={}] - Optional rules for validation (e.g., types, ranges).
 * @throws Will throw an error if validation fails.
 */
exports.validateInput = (data, requiredFields, rules = {}) => {
  // Ensure all required fields are present
  requiredFields.forEach(field => {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
    if (data[field] === null || data[field] === undefined || data[field] === '') {
      throw new Error(`Field '${field}' cannot be empty`);
    }
  });

  // Check additional rules
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];

    if (rule.type && typeof value !== rule.type) {
      throw new Error(`Field '${field}' must be of type ${rule.type}`);
    }

    if (rule.regex && !rule.regex.test(value)) {
      throw new Error(`Field '${field}' does not match the required format`);
    }

    if (rule.minLength && value.length < rule.minLength) {
      throw new Error(`Field '${field}' must be at least ${rule.minLength} characters long`);
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      throw new Error(`Field '${field}' must be at most ${rule.maxLength} characters long`);
    }

    if (rule.min && value < rule.min) {
      throw new Error(`Field '${field}' must be at least ${rule.min}`);
    }

    if (rule.max && value > rule.max) {
      throw new Error(`Field '${field}' must be at most ${rule.max}`);
    }
  });
};
