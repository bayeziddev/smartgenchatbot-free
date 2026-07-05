# SmartGen Chatbot - Deployment Guide

## 🚀 Vercel Deployment

This project is fully configured for Vercel deployment with both frontend and backend.

### Architecture

```
┌─────────────────────────────────────┐
│  Vercel Edge Network                │
├─────────────────────────────────────┤
│ Frontend (Vite + React)             │
│ Deployed to: dist/public/           │
├─────────────────────────────────────┤
│ Backend (Express + tRPC)            │
│ Deployed to: api/index.ts (Routes)  │
└─────────────────────────────────────┘
```

### Configuration Files

- **vercel.json** - Vercel build and deployment configuration
- **api/index.ts** - Serverless backend entry point
- **.env.production** - Production environment variables
- **.env.local** - Local development environment variables

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
NODE_ENV=production
FRONTEND_URL=https://smartgenchatbot-free-7ucfiduty.vercel.app
VITE_API_URL=https://smartgenchatbot-free-7ucfiduty.vercel.app/api
AI_GATEWAY_API_KEY=your_api_key_here
```

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Start production build locally
pnpm start
```

### API Endpoints

- **Health Check**: `GET /api/health`
- **Status**: `GET /api/status`
- **tRPC Routes**: `POST /api/trpc`

### Deployment Steps

1. Push to GitHub main branch
2. Vercel automatically detects changes
3. Builds frontend + backend
4. Deploys to production

### Debugging

Check Vercel Deployments tab for:
- Build logs
- Function logs
- Runtime errors

### CORS Configuration

Frontend URLs allowed:
- `http://localhost:5173` (dev)
- `http://localhost:3000` (dev)
- `https://smartgenchatbot-free-7ucfiduty.vercel.app` (production)

---

**Status**: ✅ Ready for Production Deployment
