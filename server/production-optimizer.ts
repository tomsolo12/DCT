import { Request, Response, NextFunction } from 'express';
import { systemHealthMonitor } from './system-health-monitor';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class ProductionOptimizer {
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private readonly defaultCacheTTL = 300000; // 5 minutes
  private readonly defaultRateLimit = 100; // requests per minute
  private readonly rateLimitWindow = 60000; // 1 minute

  // Performance monitoring middleware
  performanceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        systemHealthMonitor.recordApiCall(req.path, responseTime);
        
        // Log slow requests
        if (responseTime > 1000) {
          console.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
        }
      });
      
      next();
    };
  }

  // Rate limiting middleware
  rateLimitMiddleware(limit: number = this.defaultRateLimit) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = this.getClientIdentifier(req);
      const now = Date.now();
      
      const entry = this.rateLimits.get(clientId);
      
      if (!entry || now > entry.resetTime) {
        // Reset or create new entry
        this.rateLimits.set(clientId, {
          count: 1,
          resetTime: now + this.rateLimitWindow
        });
        next();
      } else if (entry.count < limit) {
        // Increment count
        entry.count++;
        next();
      } else {
        // Rate limit exceeded
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
      }
    };
  }

  // Caching middleware
  cacheMiddleware(ttl: number = this.defaultCacheTTL) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        next();
        return;
      }

      const cacheKey = this.generateCacheKey(req);
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.json(cached);
        return;
      }

      // Store original json method
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache the response
        if (res.statusCode === 200) {
          optimizer.setCache(cacheKey, data, ttl);
        }
        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Error handling middleware
  errorHandlingMiddleware() {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('API Error:', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      // Don't expose internal errors in production
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (err.type === 'validation') {
        res.status(400).json({
          error: 'Validation failed',
          details: isProduction ? undefined : err.details
        });
      } else if (err.type === 'authorization') {
        res.status(403).json({
          error: 'Access denied'
        });
      } else if (err.type === 'not_found') {
        res.status(404).json({
          error: 'Resource not found'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: isProduction ? 'Something went wrong' : err.message
        });
      }
    };
  }

  // Security headers middleware
  securityHeadersMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Basic security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // CORS headers for API
      if (req.path.startsWith('/api/')) {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }

      next();
    };
  }

  // Compression and optimization
  optimizeResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add ETag for caching
      if (req.method === 'GET') {
        const originalJson = res.json;
        res.json = function(data: any) {
          const etag = optimizer.generateETag(data);
          res.setHeader('ETag', etag);
          
          // Check if client has cached version
          if (req.headers['if-none-match'] === etag) {
            res.status(304).end();
            return res;
          }
          
          return originalJson.call(this, data);
        };
      }

      next();
    };
  }

  private getClientIdentifier(req: Request): string {
    // Use IP address or API key for identification
    return req.headers['x-api-key'] as string || 
           req.headers['x-forwarded-for'] as string || 
           req.connection.remoteAddress || 
           'unknown';
  }

  private generateCacheKey(req: Request): string {
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query);
    return `${req.method}:${url}:${query}`;
  }

  private generateETag(data: any): string {
    // Simple hash function for ETag generation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setCache(key: string, data: any, ttl: number = this.defaultCacheTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Background cleanup tasks
  startBackgroundTasks(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 300000);

    // Clean up old rate limit entries every minute
    setInterval(() => {
      this.cleanupExpiredRateLimits();
    }, 60000);

    // Clear resolved alerts every hour
    setInterval(() => {
      systemHealthMonitor.clearResolvedAlerts();
    }, 3600000);

    console.log('Background cleanup tasks started');
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime) {
        this.rateLimits.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired rate limit entries`);
    }
  }

  getCacheStats(): {
    totalEntries: number;
    memoryUsage: number;
    hitRate: number;
  } {
    const totalEntries = this.cache.size;
    const memoryUsage = JSON.stringify(Array.from(this.cache.values())).length;
    
    return {
      totalEntries,
      memoryUsage,
      hitRate: 0 // Would track actual hit rate in production
    };
  }

  getRateLimitStats(): {
    activeClients: number;
    totalRequests: number;
    blockedRequests: number;
  } {
    const activeClients = this.rateLimits.size;
    const totalRequests = Array.from(this.rateLimits.values())
      .reduce((sum, entry) => sum + entry.count, 0);
    
    return {
      activeClients,
      totalRequests,
      blockedRequests: 0 // Would track actual blocked requests
    };
  }
}

export const optimizer = new ProductionOptimizer();