import { Router, Request, Response } from "express";
import { pool } from "./db";

const router = Router();

// Health check - always returns 200 if service is running
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "myaimediamgr"
  });
});

// Ready check - returns 200 if all dependencies are ready, 503 otherwise
router.get("/ready", async (_req: Request, res: Response) => {
  const checks = {
    database: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Check database connectivity
    const result = await pool.query("SELECT 1 as alive");
    checks.database = result.rows[0]?.alive === 1;
    
    // All checks must pass for service to be ready
    const isReady = checks.database;
    
    if (isReady) {
      res.status(200).json({
        status: "ready",
        checks,
        timestamp: checks.timestamp
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        checks,
        timestamp: checks.timestamp
      });
    }
  } catch (error) {
    console.error("Ready check failed:", error);
    res.status(503).json({
      status: "error",
      checks,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: checks.timestamp
    });
  }
});

// Basic metrics endpoint
router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    // Get basic database metrics
    const dbMetrics = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM campaigns) as total_campaigns,
        (SELECT COUNT(*) FROM platforms WHERE is_connected = true) as connected_platforms
    `);
    
    // Memory usage
    const memUsage = process.memoryUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
        external: Math.round(memUsage.external / 1024 / 1024) + "MB"
      },
      database: dbMetrics.rows[0] || {},
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error) {
    console.error("Metrics error:", error);
    res.status(500).json({ 
      error: "Failed to collect metrics",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;