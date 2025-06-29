import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { UserSyncService } from '../../../application/services/user-sync.service';

@Injectable()
export class Auth0AuthGuard implements CanActivate {
  private readonly logger = new Logger(Auth0AuthGuard.name);
  private jwksClient: jwksClient.JwksClient;
  private auth0Domain: string;
  private auth0Audience: string;
  private allowedOrganizations: string[];

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private userSyncService: UserSyncService,
  ) {
    // Auth0設定の取得
    this.auth0Domain = this.configService.get<string>('AUTH0_DOMAIN') || '';
    this.auth0Audience = this.configService.get<string>('AUTH0_AUDIENCE') || '';
    
    if (!this.auth0Domain || !this.auth0Audience) {
      this.logger.error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be configured');
      throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be configured');
    }
    
    // 許可された組織IDを環境変数から取得
    const allowedOrgsEnv = this.configService.get<string>('ALLOWED_ORGANIZATIONS') || '';
    this.allowedOrganizations = allowedOrgsEnv.split(',').map(org => org.trim()).filter(org => org);
    
    if (this.allowedOrganizations.length === 0) {
      this.logger.warn('No ALLOWED_ORGANIZATIONS configured - all organizations will be allowed');
    } else {
      this.logger.log(`Allowed organizations: ${this.allowedOrganizations.join(', ')}`);
    }
    
    // Auth0ドメインからHTTPSプロトコルを除去
    this.auth0Domain = this.auth0Domain.replace('https://', '').replace('/', '');
    
    this.jwksClient = jwksClient({
      jwksUri: `https://${this.auth0Domain}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
    
    this.logger.log(`Auth0 Guard initialized with domain: ${this.auth0Domain}`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('No authorization token provided');
      throw new UnauthorizedException('No authorization token provided');
    }

    try {
      const decodedToken = await this.verifyToken(token);
      
      // Attach user information to request
      const namespace = 'https://api.procure-erp.com/';
      const userInfo = {
        sub: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        roles: decodedToken['https://app.procure-erp.com/roles'] || [],
        permissions: decodedToken['https://app.procure-erp.com/permissions'] || [],
        organization: decodedToken.org_id,
        scope: decodedToken.scope?.split(' ') || [],
        org_id: decodedToken[`${namespace}org_id`] || null,
        org_name: decodedToken[`${namespace}org_name`] || null,
        tenant_id: decodedToken[`${namespace}tenant_id`] || decodedToken[`${namespace}org_id`] || null,
      };
      
      // 組織ID検証（環境変数で許可された組織のみ）
      if (this.allowedOrganizations.length > 0) {
        const userOrgId = userInfo.org_id || userInfo.organization;
        if (!userOrgId || !this.allowedOrganizations.includes(userOrgId)) {
          this.logger.warn(`Access denied for organization: ${userOrgId}. Allowed: ${this.allowedOrganizations.join(', ')}`);
          throw new UnauthorizedException('Access denied: Organization not allowed');
        }
        this.logger.debug(`Organization validation passed: ${userOrgId}`);
      }
      
      // **CRITICAL FIX**: Sync user with database during authentication
      try {
        const dbUser = await this.userSyncService.syncUser(userInfo);
        this.logger.debug(`User sync completed for: ${userInfo.sub}, DB user ID: ${dbUser.id}, tenant: ${dbUser.tenant_id}`);
        
        // Attach both Auth0 and DB user information to request
        request.user = {
          ...userInfo,
          dbUser: dbUser, // Include complete DB user information
          id: dbUser.id, // Include DB user ID for convenience
          app_approved: dbUser.app_approved, // Include approval status
        };
      } catch (syncError) {
        this.logger.error(`User sync failed for ${userInfo.sub}: ${syncError.message}`);
        // Still allow authentication but log the sync failure
        // This prevents authentication failures due to DB issues
        request.user = userInfo;
      }
      
      this.logger.debug(`Authentication successful for user: ${decodedToken.sub}`);
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: any): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }

  private async verifyToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Decode the token without verification to get the header
      const decodedHeader = jwt.decode(token, { complete: true });
      
      if (!decodedHeader || !decodedHeader.header.kid) {
        return reject(new Error('Invalid token header'));
      }

      // Get the signing key
      this.jwksClient.getSigningKey(decodedHeader.header.kid, (err, key) => {
        if (err) {
          this.logger.error(`Failed to get signing key: ${err.message}`);
          return reject(err);
        }

        const signingKey = key?.getPublicKey();
        
        if (!signingKey) {
          this.logger.error('Failed to get public key from signing key');
          return reject(new Error('Failed to get public key'));
        }

        // Verify the token
        jwt.verify(
          token,
          signingKey,
          {
            audience: this.auth0Audience,
            issuer: `https://${this.auth0Domain}/`,
            algorithms: ['RS256'],
          },
          (error, decoded) => {
            if (error) {
              this.logger.error(`Token verification failed: ${error.message}`);
              return reject(error);
            }
            resolve(decoded);
          },
        );
      });
    });
  }
}
