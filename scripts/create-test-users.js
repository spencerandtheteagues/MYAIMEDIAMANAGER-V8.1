// scripts/create-test-users.js
import fs from "node:fs";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";
const headers = { "Content-Type": "application/json" };

async function createUser(email, password, username, businessName, tier = 'trial') {
  console.log(`Creating user: ${email} (${tier})`);
  
  try {
    // Try signup
    const signupResponse = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        password,
        username,
        businessName
      })
    });
    
    if (signupResponse.ok) {
      console.log(`✓ Created user: ${email}`);
      return true;
    }
    
    // If user exists, try login to verify
    const loginResponse = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password })
    });
    
    if (loginResponse.ok) {
      console.log(`✓ User exists and verified: ${email}`);
      return true;
    }
    
    console.error(`✗ Failed to create or verify user: ${email}`);
    return false;
  } catch (error) {
    console.error(`Error creating user ${email}:`, error.message);
    return false;
  }
}

(async () => {
  console.log("Creating test users...\n");
  
  const testUsers = [
    {
      email: 'test-enterprise@myaimediamgr.com',
      password: 'Test123!@#',
      username: 'test-enterprise',
      businessName: 'Test Enterprise Co',
      tier: 'enterprise'
    },
    {
      email: 'test-trial@myaimediamgr.com',
      password: 'Test123!@#',
      username: 'test-trial',
      businessName: 'Test Trial Business',
      tier: 'trial'
    },
    {
      email: 'test-pro@myaimediamgr.com',
      password: 'Test123!@#',
      username: 'test-pro',
      businessName: 'Test Pro Agency',
      tier: 'professional'
    }
  ];
  
  let created = 0;
  for (const user of testUsers) {
    const success = await createUser(
      user.email,
      user.password,
      user.username,
      user.businessName,
      user.tier
    );
    if (success) created++;
  }
  
  console.log(`\n✅ Created/verified ${created}/${testUsers.length} test users`);
  
  // Save test user credentials for reference
  const credsFile = './test-users.json';
  fs.writeFileSync(credsFile, JSON.stringify(testUsers, null, 2));
  console.log(`📁 Test user credentials saved to ${credsFile}`);
  
  process.exit(created === testUsers.length ? 0 : 1);
})();