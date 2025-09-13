#!/usr/bin/env tsx
// Script to fix admin password hash for spencerandtheteagues@gmail.com

import bcrypt from "bcryptjs";
import { storage } from "../server/storage.js";

async function fixAdminPassword() {
  console.log("🔧 Fixing admin password hash...\n");
  
  const adminEmail = "spencerandtheteagues@gmail.com";
  const plainPassword = "TheMar$Key$8!";
  
  try {
    // Find the admin user
    const adminUser = await storage.getUserByEmail(adminEmail);
    
    if (!adminUser) {
      console.log(`❌ Admin user not found: ${adminEmail}`);
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.username}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Current password field: ${adminUser.password?.substring(0, 20)}...`);
    
    // Check if password is already hashed (bcrypt hashes start with $2b$)
    if (adminUser.password && adminUser.password.startsWith('$2b$')) {
      console.log("✅ Password is already properly hashed!");
      
      // Test the current hash against the plain password
      const isValid = await bcrypt.compare(plainPassword, adminUser.password);
      if (isValid) {
        console.log("✅ Current hash matches the expected password!");
        console.log("🎉 Admin login should work correctly.");
      } else {
        console.log("❌ Current hash does not match expected password");
        console.log("🔄 Generating new hash...");
        await hashAndUpdate();
      }
    } else {
      console.log("⚠️  Password appears to be in plain text - fixing...");
      await hashAndUpdate();
    }
    
    async function hashAndUpdate() {
      // Hash the password
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      console.log(`🔐 Generated hash: ${hashedPassword.substring(0, 30)}...`);
      
      // Update the admin user
      await storage.updateUser(adminUser.id, {
        password: hashedPassword,
        emailVerified: true,
        isAdmin: true,
        role: "admin",
        accountStatus: "active",
        tier: "enterprise"
      });
      
      console.log("✅ Admin password updated successfully!");
      console.log("✅ Admin privileges confirmed!");
      console.log("✅ Email verified!");
      
      // Test the login
      console.log("\n🧪 Testing login...");
      const updatedUser = await storage.getUserByEmail(adminEmail);
      if (updatedUser && updatedUser.password) {
        const testLogin = await bcrypt.compare(plainPassword, updatedUser.password);
        if (testLogin) {
          console.log("🎉 Login test PASSED! Admin can now log in.");
        } else {
          console.log("❌ Login test FAILED! Something went wrong.");
        }
      }
    }
    
  } catch (error) {
    console.error("💥 Error fixing admin password:", error);
  }
  
  console.log("\n✨ Admin password fix completed!");
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAdminPassword()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { fixAdminPassword };