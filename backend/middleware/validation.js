const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const emailLeadValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID'),
  body('consent')
    .isBoolean()
    .withMessage('Consent must be a boolean value')
    .custom(value => {
      if (!value) {
        throw new Error('You must agree to receive emails');
      }
      return true;
    }),
  handleValidationErrors
];

const eventImportValidation = [
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

const eventFilterValidation = [
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('filters.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty if provided'),
  body('filters.startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('filters.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('filters.status')
    .optional()
    .isIn(['new', 'updated', 'inactive', 'imported'])
    .withMessage('Invalid status value'),
  handleValidationErrors
];

module.exports = {
  emailLeadValidation,
  eventImportValidation,
  eventFilterValidation,
  handleValidationErrors
};
