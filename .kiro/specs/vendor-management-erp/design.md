# Design Document: VendorBridge - Procurement & Vendor Management ERP

## Overview

VendorBridge is a MERN stack ERP application. This document covers the
system architecture, database schema, API design, authentication flow,
and business logic for the backend. Frontend component design will be
added once the MCP server design output is received.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│              React SPA (JavaScript)                      │
│         Axios HTTP client + Context API                  │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API (HTTPS)
┌─────────────────────▼───────────────────────────────────┐
│                    API GATEWAY LAYER                     │
│            Express.js (Node.js) Server                   │
│     JWT Auth Middleware │ RBAC Middleware │ Validators   │
├──────────────┬──────────────────────┬────────────────────┤
│  Auth Routes │   Business Routes    │  Admin Routes      │
│  /api/auth   │  /api/vendors        │  /api/admin        │
│              │  /api/rfqs           │  /api/users        │
│              │  /api/quotations     │  /api/reports      │
│              │  /api/purchase-orders│                    │
│              │  /api/invoices       │                    │
│              │  /api/notifications  │                    │
│              │  /api/activity-logs  │                    │
└──────────────┴──────────┬───────────┴────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   SERVICE LAYER                          │
│   VendorService │ RFQService │ QuotationService          │
│   POService │ InvoiceService │ NotificationService       │
│   ReportService │ ActivityLogService                     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    DATA LAYER                            │
│              Mongoose ODM + MongoDB                      │
└─────────────────────────────────────────────────────────┘
         │                              │
┌────────▼────────┐          ┌──────────▼──────────┐
│    MongoDB       │          │  External Services   │
│  (Primary DB)    │          │  Resend (Email API)  │
│                  │          │  Puppeteer (PDF)     │
└──────────────────┘          └─────────────────────┘
```

---

## 2. Project Folder Structure

```
vendorbridge/
├── client/                         # React frontend
│   ├── public/
│   └── src/
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Screen-level components
│       ├── context/                # React Context (auth, notifications)
│       ├── hooks/                  # Custom hooks
│       ├── services/               # Axios API calls
│       ├── utils/                  # Helper functions
│       └── App.js
│
└── server/                         # Express backend
    ├── config/
    │   ├── db.js                   # MongoDB connection
    │   └── env.js                  # Environment config
    ├── middleware/
    │   ├── auth.js                 # JWT verification
    │   ├── rbac.js                 # Role-based access control
    │   ├── validate.js             # Request validation
    │   └── errorHandler.js        # Global error handler
    ├── models/                     # Mongoose models
    │   ├── User.js
    │   ├── Vendor.js
    │   ├── RFQ.js
    │   ├── Quotation.js
    │   ├── PurchaseOrder.js
    │   ├── Invoice.js
    │   ├── Notification.js
    │   └── ActivityLog.js
    ├── routes/                     # Express route definitions
    │   ├── auth.routes.js
    │   ├── vendor.routes.js
    │   ├── rfq.routes.js
    │   ├── quotation.routes.js
    │   ├── purchaseOrder.routes.js
    │   ├── invoice.routes.js
    │   ├── notification.routes.js
    │   ├── activityLog.routes.js
    │   ├── report.routes.js
    │   └── admin.routes.js
    ├── controllers/                # Route handler logic
    ├── services/                   # Business logic
    ├── utils/
    │   ├── emailService.js         # Resend email utility
    │   ├── pdfService.js           # Puppeteer PDF generation
    │   ├── activityLogger.js       # Centralized logging helper
    │   └── counterService.js      # Auto-number generators
    └── server.js                   # App entry point
```

---

## 3. Database Schema (MongoDB / Mongoose)

### 3.1 User

```js
{
  _id: ObjectId,
  name: String,               // required
  email: String,              // required, unique
  password: String,           // bcrypt hashed, required
  role: {
    type: String,
    enum: ['admin', 'procurement_officer', 'vendor', 'manager'],
    required: true
  },
  company: String,
  phone: String,
  isActive: Boolean,          // default: true
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 Vendor

```js
{
  _id: ObjectId,
  vendorId: String,           // auto-generated e.g. VND-0001
  companyName: String,        // required
  category: {
    type: String,
    enum: ['IT', 'Manufacturing', 'Services', 'Logistics', 'Other']
  },
  contactPerson: String,      // required
  email: String,              // required, unique
  phone: String,              // required
  alternatePhone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  gstNumber: String,          // required
  panNumber: String,
  paymentTerms: {
    type: String,
    enum: ['Net15', 'Net30', 'Net60']
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,    // stored encrypted
    ifscCode: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  rating: Number,             // 1-5, calculated from PO history
  linkedUserId: ObjectId,     // ref: User (if vendor has portal access)
  createdBy: ObjectId,        // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### 3.3 RFQ (Request for Quotation)

```js
{
  _id: ObjectId,
  rfqNumber: String,          // auto-generated e.g. RFQ-2024-0001
  title: String,              // required
  description: String,
  category: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  lineItems: [
    {
      itemName: String,
      description: String,
      quantity: Number,
      unitOfMeasure: String,
      estimatedPrice: Number
    }
  ],
  assignedVendors: [ObjectId], // ref: Vendor
  deadline: Date,             // required
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: Date
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'cancelled'],
    default: 'draft'
  },
  createdBy: ObjectId,        // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### 3.4 Quotation

