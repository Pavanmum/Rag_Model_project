# 🧠 3D Brain Viewer Frontend

A modern, interactive 3D brain visualization interface inspired by BrainFacts.org, designed for medical MRI analysis and research.

## 🌟 Features

### 🎯 **Interactive 3D Brain Model**
- **Real-time 3D rendering** using Three.js
- **Anatomically accurate brain hemispheres** with realistic coloring
- **Interactive controls**: rotate, zoom, pan with mouse/touch
- **Multiple view modes**: Solid, Wireframe, Points
- **Smooth animations** and transitions

### 🧭 **Brain Region Explorer**
- **Dropdown selector** for different brain regions:
  - Whole Brain
  - Left/Right Cerebral Hemispheres
  - Frontal, Parietal, Temporal, Occipital Lobes
  - Cerebellum
  - Brainstem
- **Dynamic descriptions** for each region
- **Visual highlighting** of selected areas

### 📊 **Comprehensive Scan Analysis**
- **Drag & drop file upload** for DICOM/NIfTI files
- **Real-time processing** with progress indicators
- **Quality assessment** with visual scoring (0-100)
- **Feature extraction** display (40+ quantitative features)
- **Issue detection** with severity indicators
- **Clinical insights** generation

### 🎛️ **Advanced Controls**
- **Opacity slider**: Adjust brain transparency
- **Rotation speed**: Auto-rotation control
- **View controls**: Reset, screenshot, fullscreen
- **Coordinate display**: Real-time 3D position
- **Zoom indicator**: Current zoom level

### 📋 **Smart Information Panels**
- **Tabbed interface**: Description, Analysis, Questions
- **Scan information**: Patient ID, modality, quality
- **Analysis results**: SNR, contrast, resolution
- **Intelligent questions**: Context-aware suggestions

### 🎨 **Modern UI Design**
- **Glassmorphism effects** with backdrop blur
- **Gradient backgrounds** and smooth animations
- **Responsive design** for all screen sizes
- **Accessibility features** and tooltips
- **Professional medical interface** styling

## 🚀 Quick Start

### 1. **Open the Frontend**
```bash
# Option 1: Direct file access
# Open: index.html in browser

# Option 2: Via local server (recommended)
# Use any local server like Live Server, Python's http.server, etc.
```

### 2. **Explore the 3D Brain**
- Use mouse to **rotate** the brain model
- **Scroll** to zoom in/out
- **Right-click + drag** to pan
- Select different **brain regions** from dropdown

### 3. **Upload and Analyze Scans**
- Click **"Upload Scan"** button
- **Drag & drop** DICOM or NIfTI files
- View **comprehensive analysis** results
- Explore **suggested questions**

## 📁 File Structure

```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and animations
├── brain-viewer.js     # 3D brain visualization engine
├── app.js             # Application logic and API integration
└── README.md          # This documentation
```

## 🔧 Technical Details

### **Dependencies**
- **Three.js**: 3D graphics rendering
- **OrbitControls**: Camera movement
- **Font Awesome**: Icons
- **Modern CSS**: Flexbox, Grid, Animations

### **Browser Compatibility**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### **Performance**
- **Optimized rendering** with requestAnimationFrame
- **Efficient geometry** with LOD (Level of Detail)
- **Memory management** with proper disposal
- **Responsive controls** with debouncing

## 🎮 User Interface Guide

### **Header Navigation**
- **Logo**: MRI RAG.ai branding
- **Navigation**: Analysis, Upload, Search, Documentation
- **Actions**: For Researchers, Login buttons

### **Left Sidebar**
- **Brain Regions**: Dropdown selector
- **Scan Information**: Current scan details
- **Analysis Tools**: Upload, Analyze, Compare, Report
- **Visualization Controls**: Opacity, rotation, view mode

### **3D Viewer (Center)**
- **Interactive brain model** with realistic lighting
- **Control buttons**: Reset, screenshot, fullscreen, settings
- **Status indicators**: Coordinates, zoom level
- **Loading animations** during processing

### **Right Panel**
- **Description Tab**: Brain region information
- **Analysis Tab**: Quality scores, features, issues
- **Questions Tab**: AI-generated questions by category

### **Upload Modal**
- **Drag & drop area** with visual feedback
- **File type validation** (DICOM, NIfTI)
- **Progress tracking** with animated bars
- **Error handling** with user-friendly messages

## 🔌 API Integration

### **Endpoints Used**
- `POST /analyze` - Comprehensive scan analysis
- `POST /upload` - File upload and indexing
- `GET /health` - System status check
- `POST /query` - Similar case retrieval
- `GET /search_simple` - Metadata search

### **Data Flow**
1. **File Upload** → Processing → Analysis
2. **Results Display** → Feature extraction → Visualization
3. **Question Generation** → Context analysis → Suggestions
4. **Real-time Updates** → Progress tracking → Completion

## 🎯 Use Cases

### **Medical Researchers**
- **Explore brain anatomy** with interactive 3D models
- **Analyze MRI scans** with comprehensive metrics
- **Compare cases** using similarity search
- **Generate reports** with automated insights

### **Radiologists**
- **Quality assessment** of imaging data
- **Issue detection** with severity classification
- **Educational tool** for anatomy reference
- **Research collaboration** platform

### **Students & Educators**
- **Interactive learning** of brain anatomy
- **Visual exploration** of different regions
- **Understanding MRI analysis** workflows
- **Hands-on experience** with medical imaging

## 🛠️ Customization

### **Styling**
- Modify `styles.css` for custom themes
- Adjust colors in CSS variables
- Change animations and transitions

### **3D Models**
- Replace brain geometry in `brain-viewer.js`
- Add custom brain regions
- Implement different visualization modes

### **Functionality**
- Extend `app.js` for new features
- Add custom analysis tools
- Integrate additional APIs

## 🔍 Troubleshooting

### **Common Issues**
- **3D model not loading**: Check Three.js CDN connection
- **Upload not working**: Verify API server is running
- **Slow performance**: Reduce model complexity
- **Browser compatibility**: Update to latest version

### **Debug Mode**
- Open browser developer tools (F12)
- Check console for error messages
- Monitor network requests
- Verify file paths and permissions

## 🎉 Success Features

✅ **Interactive 3D brain visualization**  
✅ **Real-time scan analysis**  
✅ **Intelligent question generation**  
✅ **Professional medical UI**  
✅ **Responsive design**  
✅ **API integration**  
✅ **File upload with progress**  
✅ **Quality assessment visualization**  
✅ **Issue detection display**  
✅ **Modern animations and effects**  

---

**🧠 Your 3D Brain Viewer is ready for medical imaging research!** 🎯
