# VendorBridge - Frontend Features & UI Specification

## Overview

VendorBridge is a Procurement & Vendor Management ERP web application.
This document describes every screen, layout, component, and interaction
needed to design the frontend UI.

Tech Stack: React (JavaScript), Tailwind CSS or any modern UI framework.
The app has a sidebar-based navigation layout with role-based screen access.

---

## User Roles & Access

| Role               | Access                                                                 |
|--------------------|------------------------------------------------------------------------|
| Admin              | All screens + user management                                          |
| Procurement Officer| Dashboard, Vendors, RFQs, Quotations, POs, Invoices, Reports          |
| Manager/Approver   | Dashboard, Approvals, POs, Invoices, Reports                           |
| Vendor             | Vendor Portal (RFQ list, Quotation submission, PO view)                |

---

## App Shell / Layout

### Sidebar Navigation
- Logo at top
- Navigation links (icons + labels):
  - Dashboard
  - Vendors
  - RFQs
  - Quotations
  - Approvals
  - Purchase Orders
  - Invoices
  - Activity Logs
  - Reports
  - Settings (Admin only)
- Active link highlighted
- Collapsible sidebar (icon-only mode on collapse)
- User avatar + name + role at bottom of sidebar
- Logout button

### Top Header Bar
- Page title (current screen name)
- Notification bell icon with unread badge count
- User profile dropdown (View Profile, Settings, Logout)
- Breadcrumb navigation

### Main Content Area
- White/light background
- Scrollable content
- Responsive grid layout

---

## Screen 1: Login / Signup

### Login Page
- Centered card layout
- VendorBridge logo at top
- Heading: "Welcome Back"
- Fields:
  - Email (input, placeholder: "Enter your email")
  - Password (input with show/hide toggle)
- "Forgot Password?" link (right-aligned below password)
- "Sign In" primary button (full width)
- Divider: "Don't have an account?"
- "Sign Up" link
- Error alert banner for invalid credentials
- Loading spinner on button while submitting

### Signup Page
- Centered card layout
- Heading: "Create Account"
- Fields:
  - Full Name
  - Email
  - Password
  - Confirm Password
  - Role (dropdown: Procurement Officer, Vendor, Manager)
  - Company Name
- "Create Account" primary button (full width)
- "Already have an account? Sign In" link
- Success message on completion
- Inline field validation errors

### Forgot Password Page
- Centered card layout
- Heading: "Reset Password"
- Email input field
- "Send Reset Link" button
- Success state: "Check your email for a reset link"
- Back to Login link

---

## Screen 2: Dashboard / Home

### Layout
- Welcome message: "Good morning, [Name]"
- Stats cards row (4 cards):
  - Pending Approvals (number + icon)
  - Active RFQs (number + icon)
  - Purchase Orders (number + icon)
  - Invoices This Month (number + icon)
- Cards are clickable and navigate to respective screens

### Quick Action Buttons
- "Create RFQ" button
- "Add Vendor" button
- "Generate PO" button
- "View Reports" button

