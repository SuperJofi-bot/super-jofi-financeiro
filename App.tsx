
import React, { useState } from 'react';
import Layout from './components/Layout';
import { FinanceProvider } from './context/FinanceContext';
import ChartOfAccounts from './pages/ChartOfAccounts';
import Entries from './pages/Entries';
import Reports from './pages/Reports';
import { Page } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.ENTRIES);

  const renderPage = () => {
    switch (currentPage) {
      case Page.CHART_OF_ACCOUNTS:
        return <ChartOfAccounts />;
      case Page.ENTRIES:
        return <Entries />;
      case Page.REPORTS:
        return <Reports />;
      default:
        return <Entries />;
    }
  };

  return (
    <FinanceProvider>
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </Layout>
    </FinanceProvider>
  );
};

export default App;
