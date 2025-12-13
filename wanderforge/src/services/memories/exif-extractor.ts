// ============================================================
// EXIF EXTRACTOR
// Extracts metadata (timestamp, GPS, camera) from photos
// ============================================================

import type { PhotoExifData } from './types';

/**
 * Extract EXIF metadata from an image file
 * Uses browser-native FileReader and manual EXIF parsing
 */
export async function extractExif(file: File): Promise<PhotoExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const exif = parseExifFromBuffer(buffer);
        resolve(exif);
      } catch (error) {
        console.warn('EXIF extraction failed:', error);
        // Return basic info from file
        resolve({
          timestamp: file.lastModified ? new Date(file.lastModified) : undefined,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        timestamp: file.lastModified ? new Date(file.lastModified) : undefined,
      });
    };

    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)); // Read first 128KB for EXIF
  });
}

/**
 * Parse EXIF data from ArrayBuffer
 * Simplified parser for JPEG EXIF data
 */
function parseExifFromBuffer(buffer: ArrayBuffer): PhotoExifData {
  const view = new DataView(buffer);
  const exifData: PhotoExifData = {};

  // Check for JPEG magic bytes (FFD8)
  if (view.getUint16(0) !== 0xffd8) {
    return exifData;
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    if (view.getUint8(offset) !== 0xff) {
      offset++;
      continue;
    }

    const marker = view.getUint8(offset + 1);

    // APP1 marker (EXIF)
    if (marker === 0xe1) {
      // Check for "Exif\0\0" identifier
      if (
        view.getUint32(offset + 4) === 0x45786966 && // "Exif"
        view.getUint16(offset + 8) === 0x0000
      ) {
        const tiffOffset = offset + 10;
        const bigEndian = view.getUint16(tiffOffset) === 0x4d4d; // "MM"

        // Parse IFD0
        const ifd0Offset = tiffOffset + readUint32(view, tiffOffset + 4, bigEndian);
        const ifd0Count = readUint16(view, ifd0Offset, bigEndian);

        for (let i = 0; i < ifd0Count; i++) {
          const entryOffset = ifd0Offset + 2 + i * 12;
          const tag = readUint16(view, entryOffset, bigEndian);
          const value = readTagValue(view, entryOffset, tiffOffset, bigEndian);

          switch (tag) {
            case 0x010f: // Make
            case 0x0110: // Model
              if (value) {
                exifData.camera = (exifData.camera ? exifData.camera + ' ' : '') + value;
              }
              break;
            case 0x0112: // Orientation
              exifData.orientation = value as number;
              break;
          }
        }

        // Find EXIF SubIFD
        const exifIfdPointer = findTag(view, ifd0Offset, ifd0Count, 0x8769, tiffOffset, bigEndian);
        if (exifIfdPointer) {
          const exifIfdOffset = tiffOffset + exifIfdPointer;
          const exifCount = readUint16(view, exifIfdOffset, bigEndian);

          for (let i = 0; i < exifCount; i++) {
            const entryOffset = exifIfdOffset + 2 + i * 12;
            const tag = readUint16(view, entryOffset, bigEndian);
            const value = readTagValue(view, entryOffset, tiffOffset, bigEndian);

            switch (tag) {
              case 0x9003: // DateTimeOriginal
              case 0x9004: // DateTimeDigitized
                if (value && !exifData.timestamp) {
                  exifData.timestamp = parseExifDate(value as string);
                }
                break;
            }
          }
        }

        // Find GPS IFD
        const gpsIfdPointer = findTag(view, ifd0Offset, ifd0Count, 0x8825, tiffOffset, bigEndian);
        if (gpsIfdPointer) {
          const gpsIfdOffset = tiffOffset + gpsIfdPointer;
          const gpsCount = readUint16(view, gpsIfdOffset, bigEndian);
          const gpsData: Record<number, unknown> = {};

          for (let i = 0; i < gpsCount; i++) {
            const entryOffset = gpsIfdOffset + 2 + i * 12;
            const tag = readUint16(view, entryOffset, bigEndian);
            const value = readGpsValue(view, entryOffset, tiffOffset, bigEndian);
            gpsData[tag] = value;
          }

          // Parse GPS coordinates
          if (gpsData[2] && gpsData[4]) {
            // GPS Latitude (tag 2) and Longitude (tag 4)
            const latRef = gpsData[1] as string;
            const lonRef = gpsData[3] as string;
            const lat = gpsData[2] as number[];
            const lon = gpsData[4] as number[];

            if (lat && lon) {
              exifData.latitude = convertDMSToDD(lat, latRef === 'S');
              exifData.longitude = convertDMSToDD(lon, lonRef === 'W');
            }
          }
        }
      }

      break;
    }

    // Skip to next marker
    if (marker >= 0xe0 && marker <= 0xef) {
      offset += 2 + view.getUint16(offset + 2);
    } else {
      offset += 2;
    }
  }

  return exifData;
}

