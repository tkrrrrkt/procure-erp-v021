import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as crypto from 'node:crypto';

export interface CspHeaderResult {
  policy: string;
  nonce?: string;
  reportOnly: boolean;
}

@Injectable()
export class CspService {
  private readonly logger = new Logger(CspService.name);
  
  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate CSP header content based on environment configuration
   */
  generateCspHeader(): CspHeaderResult {
    const isEnabled = this.configService.get<string>('CSP_ENABLED', 'true') === 'true';
    const reportOnly = this.configService.get<string>('CSP_REPORT_ONLY', 'false') === 'true';
    const nonceEnabled = this.configService.get<string>('CSP_NONCE_ENABLED', 'true') === 'true';
    
    if (!isEnabled) {
      this.logger.debug('CSP is disabled via configuration');
      return { policy: '', reportOnly: false };
    }

    const nonce = nonceEnabled ? this.generateNonce() : undefined;
    const allowedDomains = this.parseAllowedDomains();
    const reportUri = this.configService.get<string>('CSP_REPORT_URI', '');
    const httpsOnly = this.configService.get<string>('CSP_HTTPS_ONLY', 'true') === 'true';

    // Base CSP directives with security-first approach
    const nonceStr = nonce ? ` 'nonce-${nonce}'` : '';
    const directives: string[] = [
      `default-src 'self'`,
      `script-src 'self'${nonceStr} 'strict-dynamic'`,
      `style-src 'self'${nonceStr} 'unsafe-hashes'`,
      `img-src 'self' data: https:`,
      `font-src 'self' https:`,
      `connect-src 'self'`,
      `media-src 'self'`,
      `object-src 'none'`,
      `child-src 'none'`,
      `frame-src 'none'`,
      `frame-ancestors 'none'`,
      `form-action 'self'`,
      `base-uri 'self'`,
      `manifest-src 'self'`,
      `worker-src 'self'`
    ];

    // Add allowed domains to relevant directives
    if (allowedDomains.length > 0) {
      const domainList = allowedDomains.join(' ');
      directives[1] = `script-src 'self'${nonceStr} 'strict-dynamic' ${domainList}`;
      directives[2] = `style-src 'self'${nonceStr} 'unsafe-hashes' ${domainList}`;
      directives[5] = `connect-src 'self' ${domainList}`;
    }

    // Add HTTPS upgrade directive if enabled
    if (httpsOnly) {
      directives.push('upgrade-insecure-requests');
    }

    // Add report URI if configured
    if (reportUri) {
      directives.push(`report-uri ${reportUri}`);
    }

    const policy = directives.join('; ');

    this.logger.debug(`Generated CSP policy: ${policy}`);
    
    return {
      policy,
      nonce,
      reportOnly
    };
  }

  /**
   * Apply CSP headers to HTTP response
   */
  applyCspHeaders(req: Request, res: Response): string | undefined {
    try {
      const { policy, nonce, reportOnly } = this.generateCspHeader();
      
      if (!policy) {
        return undefined;
      }

      const headerName = reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

      res.setHeader(headerName, policy);
      
      // Add additional security headers
      this.applyAdditionalSecurityHeaders(res);
      
      this.logger.debug(`Applied CSP header: ${headerName}`);
      
      return nonce;
    } catch (error) {
      this.logger.error('Failed to apply CSP headers', error);
      return undefined;
    }
  }

