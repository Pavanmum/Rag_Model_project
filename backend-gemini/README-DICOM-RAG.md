# Enhanced RAG Backend with DICOM Support

A powerful backend system that combines Retrieval-Augmented Generation (RAG) with medical imaging capabilities, supporting both PDF documents and DICOM files with Google Gemini AI integration.

## 🚀 Features

### Core Capabilities
- **DICOM File Processing**: Upload, parse, and analyze medical imaging files
- **PDF Document Processing**: Traditional document upload and analysis
- **Data Compression**: Automatic compression of DICOM data for efficient storage
- **Medical RAG**: Specialized medical question-answering with context awareness
- **Vector Search**: Semantic similarity search using Gemini embeddings
- **MongoDB Storage**: Scalable document and metadata storage

### Medical Imaging Features
- **DICOM Metadata Extraction**: Patient info, study details, technical parameters
- **Medical Analysis**: AI-powered analysis of imaging studies
- **Compression**: Efficient storage of large DICOM files
- **Multi-modal Support**: Handle various DICOM modalities (MRI, CT, X-Ray, etc.)

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB Atlas account or local MongoDB instance
- Google Gemini API key
- Test DICOM files (optional, for testing)

## 🛠️ Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend-gemini
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DATABASE=mri_rag_system
   PORT=3002
   ```

## 🚀 Usage

### Start the Enhanced Server
```bash
npm run dicom
```

The server will start on `http://localhost:3002` with the following endpoints:

### API Endpoints

#### File Upload
- **POST** `/upload` - Upload DICOM or PDF files
  ```bash
  curl -X POST -F "file=@scan.dcm" http://localhost:3002/upload
  ```

#### Medical RAG
- **POST** `/ask` - Ask medical questions with context
  ```json
  {
    "question": "What type of imaging study is this?",
    "documentId": "optional-document-id",
    "includeContext": true
  }
  ```

#### Document Management
- **GET** `/documents` - List all processed documents
- **DELETE** `/documents/:documentId` - Delete document and chunks

#### DICOM Management
- **GET** `/dicom` - List all DICOM files
- **GET** `/dicom/:dicomId` - Get specific DICOM file
- **POST** `/analyze-dicom/:dicomId` - AI analysis of DICOM file
- **DELETE** `/dicom/:dicomId` - Delete DICOM file

#### System
- **GET** `/health` - Health check and system status

## 🧪 Testing

### Run DICOM Upload Test
```bash
npm run test-dicom
```

This will test:
- DICOM file upload and processing
- Medical metadata extraction
- RAG-based medical question answering
- Document management
- AI-powered medical analysis

### Manual Testing with cURL

1. **Upload a DICOM file**:
   ```bash
   curl -X POST -F "file=@test_brain.dcm" http://localhost:3002/upload
   ```

2. **Ask a medical question**:
   ```bash
   curl -X POST http://localhost:3002/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "What imaging modality was used in this study?"}'
   ```

3. **Get DICOM files list**:
   ```bash
   curl http://localhost:3002/dicom
   ```

## 📊 Database Schema

### Documents Collection
```javascript
{
  documentId: "uuid",
  filename: "scan.dcm",
  fileType: "DICOM",
  content: "extracted medical text",
  embedding: [0.1, 0.2, ...], // Gemini embeddings
  chunkIndex: 0,
  totalChunks: 5,
  metadata: {
    patientId: "12345",
    modality: "MRI",
    bodyPart: "BRAIN",
    studyDate: "20241028",
    // ... other DICOM metadata
  }
}
```

### DICOM Collection
```javascript
{
  dicomId: "uuid",
  filename: "scan.dcm",
  metadata: {
    patientId: "12345",
    patientName: "DOE^JOHN",
    modality: "MRI",
    bodyPart: "BRAIN",
    studyDate: "20241028",
    rows: 512,
    columns: 512,
    // ... complete DICOM metadata
  },
  compressedDicomData: Buffer, // Compressed DICOM file
  compressedPixelData: Buffer, // Compressed pixel data
  fileSize: 1048576,
  uploadedAt: Date,
  processedAt: Date
}
```

## 🔧 Configuration Options

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DATABASE`: Database name (default: mri_rag_system)
- `PORT`: Server port (default: 3002)
- `MAX_FILE_SIZE_MB`: Maximum file size (default: 100MB)
- `ENABLE_DICOM_COMPRESSION`: Enable DICOM compression (default: true)

### File Upload Limits
- Maximum file size: 100MB
- Supported formats: DICOM (.dcm, .dicom), PDF (.pdf)
- Automatic compression for DICOM files

## 🏥 Medical Use Cases

1. **Radiology Report Analysis**: Upload DICOM files and ask questions about imaging findings
2. **Study Comparison**: Compare multiple imaging studies using natural language queries
3. **Technical Parameter Review**: Query imaging parameters and acquisition settings
4. **Patient Data Extraction**: Extract and analyze patient information from DICOM metadata
5. **Quality Assurance**: Automated analysis of imaging study quality and completeness

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- File type validation
- Helmet.js security headers
- CORS protection
- Input sanitization
- Compressed data storage

## 📈 Performance Optimizations

- **Compression**: DICOM files compressed using gzip
- **Chunking**: Large documents split into manageable chunks
- **Indexing**: MongoDB indexes for fast queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Response compression with gzip

## 🐛 Troubleshooting

### Common Issues

1. **DICOM Upload Fails**:
   - Check file format (.dcm or .dicom extension)
   - Verify file size is under 100MB
   - Ensure DICOM file is valid

2. **MongoDB Connection Issues**:
   - Verify MONGODB_URI in .env
   - Check network connectivity
   - Ensure database exists

3. **Gemini API Errors**:
   - Verify GEMINI_API_KEY is correct
   - Check API quota and billing
   - Ensure model names are correct

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
