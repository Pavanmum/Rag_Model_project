'use client';

import { useState, useEffect } from 'react';
import TabbedFileUpload from '../components/TabbedFileUpload';
import MultiModalChatInterface from '../components/MultiModalChatInterface';
import { FileText, Image, MessageSquare, Upload, Brain, Database, Zap } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  fileType: string;
  mimeType: string;
  createdAt: string;
  totalChunks: number;
  fileSize: number;
  metadata?: any;
}

export default function MultiModalPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (uploadedFiles: any[]) => {
    // Refresh documents list after successful uploads
    fetchDocuments();
  };

  const getFileTypeStats = () => {
    const stats = documents.reduce((acc, doc) => {
      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const fileTypeStats = getFileTypeStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        
        {/* Hero Section */}
        <div className="text-center py-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multi-Modal RAG Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Upload PDFs and images, then ask intelligent questions about their content. 
            Powered by Google Gemini Vision API and advanced vector search.
          </p>
          
          {/* Feature Icons */}
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 mb-2 text-blue-600" />
              <span>Multi-File Upload</span>
            </div>
            <div className="flex flex-col items-center">
              <Brain className="w-8 h-8 mb-2 text-blue-600" />
              <span>Gemini Vision AI</span>
            </div>
            <div className="flex flex-col items-center">
              <Database className="w-8 h-8 mb-2 text-blue-600" />
              <span>Vector Search</span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 mb-2 text-blue-600" />
              <span>Instant Answers</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                  <p className="text-sm text-gray-500">Total Documents</p>
                </div>
              </div>
            </div>
            
            {fileTypeStats.pdf && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{fileTypeStats.pdf}</p>
                    <p className="text-sm text-gray-500">PDF Files</p>
                  </div>
                </div>
              </div>
            )}
            
            {fileTypeStats.image && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <Image className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{fileTypeStats.image}</p>
                    <p className="text-sm text-gray-500">Images</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.reduce((sum, doc) => sum + doc.totalChunks, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Chunks</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Upload className="w-6 h-6 mr-3 text-blue-600" />
                Upload Files
              </h2>
              <p className="text-gray-600 mt-2">
                Drag and drop PDFs and images to get started
              </p>
            </div>
            <div className="p-6">
              <TabbedFileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="mb-8">
          <MultiModalChatInterface 
            documents={documents} 
            onRefreshDocuments={fetchDocuments}
          />
        </div>

        {/* Instructions */}
        {documents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">
                  1
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Upload Files</h4>
                <p className="text-gray-600">
                  Drag and drop PDFs and images (JPG, PNG, GIF, WebP, BMP) up to 20MB each
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">
                  2
                </div>
                <h4 className="font-medium text-gray-900 mb-2">AI Processing</h4>
                <p className="text-gray-600">
                  Gemini Vision analyzes images and extracts text, while PDFs are parsed and chunked
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">
                  3
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Vector Embeddings</h4>
                <p className="text-gray-600">
                  Content is converted to vector embeddings for semantic search and similarity matching
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">
                  4
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Ask Questions</h4>
                <p className="text-gray-600">
                  Chat with your documents and images to get intelligent, context-aware answers
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Supported File Types:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-medium">Documents:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>PDF files</li>
                    <li>Text extraction</li>
                    <li>OCR for scanned PDFs</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Images:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>JPG, PNG, GIF, WebP, BMP</li>
                    <li>AI image description</li>
                    <li>OCR text extraction</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example Questions */}
        {documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Questions to Try</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">General Questions:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• "What documents do I have uploaded?"</li>
                  <li>• "Summarize all the content"</li>
                  <li>• "What are the main topics covered?"</li>
                  <li>• "Find information about [specific topic]"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Image-Specific Questions:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• "What images contain text?"</li>
                  <li>• "Describe the images I uploaded"</li>
                  <li>• "What text can you extract from images?"</li>
                  <li>• "Compare content between PDFs and images"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
