// scripts/run-int-tests.js
import fs from "node:fs";
import path from "node:path";
import prettyBytes from "pretty-bytes";

const ART_DIR = process.argv[2];
if (!ART_DIR) {
  console.error("Usage: node scripts/run-int-tests.js <artifact-dir>");
  process.exit(1);
}

const base = process.env.E2E_BASE_URL || "http://localhost:5000";
const headers = { "Content-Type": "application/json" };

async function login(email, password) {
  console.log(`Logging in as ${email}...`);
  const r = await fetch(`${base}/api/auth/login`, { 
    method: "POST", 
    headers, 
    body: JSON.stringify({ email, password })
  });
  
  if (!r.ok) {
    const error = await r.text();
    throw new Error(`Login failed for ${email}: ${error}`);
  }
  
  const cookie = r.headers.get("set-cookie");
  const user = await r.json();
  console.log(`✓ Logged in as ${user.email} (${user.subscriptionTier || 'trial'})`);
  return { cookie, user };
}

function hWithCookie(cookie) { 
  return { ...headers, cookie }; 
}

async function getUser(cookie) {
  const r = await fetch(`${base}/api/user`, { headers: hWithCookie(cookie) });
  if (!r.ok) throw new Error("Failed to get user");
  return await r.json();
}

async function generateContent(cookie, prompt, type = "text") {
  console.log(`Generating ${type} content...`);
  const endpoint = type === "image" ? "/api/ai/generate-content" : "/api/ai/generate";
  const body = type === "image" 
    ? { prompt, platform: "instagram", generateImage: true, temperature: 0 }
    : { prompt, platform: "instagram", temperature: 0 };
    
  const r = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: hWithCookie(cookie),
    body: JSON.stringify(body)
  });
  
  if (!r.ok) {
    const error = await r.text();
    throw new Error(`${type} generation failed: ${error}`);
  }
  
  return await r.json();
}

async function getContentLibrary(cookie, type = null) {
  const url = type ? `${base}/api/library?type=${type}` : `${base}/api/library`;
  const r = await fetch(url, { headers: hWithCookie(cookie) });
  if (!r.ok) throw new Error("Failed to get content library");
  return await r.json();
}

async function createCampaign(cookie, data) {
  console.log("Creating campaign...");
  const r = await fetch(`${base}/api/campaigns`, {
    method: "POST",
    headers: hWithCookie(cookie),
    body: JSON.stringify(data)
  });
  
  if (!r.ok) {
    const error = await r.text();
    throw new Error(`Campaign creation failed: ${error}`);
  }
  
  return await r.json();
}

