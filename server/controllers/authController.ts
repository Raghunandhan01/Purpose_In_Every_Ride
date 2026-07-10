import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { generateToken } from '../utils/jwt.js';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const data = await authService.registerUser(req.body);
    
    // Set HTTP-only cookie if required, otherwise just send JSON
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const data = await authService.loginUser(req.body);

    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'User not found'
    });
  }
};

export const refreshSession = async (req: any, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        ...user,
        token
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Session refresh failed'
    });
  }
};
