'use client';

import React, { useState, useCallback } from 'react';
import DicomUpload from '../../components/DicomUpload';
import Brain3D from '../../components/Brain3D';
import SketchfabBrain from '../../components/SketchfabBrain';
import TumorDetectionReport from '../../components/TumorDetectionReport';

interface UploadResponse {
  message: string;
  documentId: string;
  filename: string;
  fileType: string;
  chunksCreated: number;
  metadata?: any;
  extractedTextPreview: string;
}

interface MedicalQuestion {
  question: string;
  answer?: string;
  loading?: boolean;
  sources?: any[];
}

interface TumorDetectionReport {
  documentId: string;
  filename: string;
  detectionStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  overallConfidence: number;
  analysis: string;
  metrics: {
    sensitivity: number;
    specificity: number;
    accuracy: number;
    processingTime: number;
  };
  riskFactors: string[];
  timestamp: Date;
  aiProvider: string;
  disclaimer: string;
  processingTime: number;
}

export default function DicomUploadPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [questions, setQuestions] = useState<MedicalQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [useRealisticBrain, setUseRealisticBrain] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingAnswerIndex, setSpeakingAnswerIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Tumor detection state
  const [tumorReport, setTumorReport] = useState<TumorDetectionReport | null>(null);
  const [isAnalyzingTumor, setIsAnalyzingTumor] = useState(false);
  const [tumorAnalysisProgress, setTumorAnalysisProgress] = useState(0);
  const [showTumorReport, setShowTumorReport] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // ── Voice / Text-to-Speech helpers ──────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Speak a specific Q&A answer
  const speakAnswer = useCallback((text: string, index: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeakingAnswerIndex(index);
    utterance.onend = () => setSpeakingAnswerIndex(null);
    utterance.onerror = () => setSpeakingAnswerIndex(null);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopAnswerSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingAnswerIndex(null);
      setIsSpeaking(false);
    }
  }, []);

  // Voice input — microphone
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewQuestion(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, []);

  const speakTumorResult = useCallback((result: TumorDetectionReport) => {
    const tumorDetected = result.analysis.toLowerCase().includes('tumor detected: yes');
    const confidence = result.overallConfidence;
    const filename = result.filename;

    let message = '';
    if (tumorDetected) {
      message =
        `Attention! Tumor detection analysis for ${filename} is complete. ` +
        `Result: A potential tumor has been detected with a confidence level of ${confidence} percent. ` +
        `Please review the detailed report immediately and consult a medical professional.`;
    } else {
      message =
        `Tumor detection analysis for ${filename} is complete. ` +
        `Result: No tumor detected. Confidence level is ${confidence} percent. ` +
        `The brain scan appears normal. Please review the full report for more details.`;
    }
    speak(message);
  }, [speak]);

  const handleUploadSuccess = (response: UploadResponse) => {
    setUploadedFile(response);
    // Clear previous questions when new file is uploaded
    setQuestions([]);
    // Clear previous tumor analysis
    setTumorReport(null);
    setShowTumorReport(false);

    // Always start tumor detection for uploaded files
    startTumorDetection(response);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const askQuestion = async () => {
    if (!newQuestion.trim() || !uploadedFile) return;

    const questionObj: MedicalQuestion = {
      question: newQuestion,
      loading: true
    };

    setQuestions(prev => [...prev, questionObj]);
    setNewQuestion('');
    setAskingQuestion(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newQuestion,
          documentId: uploadedFile.documentId,
          includeContext: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get answer: ${response.status}`);
      }

      const result = await response.json();

      setQuestions(prev => {
        const updated = prev.map((q, index) =>
          index === prev.length - 1
            ? { ...q, answer: result.answer, sources: result.sources, loading: false }
            : q
        );
        // 🔊 Auto-speak the new answer
        if (result.answer) {
          const answerIdx = updated.length - 1;
          setTimeout(() => speakAnswer(result.answer, answerIdx), 300);
        }
        return updated;
      });

    } catch (error) {
      console.error('Question error:', error);
      setQuestions(prev => 
        prev.map((q, index) => 
          index === prev.length - 1 
            ? { ...q, answer: 'Failed to get answer. Please try again.', loading: false }
            : q
        )
      );
    } finally {
      setAskingQuestion(false);
    }
  };

  const startTumorDetection = async (uploadResponse: UploadResponse) => {
    setIsAnalyzingTumor(true);
    setTumorAnalysisProgress(0);
    setShowTumorReport(true);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTumorAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/detect-tumor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: uploadResponse.documentId,
          filename: uploadResponse.filename
        }),
      });

      clearInterval(progressInterval);
      setTumorAnalysisProgress(100);

      if (!response.ok) {
        throw new Error(`Tumor detection failed: ${response.status}`);
      }

      const result = await response.json();
      setTumorReport(result);

      // Show notification based on results
      const tumorDetected = result.analysis.toLowerCase().includes('tumor detected: yes');
      if (tumorDetected) {
        showNotificationMessage('⚠️ Potential tumor detected! Please review the detailed report.');
      } else {
        showNotificationMessage('✅ No tumor detected in the brain scan.');
      }

      // 🔊 Voice announcement — speaks the result automatically
      speakTumorResult(result);

    } catch (error) {
      console.error('Tumor detection error:', error);
      setTumorReport({
        documentId: uploadResponse.documentId,
        filename: uploadResponse.filename,
        detectionStatus: 'error',
        overallConfidence: 0,
        analysis: 'Failed to analyze the image for tumor detection. Please try again.',
        metrics: { sensitivity: 0, specificity: 0, accuracy: 0, processingTime: 0 },
        riskFactors: [],
        timestamp: new Date(),
        aiProvider: 'Google Gemini',
        disclaimer: 'Analysis failed due to technical error.',
        processingTime: 0
      });
    } finally {
      setIsAnalyzingTumor(false);
    }
  };

  const suggestedQuestions = [
    "What type of medical imaging study is this?",
    "What are the technical parameters of this scan?",
    "What body part was examined in this study?",
    "What is the patient information available?",
    "What imaging modality was used?",
    "What are the image dimensions and quality parameters?"
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient-shift"></div>

      {/* Animated Gradient Overlay */}
      <div className="fixed inset-0 opacity-50">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg transition-all duration-300 hover:scale-105">
            🏥 Knowledge Enhanced Medical Image Analyzing RAG 
          </h1>
          <p className="text-xl text-gray-200 drop-shadow-md mb-2">
            Upload brain scans for automatic tumor detection and medical analysis
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>DICOM Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              <span>Tumor Detection</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="transform transition-all duration-500 hover:scale-[1.02] animate-slide-in-left">
            <DicomUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* 3D Brain Visualization */}
          <div className="flex flex-col items-center justify-center transform transition-all duration-500 hover:scale-[1.02] animate-slide-in-right">
            <div className="mb-6 text-center">
              <h3 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                � Interactive 3D Brain Models
              </h3>
              <p className="text-gray-200 drop-shadow-md mb-2">
                Drag to rotate • Scroll to zoom • Right-click to pan
              </p>
              <p className="text-sm text-pink-300 animate-pulse">
                ✨ Fully interactive medical visualization
              </p>

              {/* Model Toggle */}
              <div className="mt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={() => setUseRealisticBrain(false)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    !useRealisticBrain
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🩸 Blood Vessels
                </button>
                <button
                  onClick={() => setUseRealisticBrain(true)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    useRealisticBrain
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🧠 Sketchfab Model
                </button>
              </div>
            </div>

            <div className="relative group">
              {/* Glow effect container */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse-slow"></div>

              {/* Brain container */}
              <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 shadow-2xl transform transition-all duration-300 hover:shadow-pink-500/30">
                {useRealisticBrain ? (
                  <SketchfabBrain
                    width={450}
                    height={400}
                  />
                ) : (
                  <Brain3D
                    width={450}
                    height={400}
                    autoRotate={false}
                  />
                )}
              </div>
            </div>

            {/* Brain Components Legend */}
            <div className="mt-8 w-full max-w-md">
              <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 shadow-xl">
                <h4 className="text-lg font-semibold text-white mb-4 text-center">Brain Anatomy</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/30 transform transition-all duration-300 hover:scale-105 hover:bg-gray-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-300 to-pink-500 rounded-full shadow-lg animate-pulse-slow border-2 border-pink-200"></div>
                    <div>
                      <span className="text-gray-200 font-medium block">Cerebrum (Pink)</span>
                      <span className="text-xs text-gray-400">Main brain - thinking & memory</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/30 transform transition-all duration-300 hover:scale-105 hover:bg-gray-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg animate-pulse-slow animation-delay-1000 border-2 border-yellow-200"></div>
                    <div>
                      <span className="text-gray-200 font-medium block">Cerebellum (Gold)</span>
                      <span className="text-xs text-gray-400">Coordination & balance</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/30 transform transition-all duration-300 hover:scale-105 hover:bg-gray-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full shadow-lg animate-pulse-slow animation-delay-2000 border-2 border-blue-200"></div>
                    <div>
                      <span className="text-gray-200 font-medium block">Brain Stem (Blue)</span>
                      <span className="text-xs text-gray-400">Vital functions control</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/30 transform transition-all duration-300 hover:scale-105 hover:bg-gray-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-full shadow-lg animate-pulse-slow animation-delay-3000 border-2 border-cyan-200"></div>
                    <div>
                      <span className="text-gray-200 font-medium block">Temporal Lobes (Cyan)</span>
                      <span className="text-xs text-gray-400">Memory & language processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tumor Detection Section */}
            {uploadedFile && (
              <div className="mt-8 w-full max-w-md">
                <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 shadow-xl">
                  <h4 className="text-lg font-semibold text-white mb-4 text-center flex items-center justify-center">
                    <span className="mr-2">🧠</span>
                    AI Tumor Detection
                  </h4>

                  {tumorReport ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <span className="text-gray-200">Status:</span>
                        <span className={`font-semibold ${
                          tumorReport.analysis.toLowerCase().includes('tumor detected: yes')
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}>
                          {tumorReport.analysis.toLowerCase().includes('tumor detected: yes')
                            ? '⚠️ Tumor Detected'
                            : '✅ No Tumor Detected'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <span className="text-gray-200">Confidence:</span>
                        <span className="font-semibold text-blue-400">
                          {tumorReport.overallConfidence}%
                        </span>
                      </div>

                      {/* 🔊 Voice Controls */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => speakTumorResult(tumorReport)}
                          disabled={isSpeaking}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                            isSpeaking
                              ? 'bg-yellow-600 text-white cursor-not-allowed animate-pulse'
                              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                              </span>
                              Speaking...
                            </>
                          ) : (
                            <> 🔊 Read Aloud </>
                          )}
                        </button>
                        {isSpeaking && (
                          <button
                            onClick={stopSpeaking}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md"
                          >
                            ⏹ Stop
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => setShowTumorReport(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          📋 View Full Report
                        </button>
                        <button
                          onClick={() => {
                            // Call the PDF generation directly
                            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/generate-pdf-report`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ tumorReport: tumorReport }),
                            })
                            .then(response => response.json())
                            .then(async ({ htmlContent, filename }) => {
                              const { default: jsPDF } = await import('jspdf');
                              const { default: html2canvas } = await import('html2canvas');

                              const tempDiv = document.createElement('div');
                              tempDiv.innerHTML = htmlContent;
                              tempDiv.style.position = 'absolute';
                              tempDiv.style.left = '-9999px';
                              tempDiv.style.width = '800px';
                              document.body.appendChild(tempDiv);

                              const canvas = await html2canvas(tempDiv, {
                                scale: 2,
                                useCORS: true,
                                backgroundColor: '#ffffff'
                              });

                              const imgData = canvas.toDataURL('image/png');
                              const pdf = new jsPDF('p', 'mm', 'a4');
                              const imgWidth = 210;
                              const pageHeight = 295;
                              const imgHeight = (canvas.height * imgWidth) / canvas.width;

                              pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                              document.body.removeChild(tempDiv);
                              pdf.save(filename);
                            })
                            .catch(error => {
                              console.error('PDF download error:', error);
                              alert('Failed to download PDF report');
                            });
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          📄 Download PDF Report
                        </button>
                      </div>
                    </div>
                  ) : isAnalyzingTumor ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                      <p className="text-gray-300 text-sm">Analyzing brain scan...</p>
                      <div className="mt-2 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${tumorAnalysisProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{Math.round(tumorAnalysisProgress)}% complete</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => uploadedFile && startTumorDetection(uploadedFile)}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🔍 Start Tumor Detection
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question & Answer Section */}
        {uploadedFile && (
          <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-8 border border-gray-600/50 shadow-2xl transform transition-all duration-500 hover:shadow-purple-500/20">
              <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">🤖 Ask Medical Questions</h2>
              
              {/* Question Input */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  {/* Mic Button */}
                  <button
                    onClick={startListening}
                    disabled={isListening || askingQuestion}
                    title={isListening ? 'Listening...' : 'Speak your question'}
                    className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                      isListening
                        ? 'bg-red-500 animate-pulse text-white cursor-not-allowed'
                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white'
                    }`}
                  >
                    {isListening ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm6.364 5.636a1 1 0 0 1 1 1 7.364 7.364 0 0 1-6.364 7.29V19h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.074A7.364 7.364 0 0 1 4.636 9.636a1 1 0 0 1 2 0 5.364 5.364 0 0 0 10.728 0 1 1 0 0 1 1-1z"/>
                      </svg>
                    )}
                  </button>

                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder={isListening ? '🎤 Listening... speak now' : 'Ask a question or tap 🎤 to speak...'}
                    className={`flex-1 px-4 py-3 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                      isListening
                        ? 'bg-red-900/30 border-red-500 placeholder-red-300'
                        : 'bg-gray-700 border-gray-600 focus:border-blue-500'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                    disabled={askingQuestion || isListening}
                  />
                  <button
                    onClick={askQuestion}
                    disabled={!newQuestion.trim() || askingQuestion || isListening}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {askingQuestion ? '🤔' : '🚀'} Ask
                  </button>
                </div>
                {isListening && (
                  <p className="mt-2 text-sm text-red-400 animate-pulse flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                    Listening... speak your question clearly
                  </p>
                )}
              </div>

              {/* Suggested Questions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">💡 Suggested Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setNewQuestion(question)}
                      className="text-left p-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions and Answers */}
              {questions.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">📋 Questions & Answers</h3>
                  {questions.map((qa, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                      {/* Question */}
                      <div className="mb-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-blue-400 text-lg">❓</span>
                          <p className="text-white font-medium">{qa.question}</p>
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="ml-6">
                        {qa.loading ? (
                          <div className="flex items-center space-x-2 text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                            <span>Analyzing medical data...</span>
                          </div>
                        ) : qa.answer ? (
                          <div>
                            <div className="flex items-start space-x-3 mb-3">
                              <span className="text-green-400 text-lg">🤖</span>
                              <div className="flex-1">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {qa.answer}
                                </p>
                              </div>
                            </div>

                            {/* 🔊 Answer Voice Controls */}
                            <div className="flex gap-2 mb-3">
                              <button
                                onClick={() =>
                                  speakingAnswerIndex === index
                                    ? stopAnswerSpeaking()
                                    : speakAnswer(qa.answer!, index)
                                }
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 shadow ${
                                  speakingAnswerIndex === index
                                    ? 'bg-yellow-500 text-black animate-pulse'
                                    : 'bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-white'
                                }`}
                              >
                                {speakingAnswerIndex === index ? (
                                  <>
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                                    </span>
                                    ⏹ Stop Reading
                                  </>
                                ) : (
                                  <> 🔊 Read Answer </>
                                )}
                              </button>
                            </div>

                            {/* Sources */}
                            {qa.sources && qa.sources.length > 0 && (
                              <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                                  📚 Sources ({qa.sources.length})
                                </h4>
                                <div className="space-y-2">
                                  {qa.sources.map((source, sourceIndex) => (
                                    <div key={sourceIndex} className="text-xs text-gray-500">
                                      <span className="font-medium">{source.filename}</span>
                                      <span className="ml-2">
                                        (Similarity: {(source.similarity * 100).toFixed(1)}%)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400">
          <p>Powered by Google Gemini AI • Enhanced RAG with DICOM Support • Brain Tumor Detection</p>
        </div>
      </div>

      {/* Tumor Detection Report Modal */}
      {showTumorReport && (
        <TumorDetectionReport
          report={tumorReport}
          isAnalyzing={isAnalyzingTumor}
          progress={tumorAnalysisProgress}
          onClose={() => setShowTumorReport(false)}
        />
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-2xl max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {notificationMessage}
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
