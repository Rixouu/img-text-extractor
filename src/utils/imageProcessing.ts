export async function resizeImage(file: File, maxWidth = 1000, maxHeight = 1000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          URL.revokeObjectURL(objectUrl);
          resolve(blob);
        } else {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas to Blob conversion failed'));
        }
      }, file.type);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unsupported file type for image resizing'));
    };
    img.src = objectUrl;
  });
}