  /**
   * Generate secure random nonce for CSP
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Parse and validate allowed domains from configuration
   */
  private parseAllowedDomains(): string[] {
    const domainsConfig = this.configService.get<string>('CSP_ALLOWED_DOMAINS', '');
    
    if (!domainsConfig) {
      return [];
    }

    return domainsConfig
      .split(',')
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0)
      .map(domain => domain.startsWith('https://') ? domain : `https://${domain}`);
  }

  /**
   * Apply additional security headers beyond CSP
   */
  private applyAdditionalSecurityHeaders(res: Response): void {
    // X-Frame-Options
    const xFrameOptions = this.configService.get<string>('X_FRAME_OPTIONS', 'DENY');
    res.setHeader('X-Frame-Options', xFrameOptions);

    // X-Content-Type-Options
    const xContentTypeOptions = this.configService.get<string>('X_CONTENT_TYPE_OPTIONS', 'nosniff');
    res.setHeader('X-Content-Type-Options', xContentTypeOptions);

    // Referrer-Policy
    const referrerPolicy = this.configService.get<string>('REFERRER_POLICY', 'strict-origin-when-cross-origin');
    res.setHeader('Referrer-Policy', referrerPolicy);

    // Permissions-Policy
    const permissionsPolicy = this.configService.get<string>('PERMISSIONS_POLICY', 'geolocation=(), microphone=(), camera=()');
    if (permissionsPolicy) {
      res.setHeader('Permissions-Policy', permissionsPolicy);
    }

    // Strict-Transport-Security (HSTS)
    const hstsMaxAge = this.configService.get<string>('HSTS_MAX_AGE', '31536000');
    const hstsIncludeSubdomains = this.configService.get<string>('HSTS_INCLUDE_SUBDOMAINS', 'true') === 'true';
    const hstsPreload = this.configService.get<string>('HSTS_PRELOAD', 'true') === 'true';
    
    let hstsValue = `max-age=${hstsMaxAge}`;
    if (hstsIncludeSubdomains) hstsValue += '; includeSubDomains';
    if (hstsPreload) hstsValue += '; preload';
    
    res.setHeader('Strict-Transport-Security', hstsValue);
  }

  /**
   * Validate CSP configuration on startup
   */
  validateConfiguration(): boolean {
    const required = ['CSP_ENABLED'];
    const missing = required.filter(key => !this.configService.get(key));
    
    if (missing.length > 0) {
      this.logger.warn(`Missing CSP configuration: ${missing.join(', ')}`);
      return false;
    }

    this.logger.log('CSP configuration validated successfully');
    return true;
  }

  /**
   * Get CSP configuration summary for debugging
   */
  getConfigurationSummary(): Record<string, any> {
    return {
      enabled: this.configService.get<string>('CSP_ENABLED', 'true') === 'true',
      reportOnly: this.configService.get<string>('CSP_REPORT_ONLY', 'false') === 'true',
      reportUri: this.configService.get<string>('CSP_REPORT_URI', ''),
      allowedDomains: this.parseAllowedDomains(),
      httpsOnly: this.configService.get<string>('CSP_HTTPS_ONLY', 'true') === 'true',
      nonceEnabled: this.configService.get<string>('CSP_NONCE_ENABLED', 'true') === 'true'
    };
  }

  /**
   * Get CSP statistics for main.ts bootstrap logging
   */
  getCspStatistics(): {
    enabled: boolean;
    reportOnly: boolean;
    enforceHttps: boolean;
    allowedDomainsCount: number;
  } {
    const allowedDomains = this.parseAllowedDomains();
    
    return {
      enabled: this.configService.get<string>('CSP_ENABLED', 'true') === 'true',
      reportOnly: this.configService.get<string>('CSP_REPORT_ONLY', 'false') === 'true',
      enforceHttps: this.configService.get<string>('CSP_HTTPS_ONLY', 'true') === 'true',
      allowedDomainsCount: allowedDomains.length
    };
  }

  /**
   * Get all security headers as an object for testing purposes
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // CSP Header
    const { policy, reportOnly } = this.generateCspHeader();
    if (policy) {
      const headerName = reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      headers[headerName] = policy;
    }
    
    // Additional Security Headers
    headers['X-Frame-Options'] = this.configService.get<string>('X_FRAME_OPTIONS', 'DENY');
    headers['X-Content-Type-Options'] = this.configService.get<string>('X_CONTENT_TYPE_OPTIONS', 'nosniff');
    headers['Referrer-Policy'] = this.configService.get<string>('REFERRER_POLICY', 'strict-origin-when-cross-origin');
    
    const permissionsPolicy = this.configService.get<string>('PERMISSIONS_POLICY', 'geolocation=(), microphone=(), camera=()');
    if (permissionsPolicy) {
      headers['Permissions-Policy'] = permissionsPolicy;
    }
    
    // HSTS Header
    const hstsMaxAge = this.configService.get<string>('HSTS_MAX_AGE', '31536000');
    const hstsIncludeSubdomains = this.configService.get<string>('HSTS_INCLUDE_SUBDOMAINS', 'true') === 'true';
    const hstsPreload = this.configService.get<string>('HSTS_PRELOAD', 'true') === 'true';
    
    let hstsValue = `max-age=${hstsMaxAge}`;
    if (hstsIncludeSubdomains) hstsValue += '; includeSubDomains';
    if (hstsPreload) hstsValue += '; preload';
    
    headers['Strict-Transport-Security'] = hstsValue;
    
    return headers;
  }
}
