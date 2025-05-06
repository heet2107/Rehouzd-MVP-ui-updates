import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import propertyService from '../services/property/propertyService';
import logger from '../utils/logger';
import { catchAsync } from '../middleware/errorHandler';
import azureBlobService from '../utils/storage/azureBlobService';
import { createOrUpdatePropertyImage, getPropertyImages } from '../models/property/propertyImageModel';

/**
 * Controller for getting property and market data
 * Returns enriched property data with comparable properties analysis
 */
export const getPropertyAndMarketData = catchAsync(async (req: Request, res: Response) => {
  logger.error('Property data request received', { body: JSON.stringify(req.body) });
  
  const propertyAnalysis = await propertyService.getPropertyAndMarketData(req.body.address);
  
  res.status(200).json(propertyAnalysis);
});

// Configure multer storage for image uploads
const storage = multer.memoryStorage();

// Set up file filter for images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept image files only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Maximum number of images allowed per property
const MAX_IMAGES_PER_PROPERTY = 5;

/**
 * Upload property images controller
 */
export const uploadPropertyImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const { userId, propertyAddress } = req.body;

    // Validate request
    if (!userId || !propertyAddress) {
      res.status(400).json({
        success: false,
        message: 'User ID and property address are required',
      });
      return;
    }

    // Check the number of files
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
      return;
    }

    if (files.length > MAX_IMAGES_PER_PROPERTY) {
      res.status(400).json({
        success: false,
        message: `Maximum ${MAX_IMAGES_PER_PROPERTY} images allowed per property`,
      });
      return;
    }

    // Generate container name
    const containerName = azureBlobService.generateContainerName(userId.toString(), propertyAddress);

    // Check if we're in development mode (based on config.env === 'development')
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // For development, just store the count in the database
      await createOrUpdatePropertyImage({
        user_id: parseInt(userId),
        property_address: propertyAddress,
        container_name: containerName,
        image_count: files.length,
      });

      res.status(200).json({
        success: true,
        message: `Successfully stored ${files.length} images for development`,
        imageCount: files.length,
        isDevelopment: true,
      });
      return;
    }

    // For production, create container if it doesn't exist
    await azureBlobService.createContainerIfNotExists(containerName);

    // Upload each file
    const uploadPromises = files.map(async (file, index) => {
      const fileExtension = path.extname(file.originalname);
      const blobName = `${uuidv4()}${fileExtension}`;
      
      return azureBlobService.uploadImage(
        containerName,
        blobName,
        file.buffer,
        file.mimetype
      );
    });

    // Wait for all uploads to complete
    const uploadedUrls = await Promise.all(uploadPromises);

    // Update database record
    await createOrUpdatePropertyImage({
      user_id: parseInt(userId),
      property_address: propertyAddress,
      container_name: containerName,
      image_count: files.length,
    });

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      imageUrls: uploadedUrls,
      imageCount: files.length,
    });
  } catch (error) {
    logger.error('Error uploading property images', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: (error as Error).message,
    });
  }
};

/**
 * Get property images controller
 */
export const getPropertyImageInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, propertyAddress } = req.params;

    // Validate request
    if (!userId || !propertyAddress) {
      res.status(400).json({
        success: false,
        message: 'User ID and property address are required',
      });
      return;
    }

    // Get property images from database
    const propertyImage = await getPropertyImages(parseInt(userId), propertyAddress);

    if (!propertyImage) {
      res.status(404).json({
        success: false,
        message: 'No images found for this property',
      });
      return;
    }

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      res.status(200).json({
        success: true,
        imageCount: propertyImage.image_count,
        isDevelopment: true,
      });
      return;
    }

    // For production, try to list the blobs in the container
    const blobs = await azureBlobService.listBlobs(propertyImage.container_name);

    res.status(200).json({
      success: true,
      imageCount: propertyImage.image_count,
      blobs,
    });
  } catch (error) {
    logger.error('Error getting property images', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get property images',
      error: (error as Error).message,
    });
  }
};

// Export the controllers
export default {
  getPropertyAndMarketData,
  uploadPropertyImages,
  getPropertyImageInfo,
  upload
}; 