# Tasks: VendorBridge - Procurement & Vendor Management ERP

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## Phase 1: Project Setup & Configuration

- [ ] 1.1 Initialize monorepo structure with `client/` and `server/` folders
- [ ] 1.2 Initialize `server/` Node.js project (`npm init`, install dependencies)
  - express, mongoose, bcryptjs, jsonwebtoken, cookie-parser
  - express-validator, express-rate-limit, helmet, cors
  - resend, puppeteer, multer
  - dotenv, nodemon (dev)
- [ ] 1.3 Initialize `client/` React project (`create-react-app` or `vite`)
  - axios, react-router-dom, recharts
- [ ] 1.4 Create `server/.env` file with all environment variables
- [ ] 1.5 Set up `server/config/db.js` — MongoDB connection with Mongoose
- [ ] 1.6 Set up `server/server.js` — Express app entry point with middleware
  - CORS, helmet, rate limiter, cookie-parser, JSON body parser
  - Mount all route files
  - Global error handler
- [ ] 1.7 Create `server/middleware/errorHandler.js` — centralized error response formatter
- [ ] 1.8 Create `server/utils/counterService.js` — atomic auto-number generator for VND, RFQ, PO, INV

---

## Phase 2: Authentication & User Management

- [ ] 2.1 Create `server/models/User.js` Mongoose model
  - Fields: name, email, password, role, company, phone, isActive, lastLogin, passwordResetToken, passwordResetExpiry
  - Pre-save hook to bcrypt hash password
- [ ] 2.2 Create `server/middleware/auth.js` — JWT verification middleware
- [ ] 2.3 Create `server/middleware/rbac.js` — role-based access control middleware
- [ ] 2.4 Create `server/controllers/auth.controller.js`
  - `signup` — validate, hash password, create user, return JWT
  - `login` — verify credentials, sign access + refresh tokens
  - `logout` — clear refresh token cookie
  - `refreshToken` — verify refresh token, issue new access token
  - `forgotPassword` — generate reset token, send email via Resend
  - `resetPassword` — verify token, update password, clear token
- [ ] 2.5 Create `server/routes/auth.routes.js` and wire to controller
- [ ] 2.6 Create `server/routes/admin.routes.js` — user management (list, invite, update, deactivate)
- [ ] 2.7 Create `server/controllers/admin.controller.js`

---

## Phase 3: Email Service (Resend)

- [ ] 3.1 Create `server/utils/emailService.js` — generic `sendEmail(to, subject, html)` utility using Resend SDK
- [ ] 3.2 Create HTML email templates in `server/utils/emailTemplates/`
  - `rfqInvitation.js` — RFQ invitation to vendor
  - `deadlineReminder.js` — 24h before RFQ deadline
  - `quotationReceived.js` — notify officer when vendor submits
  - `approvalRequest.js` — notify manager to review
  - `quotationApproved.js` — notify officer + vendor
  - `quotationRejected.js` — notify officer
  - `poConfirmation.js` — PO sent to vendor
  - `invoiceApproved.js` — notify vendor + officer
  - `invoiceRejected.js` — notify vendor
  - `passwordReset.js` — password reset link

---

## Phase 4: Vendor Management

- [ ] 4.1 Create `server/models/Vendor.js` Mongoose model with all fields and indexes
- [ ] 4.2 Create `server/controllers/vendor.controller.js`
  - `getVendors` — list with search, filter by status/category, pagination
  - `createVendor` — validate, generate VND number, create record, log activity
  - `getVendorById` — detail with performance stats
  - `updateVendor` — update fields, log activity
  - `updateVendorStatus` — activate/deactivate, log activity
  - `getVendorPerformance` — aggregation of PO history, delivery rates
  - `importVendors` — parse CSV, validate rows, bulk insert, return error report
  - `exportVendors` — query all vendors, generate CSV response
- [ ] 4.3 Create `server/routes/vendor.routes.js` with RBAC middleware
- [ ] 4.4 Add express-validator rules for vendor create/update

---

## Phase 5: RFQ Management

- [ ] 5.1 Create `server/models/RFQ.js` Mongoose model with all fields and indexes
- [ ] 5.2 Create `server/controllers/rfq.controller.js`
  - `getRFQs` — list with search, filter by status/date, pagination
  - `createRFQ` — validate, generate RFQ number, set status to draft, log activity
  - `getRFQById` — detail with populated quotations
  - `updateRFQ` — only allowed in draft status, log activity
  - `sendRFQ` — change status to open, send email invitations to assigned vendors, log activity
  - `closeRFQ` — change status to closed, log activity
  - `cancelRFQ` — change status to cancelled, log activity
  - `duplicateRFQ` — clone RFQ fields, reset status to draft, generate new RFQ number
- [ ] 5.3 Create `server/routes/rfq.routes.js` with RBAC middleware
- [ ] 5.4 Add express-validator rules for RFQ create/update

---

## Phase 6: Quotation Management

