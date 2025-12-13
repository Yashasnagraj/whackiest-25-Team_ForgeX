// ============================================================
// TRIP CHAT - Media Service
// Handle image uploads to Supabase Storage
// ============================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { MediaMetadata } from './types';

// ==================== Constants ====================

const STORAGE_BUCKET = 'chat-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const THUMBNAIL_SIZE = 200;

// ==================== Types ====================

export interface UploadResult {
  url: string;
  metadata: MediaMetadata;
}

export interface UploadProgress {
  percent: number;
  bytesUploaded: number;
  bytesTotal: number;
}

// ==================== Upload Functions ====================

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadImage(
  file: File,
  groupId: string,
  memberId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('[ChatMedia] Supabase not configured');
    return null;
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    console.error('[ChatMedia] Invalid file type:', file.type);
    throw new Error('Only images (JPEG, PNG, GIF, WebP) are allowed');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    console.error('[ChatMedia] File too large:', file.size);
    throw new Error('File size must be less than 10MB');
  }

  try {
    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${groupId}/${memberId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Get image dimensions
    const dimensions = await getImageDimensions(file);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[ChatMedia] Upload failed:', error);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    const metadata: MediaMetadata = {
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      mimeType: file.type,
    };

    console.log('[ChatMedia] Uploaded:', urlData.publicUrl);

    // Simulate progress for now (Supabase JS doesn't support progress natively)
    if (onProgress) {
      onProgress({ percent: 100, bytesUploaded: file.size, bytesTotal: file.size });
    }

    return {
      url: urlData.publicUrl,
      metadata,
    };
  } catch (error) {
    console.error('[ChatMedia] Error uploading:', error);
    throw error;
  }
}

/**
 * Upload image from data URL (e.g., from clipboard)
 */
export async function uploadImageFromDataUrl(
  dataUrl: string,
  groupId: string,
  memberId: string
): Promise<UploadResult | null> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], `pasted-${Date.now()}.png`, { type: blob.type });

  return uploadImage(file, groupId, memberId);
}

/**
 * Delete an uploaded image
 */
export async function deleteImage(url: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // Extract path from URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/chat-media\/(.+)/);

    if (!pathMatch) {
      console.error('[ChatMedia] Invalid URL format');
      return false;
    }

    const path = pathMatch[1];

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('[ChatMedia] Delete failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChatMedia] Error deleting:', error);
    return false;
  }
}

// ==================== Helper Functions ====================

/**
 * Get image dimensions from file
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Create a thumbnail data URL (client-side)
 */
export async function createThumbnail(
  file: File,
  maxSize: number = THUMBNAIL_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate thumbnail dimensions
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // Create canvas and draw thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compress image before upload (for large images)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Check if compression is needed
      if (img.width <= maxWidth && file.size < MAX_FILE_SIZE / 2) {
        resolve(file);
        return;
      }

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas and draw compressed image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Return original if canvas not supported
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          console.log(
            '[ChatMedia] Compressed:',
            formatFileSize(file.size),
            '->',
            formatFileSize(compressedFile.size)
          );

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