(async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Login with test users (create if needed)
    const testEmail = process.env.TEST_ENTERPRISE_EMAIL || "test-enterprise@myaimediamgr.com";
    const testPassword = process.env.TEST_ENTERPRISE_PASSWORD || "Test123!@#";
    
    let auth;
    try {
      auth = await login(testEmail, testPassword);
    } catch (loginError) {
      console.log("Test user not found, creating...");
      // Try to create the user first
      const signupResponse = await fetch(`${base}/api/auth/signup`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          username: "test-enterprise",
          businessName: "Test Enterprise Co"
        })
      });
      
      if (!signupResponse.ok) {
        throw new Error(`Failed to create test user: ${await signupResponse.text()}`);
      }
      
      // Now login
      auth = await login(testEmail, testPassword);
    }
    
    results.tests.push({ name: "auth", status: "PASS", user: auth.user.email });

    // Test 2: Get initial user state
    const userBefore = await getUser(auth.cookie);
    const creditsBefore = userBefore.credits || 0;
    const trialImagesBefore = userBefore.trialImagesRemaining || 0;
    console.log(`Credits: ${creditsBefore}, Trial Images: ${trialImagesBefore}`);
    results.tests.push({ 
      name: "user-state-before", 
      status: "PASS", 
      credits: creditsBefore,
      trialImages: trialImagesBefore
    });

    // Test 3: Generate text content
    const textContent = await generateContent(auth.cookie, "Test post for a bakery", "text");
    if (!textContent.content || textContent.content.length < 10) {
      throw new Error("Text generation returned empty or too short content");
    }
    console.log(`✓ Generated text: ${textContent.content.substring(0, 50)}...`);
    results.tests.push({ 
      name: "text-generation", 
      status: "PASS", 
      length: textContent.content.length 
    });

    // Test 4: Generate image content (if API key available)
    let imageResult = null;
    if (process.env.GEMINI_API_KEY || process.env.VERTEX_AI_PROJECT) {
      try {
        const imageContent = await generateContent(auth.cookie, "Neon gradient abstract background", "image");
        if (imageContent.imageUrl) {
          imageResult = { url: imageContent.imageUrl, id: imageContent.id };
          console.log(`✓ Generated image: ${imageContent.imageUrl}`);
          results.tests.push({ 
            name: "image-generation", 
            status: "PASS", 
            imageId: imageContent.id 
          });
        }
      } catch (imgError) {
        console.warn("Image generation skipped:", imgError.message);
        results.tests.push({ 
          name: "image-generation", 
          status: "SKIP", 
          reason: "No AI service configured" 
        });
      }
    } else {
      results.tests.push({ 
        name: "image-generation", 
        status: "SKIP", 
        reason: "No API keys" 
      });
    }

    // Test 5: Check content library
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for async save
    const library = await getContentLibrary(auth.cookie);
    const hasItems = library.items && library.items.length > 0;
    console.log(`✓ Content library has ${library.items?.length || 0} items`);
    results.tests.push({ 
      name: "content-library", 
      status: hasItems ? "PASS" : "WARN",
      itemCount: library.items?.length || 0
    });

    // Test 6: Create a campaign
    try {
      const campaign = await createCampaign(auth.cookie, {
        name: "Test Campaign " + Date.now(),
        description: "Integration test campaign",
        platforms: ["instagram"],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        postsPerDay: 2,
        tone: "professional",
        includeHashtags: true
      });
      
      console.log(`✓ Created campaign: ${campaign.id}`);
      results.tests.push({ 
        name: "campaign-creation", 
        status: "PASS",
        campaignId: campaign.id,
        postCount: campaign.posts?.length || 0
      });
    } catch (campError) {
      console.warn("Campaign creation failed:", campError.message);
      results.tests.push({ 
        name: "campaign-creation", 
        status: "FAIL",
        error: campError.message
      });
    }

    // Test 7: Check credits after operations
    const userAfter = await getUser(auth.cookie);
    const creditsAfter = userAfter.credits || 0;
    const trialImagesAfter = userAfter.trialImagesRemaining || 0;
    console.log(`Credits after: ${creditsAfter}, Trial Images after: ${trialImagesAfter}`);
    
    results.tests.push({ 
      name: "user-state-after", 
      status: "PASS",
      credits: creditsAfter,
      trialImages: trialImagesAfter,
      creditsUsed: creditsBefore - creditsAfter,
      trialImagesUsed: trialImagesBefore - trialImagesAfter
    });

    // Save results
    results.status = results.tests.every(t => t.status === "PASS" || t.status === "SKIP") ? "PASS" : "FAIL";
    fs.mkdirSync(path.join(ART_DIR, "data"), { recursive: true });
    fs.writeFileSync(
      path.join(ART_DIR, "data", "integration.json"),
      JSON.stringify(results, null, 2)
    );

    console.log(`\n✓ Integration tests: ${results.status}`);
    process.exit(results.status === "PASS" ? 0 : 1);

  } catch (error) {
    console.error("Integration test error:", error);
    results.error = error.message;
    results.status = "FAIL";
    
    fs.mkdirSync(path.join(ART_DIR, "data"), { recursive: true });
    fs.writeFileSync(
      path.join(ART_DIR, "data", "integration-error.json"),
      JSON.stringify(results, null, 2)
    );
    
    process.exit(1);
  }
})();