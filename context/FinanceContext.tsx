
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChartOfAccounts, Entry, BaseItem, CategoryType } from '../types';

interface FinanceContextType {
  chartOfAccounts: ChartOfAccounts;
  entries: Entry[];
  addChartItem: (key: keyof ChartOfAccounts, name: string) => void;
  updateChartItem: (key: keyof ChartOfAccounts, id: string, name: string) => void;
  deleteChartItem: (key: keyof ChartOfAccounts, id: string) => void;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (id: string, entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_CHART: ChartOfAccounts = {
  incomeTypes: [
    { id: '1', name: 'Vendas' },
    { id: '2', name: 'Recebimentos' },
    { id: '3', name: 'Outros' }
  ],
  expenseTypes: [
    { id: '1', name: 'Energia' },
    { id: '2', name: 'Aluguel' },
    { id: '3', name: 'RH' },
    { id: '4', name: 'Contabilidade' }
  ],
  banks: [
    { id: '1', name: 'Stone' },
    { id: '2', name: 'Bradesco' },
    { id: '3', name: 'Conta Interna' }
  ],
  paymentMethods: [
    { id: '1', name: 'Dinheiro' },
    { id: '2', name: 'Pix' },
    { id: '3', name: 'Débito' },
    { id: '4', name: 'Crédito' }
  ]
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts>(() => {
    const saved = localStorage.getItem('superjofi_chart');
    return saved ? JSON.parse(saved) : INITIAL_CHART;
  });

  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('superjofi_entries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('superjofi_chart', JSON.stringify(chartOfAccounts));
  }, [chartOfAccounts]);

  useEffect(() => {
    localStorage.setItem('superjofi_entries', JSON.stringify(entries));
  }, [entries]);

  const addChartItem = (key: keyof ChartOfAccounts, name: string) => {
    const newItem = { id: Date.now().toString(), name };
    setChartOfAccounts(prev => ({
      ...prev,
      [key]: [...prev[key], newItem]
    }));
  };

  const updateChartItem = (key: keyof ChartOfAccounts, id: string, name: string) => {
    setChartOfAccounts(prev => ({
      ...prev,
      [key]: prev[key].map(item => item.id === id ? { ...item, name } : item)
    }));
  };

  const deleteChartItem = (key: keyof ChartOfAccounts, id: string) => {
    setChartOfAccounts(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item.id !== id)
    }));
  };

  const addEntry = (entry: Omit<Entry, 'id'>) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    setEntries(prev => [...prev, newEntry]);
  };

  const updateEntry = (id: string, entry: Omit<Entry, 'id'>) => {
    setEntries(prev => prev.map(item => item.id === id ? { ...entry, id } : item));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(item => item.id !== id));
  };

  return (
    <FinanceContext.Provider value={{
      chartOfAccounts,
      entries,
      addChartItem,
      updateChartItem,
      deleteChartItem,
      addEntry,
      updateEntry,
      deleteEntry
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
