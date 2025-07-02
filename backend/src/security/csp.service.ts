import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';

interface CspDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
  baseUri: string[];
  formAction: string[];
  reportUri?: string;
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

interface CspConfiguration {
  enabled: boolean;
  reportOnly: boolean;
  reportUri?: string;
  allowedDomains: string[];
  enforceHttps: boolean;
  nonce?: string;
}

/**
 * Enterprise-grade Content Security Policy (CSP) Service
 * 
 * Provides dynamic CSP header generation with nonce-based policies
 * Removes unsafe-inline and unsafe-eval directives for maximum security
 * Supports environment-driven configuration and violation reporting
 */
@Injectable()
export class CspService {
  private readonly logger = new Logger(CspService.name);
  private readonly cspConfig: CspConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.cspConfig = {
      enabled: this.configService.get<boolean>('CSP_ENABLED', true),
      reportOnly: this.configService.get<boolean>('CSP_REPORT_ONLY', false),
      reportUri: this.configService.get<string>('CSP_REPORT_URI'),
      allowedDomains: this.parseDomains(this.configService.get<string>('CSP_ALLOWED_DOMAINS', '')),
      enforceHttps: this.configService.get<boolean>('CSP_ENFORCE_HTTPS', true),
    };

    this.logger.log('CSP Service initialized', {
      enabled: this.cspConfig.enabled,
      reportOnly: this.cspConfig.reportOnly,
      enforceHttps: this.cspConfig.enforceHttps,
      allowedDomainsCount: this.cspConfig.allowedDomains.length,
    });
  }

  /**
   * Generate a cryptographically secure nonce for CSP
   */
  generateNonce(): string {
    return randomBytes(16).toString('base64');
  }

  /**
   * Build CSP configuration with nonce-based policies
   */
  buildCspConfig(nonce: string): CspDirectives {
    const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN', '');
    const allowedDomains = this.cspConfig.allowedDomains;

    const directives: CspDirectives = {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        // Auth0 domains for authentication
        ...(auth0Domain ? [`https://${auth0Domain}`, `https://*.${auth0Domain}`] : []),
        // Additional allowed domains
        ...allowedDomains.map(domain => `https://${domain}`),
      ],
      styleSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        // Auth0 domains for styling
        ...(auth0Domain ? [`https://${auth0Domain}`, `https://*.${auth0Domain}`] : []),
        // Additional allowed domains
        ...allowedDomains.map(domain => `https://${domain}`),
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        // Auth0 domains for images
        ...(auth0Domain ? [`https://${auth0Domain}`, `https://*.${auth0Domain}`] : []),
        // Additional allowed domains
        ...allowedDomains.map(domain => `https://${domain}`),
      ],
      connectSrc: [
        "'self'",
        // Auth0 domains for API calls
        ...(auth0Domain ? [`https://${auth0Domain}`, `https://*.${auth0Domain}`] : []),
        // Additional allowed domains
        ...allowedDomains.map(domain => `https://${domain}`),
      ],
      fontSrc: [
        "'self'",
        "data:",
        // Auth0 domains for fonts
        ...(auth0Domain ? [`https://${auth0Domain}`, `https://*.${auth0Domain}`] : []),
        // Additional allowed domains
        ...allowedDomains.map(domain => `https://${domain}`),
      ],
      frameSrc: [
        // Auth0 domains for iframe embedding
        ...(auth0Domain ? [`https://${auth0Domain}`, `https://*.${auth0Domain}`] : []),
        // Additional allowed domains
        ...allowedDomains.map(domain => `https://${domain}`),
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: [
        "'self'",
        // Allow form submissions to Auth0
        ...(auth0Domain ? [`https://${auth0Domain}`] : []),
      ],
    };

    // Add report URI if configured
    if (this.cspConfig.reportUri) {
      directives.reportUri = this.cspConfig.reportUri;
    }

    // Add HTTPS enforcement directives
    if (this.cspConfig.enforceHttps) {
      directives.upgradeInsecureRequests = true;
      directives.blockAllMixedContent = true;
    }

    return directives;
  }

  /**
   * Generate CSP header string from directives
   */
  generateCspHeader(directives: CspDirectives): string {
    const policies: string[] = [];

    // Convert directives to policy strings
    policies.push(`default-src ${directives.defaultSrc.join(' ')}`);
    policies.push(`script-src ${directives.scriptSrc.join(' ')}`);
    policies.push(`style-src ${directives.styleSrc.join(' ')}`);
    policies.push(`img-src ${directives.imgSrc.join(' ')}`);
    policies.push(`connect-src ${directives.connectSrc.join(' ')}`);
    policies.push(`font-src ${directives.fontSrc.join(' ')}`);
    policies.push(`frame-src ${directives.frameSrc.join(' ')}`);
    policies.push(`object-src ${directives.objectSrc.join(' ')}`);
    policies.push(`base-uri ${directives.baseUri.join(' ')}`);
    policies.push(`form-action ${directives.formAction.join(' ')}`);

    // Add optional directives
    if (directives.upgradeInsecureRequests) {
      policies.push('upgrade-insecure-requests');
    }

    if (directives.blockAllMixedContent) {
      policies.push('block-all-mixed-content');
    }

    if (directives.reportUri) {
      policies.push(`report-uri ${directives.reportUri}`);
    }

    return policies.join('; ');
  }

  /**
   * Apply CSP headers to response
   */
  applyCspHeaders(req: Request, res: Response): string {
    if (!this.cspConfig.enabled) {
      this.logger.debug('CSP is disabled, skipping header application');
      return '';
    }

    const nonce = this.generateNonce();
    const directives = this.buildCspConfig(nonce);
    const cspHeader = this.generateCspHeader(directives);

    // Determine header name based on report-only mode
    const headerName = this.cspConfig.reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';

    // Set CSP header
    res.setHeader(headerName, cspHeader);

    // Set nonce in custom header for frontend usage
    res.setHeader('X-CSP-Nonce', nonce);

    // Add additional security headers
    this.addSecurityHeaders(res);

    this.logger.debug('CSP headers applied', {
      nonce: nonce.substring(0, 8) + '...',
      reportOnly: this.cspConfig.reportOnly,
      headerLength: cspHeader.length,
      url: req.url,
      method: req.method,
    });

    return nonce;
  }

  /**
   * Add comprehensive security headers
   */
  private addSecurityHeaders(res: Response): void {
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Cross-Origin Policies
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

    // HSTS (if HTTPS enforcement is enabled)
    if (this.cspConfig.enforceHttps) {
      res.setHeader('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload');
    }

    // Report-To header for violation reporting
    if (this.cspConfig.reportUri) {
      res.setHeader('Report-To', JSON.stringify({
        group: 'csp-endpoint',
        max_age: 10886400,
        endpoints: [{ url: this.cspConfig.reportUri }],
        include_subdomains: true,
      }));
    }
  }

  /**
   * Parse comma-separated domains from environment variable
   */
  private parseDomains(domainsString: string): string[] {
    if (!domainsString) return [];
    
    return domainsString
      .split(',')
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0);
  }

  /**
   * Get CSP configuration for debugging/monitoring
   */
  getCspConfiguration(): CspConfiguration {
    return { ...this.cspConfig };
  }

  /**
   * Get CSP statistics
   */
  getCspStatistics() {
    return {
      enabled: this.cspConfig.enabled,
      reportOnly: this.cspConfig.reportOnly,
      enforceHttps: this.cspConfig.enforceHttps,
      allowedDomainsCount: this.cspConfig.allowedDomains.length,
      allowedDomains: this.cspConfig.allowedDomains,
      reportUri: this.cspConfig.reportUri,
      timestamp: new Date().toISOString(),
    };
  }
}
