import { body } from 'express-validator';
import { validateResult } from './authValidator.js';

export const workLogValidator = [
  body('platform')
    .notEmpty().withMessage('Platform is required')
    .isString().withMessage('Platform must be a string')
    .isIn(['swiggy', 'zomato', 'rapido', 'blinkit', 'zepto', 'instamart'])
    .withMessage('Invalid platform selected'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Date must be in YYYY-MM-DD format'),
  body('loginTime')
    .notEmpty().withMessage('Login time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Login time must be in HH:MM 24-hour format'),
  body('logoutTime')
    .notEmpty().withMessage('Logout time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Logout time must be in HH:MM 24-hour format'),
  body('hoursWorked')
    .optional()
    .isFloat({ min: 0, max: 24 }).withMessage('Hours worked must be a number between 0 and 24'),
  body('ordersCompleted')
    .notEmpty().withMessage('Orders completed is required')
    .isInt({ min: 0 }).withMessage('Orders completed must be a positive integer'),
  body('distanceTravelled')
    .optional()
    .isFloat({ min: 0 }).withMessage('Distance travelled must be a non-negative number'),
  body('grossEarnings')
    .notEmpty().withMessage('Gross earnings are required')
    .isFloat({ min: 0 }).withMessage('Gross earnings must be a non-negative number'),
  body('tips')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tips must be a non-negative number'),
  body('bonusIncentives')
    .optional()
    .isFloat({ min: 0 }).withMessage('Bonus incentives must be a non-negative number'),
  body('fuelCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fuel cost must be a non-negative number'),
  body('parkingCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Parking cost must be a non-negative number'),
  body('foodExpense')
    .optional()
    .isFloat({ min: 0 }).withMessage('Food expense must be a non-negative number'),
  body('otherExpenses')
    .optional()
    .isFloat({ min: 0 }).withMessage('Other expenses must be a non-negative number'),
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .trim(),
  validateResult
];
