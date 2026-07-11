export const MAX_VALID_ID_DATA_URL_LENGTH = 1_100_000;

export function normalizeValidIdUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    !trimmed.startsWith('data:image/jpeg;base64,') &&
    !trimmed.startsWith('data:image/png;base64,') &&
    !trimmed.startsWith('data:image/webp;base64,')
  ) {
    return null;
  }

  if (trimmed.length > MAX_VALID_ID_DATA_URL_LENGTH) {
    return null;
  }

  return trimmed;
}

export async function readValidIdFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPEG, PNG, or WebP).');
  }

  const dataUrl = await compressValidIdImage(file);
  if (dataUrl.length > MAX_VALID_ID_DATA_URL_LENGTH) {
    throw new Error('Image is too large. Please upload a smaller photo.');
  }

  return dataUrl;
}

async function compressValidIdImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to process image.');
    }

    context.drawImage(image, 0, 0, width, height);

    let quality = 0.85;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);

    while (dataUrl.length > MAX_VALID_ID_DATA_URL_LENGTH && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const MAX_SIGNATURE_IMAGE_DATA_URL_LENGTH = MAX_VALID_ID_DATA_URL_LENGTH;

export const normalizeSignatureImageUrl = normalizeValidIdUrl;

export async function readSignatureImageFileAsDataUrl(
  file: File,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPEG, PNG, or WebP).');
  }

  const dataUrl = await compressSignatureImage(file);
  if (dataUrl.length > MAX_SIGNATURE_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Image is too large. Please upload a smaller signature.');
  }

  return dataUrl;
}

async function compressSignatureImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const maxDimension = 800;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to process image.');
    }

    // Transparent PNG/WebP signatures become black when flattened to JPEG
    // without an explicit background.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let dataUrl = canvas.toDataURL('image/png');

    if (dataUrl.length > MAX_SIGNATURE_IMAGE_DATA_URL_LENGTH) {
      let quality = 0.92;
      dataUrl = canvas.toDataURL('image/jpeg', quality);

      while (
        dataUrl.length > MAX_SIGNATURE_IMAGE_DATA_URL_LENGTH &&
        quality > 0.5
      ) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to read image file.'));
    image.src = src;
  });
}
