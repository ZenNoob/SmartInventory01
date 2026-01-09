# Smart Inventory - Frontend

Next.js frontend application for Smart Inventory system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env.local
```

3. Configure `.env.local` with backend API URL.

4. Run development server:
```bash
npm run dev
```

Frontend will start at `http://localhost:3000`

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
└── lib/           # Utilities and API client
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001/api)
