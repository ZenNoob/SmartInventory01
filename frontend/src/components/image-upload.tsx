'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProcessedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
}

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined, images?: ProcessedImage) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${getApiUrl()}${path}`;
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('storeId');

      const response = await fetch(`${getApiUrl()}/api/upload/product-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Store-Id': storeId || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      if (data.success && data.images) {
        onChange(data.images.medium, data.images);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [disabled, isUploading]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemove = async () => {
    if (!value) return;

    try {
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('storeId');

      await fetch(`${getApiUrl()}/api/upload/product-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Store-Id': storeId || '',
        },
        body: JSON.stringify({ imageUrl: value }),
      });
    } catch (err) {
      console.error('Failed to delete image:', err);
    }

    onChange(undefined);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative inline-block">
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
            <Image
              src={getImageUrl(value)}
              alt="Product image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
            dragOver && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && !isUploading && 'hover:border-primary hover:bg-muted/50'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground text-center px-2">
                Click or drag image
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
