# Paystack Wallet Service

A secure wallet and authentication system built with NestJS, TypeORM, and PostgreSQL. Supports JWT, Google OAuth, API Key authentication, Paystack integration, and robust wallet operations.

---

## Features

- 🔐 **JWT Authentication**: Secure user login, registration, and token refresh
- 🔑 **API Key Management**: Generate, rotate, revoke keys for service-to-service auth
- 👥 **Role-Based Access Control**: User, Admin, Service roles
- 🛡️ **Security**: Bcrypt hashing, helmet, rate limiting, input validation
- 💳 **Wallet Operations**: Deposit, transfer, balance, transaction history
- 💰 **Paystack Integration**: Webhook endpoint for payment notifications
- 🌐 **Google OAuth**: Social login support
- 📚 **Swagger API Docs**: Interactive docs at `/api/docs`
- 🗄️ **PostgreSQL Database**: TypeORM entities and migrations

---

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (TypeORM)
- **Authentication:** JWT, Google OAuth, API Key
- **Payments:** Paystack
- **Docs:** Swagger/OpenAPI

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Obiski15/Service-to-Service-Auth.git
   cd paystack-wallet-service
   ```

````
2. **Install dependencies**
   ```bash
pnpm install
````

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

````
   Edit `.env` with your DB, JWT, Paystack, and Google credentials.

4. **Set up the database**
   ```bash
docker exec -it <postgres_container> psql -U <db_user> -c "CREATE DATABASE paystack_wallet_service;"
````

5. **Run the application**
   ```bash
   pnpm run start:dev
   ```

````

---

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=root
DB_PASSWORD=user
DB_DATABASE=paystack_wallet_service

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
API_KEY_PREFIX=sk_live_
PORT=3000
APP_URL=
PAYSTACK_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...
````

---

## API Documentation

- **Swagger UI:** http://localhost:3000/api/docs
- All endpoints, request/response schemas, authentication testing

---

## Main Endpoints

### Auth

- `POST /auth/register` — Register user
- `POST /auth/login` — Login
- `POST /auth/refresh` — Refresh token
- `GET /auth/google` — Google OAuth login
- `GET /auth/google/callback` — Google OAuth callback

### Wallet

- `POST /wallet/deposit` — Deposit money
- `GET /wallet/balance` — Get balance
- `GET /wallet/transactions` — Transaction history
- `POST /wallet/transfer` — Transfer funds
- `POST /wallet/paystack/webhook` — Paystack webhook

### API Keys

- `POST /keys` — Create API key
- `GET /keys` — List API keys
- `PATCH /keys/:id/rotate` — Rotate key
- `PATCH /keys/:id/revoke` — Revoke key
- `DELETE /keys/:id` — Delete key

---

## Project Structure

```
src/
├── decorators/          # Custom decorators (@Public, @Roles, @RequirePermissions)
├── entities/            # TypeORM entities (User, Wallet, ApiKey)
├── modules/
│   ├── auth/            # Auth (JWT, Google, guards)
│   ├── user/            # User management
│   ├── api-key/         # API key CRUD
│   ├── wallet/          # Wallet logic
│
├── types/               # TypeScript types
├── app.module.ts        # Root module
└── main.ts              # Entry point
```

---

## Security Features

- Password hashing (bcrypt)
- JWT with refresh tokens
- API key hashing
- Role and permission checks
- Rate limiting
- Helmet middleware
- Input validation
- CORS

---

## Testing

```bash
pnpm run test        # Unit tests
pnpm run test:e2e    # E2E tests
pnpm run test:cov    # Coverage
```