### Recent Activity Section
- Table: Recent Purchase Orders (PO#, Vendor, Amount, Status, Date)
- Table: Recent Invoices (Invoice#, Vendor, Amount, Status, Date)
- "View All" link for each table

### Analytics Section
- Bar chart: Monthly Procurement Spend
- Pie chart: Spend by Vendor Category
- Line chart: RFQ to PO conversion trend

### Pending Approvals Widget
- List of items awaiting current user's approval
- Each item shows: type (Quotation/Invoice), reference number, vendor, amount, date
- "Review" action button per item

---

## Screen 3: Vendor Management

### Vendor List View
- Page heading: "Vendors"
- Top bar:
  - Search input (search by name, email, GST)
  - Filter dropdown (by status: Active, Inactive, Pending)
  - Filter dropdown (by category)
  - "Add Vendor" primary button (top right)
  - "Import CSV" secondary button
  - "Export" button
- Vendors table columns:
  - Vendor ID
  - Company Name
  - Category
  - Contact Person
  - Email
  - Phone
  - GST Number
  - Status badge (Active = green, Inactive = red, Pending = yellow)
  - Actions (View, Edit, Deactivate)
- Pagination controls at bottom
- Empty state: illustration + "No vendors found. Add your first vendor."

### Add / Edit Vendor Modal or Page
- Heading: "Add New Vendor" / "Edit Vendor"
- Form sections:
  - Company Information:
    - Company Name (required)
    - Vendor Category (dropdown: IT, Manufacturing, Services, Logistics, etc.)
    - Website URL
  - Contact Details:
    - Contact Person Name (required)
    - Email (required)
    - Phone Number (required)
    - Alternate Phone
  - Address:
    - Street Address
    - City
    - State
    - Country
    - Postal Code
  - Tax & Compliance:
    - GST Number (required)
    - PAN Number
    - Payment Terms (dropdown: Net 15, Net 30, Net 60)
  - Bank Details:
    - Bank Name
    - Account Number
    - IFSC Code
- Status toggle (Active / Inactive)
- "Save Vendor" and "Cancel" buttons
- Inline validation errors

### Vendor Detail View
- Vendor profile card (name, category, status, contact)
- Tabs:
  - Overview (contact details, address, GST)
  - Quotation History (list of past quotations)
  - Purchase Order History (list of past POs)
  - Performance Metrics (on-time delivery %, average price, rating)
  - Activity Log (all actions related to this vendor)
- "Edit Vendor" button
- "Deactivate Vendor" danger button

---

## Screen 4: RFQ Management

### RFQ List View
- Page heading: "Requests for Quotation"
- Top bar:
  - Search input
  - Filter by status (Open, Closed, Draft, Cancelled)
  - Filter by date range
  - "Create RFQ" primary button
- RFQ table columns:
  - RFQ Number
  - Title
  - Created By
  - Vendors Invited (count)
  - Deadline
  - Quotations Received (count)
  - Status badge
  - Actions (View, Duplicate, Cancel)
- Pagination
- Empty state

### Create RFQ Page
- Heading: "Create New RFQ"
- Form sections:
  - Basic Information:
    - RFQ Title (required)
    - Description / Scope of Work (textarea)
    - Category (dropdown)
    - Priority (dropdown: Low, Medium, High)
    - Response Deadline (date picker, required)
  - Line Items:
    - Table with Add Row button
    - Columns: Item Name, Description, Quantity, Unit of Measure, Estimated Price
    - Remove row button per row
  - Vendor Selection:
    - Multi-select searchable dropdown of active vendors
    - Selected vendors shown as removable tags
  - Attachments:
    - File upload drop zone
    - Supported formats: PDF, DOC, XLSX, PNG, JPG (max 10MB per file)
    - List of uploaded files with remove button
- Action buttons: "Save as Draft", "Send to Vendors", "Cancel"
- Preview mode before sending

### RFQ Detail View
- RFQ header card (number, title, status, deadline, created by)
- Line items table (read-only)
- Vendors Invited section (list with quotation status per vendor)
- Quotations Received section (list of submitted quotations with "Compare" button)
- Attachments section
- Activity timeline for this RFQ
- Actions: "Close RFQ", "Extend Deadline", "Duplicate RFQ"

---

## Screen 5: Quotation Submission (Vendor Portal)

### RFQ List for Vendor
- Heading: "Open RFQs"
- Table columns: RFQ Number, Title, Deadline, Status (Pending/Submitted/Closed)
- "Submit Quotation" button for pending RFQs
- "View Quotation" for submitted ones

### Submit Quotation Page
- RFQ details displayed at top (read-only): title, description, line items, deadline
- Quotation form:
  - Per line item:
    - Unit Price (required)
    - Total Price (auto-calculated)
    - Delivery Timeline (date picker)
  - Overall:
    - Payment Terms (dropdown)
    - Validity Period (number of days)
    - Discount (% or flat amount)
    - Tax (GST %)
    - Grand Total (auto-calculated)
    - Notes / Special Conditions (textarea)
  - Attachments:
    - Upload supporting docs (catalogs, certifications)
- "Submit Quotation" primary button
- "Save Draft" secondary button
- Deadline warning banner if less than 24 hours remain

### Quotation History Page (Vendor)
- List of all submitted quotations
- Columns: RFQ Number, Title, Submitted Date, Total Amount, Status
- Status badges: Submitted, Under Review, Selected, Rejected

---

## Screen 6: Quotation Comparison

### Comparison View
- Page heading: "Compare Quotations — RFQ #[number]"
- RFQ summary card at top (title, deadline, line items summary)
- Comparison table:
  - Rows: each line item
  - Columns: one per vendor
  - Cells show: unit price, total price
  - Lowest price cell highlighted in green
  - Highest price cell highlighted in red (subtle)
- Summary row per vendor:
  - Subtotal
  - Discount
  - Tax (GST)
  - Grand Total
  - Delivery Timeline
  - Payment Terms
  - Validity Period
  - Vendor Rating (star display)
- Vendor rating indicators below each vendor column
- Sort vendors by: Lowest Price, Fastest Delivery, Highest Rating
- Filter: hide/show specific vendors
- "Select Vendor" button under each vendor column
- "Add Evaluation Notes" button per vendor
- "View Full Quotation" link per vendor

### Evaluation Notes Modal
- Textarea for notes
- Save button

### Select Vendor Confirmation Modal
- Summary of selected vendor and price
- "Confirm Selection & Send for Approval" button
- "Cancel" button

---

## Screen 7: Approval Workflow

### Approval Queue (Manager View)
- Page heading: "Pending Approvals"
- Tabs: Quotations | Invoices | Purchase Orders
- Table columns:
  - Reference Number
  - Type
  - Vendor
  - Amount
  - Submitted By
  - Date
  - Priority badge
  - "Review" button
- Empty state: "No pending approvals"

### Quotation Approval Detail Page
- Heading: "Review Quotation — #[number]"
- Section: RFQ Details (title, items, original requirements)
- Section: Selected Quotation Details (vendor info, pricing breakdown, delivery terms)
- Section: Comparison Summary (other quotations briefly listed for reference)
- Section: Procurement Officer Notes
- Approval form:
  - Decision: Approve / Reject (radio or button group)
  - Remarks textarea (required on rejection)
  - Approval Timeline (shows previous approvals if multi-level)
- "Approve" green primary button
- "Reject" red button
- Approval status trail at bottom (timeline of approvers)

### Approval Status Badges
- Pending Approval — yellow
- Approved — green
- Rejected — red
- Escalated — orange

---

## Screen 8: Purchase Orders

### PO List View
- Page heading: "Purchase Orders"
- Top bar: search, filter by status, filter by vendor, filter by date, "Create PO" button
- Table columns:
  - PO Number (auto-generated, e.g. PO-2024-0001)
  - Vendor Name
  - RFQ Reference
  - Total Amount
  - Created Date
  - Expected Delivery
  - Status badge (Draft, Confirmed, Acknowledged, Completed, Cancelled)
  - Actions (View, Download PDF, Send Email)
- Pagination

### PO Detail / Generation Page
- Auto-populated from approved quotation
- PO header:
  - PO Number (auto-generated)
  - PO Date
  - Vendor details (name, address, GST)
  - Buyer details (company name, address, GST)
- Delivery & Billing:
  - Delivery Address (editable)
  - Billing Address (editable)
  - Expected Delivery Date
- Line Items table:
  - Item Name, Description, Quantity, Unit Price, Total
  - Add/remove rows (only in Draft mode)
- Financial Summary:
  - Subtotal
  - Discount
  - Tax (GST %)
  - Grand Total
- Special Instructions (textarea)
- Terms & Conditions (text block, editable)
- Action buttons:
  - "Save as Draft"
  - "Confirm PO" (locks editing)
  - "Send to Vendor" (triggers email with PDF)
  - "Download PDF"
  - "Print"
- Status timeline at bottom

### Send PO Modal
- To: vendor email (pre-filled, editable)
- Subject: pre-filled
- Message body: editable
- Attach PO PDF: checkbox (checked by default)
- "Send" button

---

## Screen 9: Invoice Management

### Invoice List View
- Page heading: "Invoices"
- Top bar: search, filter by status, filter by vendor, filter by date
- Table columns:
  - Invoice Number
  - Vendor Name
  - PO Reference
  - Invoice Date
  - Total Amount
  - Due Date
  - Status badge (Received, Under Review, Approved, Rejected, Paid)
  - Actions (View, Download, Send Email)
- Pagination

### Invoice Detail / Generation Page
- Invoice header:
  - Invoice Number (auto-generated)
  - Invoice Date
  - Due Date
  - PO Reference Number
  - Vendor details
  - Buyer details
- Line Items table:
  - Item Name, Quantity, Unit Price, Total
- Financial Summary:
  - Subtotal
  - Discount
  - GST (%)
  - Grand Total
- Discrepancy alert banner (if invoice total differs from PO total by > 5%)
- Three-way match status indicator:
  - PO ✓
  - Goods Received ✓
  - Invoice ✓
- Action buttons:
  - "Approve Invoice" (Manager only)
  - "Reject Invoice" (Manager only, opens remarks modal)
  - "Download PDF"
  - "Print"
  - "Send via Email"
- Approval timeline at bottom

### Invoice Email Modal
- To: recipient email (editable)
- CC: optional
- Subject: pre-filled
- Message body: editable
- Attach Invoice PDF: checked by default
- "Send" button

### Reject Invoice Modal
- Reason dropdown (Amount Mismatch, Missing Items, Incorrect Tax, Other)
- Remarks textarea
- "Submit Rejection" button

---

## Screen 10: Activity Logs & Notifications

### Notifications Panel (Dropdown from Header Bell)
- Grouped by: Today, Yesterday, Earlier
- Each notification:
  - Icon indicating type (RFQ, Approval, Invoice, PO)
  - Short message text
  - Timestamp
  - Unread indicator dot
- "Mark all as read" button
- "View All Notifications" link

### Notifications Full Page
- Filter by type: All, RFQs, Approvals, POs, Invoices
- List view of all notifications with read/unread states
- Click notification to navigate to relevant record

### Activity Logs Page
- Page heading: "Activity Logs"
- Filters:
  - Date range picker
  - User filter (dropdown)
  - Record type filter (Vendor, RFQ, Quotation, PO, Invoice)
  - Action type filter (Created, Updated, Approved, Rejected, Deleted)
- Activity log table:
  - Timestamp
  - User (name + role)
  - Action
  - Record Type
  - Record Reference
  - Details (short description)
- Click row to expand full details
- Export logs as CSV button

---

## Screen 11: Reports & Analytics

### Reports Dashboard
- Page heading: "Reports & Analytics"
- Summary stats row:
  - Total Spend This Month
  - Total Vendors
  - RFQs This Month
  - Pending Invoices

### Pre-configured Report Cards
- Vendor Performance Report
- Monthly Procurement Spend Report
- RFQ to PO Conversion Report
- Invoice Status Summary Report
- Each card has: title, description, "Generate" button

### Report Detail / Builder Page
- Selected report type shown
- Filters:
  - Date range
  - Vendor (multi-select)
  - Category
  - Status
- Preview section (table + chart)
- Charts:
  - Bar chart: spend by vendor
  - Line chart: monthly trends
  - Pie chart: spend by category
- Export buttons: "Download PDF", "Download Excel", "Download CSV"
- Schedule report:
  - Frequency dropdown (Daily, Weekly, Monthly)
  - Email recipients input
  - "Schedule" button

---

## Screen 12: Settings (Admin Only)

### Settings Page
- Tabs:
  - User Management
  - Company Profile
  - Notification Settings
  - Email Templates
  - Workflow Configuration

### User Management Tab
- Table: Name, Email, Role, Status, Last Login, Actions (Edit, Deactivate)
- "Invite User" button (opens modal with email + role selection)

### Company Profile Tab
- Company name, logo upload, address, GST, contact email

### Notification Settings Tab
- Toggle switches for each notification type
- Configure: Email, In-App per notification event

### Email Templates Tab
- List of templates (RFQ Invitation, PO Confirmation, Invoice, Approval)
- Edit template: subject + body with placeholder variables

### Workflow Configuration Tab
- Approval threshold: set amount above which approval is required
- Multi-level approval toggle
- Approver assignment per department

---

## Shared / Reusable Components

| Component           | Description                                               |
|---------------------|-----------------------------------------------------------|
| StatusBadge         | Colored pill showing record status                        |
| DataTable           | Sortable, filterable, paginated table                     |
| SearchBar           | Input with debounce search                                |
| FilterDropdown      | Dropdown with multi-select filter options                 |
| ConfirmModal        | Generic confirm/cancel dialog                             |
| FormModal           | Modal with embedded form                                  |
| FileUpload          | Drag & drop file upload with preview list                 |
| DatePicker          | Calendar-based date input                                 |
| ToastNotification   | Success / Error / Warning / Info toast messages           |
| PageHeader          | Heading + breadcrumb + action button area                 |
| EmptyState          | Illustration + message when no data                       |
| LoadingSpinner      | Centered spinner for loading states                       |
| PriceDisplay        | Formatted currency display                                |
| Timeline            | Vertical timeline for approval history / activity logs    |
| AvatarGroup         | Stacked avatars for vendor/user lists                     |
| SideDrawer          | Slide-in panel for quick view details                     |

---

## Color System (Suggested)

| Token             | Value        | Usage                          |
|-------------------|--------------|--------------------------------|
| Primary           | #4F46E5      | Buttons, links, active states  |
| Success           | #16A34A      | Approved, active, positive     |
| Warning           | #D97706      | Pending, draft, deadline near  |
| Danger            | #DC2626      | Rejected, error, delete        |
| Neutral           | #6B7280      | Secondary text, borders        |
| Background        | #F9FAFB      | Page background                |
| Surface           | #FFFFFF      | Cards, modals, panels          |
| Text Primary      | #111827      | Headings, body text            |
| Text Secondary    | #6B7280      | Subtitles, labels              |

---

## Typography

| Scale       | Size   | Weight  | Usage                    |
|-------------|--------|---------|--------------------------|
| H1          | 30px   | 700     | Page headings            |
| H2          | 24px   | 600     | Section headings         |
| H3          | 20px   | 600     | Card titles              |
| Body        | 16px   | 400     | Body text, paragraphs    |
| Small       | 14px   | 400     | Table text, labels       |
| XSmall      | 12px   | 400     | Timestamps, helper text  |

---

## Responsive Breakpoints

| Breakpoint  | Width       | Behavior                                      |
|-------------|-------------|-----------------------------------------------|
| Mobile      | < 640px     | Sidebar hidden, hamburger menu, stacked cards |
| Tablet      | 640–1024px  | Collapsed sidebar (icons only)                |
| Desktop     | > 1024px    | Full sidebar, full table columns              |

---

## Navigation & Routing

| Route                        | Screen                            | Roles                          |
|------------------------------|-----------------------------------|--------------------------------|
| /login                       | Login                             | Public                         |
| /signup                      | Signup                            | Public                         |
| /forgot-password             | Forgot Password                   | Public                         |
| /dashboard                   | Dashboard                         | All                            |
| /vendors                     | Vendor List                       | Admin, Procurement Officer     |
| /vendors/new                 | Add Vendor                        | Admin, Procurement Officer     |
| /vendors/:id                 | Vendor Detail                     | Admin, Procurement Officer     |
| /rfqs                        | RFQ List                          | Admin, Procurement Officer     |
| /rfqs/new                    | Create RFQ                        | Procurement Officer            |
| /rfqs/:id                    | RFQ Detail                        | All                            |
| /quotations                  | Quotation List (Vendor)           | Vendor                         |
| /quotations/:rfqId/submit    | Submit Quotation                  | Vendor                         |
| /quotations/:rfqId/compare   | Quotation Comparison              | Procurement Officer            |
| /approvals                   | Approval Queue                    | Manager/Approver               |
| /approvals/:id               | Approval Detail                   | Manager/Approver               |
| /purchase-orders             | PO List                           | All except Vendor              |
| /purchase-orders/new         | Create/Generate PO                | Procurement Officer            |
| /purchase-orders/:id         | PO Detail                         | All                            |
| /invoices                    | Invoice List                      | All except Vendor              |
| /invoices/:id                | Invoice Detail                    | All                            |
| /activity-logs               | Activity Logs                     | Admin                          |
| /notifications               | All Notifications                 | All                            |
| /reports                     | Reports & Analytics               | Admin, Manager                 |
| /settings                    | Settings                          | Admin                          |
