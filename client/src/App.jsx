import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="vendors" element={<VendorManagement />} />
            <Route path="rfqs" element={<RFQManagement />} />
            <Route path="quotations" element={<QuotationComparison />} />
            <Route path="pos" element={<PurchaseOrders />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="approvals" element={<Approvals />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
