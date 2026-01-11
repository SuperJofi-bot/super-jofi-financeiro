
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { FinanceProvider } from './context/FinanceContext';
import ChartOfAccounts from './pages/ChartOfAccounts';
import Entries from './pages/Entries';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Login from './pages/Login';
import { Page } from './types';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>(Page.ENTRIES);

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuta mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.CHART_OF_ACCOUNTS:
        return <ChartOfAccounts />;
      case Page.ENTRIES:
        return <Entries />;
      case Page.REPORTS:
        return <Reports />;
      case Page.USERS:
        return <Users />;
      default:
        return <Entries />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <FinanceProvider>
      <Layout 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
    </FinanceProvider>
  );
};

export default App;
