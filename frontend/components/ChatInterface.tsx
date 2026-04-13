'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Bot, User, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    filename: string;
    similarity: number;
    chunk_index: number;
    preview: string;
  }>;
}

interface ChatInterfaceProps {
  documentId?: string;
  documentName?: string;
}

export default function ChatInterface({ documentId, documentName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      const response = await axios.post('/api/ask', {
        question: userMessage.content,
        documentId: documentId,
      }, {
        timeout: 30000, // 30 second timeout
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
        sources: response.data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Question failed:', error);
      setError(error.response?.data?.error || 'Failed to get response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
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

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-5 h-5 text-primary-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ask Questions</h2>
            {documentName && (
              <p className="text-sm text-gray-500">About: {documentName}</p>
            )}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Ready to answer your questions!</p>
            <p className="text-gray-400 text-sm">
              {documentName 
                ? `Ask anything about "${documentName}"`
                : 'Upload a PDF document first, then ask questions about its content'
              }
            </p>
            {documentName && (
              <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700">Try asking:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "What is this document about?"</li>
                  <li>• "Summarize the main points"</li>
                  <li>• "What are the key findings?"</li>
                  <li>• "Extract important dates and numbers"</li>
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
                      ? 'bg-primary-600 text-white' 
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
                      ? 'bg-primary-600 text-white'
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
                                <FileText className="w-3 h-3 mr-1" />
                                {source.filename}
                              </span>
                              <span className="text-gray-500">
                                {(source.similarity * 100).toFixed(1)}% match
                              </span>
                            </div>
                            <p className="text-gray-600 line-clamp-2">{source.preview}</p>
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
              <span className="text-gray-600">Thinking<span className="loading-dots"></span></span>
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
              placeholder={documentName ? "Ask a question about the document..." : "Upload a PDF first to start asking questions"}
              className="input-field resize-none min-h-[40px] max-h-[120px]"
              disabled={loading || !documentName}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim() || !documentName}
            className="btn-primary flex items-center justify-center px-4 py-2 min-w-[80px]"
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
  );
}
