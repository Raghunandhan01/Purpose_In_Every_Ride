import { Request, Response } from 'express';
import { Platform } from '../models/index.js';
import { DEFAULT_PLATFORMS } from '../constants/platforms.js';

export const getPlatforms = async (req: Request, res: Response) => {
  try {
    let platforms = await Platform.find({});
    
    // Auto seed platforms if empty
    if (platforms.length === 0) {
      for (const p of DEFAULT_PLATFORMS) {
        await Platform.create(p);
      }
      platforms = await Platform.find({});
    }

    res.status(200).json({
      success: true,
      message: 'Platforms retrieved successfully',
      data: platforms,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve platforms'
    });
  }
};

export const getPlatformById = async (req: Request, res: Response) => {
  try {
    const platform = await Platform.findById(req.params.id);
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    res.status(200).json({
      success: true,
      data: platform,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve platform'
    });
  }
};

export const createPlatform = async (req: Request, res: Response) => {
  try {
    const { id, name, logo, color, active } = req.body;
    const existing = await Platform.findById(id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Platform already exists'
      });
    }

    const newPlatform = await Platform.create({
      id: id.toLowerCase(),
      name,
      logo,
      color,
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      message: 'Platform created successfully',
      data: newPlatform,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create platform'
    });
  }
};

export const updatePlatform = async (req: Request, res: Response) => {
  try {
    const platform = await Platform.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Platform updated successfully',
      data: platform,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update platform'
    });
  }
};

export const deletePlatform = async (req: Request, res: Response) => {
  try {
    const platform = await Platform.findByIdAndDelete(req.params.id);
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Platform deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete platform'
    });
  }
};
