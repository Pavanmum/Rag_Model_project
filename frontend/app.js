/**
 * Main Application Logic for MRI RAG System Frontend
 */

class MRIApp {
    constructor() {
        this.brainViewer = null;
        this.currentScanData = null;
        this.apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
        
        this.init();
    }

    init() {
        // Initialize 3D brain viewer
        this.brainViewer = new BrainViewer('brain-viewer');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadSystemHealth();
        
        console.log('MRI RAG System initialized');
    }

    setupEventListeners() {
        // Brain region selector
        document.getElementById('brain-region').addEventListener('change', (e) => {
            this.selectBrainRegion(e.target.value);
        });

        // Control sliders
        document.getElementById('opacity-slider').addEventListener('input', (e) => {
            this.brainViewer.setOpacity(e.target.value);
        });

        document.getElementById('rotation-slider').addEventListener('input', (e) => {
            this.brainViewer.setRotationSpeed(e.target.value);
        });

        document.getElementById('view-mode').addEventListener('change', (e) => {
            this.brainViewer.setViewMode(e.target.value);
        });

        // Viewer controls
        document.getElementById('reset-view').addEventListener('click', () => {
            this.brainViewer.resetView();
        });

        document.getElementById('screenshot').addEventListener('click', () => {
            this.brainViewer.takeScreenshot();
        });

        document.getElementById('fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Tool buttons
        document.getElementById('upload-btn').addEventListener('click', () => {
            this.showUploadModal();
        });

        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzeCurrentScan();
        });

        document.getElementById('compare-btn').addEventListener('click', () => {
            this.compareScan();
        });

