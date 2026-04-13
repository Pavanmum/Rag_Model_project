'use client';

import { useState, useEffect } from 'react';
import TabbedFileUpload from '../../components/TabbedFileUpload';
import MultiModalChatInterface from '../../components/MultiModalChatInterface';
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

export default function TabbedUploadPage() {
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
            Smart Document & Image Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Choose your file type and upload PDFs or images separately. 
            Ask intelligent questions about all your content with AI-powered analysis.
          </p>
          
          {/* Feature Icons */}
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex flex-col items-center">
              <FileText className="w-8 h-8 mb-2 text-red-600" />
              <span>PDF Analysis</span>
            </div>
            <div className="flex flex-col items-center">
              <Image className="w-8 h-8 mb-2 text-blue-600" />
              <span>Image Understanding</span>
            </div>
            <div className="flex flex-col items-center">
              <Brain className="w-8 h-8 mb-2 text-green-600" />
              <span>AI Processing</span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 mb-2 text-purple-600" />
              <span>Smart Answers</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-gray-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                  <p className="text-sm text-gray-500">Total Files</p>
                </div>
              </div>
            </div>
            
            {fileTypeStats.pdf && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{fileTypeStats.pdf}</p>
                    <p className="text-sm text-gray-500">PDF Documents</p>
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
                  <p className="text-sm text-gray-500">Content Chunks</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Upload Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Upload className="w-6 h-6 mr-3 text-blue-600" />
                Upload Your Files
              </h2>
              <p className="text-gray-600 mt-2">
                Choose between PDF documents or images using the tabs below
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* PDF Instructions */}
              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex items-center mb-3">
                  <FileText className="w-6 h-6 text-red-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">PDF Documents</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Click the "PDF Documents" tab</li>
                  <li>• Drag & drop or click to upload PDF files</li>
                  <li>• System extracts text and creates searchable chunks</li>
                  <li>• Ask questions about document content</li>
                  <li>• Get answers with source citations</li>
                </ul>
              </div>

              {/* Image Instructions */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center mb-3">
                  <Image className="w-6 h-6 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">Images</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Click the "Images" tab</li>
                  <li>• Upload JPG, PNG, GIF, WebP, BMP files</li>
                  <li>• AI analyzes visual content and extracts text</li>
                  <li>• Ask about what you see in images</li>
                  <li>• Get descriptions and text extraction</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-medium">For PDFs:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Works with text-based and scanned PDFs</li>
                    <li>Supports files up to 20MB</li>
                    <li>Best for research papers, reports, manuals</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">For Images:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>AI describes visual content</li>
                    <li>Extracts text from screenshots, signs, etc.</li>
                    <li>Great for charts, diagrams, photos with text</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example Questions */}
        {documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Try These Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-red-500" />
                  About PDFs:
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• "Summarize my PDF documents"</li>
                  <li>• "What are the main topics covered?"</li>
                  <li>• "Find information about [specific topic]"</li>
                  <li>• "Extract key dates and numbers"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Image className="w-4 h-4 mr-2 text-blue-500" />
                  About Images:
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• "Describe the images I uploaded"</li>
                  <li>• "What text can you see in the images?"</li>
                  <li>• "What objects are visible in my photos?"</li>
                  <li>• "Compare content between images and PDFs"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
