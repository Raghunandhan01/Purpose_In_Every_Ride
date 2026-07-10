import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const validateResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: (err as any).path, message: err.msg }))
    });
  }
  next();
};

export const registerValidator = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isString().withMessage('Full name must be a string')
    .trim(),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .isString().withMessage('Phone number must be a string'),
  body('vehicleType')
    .optional()
    .isString().withMessage('Vehicle type must be a string'),
  body('preferredPlatform')
    .optional()
    .isString().withMessage('Preferred platform must be a string'),
  validateResult
];

export const loginValidator = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResult
];

export const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validateResult
];

export const updateProfileValidator = [
  body('fullName')
    .optional()
    .isString().withMessage('Full name must be a string')
    .trim(),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .isString().withMessage('Phone number must be a string'),
  body('vehicleType')
    .optional()
    .isString().withMessage('Vehicle type must be a string'),
  body('preferredPlatform')
    .optional()
    .isString().withMessage('Preferred platform must be a string'),
  body('theme')
    .optional()
    .isString().withMessage('Theme must be a string'),
  body('language')
    .optional()
    .isString().withMessage('Language must be a string'),
  body('goals')
    .optional()
    .isString().withMessage('Goals must be a string'),
  body('budgets')
    .optional()
    .isString().withMessage('Budgets must be a string'),
  validateResult
];
