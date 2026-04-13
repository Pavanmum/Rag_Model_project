'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Info, 
  Settings, 
  Maximize, 
  Upload, 
  Search, 
  Scale, 
  FileText,
  Brain,
  X
} from 'lucide-react';

// Components
import BrainViewer3D from '../../components/BrainViewer3D';
import LeftPanel from '../../components/LeftPanel';
import RightPanel from '../../components/RightPanel';
import UploadModal from '../../components/UploadModal';

interface ScanData {
  medical_metadata?: {
    patient?: { id: string };
    series?: { modality: string };
  };
  quality_assessment?: {
    quality_grade: string;
    quality_score: number;
    snr: number;
    contrast: number;
  };
  feature_analysis?: {
    statistics?: {
      total_features: number;
      statistical_features: number;
      shape_features: number;
      texture_features: number;
    };
  };
  image_properties?: {
    dimensions: number[];
  };
  potential_issues?: Array<{
    message: string;
    severity: string;
  }>;
  suggested_queries?: string[];
}

export default function BrainViewerPage() {
  const [selectedRegion, setSelectedRegion] = useState('whole');
  const [activeTab, setActiveTab] = useState('description');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentScanData, setCurrentScanData] = useState<ScanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const brainViewerRef = useRef<any>(null);

  const brainRegions = [
    { value: 'whole', label: 'Whole Brain' },
    { value: 'left-hemisphere', label: 'Left Cerebral Hemisphere' },
    { value: 'right-hemisphere', label: 'Right Cerebral Hemisphere' },
    { value: 'frontal', label: 'Frontal Lobe' },
    { value: 'parietal', label: 'Parietal Lobe' },
    { value: 'temporal', label: 'Temporal Lobe' },
    { value: 'occipital', label: 'Occipital Lobe' },
    { value: 'cerebellum', label: 'Cerebellum' },
    { value: 'brainstem', label: 'Brainstem' },
  ];

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    if (brainViewerRef.current) {
      brainViewerRef.current.highlightRegion(region);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    setShowUploadModal(false);

    try {
      // Analyze the scan
      const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }

      const analysisResult = await analyzeResponse.json();
      setCurrentScanData(analysisResult);
      setActiveTab('analysis');

      // Also upload for indexing
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('metadata', JSON.stringify({
        patient_id: analysisResult.medical_metadata?.patient?.id || 'Unknown',
        modality: analysisResult.medical_metadata?.series?.modality || 'Unknown'
      }));

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload`, {
        method: 'POST',
        body: uploadFormData
      });

      if (uploadResponse.ok) {
        console.log('Upload successful');
      }

    } catch (error) {
      console.error('Upload/Analysis error:', error);
      alert('Failed to analyze scan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleControlAction = (action: string) => {
    if (!brainViewerRef.current) return;

    switch (action) {
      case 'reset':
        brainViewerRef.current.resetView();
        break;
      case 'screenshot':
        brainViewerRef.current.takeScreenshot();
        break;
      case 'fullscreen':
        const viewer = document.getElementById('brain-viewer-container');
        if (viewer) {
          if (!document.fullscreenElement) {
            viewer.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }
        break;
    }
  };

  const getCurrentRegionLabel = () => {
    const region = brainRegions.find(r => r.value === selectedRegion);
    return region ? region.label : 'Whole Brain';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-white/20 fixed top-0 left-0 right-0 z-50 h-15">
        <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl mr-2">🧠</div>
            <span className="text-xl font-semibold text-gray-700">
              MRI<strong className="text-indigo-600">RAG</strong>.ai
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#analysis" className="text-gray-600 hover:text-indigo-600 font-medium">Analysis</a>
            <a href="#upload" className="text-gray-600 hover:text-indigo-600 font-medium">Upload</a>
            <a href="#search" className="text-gray-600 hover:text-indigo-600 font-medium">Search</a>
            <a href="#docs" className="text-gray-600 hover:text-indigo-600 font-medium">Documentation</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>For Researchers</span>
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2">
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-5 px-5 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_350px] gap-5 min-h-[calc(100vh-120px)]">
          
          {/* Left Panel */}
          <LeftPanel
            selectedRegion={selectedRegion}
            brainRegions={brainRegions}
            onRegionChange={handleRegionChange}
            onUploadClick={() => setShowUploadModal(true)}
            onAnalyzeClick={() => setActiveTab('analysis')}
            scanData={currentScanData}
          />

          {/* Center Panel - Brain Viewer */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{getCurrentRegionLabel()}</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleControlAction('reset')}
                  className="w-8 h-8 bg-white/20 rounded hover:bg-white/30 flex items-center justify-center"
                  title="Reset View"
                >
                  <Home className="w-4 h-4" />
                </button>
                <button 
                  className="w-8 h-8 bg-white/20 rounded hover:bg-white/30 flex items-center justify-center"
                  title="Info"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button 
                  className="w-8 h-8 bg-white/20 rounded hover:bg-white/30 flex items-center justify-center"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleControlAction('fullscreen')}
                  className="w-8 h-8 bg-white/20 rounded hover:bg-white/30 flex items-center justify-center"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div id="brain-viewer-container" className="flex-1 bg-gray-900 relative min-h-[500px]">
              <BrainViewer3D 
                ref={brainViewerRef}
                selectedRegion={selectedRegion}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right Panel */}
          <RightPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedRegion={selectedRegion}
            scanData={currentScanData}
          />
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
}
