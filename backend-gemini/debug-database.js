// Debug script to check what's in the database
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DATABASE);
    const collection = db.collection('documents');
    
    // Get all documents
    const docs = await collection.find({}).toArray();
    console.log(`\n📊 Found ${docs.length} documents in database:`);
    
    docs.forEach((doc, index) => {
      console.log(`\n--- Document ${index + 1} ---`);
      console.log(`ID: ${doc._id}`);
      console.log(`Document ID: ${doc.documentId}`);
      console.log(`Filename: ${doc.filename}`);
      console.log(`Chunk: ${doc.chunkIndex + 1}/${doc.totalChunks}`);
      console.log(`Content preview: ${doc.content.substring(0, 200)}...`);
      console.log(`Embedding length: ${doc.embedding ? doc.embedding.length : 'No embedding'}`);
      console.log(`Created: ${doc.createdAt}`);
    });
    
    // Test similarity search manually
    if (docs.length > 0) {
      console.log('\n🔍 Testing manual similarity search...');
      
      // Get the first document's embedding
      const firstDoc = docs[0];
      if (firstDoc.embedding) {
        console.log(`Using embedding from: ${firstDoc.filename}`);
        
        // Simple similarity test - compare with itself (should be 1.0)
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
        
        const selfSimilarity = cosineSimilarity(firstDoc.embedding, firstDoc.embedding);
        console.log(`Self-similarity: ${selfSimilarity}`);
        
        // Test with all other documents
        docs.forEach((doc, index) => {
          if (doc._id.toString() !== firstDoc._id.toString() && doc.embedding) {
            const similarity = cosineSimilarity(firstDoc.embedding, doc.embedding);
            console.log(`Similarity with doc ${index + 1}: ${similarity.toFixed(4)}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

debugDatabase().catch(console.error);
