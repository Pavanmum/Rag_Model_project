require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAvailableModels() {
  try {
    console.log('🔍 Fetching available Gemini models...\n');
    
    // List all available models
    const models = await genAI.listModels();
    
    console.log('📋 Available Models:\n');
    console.log('='.repeat(80));
    
    for await (const model of models) {
      console.log(`\n📦 Model: ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
      console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
      console.log('-'.repeat(80));
    }
    
    console.log('\n✅ Model listing complete!');
    
  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      console.log('\n⚠️  Rate limit exceeded. Try again later or upgrade your plan.');
      console.log('📊 Check usage: https://ai.dev/rate-limit');
    }
  }
}

listAvailableModels();

