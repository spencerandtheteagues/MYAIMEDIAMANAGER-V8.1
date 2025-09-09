import { Router } from "express";
import type { IStorage } from "./storage";
import { InsertBrandProfile } from "@shared/schema";

export function createBrandRoutes(storage: IStorage) {
  const router = Router();
  
  // Get brand profile for current user
  router.get("/api/brand/profile", async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const profile = await storage.getBrandProfile(req.user.id);
      if (!profile) {
        // Return default profile structure if none exists
        return res.json({
          brandName: req.user.businessName || "",
          voice: "friendly",
          targetAudience: "",
          products: [],
          valueProps: [],
          bannedPhrases: [],
          requiredDisclaimers: [],
          preferredCTAs: ["Learn More", "Get Started", "Contact Us"],
          keywords: []
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching brand profile:", error);
      res.status(500).json({ error: "Failed to fetch brand profile" });
    }
  });
  
  // Create or update brand profile
  router.put("/api/brand/profile", async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const {
        brandName,
        voice,
        targetAudience,
        products,
        valueProps,
        bannedPhrases,
        requiredDisclaimers,
        preferredCTAs,
        keywords
      } = req.body;
      
      // Check if profile exists
      const existing = await storage.getBrandProfile(req.user.id);
      
      if (existing) {
        // Update existing profile
        const updated = await storage.updateBrandProfile(req.user.id, {
          brandName,
          voice,
          targetAudience,
          products: products || [],
          valueProps: valueProps || [],
          bannedPhrases: bannedPhrases || [],
          requiredDisclaimers: requiredDisclaimers || [],
          preferredCTAs: preferredCTAs || ["Learn More"],
          keywords: keywords || []
        });
        return res.json(updated);
      } else {
        // Create new profile
        const newProfile: InsertBrandProfile = {
          userId: req.user.id,
          brandName: brandName || req.user.businessName || "My Brand",
          voice: voice || "friendly",
          targetAudience: targetAudience || "",
          products: products || [],
          valueProps: valueProps || [],
          bannedPhrases: bannedPhrases || [],
          requiredDisclaimers: requiredDisclaimers || [],
          preferredCTAs: preferredCTAs || ["Learn More"],
          keywords: keywords || []
        };
        
        const created = await storage.createBrandProfile(newProfile);
        res.json(created);
      }
    } catch (error) {
      console.error("Error updating brand profile:", error);
      res.status(500).json({ error: "Failed to update brand profile" });
    }
  });
  
  return router;
}