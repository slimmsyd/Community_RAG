import { useState, useEffect } from 'react';

interface ImageMetadata {
  userId: string;
  type: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadDate: string;
}

interface GridFSImage {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: string;
  metadata: ImageMetadata;
  url: string;
}

interface UseUserImagesReturn {
  images: GridFSImage[];
  isLoading: boolean;
  error: string | null;
  refreshImages: () => Promise<void>;
  deleteImage: (imageId: string) => Promise<boolean>;
  canUploadMore: boolean;
}

export function useUserImages(userId: string): UseUserImagesReturn {
  const [images, setImages] = useState<GridFSImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_IMAGES = 6;
  const canUploadMore = images.length < MAX_IMAGES;

  const deleteImage = async (imageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchImages(); // Refresh the images list
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting image:', err);
      return false;
    }
  };

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/images/user/${userId}`);
      const data = await response.json();
      console.log("Logging the the data from", data)
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch images');
      }

      setImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchImages();
    }
  }, [userId]);

  return {
    images,
    isLoading,
    error,
    refreshImages: fetchImages,
    deleteImage,
    canUploadMore
  };
} 