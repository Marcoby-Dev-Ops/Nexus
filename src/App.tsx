import React from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';

/**
 * @name App
 * @description The root component of the application, rendering the main dashboard.
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard' },
  ];
  return (
    <Layout breadcrumbs={breadcrumbs} subtitle="Welcome to NEXUS - Your business operating system">
      <Dashboard />
    </Layout>
  );
}

export default App;
