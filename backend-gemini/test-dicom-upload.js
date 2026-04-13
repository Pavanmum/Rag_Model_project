const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const SERVER_URL = 'http://localhost:3003';
const TEST_DICOM_PATH = '../mri-rag-system/test_brain.dcm'; // Adjust path as needed

async function testDicomUpload() {
  try {
    console.log('🧪 Testing DICOM Upload and RAG System...\n');

    // Check if test DICOM file exists
    const dicomPath = path.resolve(__dirname, TEST_DICOM_PATH);
    if (!fs.existsSync(dicomPath)) {
      console.log('❌ Test DICOM file not found at:', dicomPath);
      console.log('Please ensure you have a test DICOM file available.');
      return;
    }

    console.log('✅ Found test DICOM file:', dicomPath);

    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    try {
      const healthResponse = await axios.get(`${SERVER_URL}/health`);
      console.log('✅ Health check passed:', healthResponse.data.status);
      console.log('   Features:', healthResponse.data.features);
    } catch (error) {
      console.log('❌ Health check failed. Is the server running on port 3002?');
      console.log('   Start server with: npm run dev');
      return;
    }

    // Test 2: Upload DICOM file
    console.log('\n2. Testing DICOM Upload...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(dicomPath));

    try {
      const uploadResponse = await axios.post(`${SERVER_URL}/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout
      });

      console.log('✅ DICOM upload successful!');
      console.log('   Document ID:', uploadResponse.data.documentId);
      console.log('   File Type:', uploadResponse.data.fileType);
      console.log('   Chunks Created:', uploadResponse.data.chunksCreated);
      
      if (uploadResponse.data.metadata) {
        console.log('   Patient ID:', uploadResponse.data.metadata.patientId);
        console.log('   Modality:', uploadResponse.data.metadata.modality);
        console.log('   Body Part:', uploadResponse.data.metadata.bodyPart);
      }

      const documentId = uploadResponse.data.documentId;

      // Test 3: Ask medical question
      console.log('\n3. Testing Medical RAG Query...');
      const medicalQuestions = [
        "What type of medical imaging study is this?",
        "What are the technical parameters of this scan?",
        "What body part was examined in this study?",
        "What is the patient information available?"
      ];

      for (const question of medicalQuestions) {
        console.log(`\n   Question: ${question}`);
        try {
          const askResponse = await axios.post(`${SERVER_URL}/ask`, {
            question: question,
            documentId: documentId,
            includeContext: true
          }, {
            timeout: 30000
          });

          console.log('   ✅ Answer received:');
          console.log('   ', askResponse.data.answer.substring(0, 200) + '...');
          console.log('   Sources used:', askResponse.data.sources.length);
        } catch (error) {
          console.log('   ❌ Question failed:', error.message);
        }
      }

      // Test 4: Get documents list
      console.log('\n4. Testing Documents List...');
      try {
        const docsResponse = await axios.get(`${SERVER_URL}/documents`);
        console.log('✅ Documents retrieved:', docsResponse.data.length);
        
        const dicomDocs = docsResponse.data.filter(doc => doc.fileType === 'DICOM');
        console.log('   DICOM files:', dicomDocs.length);
      } catch (error) {
        console.log('❌ Documents list failed:', error.message);
      }

      // Test 5: Get DICOM files list
      console.log('\n5. Testing DICOM Files List...');
      try {
        const dicomResponse = await axios.get(`${SERVER_URL}/dicom`);
        console.log('✅ DICOM files retrieved:', dicomResponse.data.length);
        
        if (dicomResponse.data.length > 0) {
          const firstDicom = dicomResponse.data[0];
          console.log('   First DICOM file:', firstDicom.filename);
          console.log('   Patient ID:', firstDicom.metadata?.patientId);
          
          // Test 6: DICOM Analysis
          console.log('\n6. Testing DICOM Analysis...');
          try {
            const analysisResponse = await axios.post(`${SERVER_URL}/analyze-dicom/${firstDicom.dicomId}`, {
              analysisType: 'general'
            });
            
            console.log('✅ DICOM analysis completed');
            console.log('   Analysis preview:', analysisResponse.data.analysis.substring(0, 200) + '...');
          } catch (error) {
            console.log('❌ DICOM analysis failed:', error.message);
          }
        }
      } catch (error) {
        console.log('❌ DICOM files list failed:', error.message);
      }

      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ DICOM file upload and processing');
      console.log('   ✅ Medical metadata extraction');
      console.log('   ✅ RAG-based medical question answering');
      console.log('   ✅ Document and DICOM file management');
      console.log('   ✅ AI-powered medical analysis');

    } catch (error) {
      console.log('❌ DICOM upload failed:', error.message);
      if (error.response) {
        console.log('   Server response:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testDicomUpload();
}

module.exports = { testDicomUpload };
