'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Image, Loader2, Filter, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    filename: string;
    fileType: string;
    similarity: number;
    chunkIndex: number;
    totalChunks: number;
  }>;
}

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

interface MultiModalChatInterfaceProps {
  documents: Document[];
  onRefreshDocuments: () => void;
}

export default function MultiModalChatInterface({ 
  documents, 
  onRefreshDocuments 
}: MultiModalChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setError('');

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Question failed:', error);
      setError('Failed to get response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const getFileIcon = (fileType: string | undefined) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = selectedFileType === 'all' 
    ? documents 
    : documents.filter(doc => doc.fileType === selectedFileType);

  const fileTypes = ['all', ...Array.from(new Set(documents.map(doc => doc.fileType).filter(Boolean)))];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Documents Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
              <button
                onClick={onRefreshDocuments}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>

            {/* File Type Filter */}
            {fileTypes.length > 2 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fileTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedFileType(type)}
                      className={`px-3 py-1 text-xs rounded-full border ${
                        selectedFileType === type
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? 'All' : (type || '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Documents List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredDocuments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  {selectedFileType === 'all' 
                    ? 'No documents uploaded yet' 
                    : `No ${selectedFileType} files found`
                  }
                </p>
              ) : (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getFileIcon(doc.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(doc.fileType || 'UNKNOWN').toUpperCase()} • {formatFileSize(doc.fileSize)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.totalChunks} chunks • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <Bot className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Multi-Modal Assistant</h2>
                  <p className="text-sm text-gray-500">
                    Ask questions about your PDFs and images
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear Chat
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Ready to answer your questions!</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Ask questions about your uploaded PDFs and images
                  </p>
                  
                  {documents.length > 0 && (
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      <p className="text-sm font-medium text-gray-700">Try asking:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• "What documents do I have uploaded?"</li>
                        <li>• "Summarize the content across all files"</li>
                        <li>• "What images contain text?"</li>
                        <li>• "Find information about [topic]"</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 max-w-full">
                            <p className="text-xs font-medium text-gray-600 mb-1">Sources:</p>
                            <div className="space-y-1">
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded p-2 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-700 flex items-center">
                                      {getFileIcon(source.fileType)}
                                      <span className="ml-1">{source.filename}</span>
                                    </span>
                                    <span className="text-gray-500">
                                      {(source.similarity * 100).toFixed(1)}% match
                                    </span>
                                  </div>
                                  <p className="text-gray-600">
                                    {(source.fileType || 'UNKNOWN').toUpperCase()} • Chunk {source.chunkIndex + 1}/{source.totalChunks}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex mr-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-gray-600">Analyzing content...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder={documents.length > 0 ? "Ask a question about your documents..." : "Upload files first to start asking questions"}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none min-h-[40px] max-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || documents.length === 0}
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !question.trim() || documents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center justify-center min-w-[80px]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
