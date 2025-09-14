const fetch = require('node-fetch');

async function testOAuthDebug() {
  try {
    console.log('Testing OAuth Debug Endpoint...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/google/debug', {
      headers: {
        'Cookie': 'connect.sid=test',
        'User-Agent': 'OAuth-Test-Script/1.0'
      }
    });
    
    const data = await response.json();
    console.log('OAuth Configuration Status:');
    console.log('==========================');
    console.log('Google OAuth Configured:', data.oauth?.configured ? '✓ Yes' : '✗ No');
    console.log('Client ID Length:', data.oauth?.clientIdLength || 0);
    console.log('Client Secret Length:', data.oauth?.clientSecretLength || 0);
    console.log('\nSession Configuration:');
    console.log('Session Exists:', data.session?.exists ? '✓ Yes' : '✗ No');
    console.log('Session Cookie Settings:', JSON.stringify(data.session?.cookie, null, 2));
    console.log('\nEnvironment:');
    console.log('NODE_ENV:', data.environment?.nodeEnv);
    console.log('Is Production:', data.environment?.isProduction ? 'Yes' : 'No');
    console.log('\nFull Debug Info:', JSON.stringify(data, null, 2));
    
    if (!data.oauth?.configured) {
      console.error('\n⚠️  WARNING: Google OAuth is not properly configured!');
      console.error('Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.');
    }
    
  } catch (error) {
    console.error('Error testing OAuth:', error.message);
  }
}

testOAuthDebug();