import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.auth0.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.procure-erp.com https://*.auth0.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '));

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy', [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'fullscreen=(self)',
      'sync-xhr=()'
    ].join(', '));

    // Strict-Transport-Security (HSTS)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Cross-Origin-Embedder-Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin-Opener-Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Clear-Site-Data on logout
    if (req.path.includes('/logout')) {
      res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
    }

    next();
  }
}
