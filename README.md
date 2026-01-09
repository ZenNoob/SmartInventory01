# Smart Inventory

Hệ thống quản lý kho hàng thông minh với kiến trúc tách biệt Backend và Frontend.

## Cấu trúc Project

```
SmartInventory/
├── backend/           # Express.js API Server
│   ├── src/
│   │   ├── db/        # Database connection
│   │   ├── middleware/# Auth middleware
│   │   ├── repositories/ # Data access layer
│   │   ├── routes/    # API endpoints
│   │   └── services/  # Business logic
│   └── scripts/       # Database scripts
│
├── frontend/          # Next.js Frontend
│   ├── src/
│   │   ├── app/       # Pages
│   │   ├── components/# UI Components
│   │   ├── contexts/  # React contexts
│   │   ├── hooks/     # Custom hooks
│   │   └── lib/       # API client & utils
│   └── package.json
│
└── .kiro/             # Kiro specs
```

## Cài đặt

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Cấu hình database trong .env
npm run dev
```

Backend chạy tại: `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend chạy tại: `http://localhost:3000`

## Công nghệ

### Backend
- Express.js
- SQL Server (mssql)
- JWT Authentication
- TypeScript

### Frontend
- Next.js 15
- React 18
- Tailwind CSS
- Radix UI
- TypeScript

## API Documentation

Xem chi tiết tại `backend/README.md`
