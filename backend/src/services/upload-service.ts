/**
 * Upload Service
 * Handles file uploads with image processing
 */

import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PRODUCT_IMAGES_DIR = path.join(UPLOAD_DIR, 'products');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(PRODUCT_IMAGES_DIR)) {
  fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Image sizes for product images
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
};

/**
 * Multer storage configuration
 */
const storage = multer.memoryStorage();

/**
 * File filter for images
 */
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
  }
};

/**
 * Multer upload middleware for single image
 */
export const uploadSingleImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('image');

/**
 * Multer upload middleware for multiple images
 */
export const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
}).array('images', 5);

/**
 * Image processing result
 */
export interface ProcessedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
}

/**
 * Process and save product image
 */
export async function processProductImage(
  buffer: Buffer,
  storeId: string
): Promise<ProcessedImage> {
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const storeDir = path.join(PRODUCT_IMAGES_DIR, storeId);

  // Ensure store directory exists
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  const baseName = `${uniqueId}`;
  const results: ProcessedImage = {
    original: '',
    thumbnail: '',
    medium: '',
    large: '',
  };

  // Save original (optimized)
  const originalPath = path.join(storeDir, `${baseName}_original.webp`);
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(originalPath);
  results.original = `/uploads/products/${storeId}/${baseName}_original.webp`;

  // Generate thumbnail
  const thumbnailPath = path.join(storeDir, `${baseName}_thumb.webp`);
  await sharp(buffer)
    .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toFile(thumbnailPath);
  results.thumbnail = `/uploads/products/${storeId}/${baseName}_thumb.webp`;

  // Generate medium
  const mediumPath = path.join(storeDir, `${baseName}_medium.webp`);
  await sharp(buffer)
    .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(mediumPath);
  results.medium = `/uploads/products/${storeId}/${baseName}_medium.webp`;

  // Generate large
  const largePath = path.join(storeDir, `${baseName}_large.webp`);
  await sharp(buffer)
    .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toFile(largePath);
  results.large = `/uploads/products/${storeId}/${baseName}_large.webp`;

  return results;
}

/**
 * Delete product images
 */
export async function deleteProductImages(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  // Extract base path from URL
  const urlPath = imageUrl.replace('/uploads/', '');
  const basePath = path.join(UPLOAD_DIR, urlPath);

  // Get the base name without size suffix
  const dir = path.dirname(basePath);
  const fileName = path.basename(basePath);
  const match = fileName.match(/^(.+)_(original|thumb|medium|large)\.webp$/);

  if (match) {
    const baseName = match[1];
    const sizes = ['original', 'thumb', 'medium', 'large'];

    for (const size of sizes) {
      const filePath = path.join(dir, `${baseName}_${size}.webp`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

/**
 * Get image URL with size variant
 */
export function getImageUrl(
  originalUrl: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string {
  if (!originalUrl) return '';

  const sizeMap = {
    thumbnail: 'thumb',
    medium: 'medium',
    large: 'large',
  };

  return originalUrl.replace('_original.webp', `_${sizeMap[size]}.webp`);
}

export const uploadService = {
  processProductImage,
  deleteProductImages,
  getImageUrl,
  uploadSingleImage,
  uploadMultipleImages,
};
