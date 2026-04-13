'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

interface TabbedFileUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void;
}

const PDF_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf']
};

const IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp']
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function TabbedFileUpload({ onUploadComplete }: TabbedFileUploadProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'image'>('pdf');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDropPDF = useCallback((acceptedFiles: globalThis.File[], rejectedFiles: any[]) => {
    handleFileDrop(acceptedFiles, rejectedFiles, 'pdf');
  }, []);

  const onDropImage = useCallback((acceptedFiles: globalThis.File[], rejectedFiles: any[]) => {
    handleFileDrop(acceptedFiles, rejectedFiles, 'image');
  }, []);

  const handleFileDrop = (acceptedFiles: globalThis.File[], rejectedFiles: any[], fileType: 'pdf' | 'image') => {
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
  };

  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps, isDragActive: isPDFDragActive } = useDropzone({
    onDrop: onDropPDF,
    accept: PDF_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImage,
    accept: IMAGE_TYPES,
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

  const pdfFiles = uploadedFiles.filter(f => f.type === 'pdf');
  const imageFiles = uploadedFiles.filter(f => f.type === 'image');

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pdf'
              ? 'border-red-500 text-red-600 bg-red-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <FileText className="w-5 h-5 mr-2" />
          PDF Documents
          {pdfFiles.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {pdfFiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'image'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <Image className="w-5 h-5 mr-2" />
          Images
          {imageFiles.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {imageFiles.length}
            </span>
          )}
        </button>
      </div>

      {/* PDF Upload Tab */}
      {activeTab === 'pdf' && (
        <div className="space-y-6">
          <div
            {...getPDFRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isPDFDragActive
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-red-400'
              }`}
          >
            <input {...getPDFInputProps()} />
            <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
            {isPDFDragActive ? (
              <p className="text-red-600 text-lg">Drop PDF files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 text-lg mb-2">
                  Drag & drop PDF files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF files up to 50MB each
                </p>
              </div>
            )}
          </div>

          {/* PDF Files List */}
          {pdfFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-red-500" />
                PDF Files ({pdfFiles.length})
              </h3>
              <div className="space-y-3">
                {pdfFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF • {formatFileSize(uploadedFile.file.size)}
                        {uploadedFile.result && (
                          <span> • {uploadedFile.result.chunks} chunks</span>
                        )}
                      </p>
                      {uploadedFile.error && (
                        <p className="text-sm text-red-500 mt-1">{uploadedFile.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadedFile.status)}
                      <span className="text-sm text-gray-500 capitalize">
                        {uploadedFile.status}
                      </span>
                    </div>

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
      )}

      {/* Image Upload Tab */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          <div
            {...getImageRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isImageDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
              }`}
          >
            <input {...getImageInputProps()} />
            <Image className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            {isImageDragActive ? (
              <p className="text-blue-600 text-lg">Drop image files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 text-lg mb-2">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, GIF, WebP, BMP up to 50MB each
                </p>
              </div>
            )}
          </div>

          {/* Image Files List */}
          {imageFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2 text-blue-500" />
                Images ({imageFiles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imageFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="border rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    {uploadedFile.preview && (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-full h-32 object-cover"
                      />
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {uploadedFile.file.type.split('/')[1].toUpperCase()} • {formatFileSize(uploadedFile.file.size)}
                          </p>
                          {uploadedFile.error && (
                            <p className="text-sm text-red-500 mt-1">{uploadedFile.error}</p>
                          )}
                        </div>

                        <button
                          onClick={() => removeFile(uploadedFile.id)}
                          className="text-gray-400 hover:text-red-500 p-1 ml-2"
                          disabled={uploadedFile.status === 'uploading'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(uploadedFile.status)}
                          <span className="text-sm text-gray-500 capitalize">
                            {uploadedFile.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload All Button */}
      {uploadedFiles.some(f => f.status === 'pending') && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={uploadAllFiles}
            disabled={isUploading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-lg"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            Upload All Files ({uploadedFiles.filter(f => f.status === 'pending').length})
          </button>
        </div>
      )}
    </div>
  );
}
