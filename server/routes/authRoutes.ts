import express from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  changePassword, 
  updateProfile, 
  getMe, 
  refreshSession 
} from '../controllers/authController.js';
import { 
  getGoogleAuthUrl, 
  getFacebookAuthUrl, 
  handleGoogleCallback, 
  handleFacebookCallback, 
  renderSandbox, 
  handleSandboxLogin 
} from '../controllers/oauthController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  registerValidator, 
  loginValidator, 
  changePasswordValidator, 
  updateProfileValidator 
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);
router.post('/logout', logoutUser);

// Social authentication routes
router.get('/google/url', getGoogleAuthUrl);
router.get('/facebook/url', getFacebookAuthUrl);
router.get('/callback/google', handleGoogleCallback);
router.get('/callback/facebook', handleFacebookCallback);
router.get('/sandbox', renderSandbox);
router.post('/sandbox-login', handleSandboxLogin);

// Protected routes
router.post('/change-password', protect, changePasswordValidator, changePassword);
router.put('/profile', protect, updateProfileValidator, updateProfile);
router.get('/me', protect, getMe);
router.post('/refresh-session', protect, refreshSession);

export default router;