        document.getElementById('report-btn').addEventListener('click', () => {
            this.generateReport();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Upload modal
        document.getElementById('close-upload').addEventListener('click', () => {
            this.hideUploadModal();
        });

        // File upload
        this.setupFileUpload();
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFileUpload(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    async handleFileUpload(files) {
        if (files.length === 0) return;

        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);

        // Show progress
        this.showUploadProgress();

        try {
            // First, analyze the scan
            const analyzeResponse = await fetch(`${this.apiBaseUrl}/analyze`, {
                method: 'POST',
                body: formData
            });

            if (!analyzeResponse.ok) {
                throw new Error('Analysis failed');
            }

            const analysisResult = await analyzeResponse.json();
            
            // Update UI with analysis results
            this.updateAnalysisResults(analysisResult);
            
            // Also upload for indexing
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('metadata', JSON.stringify({
                patient_id: analysisResult.medical_metadata?.patient?.id || 'Unknown',
                modality: analysisResult.medical_metadata?.series?.modality || 'Unknown'
            }));

            const uploadResponse = await fetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                body: uploadFormData
            });

            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                console.log('Upload successful:', uploadResult);
            }

            this.hideUploadModal();
            this.showSuccessMessage('Scan analyzed successfully!');

        } catch (error) {
            console.error('Upload/Analysis error:', error);
            this.showErrorMessage('Failed to analyze scan. Please try again.');
        } finally {
            this.hideUploadProgress();
        }
    }

    updateAnalysisResults(analysisResult) {
        this.currentScanData = analysisResult;

        // Update scan info
        this.updateScanInfo(analysisResult);
        
        // Update analysis tab
        this.updateAnalysisTab(analysisResult);
        
        // Update questions tab
        this.updateQuestionsTab(analysisResult);

        // Switch to analysis tab
        this.switchTab('analysis');
    }

    updateScanInfo(data) {
        const scanInfo = document.getElementById('scan-info');
        const patientId = data.medical_metadata?.patient?.id || 'Unknown';
        const modality = data.medical_metadata?.series?.modality || 'Unknown';
        const quality = data.quality_assessment?.quality_grade || 'Unknown';
        const features = data.feature_analysis?.statistics?.total_features || 0;

        scanInfo.innerHTML = `
            <div class="info-item">
                <span class="label">Patient ID:</span>
                <span class="value">${patientId}</span>
            </div>
            <div class="info-item">
                <span class="label">Modality:</span>
                <span class="value">${modality}</span>
            </div>
            <div class="info-item">
                <span class="label">Quality:</span>
                <span class="value">${quality}</span>
            </div>
            <div class="info-item">
                <span class="label">Features:</span>
                <span class="value">${features}</span>
            </div>
        `;
    }

    updateAnalysisTab(data) {
        // Update quality score
        const score = data.quality_assessment?.quality_score || 0;
        const scoreElement = document.querySelector('.score');
        if (scoreElement) {
            scoreElement.textContent = Math.round(score);
        }

        // Update quality circle
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            const percentage = (score / 100) * 360;
            scoreCircle.style.background = `conic-gradient(#667eea ${percentage}deg, #e2e8f0 ${percentage}deg)`;
        }

        // Update quality details
        document.getElementById('snr-value').textContent = 
            data.quality_assessment?.snr?.toFixed(2) || 'N/A';
        document.getElementById('contrast-value').textContent = 
            data.quality_assessment?.contrast?.toFixed(2) || 'N/A';
        document.getElementById('resolution-value').textContent = 
            `${data.image_properties?.dimensions?.join('x') || 'N/A'}`;

        // Update feature analysis
        const stats = data.feature_analysis?.statistics || {};
        document.getElementById('total-features').textContent = stats.total_features || 0;
        document.getElementById('stat-features').textContent = stats.statistical_features || 0;
        document.getElementById('shape-features').textContent = stats.shape_features || 0;
        document.getElementById('texture-features').textContent = stats.texture_features || 0;

        // Update issues
        this.updateIssuesList(data.potential_issues || []);
    }

    updateIssuesList(issues) {
        const issuesList = document.getElementById('issues-list');
        
        if (issues.length === 0) {
            issuesList.innerHTML = '<p class="no-issues">✅ No issues detected</p>';
            return;
        }

        issuesList.innerHTML = issues.map(issue => {
            const severity = issue.severity || 'low';
            const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
            
            return `
                <div class="issue-item ${severity}">
                    <span class="issue-icon">${icon}</span>
                    <span class="issue-text">${issue.message || 'Unknown issue'}</span>
                </div>
            `;
        }).join('');
    }

    updateQuestionsTab(data) {
        const questions = data.suggested_queries || [];
        
        // Categorize questions
        const basicQuestions = questions.slice(0, 4);
        const clinicalQuestions = questions.slice(4, 8);
        const technicalQuestions = questions.slice(8);

        this.updateQuestionCategory('basic-questions', basicQuestions);
        this.updateQuestionCategory('clinical-questions', clinicalQuestions);
        this.updateQuestionCategory('technical-questions', technicalQuestions);
    }

    updateQuestionCategory(elementId, questions) {
        const container = document.getElementById(elementId);
        
        if (questions.length === 0) {
            container.innerHTML = '<p>No questions available</p>';
            return;
        }

        container.innerHTML = questions.map(question => `
            <div class="question-item" onclick="app.askQuestion('${question}')">
                ${question}
            </div>
        `).join('');
    }

    askQuestion(question) {
        // This would integrate with a chatbot or Q&A system
        console.log('Asking question:', question);
        alert(`Question: ${question}\n\nThis would integrate with an AI assistant to provide detailed answers about the scan.`);
    }

    selectBrainRegion(region) {
        document.getElementById('region-title').textContent = 
            region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Update description based on region
        this.updateRegionDescription(region);
        
        // Highlight region in 3D viewer
        this.brainViewer.highlightRegion(region);
    }

    updateRegionDescription(region) {
        const descriptions = {
            'whole': 'The human brain is divided into two nearly symmetric hemispheres, which are joined by a thick bridge of white tissue called the corpus callosum.',
            'left-hemisphere': 'The left cerebral hemisphere is typically dominant for language processing and analytical thinking.',
            'right-hemisphere': 'The right cerebral hemisphere is associated with spatial processing, creativity, and visual-spatial skills.',
            'frontal': 'The frontal lobe is responsible for executive functions, motor control, and personality.',
            'parietal': 'The parietal lobe processes sensory information and spatial awareness.',
            'temporal': 'The temporal lobe is crucial for auditory processing, memory, and language comprehension.',
            'occipital': 'The occipital lobe is the primary visual processing center of the brain.',
            'cerebellum': 'The cerebellum coordinates movement, balance, and motor learning.',
            'brainstem': 'The brainstem controls vital functions like breathing, heart rate, and consciousness.'
        };

        document.getElementById('region-description').innerHTML = `
            <p>${descriptions[region] || 'Select a brain region to see its description.'}</p>
        `;
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active class to selected tab and pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    showUploadModal() {
        document.getElementById('upload-modal').style.display = 'block';
    }

    hideUploadModal() {
        document.getElementById('upload-modal').style.display = 'none';
    }

    showUploadProgress() {
        document.getElementById('upload-area').style.display = 'none';
        document.getElementById('upload-progress').style.display = 'block';
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            document.getElementById('progress-fill').style.width = `${progress}%`;
        }, 200);
    }

    hideUploadProgress() {
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('upload-progress').style.display = 'none';
        document.getElementById('progress-fill').style.width = '0%';
    }

    toggleFullscreen() {
        const viewer = document.getElementById('brain-viewer');
        if (!document.fullscreenElement) {
            viewer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    async loadSystemHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const health = await response.json();
            console.log('System health:', health);
        } catch (error) {
            console.error('Failed to load system health:', error);
        }
    }

    analyzeCurrentScan() {
        if (!this.currentScanData) {
            this.showErrorMessage('No scan loaded. Please upload a scan first.');
            return;
        }
        
        this.switchTab('analysis');
        this.showSuccessMessage('Analysis results are already displayed.');
    }

    compareScan() {
        this.showErrorMessage('Compare functionality coming soon!');
    }

    generateReport() {
        if (!this.currentScanData) {
            this.showErrorMessage('No scan data available for report generation.');
            return;
        }
        
        this.showSuccessMessage('Report generation feature coming soon!');
    }

    showSuccessMessage(message) {
        // Simple alert for now - could be replaced with a toast notification
        alert(`✅ ${message}`);
    }

    showErrorMessage(message) {
        // Simple alert for now - could be replaced with a toast notification
        alert(`❌ ${message}`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MRIApp();
});

// Export for global access
window.MRIApp = MRIApp;
