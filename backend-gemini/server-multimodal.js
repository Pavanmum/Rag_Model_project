const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const exifr = require('exifr');
const { fileTypeFromBuffer } = require('file-type');
const mime = require('mime-types');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MongoDB connection
let db, documentsCollection;
const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    db = client.db(process.env.MONGODB_DATABASE);
    documentsCollection = db.collection('documents');

    // Create indexes if they don't exist
    await createIndexes();

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Create database indexes
async function createIndexes() {
  try {
    // Compound index for document queries
    await documentsCollection.createIndex({
      documentId: 1,
      chunkIndex: 1
    });

    // Index for file type queries
    await documentsCollection.createIndex({ fileType: 1 });

    // Index for filename searches
    await documentsCollection.createIndex({ filename: 1 });

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Supported file types
const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/bmp': 'image'
};

// Configure multer for multi-modal file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_FILE_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Supported types: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`), false);
    }
  }
});

// Helper function to chunk text
function chunkText(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  const words = text.split(' ');

  for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
    const chunk = words.slice(i, i + maxChunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

// Cosine similarity function
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to generate content with retry logic
async function generateContentWithRetry(model, prompt, retries = 3, initialDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if ((error.message.includes('429') || error.status === 429) && i < retries - 1) {
        let delay = initialDelay * Math.pow(2, i);
        const match = error.message.match(/Please retry in ([0-9.]+)s/);
        if (match && match[1]) {
          delay = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
        }
        console.log(`Hit rate limit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  return await model.generateContent(prompt);
}

// Helper function to embed content with retry logic
async function embedContentWithRetry(model, text, retries = 3, initialDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.embedContent(text);
    } catch (error) {
      if ((error.message.includes('429') || error.status === 429) && i < retries - 1) {
        let delay = initialDelay * Math.pow(2, i);
        const match = error.message.match(/Please retry in ([0-9.]+)s/);
        if (match && match[1]) {
          delay = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
        }
        console.log(`Hit rate limit (embedding). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  return await model.embedContent(text);
}

// Generate embedding using Gemini
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.EMBEDDING_MODEL || "gemini-embedding-001" });
    const result = await embedContentWithRetry(model, text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Process PDF files
async function processPDF(buffer, filename) {
  try {
    console.log(`Processing PDF: ${filename}`);
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length < 50) {
      console.log('PDF appears to be scanned or has minimal text, attempting OCR...');
      // For scanned PDFs, we could implement OCR here
      // For now, we'll use the extracted text even if minimal
    }

    return {
      content: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info,
        processingMethod: 'pdf-parse'
      }
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

// Process image files with Gemini Vision API
async function processImage(buffer, filename, mimeType) {
  try {
    console.log(`Processing image: ${filename}`);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    let exifData = {};

    try {
      exifData = await exifr.parse(buffer) || {};
    } catch (exifError) {
      console.log('No EXIF data found or error parsing EXIF');
    }

    // Convert image to base64 for Gemini Vision API
    const base64Image = buffer.toString('base64');

    // Use Gemini Vision API to analyze the image
    const model = genAI.getGenerativeModel({ model: process.env.CHAT_MODEL || "gemini-2.0-flash" });

    const prompt = `Analyze this image in detail. Provide:
1. A comprehensive description of what you see
2. Any text visible in the image (OCR)
3. Key objects, people, or elements
4. Context and setting
5. Any relevant details that would help someone understand the content

Be thorough and descriptive as this will be used for search and question answering.`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };

    const result = await generateContentWithRetry(model, [prompt, imagePart]);
    const response = await result.response;
    const imageDescription = response.text();

    // Also try OCR with Tesseract for text extraction
    let ocrText = '';
    try {
      console.log('Extracting text with OCR...');
      const ocrResult = await Tesseract.recognize(buffer, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      ocrText = ocrResult.data.text.trim();
      console.log(`OCR extracted ${ocrText.length} characters`);
    } catch (ocrError) {
      console.log('OCR failed:', ocrError.message);
    }

    // Combine image description and OCR text
    const combinedContent = `Image Description: ${imageDescription}${ocrText ? `\n\nText found in image: ${ocrText}` : ''}`;

    return {
      content: combinedContent,
      imageDescription: imageDescription,
      ocrText: ocrText,
      metadata: {
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        format: metadata.format,
        size: metadata.size,
        exifData: exifData,
        processingMethod: 'gemini-vision-ocr'
      }
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

// Helper function for vector search using manual similarity calculation
async function vectorSearch(queryEmbedding, documentId = null, limit = 5, threshold = 0.01) {
  console.log('Using manual similarity search for multi-modal content');

  // Get all documents and calculate similarity manually
  const query = documentId ? { documentId: documentId } : {};
  const allDocs = await documentsCollection.find(query).toArray();
  console.log(`Found ${allDocs.length} documents in database for similarity search`);

  if (allDocs.length === 0) {
    console.log('No documents found in database');
    return [];
  }

  const similarities = allDocs.map(doc => {
    if (!doc.embedding) {
      console.log(`Document "${doc.filename}" chunk ${doc.chunkIndex} has no embedding`);
      return { ...doc, similarity: 0 };
    }

    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    console.log(`Similarity with "${doc.filename}" (${doc.fileType}) chunk ${doc.chunkIndex}: ${similarity.toFixed(4)}`);
    return {
      ...doc,
      similarity: similarity
    };
  });

  // Filter by threshold and sort by similarity
  const filtered = similarities
    .filter(doc => doc.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`After filtering by threshold ${threshold}: ${filtered.length} documents`);

  if (filtered.length > 0) {
    console.log('Top matches:');
    filtered.forEach((doc, index) => {
      console.log(`  ${index + 1}. "${doc.filename}" (${doc.fileType}) chunk ${doc.chunkIndex} - similarity: ${doc.similarity.toFixed(4)}`);
    });
  }

  return filtered;
}

// Multi-modal file upload and processing endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const documentId = uuidv4();

    // Detect file type
    const detectedType = await fileTypeFromBuffer(file.buffer);
    const mimeType = detectedType?.mime || file.mimetype;
    const fileType = SUPPORTED_FILE_TYPES[mimeType];

    if (!fileType) {
      return res.status(400).json({ error: `Unsupported file type: ${mimeType}` });
    }

    console.log(`Processing ${fileType} file: ${file.originalname} (${mimeType})`);

    let processedData;

    // Process based on file type
    if (fileType === 'pdf') {
      processedData = await processPDF(file.buffer, file.originalname);
    } else if (fileType === 'image') {
      processedData = await processImage(file.buffer, file.originalname, mimeType);
    }

    // Create text chunks
    const chunks = chunkText(processedData.content);
    console.log(`Created ${chunks.length} chunks from ${fileType}`);

    // Generate embeddings for each chunk
    const documents = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);

      const embedding = await generateEmbedding(chunks[i]);

      const document = {
        documentId: documentId,
        filename: file.originalname,
        fileType: fileType,
        mimeType: mimeType,
        fileSize: file.size,
        content: chunks[i],
        chunkIndex: i,
        totalChunks: chunks.length,
        embedding: embedding,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add file-type specific fields
      if (fileType === 'image') {
        document.imageDescription = processedData.imageDescription;
        document.ocrText = processedData.ocrText;
      }

      // Add metadata
      document.metadata = processedData.metadata;

      documents.push(document);
    }

    // Insert all chunks into MongoDB
    await documentsCollection.insertMany(documents);

    console.log(`${fileType.toUpperCase()} processed successfully with Gemini`);

    res.json({
      message: `${fileType.toUpperCase()} uploaded and processed successfully`,
      documentId: documentId,
      filename: file.originalname,
      fileType: fileType,
      chunks: chunks.length,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({
      error: 'Failed to process file',
      details: error.message
    });
  }
});

// Enhanced ask endpoint for multi-modal content
app.post('/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`Processing question with Gemini: ${question}`);

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // Search for similar document chunks across all file types
    const documents = await vectorSearch(questionEmbedding, documentId, 5, 0.01);

    console.log(`Found ${documents.length} relevant chunks with similarity > 0.01`);

    if (documents.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in the uploaded documents to answer your question. Please try rephrasing your question or upload a relevant document.",
        sources: []
      });
    }

    console.log(`Found ${documents.length} relevant chunks`);

    // Prepare context from relevant chunks
    const context = documents.map((doc, index) => {
      // Handle legacy documents without fileType
      const fileType = doc.fileType || 'pdf'; // Default to PDF for legacy documents
      let contextText = `Source ${index + 1} (${fileType.toUpperCase()}: ${doc.filename}):\n${doc.content}`;

      // Add image-specific context
      if (fileType === 'image' && doc.imageDescription) {
        contextText += `\nImage Description: ${doc.imageDescription}`;
      }

      if (doc.ocrText) {
        contextText += `\nText in image: ${doc.ocrText}`;
      }

      return contextText;
    }).join('\n\n');

    // Generate answer using Gemini
    const model = genAI.getGenerativeModel({ model: process.env.CHAT_MODEL || "gemini-2.0-flash" });

    const prompt = `Based on the following context from uploaded documents (PDFs and images), please answer the question.

Context:
${context}

Question: ${question}

Please provide a detailed answer based on the context above. If the context contains information from images, make sure to reference visual elements when relevant.`;

    const result = await generateContentWithRetry(model, prompt);
    const response = await result.response;
    const answer = response.text();

    res.json({
      answer: answer,
      sources: documents.map((doc) => ({
        id: doc._id.toString(),
        filename: doc.filename,
        fileType: doc.fileType || 'pdf', // Default to PDF for legacy documents
        similarity: doc.similarity,
        chunkIndex: doc.chunkIndex,
        totalChunks: doc.totalChunks
      }))
    });

  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({
      error: 'Failed to process question',
      details: error.message
    });
  }
});

// Get uploaded documents endpoint (enhanced for multi-modal)
app.get('/documents', async (req, res) => {
  try {
    const { fileType } = req.query; // Optional filter by file type

    const matchStage = fileType ? { fileType: fileType } : {};

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$documentId",
          filename: { $first: "$filename" },
          fileType: { $first: "$fileType" },
          mimeType: { $first: "$mimeType" },
          createdAt: { $first: "$createdAt" },
          totalChunks: { $first: "$totalChunks" },
          fileSize: { $first: "$fileSize" },
          metadata: { $first: "$metadata" }
        }
      },
      {
        $project: {
          id: "$_id",
          filename: 1,
          fileType: 1,
          mimeType: 1,
          createdAt: 1,
          totalChunks: 1,
          fileSize: 1,
          metadata: 1,
          _id: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const documents = await documentsCollection.aggregate(pipeline).toArray();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      details: error.message
    });
  }
});

// Delete document endpoint
app.delete('/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await documentsCollection.deleteMany({ documentId: documentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      message: 'Document deleted successfully',
      deletedChunks: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    await db.admin().ping();

    // Check Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    res.json({
      status: 'healthy',
      mongodb: 'connected',
      gemini: 'available',
      supportedFileTypes: Object.keys(SUPPORTED_FILE_TYPES),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await connectToMongoDB();

  app.listen(port, () => {
    console.log(`🚀 Multi-Modal RAG Backend Server running on port ${port}`);
    console.log(`📁 Upload endpoint: http://localhost:${port}/upload`);
    console.log(`❓ Ask endpoint: http://localhost:${port}/ask`);
    console.log(`📋 Documents endpoint: http://localhost:${port}/documents`);
    console.log(`💚 Health check: http://localhost:${port}/health`);
    console.log(`🤖 AI Provider: Google Gemini (Text + Vision)`);
    console.log(`📄 Supported file types: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`);
  });
}

startServer().catch(console.error);
