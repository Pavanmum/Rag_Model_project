'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface UploadResponse {
  message: string;
  documentId: string;
  filename: string;
  chunksCreated: number;
  extractedTextPreview: string;
}

interface PDFUploadProps {
  onUploadSuccess: (data: UploadResponse) => void;
}

export default function PDFUpload({ onUploadSuccess }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setUploadStatus('idle');
        setErrorMessage('');
      } else {
        setErrorMessage('Please upload a PDF file only.');
        setUploadStatus('error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setUploadStatus('idle');
        setErrorMessage('');
      } else {
        setErrorMessage('Please upload a PDF file only.');
        setUploadStatus('error');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post<UploadResponse>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });

      setUploadStatus('success');
      onUploadSuccess(response.data);
      
      // Reset form after successful upload
      setTimeout(() => {
        setFile(null);
        setUploadStatus('idle');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else if (error.code === 'ECONNABORTED') {
        setErrorMessage('Upload timeout. Please try with a smaller file.');
      } else {
        setErrorMessage('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-primary-600" />
        Upload PDF Document
      </h2>

      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : file
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {!file ? (
          <div className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF files up to 10MB
            </p>
          </div>
        ) : (
          <div className="cursor-pointer">
            <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              {file.name}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {formatFileSize(file.size)}
            </p>
            <p className="text-xs text-gray-400">
              Click to change file
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing PDF<span className="loading-dots"></span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload and Analyze PDF
              </>
            )}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          PDF uploaded and processed successfully!
        </div>
      )}

      {uploadStatus === 'error' && errorMessage && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {errorMessage}
        </div>
      )}

      {/* Upload Progress Info */}
      {uploading && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          <p className="text-sm">
            📄 Extracting text from PDF...<br />
            🧠 Generating embeddings...<br />
            💾 Storing in database...
          </p>
        </div>
      )}
    </div>
  );
}
