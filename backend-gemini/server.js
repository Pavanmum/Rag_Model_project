const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

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
  if (db) return; // Skip if already connected
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    db = client.db(process.env.MONGODB_DATABASE);
    documentsCollection = db.collection('documents');

    // Create indexes if they don't exist
    await createIndexes();

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Middleware to ensure DB connection on every request for serverless environments
app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Create database indexes
async function createIndexes() {
  try {
    // Compound index for document queries
    await documentsCollection.createIndex({
      documentId: 1,
      chunkIndex: 1
    });

    // Index for filename searches
    await documentsCollection.createIndex({
      filename: 1,
      createdAt: -1
    });

    // Index for date-based queries
    await documentsCollection.createIndex({
      createdAt: -1
    });

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('⚠️  Index creation warning:', error.message);
  }
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
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

// Helper function to generate embeddings using Gemini
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-embedding-001"  // Keep this for embeddings
    });

    const result = await embedContentWithRetry(model, text);
    const embedding = result.embedding;

    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    throw error;
  }
}

// Helper function for vector search using cosine similarity
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

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

// Helper function for vector search using manual similarity calculation
async function vectorSearch(queryEmbedding, documentId = null, limit = 5, threshold = 0.7) {
  // Skip MongoDB vector search for now and use manual similarity calculation
  console.log('Using manual similarity search (MongoDB vector search requires Atlas M10+ with vector index)');

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
    console.log(`Similarity with "${doc.filename}" chunk ${doc.chunkIndex}: ${similarity.toFixed(4)}`);
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
      console.log(`  ${index + 1}. "${doc.filename}" chunk ${doc.chunkIndex} - similarity: ${doc.similarity.toFixed(4)}`);
    });
  }

  return filtered;
}

// Upload and process PDF endpoint
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('Processing PDF:', req.file.originalname);

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the PDF' });
    }

    // Chunk the text for better retrieval
    const chunks = chunkText(extractedText, 800, 100);
    console.log(`Created ${chunks.length} chunks from PDF`);

    // Generate embeddings for each chunk and store in database
    const documentId = uuidv4();
    const documents = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
      const embedding = await generateEmbedding(chunks[i]);

      const document = {
        documentId: documentId,
        filename: req.file.originalname,
        content: chunks[i],
        embedding: embedding,
        chunkIndex: i,
        totalChunks: chunks.length,
        metadata: {
          fileSize: req.file.size,
          uploadedAt: new Date(),
          processedAt: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      documents.push(document);
    }

    // Insert all documents in batch
    const result = await documentsCollection.insertMany(documents);

    if (!result.acknowledged) {
      throw new Error('Failed to store document chunks in database');
    }

    console.log('PDF processed successfully with Gemini');

    res.json({
      message: 'PDF processed successfully',
      documentId: documentId,
      filename: req.file.originalname,
      chunksCreated: chunks.length,
      extractedTextPreview: extractedText.substring(0, 500) + '...',
      aiProvider: 'Google Gemini'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process PDF',
      details: error.message
    });
  }
});

// Ask question endpoint
app.post('/ask', async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('Processing question with Gemini:', question);

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // Search for similar document chunks (very low threshold for better recall)
    const documents = await vectorSearch(questionEmbedding, documentId, 5, 0.01);

    console.log(`Found ${documents.length} relevant chunks with similarity > 0.01`);

    if (!documents || documents.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in the uploaded documents to answer your question. Please try rephrasing your question or upload a relevant document.",
        sources: [],
        aiProvider: 'Google Gemini'
      });
    }

    // Prepare context from retrieved documents
    const context = documents
      .map((doc, index) => `[Source ${index + 1}]: ${doc.content}`)
      .join('\n\n');

    console.log(`Found ${documents.length} relevant chunks`);

    // Generate answer using Gemini
    console.log('=== MODEL DEBUG ===');
    console.log('process.env.CHAT_MODEL:', process.env.CHAT_MODEL);
    console.log('Hardcoded model name: gemini-1.5-flash');

    // Try this different model to test:
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"  // This one works!
    });

    console.log('Created model object:', model.model);
    console.log('=== END DEBUG ===');

    const prompt = `You are a helpful assistant that answers questions based on the provided document context. 
Always base your answers on the information provided in the context. 
If the context doesn't contain enough information to answer the question, say so clearly.
Provide specific details and quotes from the documents when relevant.

Context from documents:
${context}

Question: ${question}

Please provide a detailed answer based on the context above.`;

    const result = await generateContentWithRetry(model, prompt);
    const response = await result.response;
    const answer = response.text();

    res.json({
      answer: answer,
      sources: documents.map((doc, index) => ({
        id: doc._id.toString(),
        filename: doc.filename,
        similarity: doc.similarity,
        chunk_index: doc.chunkIndex,
        preview: doc.content.substring(0, 200) + '...'
      })),
      context_used: documents.length,
      aiProvider: 'Google Gemini'
    });

  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({
      error: 'Failed to process question',
      details: error.message
    });
  }
});

// Get uploaded documents endpoint
app.get('/documents', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$documentId",
          filename: { $first: "$filename" },
          createdAt: { $first: "$createdAt" },
          totalChunks: { $first: "$totalChunks" },
          fileSize: { $first: "$metadata.fileSize" }
        }
      },
      {
        $project: {
          id: "$_id",
          filename: 1,
          createdAt: 1,
          totalChunks: 1,
          fileSize: 1,
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
    console.error('Documents fetch error:', error);
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
    console.error('Delete error:', error);
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

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      aiProvider: 'Google Gemini',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.close();
  process.exit(0);
});

// Start server locally
async function startServer() {
  app.listen(port, () => {
    console.log(`🚀 RAG Backend Server (MongoDB + Gemini) running on port ${port}`);
    console.log(`📁 Upload endpoint: http://localhost:${port}/upload`);
    console.log(`❓ Ask endpoint: http://localhost:${port}/ask`);
    console.log(`📋 Documents endpoint: http://localhost:${port}/documents`);
    console.log(`💚 Health check: http://localhost:${port}/health`);
    console.log(`🤖 AI Provider: Google Gemini`);
  });
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startServer().catch(console.error);
}

module.exports = app;








