'use client';

interface ScanData {
  quality_assessment?: {
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

interface RightPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedRegion: string;
  scanData: ScanData | null;
}

export default function RightPanel({
  activeTab,
  onTabChange,
  selectedRegion,
  scanData
}: RightPanelProps) {
  
  const getRegionDescription = (region: string) => {
    const descriptions: Record<string, { title: string; description: string; features: string[] }> = {
      'whole': {
        title: 'Whole Brain',
        description: 'The human brain is divided into two nearly symmetric hemispheres, which are joined by a thick bridge of white tissue called the corpus callosum. Each hemisphere is comprised of four lobes containing discrete regions that carry out specific functions.',
        features: [
          'Cerebral cortex with distinct functional areas',
          'White matter connecting different regions',
          'Subcortical structures for motor and cognitive control',
          'Specialized areas for language, memory, and sensory processing'
        ]
      },
      'left-hemisphere': {
        title: 'Left Cerebral Hemisphere',
        description: 'The left cerebral hemisphere is typically dominant for language processing and analytical thinking. It contains critical areas for speech production and comprehension.',
        features: [
          'Broca\'s area for speech production',
          'Wernicke\'s area for language comprehension',
          'Primary motor cortex for right-side body control',
          'Analytical and logical processing centers'
        ]
      },
      'right-hemisphere': {
        title: 'Right Cerebral Hemisphere',
        description: 'The right cerebral hemisphere is associated with spatial processing, creativity, and visual-spatial skills. It plays a crucial role in artistic and intuitive thinking.',
        features: [
          'Spatial awareness and navigation',
          'Creative and artistic processing',
          'Visual-spatial skills',
          'Emotional processing and recognition'
        ]
      },
      'frontal': {
        title: 'Frontal Lobe',
        description: 'The frontal lobe is responsible for executive functions, motor control, and personality. It houses the primary motor cortex and prefrontal cortex.',
        features: [
          'Executive function and decision making',
          'Motor planning and control',
          'Personality and behavior regulation',
          'Working memory and attention'
        ]
      },
      'parietal': {
        title: 'Parietal Lobe',
        description: 'The parietal lobe processes sensory information and spatial awareness. It integrates information from different sensory modalities.',
        features: [
          'Somatosensory processing',
          'Spatial awareness and navigation',
          'Integration of sensory information',
          'Attention and consciousness'
        ]
      },
      'temporal': {
        title: 'Temporal Lobe',
        description: 'The temporal lobe is crucial for auditory processing, memory formation, and language comprehension. It contains the hippocampus and auditory cortex.',
        features: [
          'Auditory processing and hearing',
          'Memory formation and retrieval',
          'Language comprehension',
          'Emotional processing (amygdala)'
        ]
      },
      'occipital': {
        title: 'Occipital Lobe',
        description: 'The occipital lobe is the primary visual processing center of the brain. It receives and processes visual information from the eyes.',
        features: [
          'Primary visual cortex',
          'Visual processing and interpretation',
          'Color and motion detection',
          'Visual pattern recognition'
        ]
      },
      'cerebellum': {
        title: 'Cerebellum',
        description: 'The cerebellum coordinates movement, balance, and motor learning. It also plays a role in cognitive functions and language processing.',
        features: [
          'Motor coordination and balance',
          'Motor learning and adaptation',
          'Cognitive function support',
          'Language processing assistance'
        ]
      },
      'brainstem': {
        title: 'Brainstem',
        description: 'The brainstem controls vital functions like breathing, heart rate, and consciousness. It connects the brain to the spinal cord.',
        features: [
          'Vital function control (breathing, heart rate)',
          'Sleep-wake cycle regulation',
          'Reflexes and basic motor functions',
          'Cranial nerve nuclei'
        ]
      }
    };

    return descriptions[region] || descriptions['whole'];
  };

  const regionInfo = getRegionDescription(selectedRegion);

  const categorizeQuestions = (questions: string[] = []) => {
    const basic = questions.slice(0, 4);
    const clinical = questions.slice(4, 8);
    const technical = questions.slice(8);
    return { basic, clinical, technical };
  };

  const { basic, clinical, technical } = categorizeQuestions(scanData?.suggested_queries);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg h-fit">
      
      {/* Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {[
          { id: 'description', label: 'Description' },
          { id: 'analysis', label: 'Analysis' },
          { id: 'questions', label: 'Questions' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-indigo-600 bg-white border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 min-h-[400px]">
        
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {regionInfo.title}
            </h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p className="text-sm">
                {regionInfo.description}
              </p>
              
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Key Features:</h4>
                <ul className="space-y-1 text-sm">
                  {regionInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-600 mr-2">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan Analysis</h3>
            
            {scanData ? (
              <>
                {/* Quality Assessment */}
                {scanData.quality_assessment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Quality Assessment</h4>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
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
                            <div className="text-sm font-bold text-gray-800">
                              {Math.round(scanData.quality_assessment.quality_score)}
                            </div>
                            <div className="text-xs text-gray-500">/100</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">SNR:</span>
                          <span className="font-semibold text-gray-800">
                            {scanData.quality_assessment.snr?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Contrast:</span>
                          <span className="font-semibold text-gray-800">
                            {scanData.quality_assessment.contrast?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Resolution:</span>
                          <span className="font-semibold text-gray-800">
                            {scanData.image_properties?.dimensions?.join('x') || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature Analysis */}
                {scanData.feature_analysis?.statistics && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Feature Analysis</h4>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 mb-1">
                        {scanData.feature_analysis.statistics.total_features}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">Total Features</div>
                      
                      <div className="flex justify-between text-center">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Statistical</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {scanData.feature_analysis.statistics.statistical_features || 0}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Shape</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {scanData.feature_analysis.statistics.shape_features || 0}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Texture</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {scanData.feature_analysis.statistics.texture_features || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Detected Issues</h4>
                  {scanData.potential_issues && scanData.potential_issues.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {scanData.potential_issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`flex items-start space-x-2 p-2 bg-white rounded text-xs border-l-3 ${
                            issue.severity === 'high' ? 'border-red-400' :
                            issue.severity === 'medium' ? 'border-yellow-400' : 'border-green-400'
                          }`}
                        >
                          <span className="text-sm">
                            {issue.severity === 'high' ? '🔴' : 
                             issue.severity === 'medium' ? '🟡' : '🟢'}
                          </span>
                          <span className="text-gray-700">{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-4">
                      ✅ No issues detected
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm">Upload a scan to see analysis results</p>
              </div>
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Suggested Questions</h3>
            
            {scanData?.suggested_queries ? (
              <>
                {basic.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Basic Questions</h4>
                    <div className="space-y-1">
                      {basic.map((question, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded border-l-3 border-indigo-500 cursor-pointer hover:bg-gray-100 transition-colors text-sm text-gray-700 leading-relaxed"
                          onClick={() => alert(`Question: ${question}\n\nThis would integrate with an AI assistant.`)}
                        >
                          {question}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {clinical.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Clinical Questions</h4>
                    <div className="space-y-1">
                      {clinical.map((question, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded border-l-3 border-indigo-500 cursor-pointer hover:bg-gray-100 transition-colors text-sm text-gray-700 leading-relaxed"
                          onClick={() => alert(`Question: ${question}\n\nThis would integrate with an AI assistant.`)}
                        >
                          {question}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {technical.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Technical Questions</h4>
                    <div className="space-y-1">
                      {technical.map((question, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded border-l-3 border-indigo-500 cursor-pointer hover:bg-gray-100 transition-colors text-sm text-gray-700 leading-relaxed"
                          onClick={() => alert(`Question: ${question}\n\nThis would integrate with an AI assistant.`)}
                        >
                          {question}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">❓</div>
                <p className="text-sm">Upload and analyze a scan to see suggested questions</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