- [ ] 6.1 Create `server/models/Quotation.js` Mongoose model with all fields and indexes
- [ ] 6.2 Create `server/controllers/quotation.controller.js`
  - `getQuotations` — list with filters, pagination
  - `submitQuotation` — validate, check deadline not passed, calculate totals, set status submitted, notify officer, log activity
  - `getQuotationById` — detail view
  - `updateQuotation` — only if before deadline and status draft/submitted, recalculate totals, log activity
  - `getQuotationsByRFQ` — all quotations for an RFQ
  - `getComparisonData` — structured side-by-side data for comparison screen
  - `selectQuotation` — mark as selected, create Approval record, notify manager, log activity
  - `rejectQuotation` — mark as rejected, notify vendor, log activity
- [ ] 6.3 Create `server/routes/quotation.routes.js` with RBAC middleware
- [ ] 6.4 Add grand total calculation helper (subtotal → discount → tax → grandTotal)

---

## Phase 7: Approval Workflow

- [ ] 7.1 Create `server/models/Approval.js` Mongoose model
- [ ] 7.2 Create `server/controllers/approval.controller.js`
  - `getApprovals` — list pending approvals for logged-in manager
  - `getApprovalById` — detail with populated reference record
  - `approveRecord` — update decision to approved, update referenced record status, notify relevant users, log activity
  - `rejectRecord` — update decision to rejected, update referenced record status, send rejection reason, notify relevant users, log activity
- [ ] 7.3 Create `server/routes/approval.routes.js` with RBAC middleware (manager only)

---

## Phase 8: Purchase Order Management

- [ ] 8.1 Create `server/models/PurchaseOrder.js` Mongoose model with all fields and indexes
- [ ] 8.2 Create `server/controllers/purchaseOrder.controller.js`
  - `getPurchaseOrders` — list with search, filter by status/vendor/date, pagination
  - `createPurchaseOrder` — auto-populate from approved quotation, generate PO number, set draft status, log activity
  - `getPurchaseOrderById` — detail view
  - `updatePurchaseOrder` — only in draft status, log activity
  - `confirmPurchaseOrder` — change status to confirmed, log activity
  - `sendPurchaseOrder` — change status to sent, send email with PDF to vendor, log activity
  - `acknowledgePurchaseOrder` — vendor acknowledges, update status + timestamp, log activity
  - `updateDelivery` — update received quantities per line item, check if all received → complete, log activity
  - `downloadPOPdf` — generate and stream PDF response
- [ ] 8.3 Create `server/routes/purchaseOrder.routes.js` with RBAC middleware

---

## Phase 9: Invoice Management

- [ ] 9.1 Create `server/models/Invoice.js` Mongoose model with all fields and indexes
- [ ] 9.2 Create `server/controllers/invoice.controller.js`
  - `getInvoices` — list with search, filter by status/vendor/date, pagination
  - `generateInvoice` — auto-populate from PO, generate INV number, run discrepancy check, set three-way match, log activity
  - `getInvoiceById` — detail view
  - `approveInvoice` — update status to approved, notify vendor + officer, log activity
  - `rejectInvoice` — update status to rejected, store rejection reason, notify vendor, log activity
  - `downloadInvoicePdf` — generate and stream PDF response
  - `sendInvoiceEmail` — send invoice email with PDF attachment via Resend, log activity
- [ ] 9.3 Create `server/routes/invoice.routes.js` with RBAC middleware

---

## Phase 10: PDF Generation

- [ ] 10.1 Create `server/utils/pdfService.js` using Puppeteer
  - `generatePOPdf(po)` — render PO HTML template to PDF buffer
  - `generateInvoicePdf(invoice)` — render Invoice HTML template to PDF buffer
- [ ] 10.2 Create PO HTML template (`server/utils/pdfTemplates/po.template.js`)
  - Company header, PO number, vendor details, line items table, financial summary, terms
- [ ] 10.3 Create Invoice HTML template (`server/utils/pdfTemplates/invoice.template.js`)
  - Company header, invoice number, dates, vendor/buyer details, line items table, GST breakdown, totals

---

## Phase 11: Activity Logging

- [ ] 11.1 Create `server/models/ActivityLog.js` Mongoose model with indexes
- [ ] 11.2 Create `server/utils/activityLogger.js` — `logActivity(userId, action, recordType, recordId, recordRef, details, ip)` helper
- [ ] 11.3 Create `server/controllers/activityLog.controller.js`
  - `getActivityLogs` — filtered list (date range, user, recordType, action) with pagination
  - `exportActivityLogs` — generate CSV of filtered logs
- [ ] 11.4 Create `server/routes/activityLog.routes.js` (admin only)
- [ ] 11.5 Wire `logActivity()` calls into all controllers (vendor, rfq, quotation, approval, po, invoice, auth)

---

## Phase 12: Notifications

- [ ] 12.1 Create `server/models/Notification.js` Mongoose model
- [ ] 12.2 Create `server/utils/notificationService.js` — `createNotification(userId, type, title, message, referenceId, referenceType)` helper
- [ ] 12.3 Create `server/controllers/notification.controller.js`
  - `getNotifications` — get unread + recent notifications for logged-in user
  - `markAsRead` — mark single notification as read
  - `markAllAsRead` — mark all user notifications as read
