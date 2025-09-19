#!/usr/bin/env node
/**
 * Trigger Render deployment with fixes
 */

const https = require('https');

const SERVICE_ID = 'srv-d33qf7umcj7s73ajfi7g';
const API_KEY = 'rnd_vKob0I2nVrG99ikFj97s3sxKesqT';

console.log('🚀 Triggering Render Deployment with Fixes');
console.log('==========================================\n');

// Function to make API request
function renderAPI(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  try {
    // Check service status
    console.log('1. Checking service status...');
    const service = await renderAPI('GET', `/services/${SERVICE_ID}`);
    console.log(`   Service: ${service.name || SERVICE_ID}`);
    console.log(`   Status: ${service.status || 'unknown'}\n`);

    // Get latest deployment
    console.log('2. Getting latest deployment...');
    const deploys = await renderAPI('GET', `/services/${SERVICE_ID}/deploys?limit=1`);
    if (Array.isArray(deploys) && deploys.length > 0) {
      console.log(`   Latest: ${deploys[0].id}`);
      console.log(`   Status: ${deploys[0].status}\n`);
    }

    // Trigger new deployment
    console.log('3. Triggering new deployment...');
    console.log('   - Will clear build cache');
    console.log('   - Will run emergency tier fix');
    console.log('   - Will apply migrations properly\n');

    const newDeploy = await renderAPI('POST', `/services/${SERVICE_ID}/deploys`, {
      clearCache: true
    });

    if (newDeploy.id) {
      console.log('✅ Deployment triggered successfully!');
      console.log(`   Deploy ID: ${newDeploy.id}`);
      console.log(`   Status: ${newDeploy.status}\n`);

      console.log('📊 Monitor deployment at:');
      console.log(`   https://dashboard.render.com/web/${SERVICE_ID}/deploys/${newDeploy.id}\n`);

      console.log('4. Monitoring deployment (60 seconds)...');

      // Monitor for 1 minute
      let status = '';
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        const deploy = await renderAPI('GET', `/services/${SERVICE_ID}/deploys/${newDeploy.id}`);
        status = deploy.status;

        console.log(`   [${new Date().toLocaleTimeString()}] Status: ${status}`);

        if (status === 'live' || status === 'build_failed' || status === 'canceled') {
          break;
        }
      }

      console.log('\n' + '='.repeat(50));
      if (status === 'live') {
        console.log('🎉 Deployment appears to be progressing!');
        console.log('   Check full status at dashboard link above');
      } else if (status === 'build_failed') {
        console.log('❌ Build failed - check logs for details');
      } else {
        console.log('⏱️  Deployment still in progress');
        console.log('   Continue monitoring at dashboard');
      }

    } else {
      console.error('❌ Failed to trigger deployment');
      console.error('   Response:', newDeploy);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();