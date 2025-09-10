// scripts/test-ai-auth.js
// Test script to verify AI endpoints authentication is working

const base = process.env.E2E_BASE_URL || "http://localhost:5000";
const headers = { "Content-Type": "application/json" };

async function login(email, password) {
  console.log(`\nLogging in as ${email}...`);
  const r = await fetch(`${base}/api/auth/login`, { 
    method: "POST", 
    headers, 
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  
  if (!r.ok) {
    const error = await r.text();
    throw new Error(`Login failed: ${error}`);
  }
  
  const cookie = r.headers.get("set-cookie");
  const user = await r.json();
  console.log(`✓ Logged in as ${user.email} (${user.tier || 'trial'})`);
  return { cookie, user };
}

async function testImageGeneration(cookie) {
  console.log("\n📸 Testing Image Generation...");
  
  const response = await fetch(`${base}/api/ai/image`, {
    method: "POST",
    headers: { ...headers, cookie },
    body: JSON.stringify({
      prompt: "A beautiful sunset over mountains",
      aspectRatio: "1:1",
      platform: "instagram"
    })
  });
  
  console.log(`Response status: ${response.status}`);
  const data = await response.json();
  
  if (response.ok) {
    console.log("✅ Image generation WORKING!");
    console.log(`   Generated image: ${data.url || data.id}`);
    return true;
  } else {
    console.error("❌ Image generation FAILED!");
    console.error(`   Error: ${data.error || JSON.stringify(data)}`);
    return false;
  }
}

async function testVideoGeneration(cookie) {
  console.log("\n🎬 Testing Video Generation...");
  
  const response = await fetch(`${base}/api/ai/video/start`, {
    method: "POST",
    headers: { ...headers, cookie },
    body: JSON.stringify({
      prompt: "Ocean waves at sunset",
      durationSeconds: 3,
      platform: "instagram"
    })
  });
  
  console.log(`Response status: ${response.status}`);
  const data = await response.json();
  
  if (response.ok) {
    console.log("✅ Video generation WORKING!");
    console.log(`   Job ID: ${data.jobId}`);
    return true;
  } else {
    console.error("❌ Video generation FAILED!");
    console.error(`   Error: ${data.error || JSON.stringify(data)}`);
    if (data.error?.includes("402") || data.error?.includes("Unlock")) {
      console.log("   Note: Video requires paid tier or trial with card");
    }
    return false;
  }
}

async function testTextGeneration(cookie) {
  console.log("\n✍️ Testing Text Generation...");
  
  const response = await fetch(`${base}/api/ai/generate`, {
    method: "POST",
    headers: { ...headers, cookie },
    body: JSON.stringify({
      prompt: "Write a social media post about coffee",
      platform: "instagram",
      temperature: 0.7
    })
  });
  
  console.log(`Response status: ${response.status}`);
  const data = await response.json();
  
  if (response.ok) {
    console.log("✅ Text generation WORKING!");
    console.log(`   Generated: ${data.content?.substring(0, 50)}...`);
    return true;
  } else {
    console.error("❌ Text generation FAILED!");
    console.error(`   Error: ${data.error || JSON.stringify(data)}`);
    return false;
  }
}

(async () => {
  console.log("🔍 Testing AI Endpoints Authentication\n");
  console.log("=" + "=".repeat(60));
  
  try {
    // Test with spencer (admin account)
    const auth = await login("test-enterprise@myaimediamgr.com", "Test123!@#");
    
    const textOk = await testTextGeneration(auth.cookie);
    const imageOk = await testImageGeneration(auth.cookie);
    const videoOk = await testVideoGeneration(auth.cookie);
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results:");
    console.log(`   Text Generation:  ${textOk ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Image Generation: ${imageOk ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Video Generation: ${videoOk ? "✅ PASS" : "❌ FAIL"}`);
    console.log("=" + "=".repeat(60));
    
    if (textOk && imageOk) {
      console.log("\n🎉 Authentication is WORKING for AI endpoints!");
      console.log("Both text and image generation are functional.");
      if (!videoOk) {
        console.log("Note: Video may require additional setup or paid tier.");
      }
      process.exit(0);
    } else {
      console.error("\n⚠️ Some AI endpoints still have authentication issues!");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message);
    process.exit(1);
  }
})();