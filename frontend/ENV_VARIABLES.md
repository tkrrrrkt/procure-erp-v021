# 🔐 **Environment Variables Configuration**

## **Frontend (.env.local)**

```bash
# Auth0 Configuration for Frontend
NEXT_PUBLIC_AUTH0_DOMAIN=dev-22lwwfj3g02rol8a.jp.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=y01U0CO0qzMTCKipxbdtrPh0DGopiOZQ
NEXT_PUBLIC_AUTH0_AUDIENCE=http://localhost:3001/api/v1
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_AUTH0_SCOPE=openid profile email org_id

# Multi-Tenant Configuration
# Comma-separated list of allowed Auth0 Organization IDs
ALLOWED_ORGANIZATIONS=org_HHiSxAxNqdJoipla

# Application Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=ProcureERP
```

## **Backend (.env)**

```bash
# Auth0 Configuration for Backend
AUTH0_DOMAIN=dev-22lwwfj3g02rol8a.jp.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_AUDIENCE=http://localhost:3001/api/v1

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/procure_erp_dev?search_path=v001

# Application
NODE_ENV=development
PORT=3001
```

## **Security Notes**

1. **Never commit .env files** to version control
2. **Use different Auth0 applications** for development and production
3. **Rotate client secrets** regularly
4. **Use HTTPS** in production environments
5. **Validate all environment variables** on application startup

## **Organization Setup**

Current allowed organizations in middleware:
- `org_HHiSxAxNqdJoipla` (sint organization - Auth0 Organization ID)

To add more organizations:
1. Update `ALLOWED_ORGANIZATIONS` in both frontend and backend environment variables
2. Create corresponding Auth0 Organizations in Auth0 Dashboard
3. Add organization members in Auth0 Dashboard
4. Deploy Auth0 Post-Login Action
5. Update middleware.ts with new organization IDs

### Testing URLs

For the `sint` organization:
```bash
# Correct login URL
http://localhost:3000/login?organization=org_HHiSxAxNqdJoipla

# Security test URLs (should show error page)
http://localhost:3000/login?organization=invalid_org
http://localhost:3000/login  # Missing organization parameter