// ========== HELPER FUNCTIONS ==========

function readUint16(view: DataView, offset: number, bigEndian: boolean): number {
  return bigEndian ? view.getUint16(offset) : view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number, bigEndian: boolean): number {
  return bigEndian ? view.getUint32(offset) : view.getUint32(offset, true);
}

function readTagValue(
  view: DataView,
  entryOffset: number,
  tiffOffset: number,
  bigEndian: boolean
): string | number | null {
  const type = readUint16(view, entryOffset + 2, bigEndian);
  const count = readUint32(view, entryOffset + 4, bigEndian);
  const valueOffset = readUint32(view, entryOffset + 8, bigEndian);

  switch (type) {
    case 2: // ASCII string
      if (count <= 4) {
        return readString(view, entryOffset + 8, count);
      }
      return readString(view, tiffOffset + valueOffset, count);

    case 3: // SHORT
      return readUint16(view, entryOffset + 8, bigEndian);

    case 4: // LONG
      return valueOffset;

    default:
      return null;
  }
}

function readGpsValue(
  view: DataView,
  entryOffset: number,
  tiffOffset: number,
  bigEndian: boolean
): string | number[] | null {
  const type = readUint16(view, entryOffset + 2, bigEndian);
  const count = readUint32(view, entryOffset + 4, bigEndian);
  const valueOffset = readUint32(view, entryOffset + 8, bigEndian);

  if (type === 2) {
    // ASCII
    if (count <= 4) {
      return readString(view, entryOffset + 8, count);
    }
    return readString(view, tiffOffset + valueOffset, count);
  }

  if (type === 5 && count === 3) {
    // RATIONAL (GPS coordinates)
    const dataOffset = tiffOffset + valueOffset;
    const values: number[] = [];
    for (let i = 0; i < 3; i++) {
      const num = readUint32(view, dataOffset + i * 8, bigEndian);
      const den = readUint32(view, dataOffset + i * 8 + 4, bigEndian);
      values.push(den ? num / den : 0);
    }
    return values;
  }

  return null;
}

function readString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length - 1; i++) {
    const char = view.getUint8(offset + i);
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str;
}

function findTag(
  view: DataView,
  ifdOffset: number,
  count: number,
  targetTag: number,
  _tiffOffset: number,
  bigEndian: boolean
): number | null {
  for (let i = 0; i < count; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = readUint16(view, entryOffset, bigEndian);
    if (tag === targetTag) {
      return readUint32(view, entryOffset + 8, bigEndian);
    }
  }
  return null;
}

function parseExifDate(dateStr: string): Date | undefined {
  // Format: "YYYY:MM:DD HH:MM:SS"
  const match = dateStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }
  return undefined;
}

function convertDMSToDD(dms: number[], negative: boolean): number {
  const [degrees, minutes, seconds] = dms;
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (negative) dd = -dd;
  return dd;
}

/**
 * Resize image to max dimension while preserving aspect ratio
 * Returns base64 encoded JPEG
 */
export async function resizeImageForApi(file: File, maxDimension: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 JPEG
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve(base64);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get MIME type from file
 */
export function getImageMimeType(file: File): string {
  const type = file.type.toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'image/jpeg';
  if (type.includes('png')) return 'image/png';
  if (type.includes('webp')) return 'image/webp';
  if (type.includes('gif')) return 'image/gif';
  if (type.includes('heic') || type.includes('heif')) return 'image/jpeg'; // Will be converted
  return 'image/jpeg'; // Default
}
