# VendorBridge — Enterprise Procurement ERP

A full-stack procurement management system built with React, Node.js/Express, and MongoDB. Covers the full procurement lifecycle from vendor onboarding through RFQs, quotation comparison, purchase orders, invoicing, and approval workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router v7 |
| Backend | Node.js, Express 4, MongoDB (Atlas), Mongoose |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Resend API |
| PDF | Puppeteer |
| Dev | Nodemon, ESLint |

---

## Project Structure

```
odoo_r1/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/   # Layout, ProtectedRoute
│       ├── context/      # AuthContext
│       ├── hooks/        # useAuth
│       ├── pages/        # All page components
│       └── services/     # Axios API client
└── server/          # Express backend
    ├── config/       # MongoDB connection
    ├── controllers/  # Route handlers
    ├── middleware/   # auth, RBAC, error handler
    ├── models/       # Mongoose schemas
    ├── routes/       # Express routers
    └── utils/        # Email, PDF, cron, notifications
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repo

```bash
git clone https://github.com/Preet-Kotak/odoo_round_1_june.git
cd odoo_round_1_june
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRY=30m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=VendorBridge <noreply@yourdomain.com>

CLIENT_URL=http://localhost:5173

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Set up the frontend

```bash
cd client
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## Roles & Access Control

| Page | vendor | procurement_officer | manager | admin |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Quotations | ✅ | ✅ | ✅ | ✅ |
| Invoices | ✅ | ✅ | ✅ | ✅ |
| Vendors | ❌ | ✅ | ✅ | ✅ |
| RFQs | ❌ | ✅ | ✅ | ✅ |
| Purchase Orders | ❌ | ✅ | ✅ | ✅ |
| Approvals | ❌ | ❌ | ✅ | ✅ |
| Reports | ❌ | ❌ | ✅ | ✅ |
| Audit Trail | ❌ | ❌ | ❌ | ✅ |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login, returns access + refresh token |
| POST | `/logout` | Any | Logout, clears refresh cookie |
| POST | `/refresh-token` | Public | Get new access token via refresh cookie |
| POST | `/forgot-password` | Public | Send password reset email |
| POST | `/reset-password` | Public | Reset password with token |

### Vendors — `/api/vendors`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | admin, officer | List all vendors |
| POST | `/` | admin, officer | Create vendor |
| GET | `/:id` | admin, officer | Get vendor by ID |
| PUT | `/:id` | admin, officer | Update vendor |
| PATCH | `/:id/status` | admin | Update vendor status |

### RFQs — `/api/rfqs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | admin, officer | List all RFQs |
| POST | `/` | officer | Create RFQ |
| GET | `/:id` | Any auth | Get RFQ by ID |
| PUT | `/:id` | officer | Update RFQ |
| PATCH | `/:id/send` | officer | Send RFQ to vendors |
| PATCH | `/:id/close` | officer | Close RFQ |
| PATCH | `/:id/cancel` | officer, admin | Cancel RFQ |
| POST | `/:id/duplicate` | officer | Duplicate RFQ |

### Quotations — `/api/quotations`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | admin, officer | List all quotations |
| POST | `/` | vendor | Submit quotation |
| GET | `/rfq/:rfqId/compare` | officer, admin | Compare quotations for an RFQ |
| GET | `/:id` | Any auth | Get quotation by ID |
| PATCH | `/:id/select` | officer | Select winning quotation |
| PATCH | `/:id/reject` | officer | Reject quotation |

### Purchase Orders — `/api/purchase-orders`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | All roles | List POs |
| POST | `/` | officer | Create PO |
| GET | `/:id` | Any auth | Get PO by ID |
| GET | `/:id/pdf` | Any auth | Download PO as PDF |
| PATCH | `/:id/confirm` | officer | Confirm PO |
| PATCH | `/:id/send` | officer | Send PO to vendor |

### Invoices — `/api/invoices`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | admin, officer, manager | List invoices |
| POST | `/` | officer | Generate invoice |
| GET | `/:id` | Any auth | Get invoice by ID |
| GET | `/:id/pdf` | Any auth | Download invoice as PDF |
| POST | `/:id/email` | officer, admin | Email invoice |
| PATCH | `/:id/approve` | manager, admin | Approve invoice |
| PATCH | `/:id/reject` | manager, admin | Reject invoice |

### Approvals — `/api/approvals`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | manager, admin | List approvals |
| GET | `/:id` | manager, admin | Get approval by ID |
| PATCH | `/:id/approve` | manager, admin | Approve record |
| PATCH | `/:id/reject` | manager, admin | Reject record |

### Reports — `/api/reports`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/dashboard` | Any auth | Dashboard KPI data |
| GET | `/spending-summary` | manager, admin | Spending by vendor |
| GET | `/monthly-trends` | manager, admin | Monthly PO spend trends |

### Activity Logs — `/api/activity-logs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | admin only | Paginated audit trail |

### Notifications — `/api/notifications`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Any auth | List user notifications |

---

## Health Check

```
GET http://localhost:5000/health
```

Returns `{ status: "ok", timestamp: "..." }`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_EXPIRY` | Access token expiry (e.g. `30m`) |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry (e.g. `7d`) |
| `RESEND_API_KEY` | API key for Resend email service |
| `EMAIL_FROM` | From address for outgoing emails |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `UPLOAD_DIR` | Directory for file uploads |
| `MAX_FILE_SIZE` | Max upload size in bytes |