- [ ] 12.4 Create `server/routes/notification.routes.js`
- [ ] 12.5 Wire `createNotification()` calls into all relevant controllers

---

## Phase 13: Reports & Analytics

- [ ] 13.1 Create `server/controllers/report.controller.js`
  - `getDashboardStats` — pending approvals count, active RFQs, recent POs, recent invoices, total spend
  - `getVendorPerformance` — aggregation: on-time delivery %, avg price, total orders per vendor
  - `getSpendingSummary` — total spend grouped by vendor and category with date filter
  - `getMonthlyTrends` — monthly RFQ count, PO count, spend for past 12 months
  - `getRFQConversionRate` — ratio of RFQs to confirmed POs
  - `exportReport` — generate PDF or Excel from report data
- [ ] 13.2 Create `server/routes/report.routes.js` with RBAC middleware
- [ ] 13.3 Add MongoDB aggregation pipelines for each report type

---

## Phase 14: Cron Jobs

- [ ] 14.1 Install `node-cron` package
- [ ] 14.2 Create `server/utils/cronJobs.js`
  - Deadline reminder job — runs every hour, finds RFQs with deadline within 24h, sends reminder emails to vendors who haven't submitted
- [ ] 14.3 Register cron job in `server.js` on startup

---

## Phase 15: File Upload

- [ ] 15.1 Configure `multer` middleware for file uploads
  - Validate MIME types (PDF, DOC, XLSX, PNG, JPG)
  - Limit file size to 10MB
  - Store in `server/uploads/` with unique filenames
- [ ] 15.2 Serve static files from uploads directory
- [ ] 15.3 Wire file upload to RFQ attachments and Quotation attachments endpoints

---

## Phase 16: Frontend Setup (Backend-Independent)

- [ ] 16.1 Set up React project structure (`pages/`, `components/`, `context/`, `hooks/`, `services/`, `utils/`)
- [ ] 16.2 Set up React Router with route definitions (all routes from features.md)
- [ ] 16.3 Create `AuthContext` — store user, token, login/logout functions
- [ ] 16.4 Create `axios` instance in `services/api.js` with base URL and JWT interceptor
- [ ] 16.5 Create protected route component (redirect to login if not authenticated)
- [ ] 16.6 Create role-based route guard component (redirect if insufficient role)
- [ ] 16.7 Create API service files (one per resource):
  - `services/authService.js`
  - `services/vendorService.js`
  - `services/rfqService.js`
  - `services/quotationService.js`
  - `services/approvalService.js`
  - `services/purchaseOrderService.js`
  - `services/invoiceService.js`
  - `services/notificationService.js`
  - `services/reportService.js`

---

## Phase 17: Frontend Screens (Pending MCP Design Import)

> These tasks will be detailed once the MCP server design output (Figma file) is received.
> Each screen task will include specific component names, layout structure, and state management.

- [ ] 17.1 Login / Signup / Forgot Password screens
- [ ] 17.2 Dashboard / Home screen
- [ ] 17.3 Vendor Management screen (list + add/edit + detail)
- [ ] 17.4 RFQ Management screen (list + create + detail)
- [ ] 17.5 Quotation Submission screen (vendor portal)
- [ ] 17.6 Quotation Comparison screen
- [ ] 17.7 Approval Workflow screen
- [ ] 17.8 Purchase Order screen (list + detail + generate)
- [ ] 17.9 Invoice Management screen (list + detail)
- [ ] 17.10 Activity Logs & Notifications screen
- [ ] 17.11 Reports & Analytics screen
- [ ] 17.12 Settings screen (Admin)
- [ ] 17.13 Shared/reusable component library

---

## Phase 18: Integration & Testing

- [ ] 18.1 Test all auth endpoints (login, signup, forgot password, refresh token)
- [ ] 18.2 Test vendor CRUD + import/export
- [ ] 18.3 Test full RFQ → Quotation → Approval → PO → Invoice workflow end-to-end
- [ ] 18.4 Test PDF generation for PO and Invoice
- [ ] 18.5 Test email sending via Resend for all notification types
- [ ] 18.6 Test RBAC — verify each role can only access permitted endpoints
- [ ] 18.7 Test activity logs are created for all actions
- [ ] 18.8 Test dashboard stats and report aggregations
- [ ] 18.9 Connect frontend to backend — verify all API calls work end-to-end
- [ ] 18.10 Test responsive layout on mobile and tablet

---

## Phase 19: Final Polish

- [ ] 19.1 Add input validation error messages to all frontend forms
- [ ] 19.2 Add loading states and error states to all data-fetching screens
- [ ] 19.3 Add empty states for all list views
- [ ] 19.4 Verify all status badge colors are correct across all screens
- [ ] 19.5 Test invoice print functionality from browser
- [ ] 19.6 Final review of RBAC — confirm no unauthorized screen access
- [ ] 19.7 Clean up console logs and debug code
- [ ] 19.8 Write README with setup instructions
