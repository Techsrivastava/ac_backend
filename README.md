# Be Cool Heating - Backend API

## Deployment Guide

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your production values
```

### 3. Deploy Options

#### Option A: Node.js Direct

```bash
npm start
```

#### Option B: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start index.ts --name "becool-api"
pm2 save
pm2 startup
```

#### Option C: Railway/Render/Heroku

1. Push code to GitHub
2. Connect repo to platform
3. Set environment variables
4. Deploy

### 4. API Endpoints

Base URL: `https://your-api-url.com/api`

- `POST /auth/login` - Admin/User login
- `GET /products` - Get all products
- `POST /orders` - Create order
- `GET /orders` - Get all orders (admin)

### 5. Database

MongoDB Atlas recommended for production.

### 6. Frontend Integration

Update frontend `.env`:
```
VITE_API_URL=https://your-api-url.com/api
```
