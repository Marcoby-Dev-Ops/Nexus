import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SalesDashboard from './departments/sales/SalesDashboard';
import PropTypes from 'prop-types';

// Placeholder components for missing modules
const FinanceDashboard = () => (
  <div className="p-8 text-center text-xl text-muted-foreground">Finance module coming soon.</div>
);
const OperationsDashboard = () => (
  <div className="p-8 text-center text-xl text-muted-foreground">Operations module coming soon.</div>
);
const PulseMarketplace = () => (
  <div className="p-8 text-center text-xl text-muted-foreground">Pulse Marketplace coming soon.</div>
);

/**
 * @name App
 * @description The root component of the application, rendering the main dashboard and routes.
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} subtitle="Welcome to NEXUS - Your business operating system">
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/sales"
          element={
            <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Sales' }]} subtitle="Sales Department">
              <SalesDashboard />
            </Layout>
          }
        />
        <Route
          path="/finance"
          element={
            <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Finance' }]} subtitle="Finance Department">
              <FinanceDashboard />
            </Layout>
          }
        />
        <Route
          path="/operations"
          element={
            <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }]} subtitle="Operations Department">
              <OperationsDashboard />
            </Layout>
          }
        />
        <Route
          path="/pulse"
          element={
            <Layout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Pulse Marketplace' }]} subtitle="Pulse Marketplace">
              <PulseMarketplace />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

App.propTypes = {};

export default App;
