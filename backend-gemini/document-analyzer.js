// Document Content Analyzer - helps you understand what questions to ask
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function analyzeDocument(documentId = null) {
  try {
    console.log('🔍 Analyzing document content to suggest questions...\n');
    
    // Get document overview
    const overviewResponse = await axios.post(`${BACKEND_URL}/ask`, {
      question: "List all the main topics, sections, and key terms covered in this document. Be very detailed and comprehensive.",
      documentId: documentId
    });
    
    console.log('📋 DOCUMENT OVERVIEW:');
    console.log('=' .repeat(50));
    console.log(overviewResponse.data.answer);
    console.log('\n');
    
    // Get key terms
    const termsResponse = await axios.post(`${BACKEND_URL}/ask`, {
      question: "Extract all important medical terms, technical terms, and key concepts mentioned in this document. List them clearly.",
      documentId: documentId
    });
    
    console.log('🔑 KEY TERMS & CONCEPTS:');
    console.log('=' .repeat(50));
    console.log(termsResponse.data.answer);
    console.log('\n');
    
    // Get statistics and numbers
    const statsResponse = await axios.post(`${BACKEND_URL}/ask`, {
      question: "What statistics, percentages, numbers, or quantitative data are mentioned in this document?",
      documentId: documentId
    });
    
    console.log('📊 STATISTICS & DATA:');
    console.log('=' .repeat(50));
    console.log(statsResponse.data.answer);
    console.log('\n');
    
    // Generate suggested questions
    console.log('💡 SUGGESTED QUESTIONS TO ASK:');
    console.log('=' .repeat(50));
    
    const suggestions = [
      '📋 OVERVIEW QUESTIONS:',
      '• "What is this document about?"',
      '• "Summarize the main points of this document"',
      '• "What are the key takeaways?"',
      '',
      '🔍 SPECIFIC TOPIC QUESTIONS:',
      '• "What is [TERM] and how does it work?" (replace [TERM] with any key term)',
      '• "How is [CONDITION] treated?" (replace [CONDITION] with any condition mentioned)',
      '• "What causes [PROBLEM]?" (replace [PROBLEM] with any problem mentioned)',
      '',
      '📊 DATA QUESTIONS:',
      '• "What statistics are provided?"',
      '• "How common is [CONDITION]?"',
      '• "What percentage of people experience [EFFECT]?"',
      '',
      '💊 TREATMENT QUESTIONS:',
      '• "What treatments are available for [CONDITION]?"',
      '• "What medications are mentioned?"',
      '• "What therapies are recommended?"',
      '',
      '🏥 PRACTICAL QUESTIONS:',
      '• "How can someone manage [CONDITION]?"',
      '• "What resources are available?"',
      '• "Who can help with [PROBLEM]?"'
    ];
    
    suggestions.forEach(suggestion => console.log(suggestion));
    
    console.log('\n🎯 PRO TIP: Replace words in [BRACKETS] with actual terms from the key terms list above!');
    
  } catch (error) {
    console.error('❌ Error analyzing document:', error.message);
    console.log('\n🔧 Make sure your backend server is running on http://localhost:3001');
  }
}

// Run the analyzer
if (require.main === module) {
  console.log('🚀 Document Content Analyzer');
  console.log('This tool helps you understand what questions you can ask about your uploaded documents.\n');
  
  analyzeDocument().catch(console.error);
}

module.exports = { analyzeDocument };
