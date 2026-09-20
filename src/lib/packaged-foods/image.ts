export const MAX_LABEL_IMAGE_DIMENSION = 1600;
export const MAX_FOOD_PHOTO_DIMENSION = 1280;
export const JPEG_QUALITY = 0.72;

export const shouldPersistLabelImage = () => false;
export const shouldPersistFoodPhoto = () => false;

export const resizeImageFile = async (
  file: File,
  options?: { maxDimension?: number }
): Promise<{ mimeType: string; dataBase64: string }> => {
  const maxDimension = options?.maxDimension ?? MAX_LABEL_IMAGE_DIMENSION;
  if (typeof createImageBitmap === 'undefined') {
    const buffer = await file.arrayBuffer();
    const dataBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return { mimeType: file.type || 'image/jpeg', dataBase64 };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare image');
  context.drawImage(bitmap, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return {
    mimeType: 'image/jpeg',
    dataBase64: dataUrl.replace(/^data:image\/\w+;base64,/, ''),
  };
};