```js
{
  _id: ObjectId,
  rfqId: ObjectId,            // ref: RFQ, required
  vendorId: ObjectId,         // ref: Vendor, required
  lineItems: [
    {
      rfqLineItemId: ObjectId,
      itemName: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  subtotal: Number,
  discount: Number,           // amount or percentage
  taxRate: Number,            // GST %
  taxAmount: Number,
  grandTotal: Number,
  paymentTerms: String,
  deliveryTimeline: Date,
  validityPeriod: Number,     // days
  notes: String,
  attachments: [
    {
      fileName: String,
      fileUrl: String
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'selected', 'approved', 'rejected'],
    default: 'draft'
  },
  evaluationNotes: String,    // added by Procurement Officer
  rejectionReason: String,
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.5 Approval

```js
{
  _id: ObjectId,
  referenceId: ObjectId,      // ref: Quotation or Invoice
  referenceType: {
    type: String,
    enum: ['quotation', 'invoice', 'purchase_order']
  },
  requestedBy: ObjectId,      // ref: User
  assignedTo: ObjectId,       // ref: User (Manager)
  decision: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  remarks: String,
  decidedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.6 PurchaseOrder

```js
{
  _id: ObjectId,
  poNumber: String,           // auto-generated e.g. PO-2024-0001
  rfqId: ObjectId,            // ref: RFQ
  quotationId: ObjectId,      // ref: Quotation
  vendorId: ObjectId,         // ref: Vendor, required
  lineItems: [
    {
      itemName: String,
      description: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number,
      receivedQuantity: Number  // default: 0
    }
  ],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  expectedDelivery: Date,
  specialInstructions: String,
  termsAndConditions: String,
  subtotal: Number,
  discount: Number,
  taxRate: Number,
  taxAmount: Number,
  grandTotal: Number,
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'sent', 'acknowledged', 'partially_delivered', 'completed', 'cancelled'],
    default: 'draft'
  },
  acknowledgedAt: Date,
  sentAt: Date,
  createdBy: ObjectId,        // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### 3.7 Invoice

```js
{
  _id: ObjectId,
  invoiceNumber: String,      // auto-generated e.g. INV-2024-0001
  poId: ObjectId,             // ref: PurchaseOrder, required
  vendorId: ObjectId,         // ref: Vendor, required
  lineItems: [
    {
      itemName: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  subtotal: Number,
  discount: Number,
  taxRate: Number,
  taxAmount: Number,
  grandTotal: Number,
  dueDate: Date,
  hasDiscrepancy: Boolean,    // default: false
  discrepancyNote: String,
  threeWayMatch: {
    poMatched: Boolean,
    goodsReceived: Boolean,
    invoiceMatched: Boolean
  },
  status: {
    type: String,
    enum: ['draft', 'received', 'under_review', 'approved', 'rejected', 'paid'],
    default: 'draft'
  },
  approvalId: ObjectId,       // ref: Approval
  rejectionReason: String,
  emailSentAt: Date,
  createdBy: ObjectId,        // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### 3.8 Notification

```js
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User (recipient)
  type: {
    type: String,
    enum: ['rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'system']
  },
  title: String,
  message: String,
  referenceId: ObjectId,      // ref to related record
  referenceType: String,
  isRead: Boolean,            // default: false
  createdAt: Date
}
```

### 3.9 ActivityLog

```js
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User
  userName: String,           // denormalized for fast display
  userRole: String,
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'sent', 'login', 'logout', 'login_failed']
  },
  recordType: {
    type: String,
    enum: ['user', 'vendor', 'rfq', 'quotation', 'purchase_order', 'invoice', 'approval']
  },
  recordId: ObjectId,
  recordReference: String,    // e.g. "RFQ-2024-0001"
  details: String,            // human-readable description
  ipAddress: String,
  createdAt: Date
}
```

---

## 4. Auto-Number Generation

All reference numbers are generated using a counters collection:

```js
// Counter document per type
{
  _id: String,       // e.g. "rfq", "po", "invoice", "vendor"
  seq: Number        // incremented atomically using findOneAndUpdate
}

// Generated format:
// Vendor:   VND-0001
// RFQ:      RFQ-2024-0001
// PO:       PO-2024-0001
// Invoice:  INV-2024-0001
```

---

## 5. Authentication & Authorization

### JWT Flow

```
1. User POST /api/auth/login { email, password }
2. Server verifies password with bcrypt.compare()
3. Server signs JWT with { userId, role, email } payload
4. Token expiry: 30 minutes (access token)
5. Refresh token: 7 days (stored in httpOnly cookie)
6. Client stores access token in memory (not localStorage)
7. Every request: Authorization: Bearer <token>
8. Auth middleware verifies token on protected routes
```

### RBAC Middleware

```js
// Role permission map
const permissions = {
  admin:                ['*'],
  procurement_officer:  ['vendors:read', 'vendors:write', 'rfqs:*',
                         'quotations:read', 'quotations:compare',
                         'purchase_orders:*', 'invoices:*', 'reports:read'],
  manager:              ['approvals:*', 'purchase_orders:read',
                         'invoices:read', 'invoices:approve', 'reports:*'],
  vendor:               ['rfqs:read', 'quotations:write',
                         'purchase_orders:read']
}
```

### Password Reset Flow

```
1. POST /api/auth/forgot-password { email }
2. Generate crypto random token, hash and store in User
3. Send reset email with link: /reset-password?token=xxx
4. POST /api/auth/reset-password { token, newPassword }
5. Verify token, update password, clear token fields
```

---

## 6. API Endpoints

### Auth Routes — /api/auth

| Method | Endpoint               | Access  | Description              |
|--------|------------------------|---------|--------------------------|
| POST   | /login                 | Public  | Login, returns JWT       |
| POST   | /signup                | Public  | Register new user        |
| POST   | /forgot-password       | Public  | Send password reset email|
| POST   | /reset-password        | Public  | Reset password via token |
| POST   | /refresh-token         | Auth    | Refresh access token     |
| POST   | /logout                | Auth    | Invalidate refresh token |

### Vendor Routes — /api/vendors

| Method | Endpoint               | Access               | Description              |
|--------|------------------------|----------------------|--------------------------|
| GET    | /                      | Admin, Officer       | List all vendors         |
| POST   | /                      | Admin, Officer       | Create vendor            |
| GET    | /:id                   | Admin, Officer       | Get vendor detail        |
| PUT    | /:id                   | Admin, Officer       | Update vendor            |
| PATCH  | /:id/status            | Admin                | Activate/deactivate      |
| GET    | /:id/performance       | Admin, Officer       | Vendor performance stats |
| POST   | /import                | Admin                | Bulk import CSV          |
| GET    | /export                | Admin                | Export vendors CSV       |

### RFQ Routes — /api/rfqs

| Method | Endpoint               | Access               | Description              |
|--------|------------------------|----------------------|--------------------------|
| GET    | /                      | Admin, Officer       | List all RFQs            |
| POST   | /                      | Officer              | Create RFQ               |
| GET    | /:id                   | All Auth             | Get RFQ detail           |
| PUT    | /:id                   | Officer              | Update RFQ (draft only)  |
| PATCH  | /:id/send              | Officer              | Send RFQ to vendors      |
| PATCH  | /:id/close             | Officer              | Close RFQ                |
| PATCH  | /:id/cancel            | Officer, Admin       | Cancel RFQ               |
| POST   | /:id/duplicate         | Officer              | Duplicate RFQ            |

### Quotation Routes — /api/quotations

| Method | Endpoint                    | Access         | Description                  |
|--------|-----------------------------|----------------|------------------------------|
| GET    | /                           | Officer, Admin | List all quotations          |
| POST   | /                           | Vendor         | Submit quotation             |
| GET    | /:id                        | All Auth       | Get quotation detail         |
| PUT    | /:id                        | Vendor         | Update quotation (pre-deadline)|
| GET    | /rfq/:rfqId                 | Officer, Admin | Get all quotations for RFQ   |
| GET    | /rfq/:rfqId/compare         | Officer        | Comparison data for RFQ      |
| PATCH  | /:id/select                 | Officer        | Select quotation for approval|
| PATCH  | /:id/reject                 | Officer        | Reject quotation             |

### Approval Routes — /api/approvals

| Method | Endpoint               | Access   | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | /                      | Manager  | List pending approvals   |
| GET    | /:id                   | Manager  | Get approval detail      |
| PATCH  | /:id/approve           | Manager  | Approve                  |
| PATCH  | /:id/reject            | Manager  | Reject with remarks      |

### Purchase Order Routes — /api/purchase-orders

| Method | Endpoint               | Access               | Description              |
|--------|------------------------|----------------------|--------------------------|
| GET    | /                      | Admin, Officer, Mgr  | List all POs             |
| POST   | /                      | Officer              | Create PO from quotation |
| GET    | /:id                   | All Auth             | Get PO detail            |
| PUT    | /:id                   | Officer              | Update PO (draft only)   |
| PATCH  | /:id/confirm           | Officer              | Confirm PO               |
| PATCH  | /:id/send              | Officer              | Send PO to vendor        |
| PATCH  | /:id/acknowledge       | Vendor               | Vendor acknowledges PO   |
| PATCH  | /:id/delivery          | Officer              | Update delivery quantities|
| GET    | /:id/pdf               | All Auth             | Download PO as PDF       |

### Invoice Routes — /api/invoices

| Method | Endpoint               | Access               | Description              |
|--------|------------------------|----------------------|--------------------------|
| GET    | /                      | Admin, Officer, Mgr  | List all invoices        |
| POST   | /                      | Officer              | Generate invoice from PO |
| GET    | /:id                   | All Auth             | Get invoice detail       |
| PATCH  | /:id/approve           | Manager              | Approve invoice          |
| PATCH  | /:id/reject            | Manager              | Reject invoice           |
| GET    | /:id/pdf               | All Auth             | Download invoice as PDF  |
| POST   | /:id/email             | Officer, Admin       | Send invoice via email   |

### Notification Routes — /api/notifications

| Method | Endpoint               | Access   | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | /                      | Auth     | Get user notifications   |
| PATCH  | /:id/read              | Auth     | Mark as read             |
| PATCH  | /read-all              | Auth     | Mark all as read         |

### Activity Log Routes — /api/activity-logs

| Method | Endpoint               | Access   | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | /                      | Admin    | Get logs with filters    |
| GET    | /export                | Admin    | Export logs as CSV       |

### Report Routes — /api/reports

| Method | Endpoint                      | Access         | Description                  |
|--------|-------------------------------|----------------|------------------------------|
| GET    | /dashboard                    | All Auth       | Dashboard stats              |
| GET    | /vendor-performance           | Admin, Manager | Vendor performance report    |
| GET    | /spending-summary             | Admin, Manager | Spending summary             |
| GET    | /monthly-trends               | Admin, Manager | Monthly procurement trends   |
| GET    | /rfq-conversion               | Admin, Officer | RFQ to PO conversion rate    |
| GET    | /export/:type                 | Admin, Manager | Export report as PDF/Excel   |

### Admin Routes — /api/admin

| Method | Endpoint               | Access   | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | /users                 | Admin    | List all users           |
| POST   | /users/invite          | Admin    | Invite user              |
| PUT    | /users/:id             | Admin    | Update user role/status  |
| PATCH  | /users/:id/deactivate  | Admin    | Deactivate user          |

---

## 7. Procurement Workflow — State Machines

### RFQ States

```
draft → open → closed → [cancelled]
         ↑
       (send to vendors)
```

### Quotation States

```
draft → submitted → under_review → selected → approved
                                           ↘ rejected → (resubmit)
```

### Purchase Order States

```
draft → confirmed → sent → acknowledged → partially_delivered → completed
                                                               ↘ cancelled
```

### Invoice States

```
draft → received → under_review → approved → paid
                              ↘ rejected → (resubmit)
```

### Approval States

```
pending → approved
       ↘ rejected
```

---

## 8. Key Business Logic

### Quotation Grand Total Calculation

```
subtotal    = sum(lineItem.quantity * lineItem.unitPrice)
discountAmt = subtotal * (discount / 100)
taxable     = subtotal - discountAmt
taxAmount   = taxable * (taxRate / 100)
grandTotal  = taxable + taxAmount
```

### Invoice Discrepancy Check

```
if (Math.abs(invoice.grandTotal - po.grandTotal) / po.grandTotal > 0.05) {
  invoice.hasDiscrepancy = true
  // flag for manager review, require override to approve
}
```

### Vendor Rating Calculation

```
rating = average(onTimeDeliveryScore, priceCompetitivenessScore, qualityScore)
// Recalculated after each completed PO
```

### Deadline Reminder Cron Job

```
// Runs every hour
// Find RFQs where deadline is within next 24 hours and status = 'open'
// Send reminder notifications to assigned vendors who haven't submitted
```

---

## 9. Email Notification Templates

| Event                     | Recipients                    | Template                    |
|---------------------------|-------------------------------|-----------------------------|
| RFQ Created               | Assigned Vendors              | rfq-invitation.html         |
| Quotation Deadline -24h   | Vendors (no submission)       | deadline-reminder.html      |
| Quotation Submitted       | Procurement Officer           | quotation-received.html     |
| Quotation Selected        | Manager/Approver              | approval-request.html       |
| Quotation Approved        | Officer + Vendor              | quotation-approved.html     |
| Quotation Rejected        | Officer                       | quotation-rejected.html     |
| PO Confirmed & Sent       | Vendor                        | po-confirmation.html        |
| Invoice Approved          | Vendor + Officer              | invoice-approved.html       |
| Invoice Rejected          | Vendor                        | invoice-rejected.html       |

---

## 10. PDF Generation

Using Puppeteer (headless Chrome) to render HTML templates to PDF.

```
// PO PDF sections:
// - Company header + logo
// - PO number, date, vendor details
// - Line items table
// - Financial summary (subtotal, tax, total)
// - Terms and conditions
// - Authorized signature block

// Invoice PDF sections:
// - Company header + logo
// - Invoice number, date, due date
// - Vendor details + buyer details
// - Line items table
// - Financial summary
// - Payment instructions
// - GST breakdown
```

---

## 11. Error Handling

All API errors follow this response format:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Vendor with ID xxx not found",
    "statusCode": 404
  }
}
```

Standard error codes:

| Code                    | HTTP Status | Description                    |
|-------------------------|-------------|--------------------------------|
| VALIDATION_ERROR        | 400         | Request body validation failed |
| UNAUTHORIZED            | 401         | Missing or invalid JWT         |
| FORBIDDEN               | 403         | Insufficient role permissions  |
| RESOURCE_NOT_FOUND      | 404         | Record does not exist          |
| CONFLICT                | 409         | Duplicate record               |
| INTERNAL_ERROR          | 500         | Unexpected server error        |

---

## 12. Environment Configuration

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/vendorbridge

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=30m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=VendorBridge <noreply@yourdomain.com>

# Frontend URL (for email links)
CLIENT_URL=http://localhost:3000

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760   # 10MB in bytes
```

---

## 13. Security Measures

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT stored in memory on client, refresh token in httpOnly cookie
- All routes protected by auth middleware except /api/auth/*
- RBAC middleware checks role permissions per route
- Input validation using express-validator on all POST/PUT routes
- Rate limiting: 100 requests/minute per IP (express-rate-limit)
- CORS configured for specific client origin only
- Helmet.js for security headers
- MongoDB injection prevention via Mongoose schema validation
- File upload: validate MIME type + extension, limit file size
- Bank account numbers encrypted at rest using AES-256

---

## 14. Indexes (MongoDB)

```js
// User
{ email: 1 }                  // unique

// Vendor
{ vendorId: 1 }               // unique
{ email: 1 }                  // unique
{ status: 1 }
{ category: 1 }

// RFQ
{ rfqNumber: 1 }              // unique
{ status: 1 }
{ deadline: 1 }
{ createdBy: 1 }
{ assignedVendors: 1 }

// Quotation
{ rfqId: 1, vendorId: 1 }     // unique per RFQ-vendor pair
{ status: 1 }

// PurchaseOrder
{ poNumber: 1 }               // unique
{ vendorId: 1 }
{ status: 1 }

// Invoice
{ invoiceNumber: 1 }          // unique
{ poId: 1 }
{ vendorId: 1 }
{ status: 1 }

// ActivityLog
{ userId: 1 }
{ recordType: 1, recordId: 1 }
{ createdAt: -1 }

// Notification
{ userId: 1, isRead: 1 }
{ createdAt: -1 }
```

---

## 15. Frontend Architecture (Pending MCP Import)

The React frontend component architecture, screen layouts, state management
patterns, and routing implementation will be documented here once the MCP
server design output (Figma/design file) is received and processed.

Expected additions:
- React component tree per screen
- Context API / state management design
- Axios interceptor setup
- Protected route implementation
- Form handling and validation approach
- Chart library integration (Recharts / Chart.js)
