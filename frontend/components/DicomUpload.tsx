'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DicomMetadata {
  patientId?: string;
  patientName?: string;
  studyDate?: string;
  modality?: string;
  bodyPart?: string;
  studyDescription?: string;
  seriesDescription?: string;
  rows?: number;
  columns?: number;
  pixelSpacing?: string;
  sliceThickness?: string;
}

interface UploadResponse {
  message: string;
  documentId: string;
  filename: string;
  fileType: string;
  chunksCreated: number;
  metadata?: DicomMetadata;
  extractedTextPreview: string;
}

interface DicomUploadProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: string) => void;
}

const DicomUpload: React.FC<DicomUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isDicom = fileName.endsWith('.dcm') || fileName.endsWith('.dicom');
    const isPdf = fileName.endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(fileName);

    if (!isDicom && !isPdf && !isImage) {
      const errorMsg = 'Please upload a DICOM (.dcm), PDF (.pdf), or image file (JPG, PNG, etc.)';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadedFile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result: UploadResponse = await response.json();
      setUploadedFile(result);
      onUploadSuccess?.(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dicom': ['.dcm', '.dicom'],
      'application/octet-stream': ['.dcm', '.dicom'],
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🏥 Medical File Upload</h2>
        <p className="text-gray-300">Upload DICOM files or PDF documents for AI-powered medical analysis</p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-blue-400 bg-blue-900/20' 
            : 'border-gray-600 hover:border-blue-500 bg-gray-800/50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="text-6xl">
            {uploading ? '⏳' : isDragActive ? '📥' : '🏥'}
          </div>
          
          <div>
            <p className="text-xl text-white font-semibold">
              {uploading 
                ? 'Processing medical file...' 
                : isDragActive 
                  ? 'Drop your medical file here' 
                  : 'Drop DICOM or PDF files here'
              }
            </p>
            <p className="text-gray-400 mt-2">
              Supports: DICOM (.dcm), PDF (.pdf), Images (JPG, PNG, etc.) • Max: 100MB
            </p>
          </div>

          {!uploading && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Browse Files
            </button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Uploading and processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-600 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-400">❌</span>
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Success Display */}
      {uploadedFile && (
        <div className="mt-6 p-6 bg-green-900/30 border border-green-600 rounded-lg">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-xl">✅</span>
              <span className="text-green-300 font-semibold">Upload Successful!</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">File:</span>
                <span className="text-white ml-2">{uploadedFile.filename}</span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-2">{uploadedFile.fileType}</span>
              </div>
              <div>
                <span className="text-gray-400">Chunks:</span>
                <span className="text-white ml-2">{uploadedFile.chunksCreated}</span>
              </div>
              <div>
                <span className="text-gray-400">Document ID:</span>
                <span className="text-white ml-2 font-mono text-xs">{uploadedFile.documentId}</span>
              </div>
            </div>

            {/* DICOM Metadata */}
            {uploadedFile.metadata && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
                <h4 className="text-blue-300 font-semibold mb-3">📊 DICOM Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {uploadedFile.metadata.patientId && (
                    <div>
                      <span className="text-gray-400">Patient ID:</span>
                      <span className="text-white ml-2">{uploadedFile.metadata.patientId}</span>
                    </div>
                  )}
                  {uploadedFile.metadata.modality && (
                    <div>
                      <span className="text-gray-400">Modality:</span>
                      <span className="text-white ml-2">{uploadedFile.metadata.modality}</span>
                    </div>
                  )}
                  {uploadedFile.metadata.bodyPart && (
                    <div>
                      <span className="text-gray-400">Body Part:</span>
                      <span className="text-white ml-2">{uploadedFile.metadata.bodyPart}</span>
                    </div>
                  )}
                  {uploadedFile.metadata.studyDate && (
                    <div>
                      <span className="text-gray-400">Study Date:</span>
                      <span className="text-white ml-2">{uploadedFile.metadata.studyDate}</span>
                    </div>
                  )}
                  {uploadedFile.metadata.rows && uploadedFile.metadata.columns && (
                    <div>
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white ml-2">{uploadedFile.metadata.rows} × {uploadedFile.metadata.columns}</span>
                    </div>
                  )}
                  {uploadedFile.metadata.sliceThickness && (
                    <div>
                      <span className="text-gray-400">Slice Thickness:</span>
                      <span className="text-white ml-2">{uploadedFile.metadata.sliceThickness}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extracted Text Preview */}
            <div className="mt-4 p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
              <h4 className="text-gray-300 font-semibold mb-2">📄 Extracted Content Preview</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {uploadedFile.extractedTextPreview}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomUpload;
