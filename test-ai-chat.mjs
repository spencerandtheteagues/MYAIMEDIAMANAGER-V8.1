import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_MESSAGE = 'Give me 3 creative Instagram post ideas for a coffee shop';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper to print colored output
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Test health endpoint
async function testHealth() {
  log('\n📋 Testing health endpoint...', 'blue');
  try {
    const response = await fetch(`${BASE_URL}/api/ai-chat/health`);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      log('❌ Health endpoint not returning JSON (might be caught by frontend router)', 'red');
      console.log('Content-Type:', contentType);
      const text = await response.text();
      console.log('Response preview:', text.substring(0, 200) + '...');
      return null;
    }
    
    const data = await response.json();
    log('✅ Health check passed:', 'green');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    log('❌ Health check failed: ' + error.message, 'red');
    return null;
  }
}

// Test OpenAI chat endpoint
async function testOpenAIChat() {
  log('\n🤖 Testing OpenAI chat endpoint...', 'blue');
  try {
    const response = await fetch(`${BASE_URL}/api/ai-chat/openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_MESSAGE,
        conversationHistory: []
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        log(`❌ OpenAI chat failed (${response.status}): ${error.message}`, 'red');
      } else {
        log(`❌ OpenAI chat failed (${response.status}): Non-JSON response`, 'red');
      }
      return;
    }

    log('✅ OpenAI chat response received (streaming):', 'green');
    
    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              process.stdout.write(data.content);
              fullResponse += data.content;
            }
            if (data.done) {
              console.log('\n');
              log('✅ OpenAI streaming complete', 'green');
            }
            if (data.error) {
              log('❌ Stream error: ' + data.error, 'red');
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    log('❌ OpenAI chat error: ' + error.message, 'red');
  }
}

// Test Gemini chat endpoint  
async function testGeminiChat() {
  log('\n🌟 Testing Gemini chat endpoint...', 'blue');
  try {
    const response = await fetch(`${BASE_URL}/api/ai-chat/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_MESSAGE,
        conversationHistory: []
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        log(`❌ Gemini chat failed (${response.status}): ${error.message}`, 'red');
      } else {
        log(`❌ Gemini chat failed (${response.status}): Non-JSON response`, 'red');
      }
      return;
    }

    log('✅ Gemini chat response received (streaming):', 'green');
    
    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              process.stdout.write(data.content);
              fullResponse += data.content;
            }
            if (data.done) {
              console.log('\n');
              log('✅ Gemini streaming complete', 'green');
            }
            if (data.error) {
              log('❌ Stream error: ' + data.error, 'red');
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    log('❌ Gemini chat error: ' + error.message, 'red');
  }
}

// Run all tests
async function runTests() {
  log('🚀 Starting AI Chat API Tests', 'yellow');
  log('================================', 'yellow');
  
  // Test health first
  const health = await testHealth();
  
  // Even if health check fails (due to routing), try the actual endpoints
  log('\n📝 Testing chat endpoints directly...', 'yellow');
  
  // Check environment variables
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  
  if (hasOpenAI) {
    await testOpenAIChat();
  } else {
    log('\n⚠️  OpenAI not configured (missing OPENAI_API_KEY)', 'yellow');
  }
  
  if (hasGemini) {
    await testGeminiChat();
  } else {
    log('\n⚠️  Gemini not configured (missing GOOGLE_API_KEY or GEMINI_API_KEY)', 'yellow');
  }
  
  log('\n================================', 'yellow');
  log('✨ Tests completed!', 'yellow');
}

// Run the tests
runTests().catch(error => {
  log('Fatal error: ' + error.message, 'red');
  process.exit(1);
});