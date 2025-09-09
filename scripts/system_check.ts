import fetch from "node-fetch";

const base = process.env.CHECK_BASE_URL || "http://localhost:5000";
const user = process.env.CHECK_USER || "starter-user-1";

function hdrs() { 
  return { 
    "x-user-id": user, 
    "content-type": "application/json" 
  }; 
}

async function expect2xx(path: string, init?: any) {
  const r = await fetch(base + path, init);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${path} => ${r.status} ${text}`);
  }
  return r.json().catch(() => ({}));
}

(async () => {
  const report: any = { ok: false, steps: [] };
  
  try {
    // 1. Health check
    console.log("🔍 Checking health...");
    await expect2xx("/health");
    report.steps.push({ step: "health", ok: true });

    // 2. Ready check (DB connection)
    console.log("🔍 Checking DB readiness...");
    await expect2xx("/ready");
    report.steps.push({ step: "ready", ok: true });

    // 3. Brand profile setup
    console.log("🔍 Setting up brand profile...");
    await expect2xx("/api/brand/profile", { 
      method: "PUT", 
      headers: hdrs(), 
      body: JSON.stringify({
        brandName: "Redbird Bakehouse", 
        voice: "friendly", 
        targetAudience: "local foodies and families", 
        valueProps: ["fresh daily", "local ingredients", "custom cakes"],
        preferredCTAs: ["Pre-order today", "Visit us", "DM to order"]
      })
    });
    report.steps.push({ step: "brandProfile", ok: true });

    // 4. Text quality generation
    console.log("🔍 Testing content generation...");
    let r = await expect2xx("/api/content/generate", { 
      method: "POST", 
      headers: hdrs(), 
      body: JSON.stringify({
        platform: "x", 
        postType: "promo", 
        tone: "friendly", 
        theme: "grand opening"
      })
    });
    
    if (!r.ok) throw new Error("content.generate failed");
    const quality = r.scores?.[0]?.overall || r.best?.score?.overall || 0;
    report.steps.push({ 
      step: "content.generate", 
      ok: true, 
      quality,
      passesThreshold: quality >= 7
    });

    // 5. Image generation (optional keys)
    console.log("🔍 Testing image generation...");
    try {
      const img = await expect2xx("/api/ai/image", { 
        method: "POST", 
        headers: hdrs(), 
        body: JSON.stringify({ 
          prompt: "minimal product shot, clean background", 
          platform: "instagram" 
        })
      });
      report.steps.push({ 
        step: "image.generate", 
        ok: true, 
        id: img.id || true 
      });
    } catch (e: any) {
      // Skip if no API keys
      if (e.message.includes("GOOGLE_") || e.message.includes("VERTEX_")) {
        report.steps.push({ 
          step: "image.generate", 
          ok: false, 
          skipped: true, 
          reason: "No AI keys configured" 
        });
      } else {
        throw e;
      }
    }

    // 6. 14-post campaign
    console.log("🔍 Testing campaign generation...");
    const camp = await expect2xx("/api/campaigns/generate", { 
      method: "POST", 
      headers: hdrs(), 
      body: JSON.stringify({ 
        platform: "instagram", 
        theme: "opening week", 
        postType: "promo" 
      })
    });
    
    if (!Array.isArray(camp.posts) || camp.posts.length !== 14) {
      throw new Error(`campaign size != 14 (got ${camp.posts?.length})`);
    }
    
    // Check variety
    const hooks = camp.posts.map((p: any) => String(p.caption).split("\n")[0]);
    const uniqueHooks = new Set(hooks).size;
    
    report.steps.push({ 
      step: "campaign.generate", 
      ok: true,
      postCount: camp.posts.length,
      uniqueHooks,
      hasVariety: uniqueHooks >= 10
    });

    // 7. Credits check
    console.log("🔍 Checking credits system...");
    const bal = await expect2xx("/api/credits/me", { headers: hdrs() });
    if (typeof bal.remaining !== "number") {
      throw new Error("no credit balance");
    }
    report.steps.push({ 
      step: "credits", 
      ok: true, 
      remaining: bal.remaining 
    });

    // 8. Library autosave check
    console.log("🔍 Checking content library...");
    const lib = await expect2xx("/api/library?kind=image", { headers: hdrs() });
    report.steps.push({ 
      step: "library.image", 
      ok: Array.isArray(lib),
      itemCount: lib.length || 0
    });

    // 9. Prepublish moderation block
    console.log("🔍 Testing moderation gates...");
    let post = await expect2xx("/api/posts", { 
      method: "POST", 
      headers: hdrs(), 
      body: JSON.stringify({ 
        kind: "image", 
        caption: "Buy illegal drugs now! NSFW content here!",
        platform: "instagram"
      })
    });
    
    const pub = await fetch(base + "/api/posts/publish", { 
      method: "POST", 
      headers: hdrs(), 
      body: JSON.stringify({ id: post.id })
    });
    
    report.steps.push({ 
      step: "moderation.prepublish", 
      ok: pub.status === 422,
      blocked: pub.status === 422,
      status: pub.status
    });

    // 10. Feedback system
    console.log("🔍 Testing feedback system...");
    try {
      await expect2xx("/api/feedback", {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({
          contentId: "test-content-1",
          contentType: "post",
          feedback: "thumbs_up",
          qualityScore: 8.5,
          platform: "instagram"
        })
      });
      
      const stats = await expect2xx("/api/feedback/stats", { headers: hdrs() });
      report.steps.push({ 
        step: "feedback", 
        ok: true,
        stats: stats
      });
    } catch (e) {
      report.steps.push({ 
        step: "feedback", 
        ok: false,
        error: String(e)
      });
    }

    // 11. Metrics endpoint
    console.log("🔍 Testing metrics collection...");
    const metrics = await expect2xx("/metrics");
    report.steps.push({ 
      step: "metrics", 
      ok: true,
      hasData: Object.keys(metrics).length > 0
    });

    // Final summary
    report.ok = report.steps.every(s => s.ok || s.skipped);
    
    console.log("\n" + "=".repeat(60));
    console.log("SYSTEM CHECK REPORT");
    console.log("=".repeat(60));
    console.log(JSON.stringify(report, null, 2));
    
    if (report.ok) {
      console.log("\n✅ ALL CHECKS PASSED!");
    } else {
      console.log("\n❌ SOME CHECKS FAILED");
    }
    
    process.exit(report.ok ? 0 : 1);
    
  } catch (e) {
    report.error = String(e);
    console.error("\n❌ SYSTEM CHECK FAILED:");
    console.error(e);
    console.log("\nReport:");
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
})();