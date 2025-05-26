import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './components/dashboard/Dashboard';

const SalesHome = lazy(() => import('./departments/sales/SalesHome'));
const FinanceHome = lazy(() => import('./departments/finance/FinanceHome'));
const OperationsHome = lazy(() => import('./departments/operations/OperationsHome'));
const Marketplace = lazy(() => import('./marketplace/Marketplace'));
const DataWarehouseHome = lazy(() => import('./datawarehouse/DataWarehouseHome'));
const AdminHome = lazy(() => import('./components/dashboard/AdminHome'));

/**
 * @name App
 * @description The root component of the application, rendering the main dashboard and routes.
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8">Loading…</div>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales" element={<SalesHome />} />
            <Route path="/finance" element={<FinanceHome />} />
            <Route path="/operations" element={<OperationsHome />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/data-warehouse" element={<DataWarehouseHome />} />
            <Route path="/admin" element={<AdminHome />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
