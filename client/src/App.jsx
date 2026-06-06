import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VendorManagement from './pages/VendorManagement';
import RFQManagement from './pages/RFQManagement';
import QuotationComparison from './pages/QuotationComparison';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import AuditTrail from './pages/AuditTrail';

// Role constants matching backend
const ROLES = {
  ADMIN: 'admin',
  OFFICER: 'procurement_officer',
  MANAGER: 'manager',
  VENDOR: 'vendor',
};

const INTERNAL_ROLES = [ROLES.ADMIN, ROLES.OFFICER, ROLES.MANAGER];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Unauthorized page */}
          <Route path="/unauthorized" element={
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
              <h2 className="text-2xl font-semibold text-primary">Access Denied</h2>
              <p className="text-on-surface-variant">You don't have permission to view this page.</p>
              <a href="/" className="text-primary underline">Go to Dashboard</a>
            </div>
          } />

          {/* Protected routes — any logged-in user */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            {/* Vendor management — internal staff only */}
            <Route path="vendors" element={
              <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
                <VendorManagement />
              </ProtectedRoute>
            } />

            {/* RFQs — internal staff only */}
            <Route path="rfqs" element={
              <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
                <RFQManagement />
              </ProtectedRoute>
            } />

            {/* Quotations — all logged-in users (vendors submit, officers review) */}
            <Route path="quotations" element={<QuotationComparison />} />

            {/* Purchase Orders — internal staff only */}
            <Route path="pos" element={
              <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
                <PurchaseOrders />
              </ProtectedRoute>
            } />

            {/* Invoices — all logged-in users */}
            <Route path="invoices" element={<Invoices />} />

            {/* Approvals — managers and admins only */}
            <Route path="approvals" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Approvals />
              </ProtectedRoute>
            } />

            {/* Reports — managers and admins only */}
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Audit Trail — admins only */}
            <Route path="audit-trail" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AuditTrail />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
