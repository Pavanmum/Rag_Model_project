'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface TumorDetectionReportProps {
  report: TumorDetectionReport | null;
  isAnalyzing: boolean;
  progress: number;
  onClose: () => void;
}

export default function TumorDetectionReport({
  report,
  isAnalyzing,
  progress,
  onClose
}: TumorDetectionReportProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence < 30) return 'text-red-400';
    if (confidence < 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence < 30) return 'Low Confidence';
    if (confidence < 60) return 'Moderate Confidence';
    return 'High Confidence';
  };

  const getRiskLevelFromAnalysis = (analysis: string) => {
    const lowerAnalysis = analysis.toLowerCase();
    if (lowerAnalysis.includes('high risk') || lowerAnalysis.includes('malignant')) return 'HIGH';
    if (lowerAnalysis.includes('moderate risk') || lowerAnalysis.includes('suspicious')) return 'MODERATE';
    return 'LOW';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'text-red-500 bg-red-100';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const downloadPDFReport = async () => {
    if (!report) return;

    setIsGeneratingPDF(true);

    try {
      // Call backend to generate HTML content
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/generate-pdf-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tumorReport: report }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF content');
      }

      const { htmlContent, filename } = await response.json();

      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Clean up
      document.body.removeChild(tempDiv);

      // Download the PDF
      pdf.save(filename);

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-600 shadow-2xl">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                  style={{ 
                    transform: `rotate(${progress * 3.6}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-400">{Math.round(progress)}%</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">🧠 Analyzing Brain Scan</h3>
              <p className="text-gray-300">AI is detecting potential tumors...</p>
            </div>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Processing Image Data</span>
                <span className={progress > 20 ? 'text-green-400' : ''}>
                  {progress > 20 ? '✓' : '⏳'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AI Pattern Recognition</span>
                <span className={progress > 50 ? 'text-green-400' : ''}>
                  {progress > 50 ? '✓' : '⏳'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Generating Report</span>
                <span className={progress > 80 ? 'text-green-400' : ''}>
                  {progress > 80 ? '✓' : '⏳'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const riskLevel = getRiskLevelFromAnalysis(report.analysis);
  const tumorDetected = report.analysis.toLowerCase().includes('tumor detected: yes') || 
                       report.analysis.toLowerCase().includes('tumor: detected');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full border border-gray-600 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🧠</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Brain Tumor Detection Report</h2>
              <p className="text-gray-400 text-sm">{report.filename}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDFReport}
              disabled={isGeneratingPDF}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Detection Status */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Detection Status</span>
                <span className={`text-2xl ${tumorDetected ? '🔴' : '🟢'}`}>
                  {tumorDetected ? '⚠️' : '✅'}
                </span>
              </div>
              <div className="text-lg font-bold text-white">
                {tumorDetected ? 'Tumor Detected' : 'No Tumor Detected'}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getRiskColor(riskLevel)}`}>
                {riskLevel} Risk
              </div>
            </div>

            {/* Confidence Score */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">AI Confidence</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className={`text-2xl font-bold ${getConfidenceColor(report.overallConfidence)}`}>
                {report.overallConfidence}%
              </div>
              <div className="text-xs text-gray-400">
                {getConfidenceLabel(report.overallConfidence)}
              </div>
            </div>

            {/* Processing Time */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Analysis Time</span>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {report.processingTime}s
              </div>
              <div className="text-xs text-gray-400">Processing Duration</div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="bg-gray-700/30 rounded-lg p-6 mb-6 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Detailed Medical Analysis
            </h3>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {report.analysis}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-700/30 rounded-lg p-6 mb-6 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📈</span>
              AI Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{report.metrics.sensitivity}%</div>
                <div className="text-xs text-gray-400">Sensitivity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{report.metrics.specificity}%</div>
                <div className="text-xs text-gray-400">Specificity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{report.metrics.accuracy}%</div>
                <div className="text-xs text-gray-400">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{report.metrics.processingTime}s</div>
                <div className="text-xs text-gray-400">Processing</div>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-gray-700/30 rounded-lg p-6 mb-6 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">⚠️</span>
              Risk Factors Considered
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.riskFactors.map((factor, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-600 text-gray-200 rounded-full text-sm"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">Important Disclaimer</h4>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  {report.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600 bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Powered by {report.aiProvider}</span>
            <span>Generated: {new Date(report.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
