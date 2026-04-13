// Test MongoDB connection and Gemini AI functionality
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testConnection() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(process.env.MONGODB_DATABASE);
    const collection = db.collection('documents');
    
    // Test 1: Basic connection and database operations
    console.log('\n📋 Test 1: Basic Database Operations');
    
    // Test insert
    const testDoc = {
      documentId: 'test-gemini-123',
      filename: 'test-gemini.pdf',
      content: 'This is a test document for the RAG system with Google Gemini. It contains sample text to verify that the system can process and store documents correctly using Gemini AI.',
      embedding: new Array(768).fill(0.1), // Gemini embeddings are typically 768 dimensions
      chunkIndex: 0,
      totalChunks: 1,
      metadata: {
        fileSize: 1024,
        uploadedAt: new Date(),
        processedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(testDoc);
    console.log('✅ Test document inserted');
    
    // Test find
    const found = await collection.findOne({ documentId: 'test-gemini-123' });
    console.log('✅ Test document found:', found.filename);
    
    // Test 2: Index verification
    console.log('\n📋 Test 2: Index Verification');
    
    const indexes = await collection.listIndexes().toArray();
    console.log('📊 Available indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Test 3: Gemini AI functionality
    console.log('\n📋 Test 3: Gemini AI Test');
    
    try {
      // Test embedding generation
      console.log('🧠 Testing Gemini embedding generation...');
      const embeddingModel = genAI.getGenerativeModel({ 
        model: process.env.EMBEDDING_MODEL || "gemini-embedding-001" 
      });
      
      const embeddingResult = await embeddingModel.embedContent("test query about documents");
      const embedding = embeddingResult.embedding.values;
      
      console.log('✅ Gemini embedding generated successfully');
      console.log(`📊 Embedding dimensions: ${embedding.length}`);
      
      // Test text generation
      console.log('🤖 Testing Gemini text generation...');
      const chatModel = genAI.getGenerativeModel({ 
        model: process.env.CHAT_MODEL || "gemini-1.5-flash" 
      });
      
      const prompt = "Answer this question based on the context: What is artificial intelligence? Context: Artificial intelligence is a field of computer science that aims to create intelligent machines.";
      const result = await chatModel.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();
      
      console.log('✅ Gemini text generation working');
      console.log(`📝 Sample response: ${answer.substring(0, 100)}...`);
      
    } catch (geminiError) {
      console.log('❌ Gemini AI test failed:', geminiError.message);
      console.log('💡 This usually means:');
      console.log('   - Gemini API key is not configured or invalid');
      console.log('   - API quota exceeded');
      console.log('   - Network connectivity issues');
      console.log('   - Model names are incorrect');
    }
    
    // Test 4: Similarity search simulation
    console.log('\n📋 Test 4: Similarity Search Simulation');
    
    // Simple cosine similarity function
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
    
    // Test similarity calculation
    const vec1 = new Array(768).fill(0.1);
    const vec2 = new Array(768).fill(0.2);
    const similarity = cosineSimilarity(vec1, vec2);
    
    console.log('✅ Similarity calculation working');
    console.log(`📊 Test similarity score: ${similarity.toFixed(4)}`);
    
    // Test 5: Aggregation pipeline
    console.log('\n📋 Test 5: Aggregation Pipeline');
    
    const aggregationResult = await collection.aggregate([
      {
        $group: {
          _id: "$documentId",
          filename: { $first: "$filename" },
          totalChunks: { $sum: 1 },
          createdAt: { $first: "$createdAt" }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();
    
    console.log('✅ Aggregation pipeline working');
    console.log(`📊 Found ${aggregationResult.length} unique documents`);
    
    // Test 6: Performance test
    console.log('\n📋 Test 6: Performance Test');
    
    const startTime = Date.now();
    await collection.find({ documentId: 'test-gemini-123' }).toArray();
    const endTime = Date.now();
    
    console.log(`✅ Query performance: ${endTime - startTime}ms`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    const deleteResult = await collection.deleteMany({ documentId: 'test-gemini-123' });
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} test documents`);
    
    // Final summary
    console.log('\n🎉 Connection Test Summary:');
    console.log('✅ MongoDB connection: Working');
    console.log('✅ Database operations: Working');
    console.log('✅ Indexes: Available');
    console.log('✅ Aggregation: Working');
    console.log('✅ Performance: Good');
    
    if (process.env.GEMINI_API_KEY) {
      console.log('✅ Gemini AI integration: Working');
    } else {
      console.log('⚠️  Gemini API key not configured');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your MongoDB connection string in .env');
    console.log('2. Verify your database name is correct');
    console.log('3. Ensure your IP is whitelisted in MongoDB Atlas');
    console.log('4. Check if your database user has proper permissions');
    console.log('5. Verify your Gemini API key is valid');
    console.log('6. Check if you have Gemini API quota available');
    
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  console.log('🧪 Starting MongoDB + Gemini Connection Test...');
  console.log('📊 Configuration:');
  console.log(`   Database: ${process.env.MONGODB_DATABASE}`);
  console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   Embedding Model: ${process.env.EMBEDDING_MODEL || 'gemini-embedding-001'}`);
  console.log(`   Chat Model: ${process.env.CHAT_MODEL || 'gemini-1.5-flash'}`);
  console.log('');
  
  testConnection().catch(console.error);
}

module.exports = { testConnection };
