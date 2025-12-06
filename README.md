# Mini Authentication + API Key System

A secure authentication and API key management system built with NestJS, TypeORM, and PostgreSQL for service-to-service access.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 🔑 **API Key Management** - Generate, rotate, and revoke API keys for service-to-service authentication
- 👥 **Role-Based Access Control** - User roles (User, Admin, Service) with permission-based restrictions
- 🛡️ **Security First** - Bcrypt password hashing, helmet middleware, rate limiting
- 📚 **Interactive API Documentation** - Swagger/OpenAPI documentation with authentication testing
- 🗄️ **PostgreSQL Database** - TypeORM with entity relationships and migrations
- ✅ **Input Validation** - Class-validator for request validation

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL 16 with TypeORM
- **Authentication:** JWT (@nestjs/jwt)
- **Security:** Bcrypt, Helmet, Throttler
- **Documentation:** Swagger/OpenAPI

## Description

This system provides two authentication methods:

1. **JWT Authentication** - For user-facing applications
2. **API Key Authentication** - For service-to-service communication with permission-based access control

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (or npm/yarn)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Obiski15/Service-to-Service-Auth.git
   cd Service-to-Service-Auth
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=mini_auth

   # JWT Secrets (generate with: openssl rand -base64 64)
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret

   # API Key Configuration
   API_KEY_PREFIX=sk_live_
   INTERNAL_SECRET=your_internal_secret

   # Server
   PORT=3000
   ```

4. **Set up the database**

   ```bash
   # Create database in PostgreSQL
   psql -U postgres -c "CREATE DATABASE mini_auth;"
   ```

5. **Run the application**

   ```bash
   # Development mode with hot reload
   pnpm run start:dev

   # Production mode
   pnpm run build
   pnpm run start:prod
   ```

## API Documentation

Once the application is running, access the interactive API documentation at:

- **Swagger UI:** http://localhost:3000/api/docs

The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication testing with JWT and API keys
- Example requests and responses

## Project Structure

```
src/
├── decorators/          # Custom decorators (@Public, @Roles, @RequirePermissions)
├── entities/           # TypeORM entities (User, ApiKey)
├── modules/
│   ├── auth/          # Authentication (JWT, login, register)
│   ├── user/          # User management
│   ├── api-key/       # API key CRUD operations
│   └── demo/          # Demo endpoints
├── types/             # TypeScript type definitions
├── app.module.ts      # Root module
└── main.ts           # Application entry point
```

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT-based authentication with refresh tokens
- ✅ API key hashing for secure storage
- ✅ Role-based access control (User, Admin, Service)
- ✅ Permission-based API key restrictions
- ✅ Rate limiting (10 requests per 60 seconds)
- ✅ Helmet middleware for security headers
- ✅ Input validation with class-validator
- ✅ CORS configuration

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```
