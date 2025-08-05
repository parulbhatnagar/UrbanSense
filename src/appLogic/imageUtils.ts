// Utility to fetch and convert a local image file to base64
export async function fetchImageAsBase64(imagePath: string): Promise<{ base64: string, mimeType: string }> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  const mimeType = blob.type || getMimeTypeFromPath(imagePath);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve({ base64: reader.result, mimeType });
      } else {
        reject('Failed to convert image to base64');
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getMimeTypeFromPath(path: string): string {
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}
