'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  type: 'pdf' | 'image';
  preview?: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress?: number;
  error?: string;
  result?: {
    documentId: string;
    chunks: number;
    fileSize: number;
  };
}

interface FileUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void;
}

const SUPPORTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp']
};

const FILE_TYPE_MAP: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/bmp': 'image'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          console.error(`Error with file ${file.name}:`, error.message);
        });
      });
    }

    // Process accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      const fileType = FILE_TYPE_MAP[file.type as keyof typeof FILE_TYPE_MAP];
      const id = Math.random().toString(36).substr(2, 9);
      
      const uploadedFile: UploadedFile = {
        id,
        file,
        type: fileType,
        status: 'pending'
      };

      // Create preview for images
      if (fileType === 'image') {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      return uploadedFile;
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      // Revoke object URL for images to prevent memory leaks
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', uploadedFile.file);

    try {
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 0 } : f)
      );

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { 
          ...f, 
          status: 'complete', 
          result: {
            documentId: result.documentId,
            chunks: result.chunks,
            fileSize: result.fileSize
          }
        } : f)
      );

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f)
      );
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
    
    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        await uploadFile(file);
      }
      
      // Notify parent component
      onUploadComplete(uploadedFiles.filter(f => f.status === 'complete'));
    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 text-lg">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 text-lg mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: PDF, JPG, PNG, GIF, WebP, BMP (max 50MB each)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Files ({uploadedFiles.length})
            </h3>
            {uploadedFiles.some(f => f.status === 'pending') && (
              <button
                onClick={uploadAllFiles}
                disabled={isUploading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload All
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {uploadedFile.type === 'image' && uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadedFile.type)
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {uploadedFile.type.toUpperCase()} • {formatFileSize(uploadedFile.file.size)}
                    {uploadedFile.result && (
                      <span> • {uploadedFile.result.chunks} chunks</span>
                    )}
                  </p>
                  {uploadedFile.error && (
                    <p className="text-sm text-red-500 mt-1">{uploadedFile.error}</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(uploadedFile.status)}
                  <span className="text-sm text-gray-500 capitalize">
                    {uploadedFile.status}
                  </span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  disabled={uploadedFile.status === 'uploading'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
