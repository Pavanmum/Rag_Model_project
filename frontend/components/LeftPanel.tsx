'use client';

import { Upload, Search, Scale, FileText } from 'lucide-react';

interface BrainRegion {
  value: string;
  label: string;
}

interface ScanData {
  medical_metadata?: {
    patient?: { id: string };
    series?: { modality: string };
  };
  quality_assessment?: {
    quality_grade: string;
    quality_score: number;
  };
  feature_analysis?: {
    statistics?: {
      total_features: number;
    };
  };
}

interface LeftPanelProps {
  selectedRegion: string;
  brainRegions: BrainRegion[];
  onRegionChange: (region: string) => void;
  onUploadClick: () => void;
  onAnalyzeClick: () => void;
  scanData: ScanData | null;
}

export default function LeftPanel({
  selectedRegion,
  brainRegions,
  onRegionChange,
  onUploadClick,
  onAnalyzeClick,
  scanData
}: LeftPanelProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg h-fit space-y-6">
      
      {/* Brain Regions Section */}
      <div>
        <h3 className="text-gray-800 mb-3 text-base font-semibold">Brain Regions</h3>
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {brainRegions.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {/* Scan Information Section */}
      <div>
        <h3 className="text-gray-800 mb-3 text-base font-semibold">Scan Information</h3>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Patient ID:</span>
            <span className="text-gray-800 font-semibold">
              {scanData?.medical_metadata?.patient?.id || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Modality:</span>
            <span className="text-gray-800 font-semibold">
              {scanData?.medical_metadata?.series?.modality || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Quality:</span>
            <span className="text-gray-800 font-semibold">
              {scanData?.quality_assessment?.quality_grade || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Features:</span>
            <span className="text-gray-800 font-semibold">
              {scanData?.feature_analysis?.statistics?.total_features || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Analysis Tools Section */}
      <div>
        <h3 className="text-gray-800 mb-3 text-base font-semibold">Analysis Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUploadClick}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex flex-col items-center space-y-1 text-xs font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Scan</span>
          </button>
          
          <button
            onClick={onAnalyzeClick}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex flex-col items-center space-y-1 text-xs font-medium"
          >
            <Search className="w-4 h-4" />
            <span>Analyze</span>
          </button>
          
          <button className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex flex-col items-center space-y-1 text-xs font-medium">
            <Scale className="w-4 h-4" />
            <span>Compare</span>
          </button>
          
          <button className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex flex-col items-center space-y-1 text-xs font-medium">
            <FileText className="w-4 h-4" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Visualization Controls Section */}
      <div>
        <h3 className="text-gray-800 mb-3 text-base font-semibold">Visualization Controls</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Opacity
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="100"
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* Quality Score Display (if scan data available) */}
      {scanData?.quality_assessment && (
        <div>
          <h3 className="text-gray-800 mb-3 text-base font-semibold">Quality Score</h3>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16">
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
                    strokeDasharray={`${scanData.quality_assessment.quality_score}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">
                      {Math.round(scanData.quality_assessment.quality_score)}
                    </div>
                    <div className="text-xs text-gray-500">/100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-medium text-gray-700">
                Quality: {scanData.quality_assessment.quality_grade}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
