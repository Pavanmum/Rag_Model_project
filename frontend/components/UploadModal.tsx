'use client';

import { useState, useRef } from 'react';
import { X, Upload, Cloud } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onFileUpload: (files: FileList) => void;
}

export default function UploadModal({ onClose, onFileUpload }: UploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: FileList) => {
    const file = files[0];
    
    // Validate file type
    const validExtensions = ['.dcm', '.nii', '.nii.gz'];
    const fileName = file.name.toLowerCase();
    const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFile) {
      alert('Please upload a valid DICOM (.dcm) or NIfTI (.nii, .nii.gz) file.');
      return;
    }

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    // Call the upload handler
    onFileUpload(files);
    
    // Complete progress after a delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }, 1000);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Upload Medical Scan</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-white/20 rounded-full hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!isUploading ? (
            <div
              onClick={handleUploadAreaClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
              }`}
            >
              <Cloud className={`w-12 h-12 mx-auto mb-4 ${
                isDragOver ? 'text-indigo-500' : 'text-gray-400'
              }`} />
              
              <p className="text-gray-700 mb-2 font-medium">
                Drag & drop your DICOM or NIfTI files here
              </p>
              <p className="text-gray-500 text-sm mb-4">
                or click to browse
              </p>
              
              <div className="text-xs text-gray-400">
                Supported formats: .dcm, .nii, .nii.gz
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.nii,.nii.gz"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${uploadProgress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">
                      {Math.round(uploadProgress)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 font-medium mb-2">
                {uploadProgress < 100 ? 'Uploading and analyzing...' : 'Complete!'}
              </p>
              <p className="text-gray-500 text-sm">
                {uploadProgress < 50 ? 'Processing DICOM metadata...' :
                 uploadProgress < 80 ? 'Extracting features...' :
                 uploadProgress < 100 ? 'Generating analysis...' : 'Analysis ready!'}
              </p>
            </div>
          )}

          {/* File Type Info */}
          {!isUploading && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">💡 Supported File Types:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">DICOM:</span>
                  <span>.dcm files from MRI scanners</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">NIfTI:</span>
                  <span>.nii, .nii.gz neuroimaging files</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
