import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChartOfAccounts, Entry } from '../types';
import { supabase } from '../utils/supabase';

interface FinanceContextType {
  chartOfAccounts: ChartOfAccounts;
  entries: Entry[];
  loading: boolean;
  addChartItem: (key: keyof ChartOfAccounts, name: string) => Promise<void>;
  updateChartItem: (key: keyof ChartOfAccounts, id: string, name: string) => Promise<void>;
  deleteChartItem: (key: keyof ChartOfAccounts, id: string) => Promise<void>;
  addEntry: (entry: Omit<Entry, 'id'>) => Promise<void>;
  updateEntry: (id: string, entry: Omit<Entry, 'id'>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_CHART: ChartOfAccounts = {
  incomeTypes: [],
  expenseTypes: [],
  banks: [],
  paymentMethods: [],
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts>(INITIAL_CHART);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===========================
     LOAD PLANO DE CONTAS
  =========================== */
  const loadChartOfAccounts = async () => {
    const { data, error } = await supabase
      .from('planos_contas')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return;

    const newChart: ChartOfAccounts = {
      incomeTypes: [],
      expenseTypes: [],
      banks: [],
      paymentMethods: [],
    };

    data.forEach((item: any) => {
      const key = item.categoria as keyof ChartOfAccounts;
      if (newChart[key]) {
        newChart[key].push({
          id: item.id,
          name: item.nome,
        });
      }
    });

    setChartOfAccounts(newChart);
  };

  /* ===========================
     LOAD LANÇAMENTOS
  =========================== */
  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
  };

  /* ===========================
     INITIAL LOAD
  =========================== */
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await loadChartOfAccounts();
      await loadEntries();
      setLoading(false);
    };

    loadAll();
  }, []);

  /* ===========================
     PLANO DE CONTAS (CRUD)
  =========================== */
  const addChartItem = async (key: keyof ChartOfAccounts, name: string) => {
    await supabase.from('planos_contas').insert({
      categoria: key,
      nome: name,
    });

    loadChartOfAccounts();
  };

  const updateChartItem = async (key: keyof ChartOfAccounts, id: string, name: string) => {
    await supabase
      .from('planos_contas')
      .update({ nome: name })
      .eq('id', id);

    loadChartOfAccounts();
  };

  const deleteChartItem = async (key: keyof ChartOfAccounts, id: string) => {
    await supabase
      .from('planos_contas')
      .delete()
      .eq('id', id);

    loadChartOfAccounts();
  };

  /* ===========================
     LANÇAMENTOS (CRUD)
  =========================== */
  const addEntry = async (entry: Omit<Entry, 'id'>) => {
    await supabase.from('lancamentos').insert(entry);
    loadEntries();
  };

  const updateEntry = async (id: string, entry: Omit<Entry, 'id'>) => {
    await supabase
      .from('lancamentos')
      .update(entry)
      .eq('id', id);

    loadEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase
      .from('lancamentos')
      .delete()
      .eq('id', id);

    loadEntries();
  };

  return (
    <FinanceContext.Provider
      value={{
        chartOfAccounts,
        entries,
        loading,
        addChartItem,
        updateChartItem,
        deleteChartItem,
        addEntry,
        updateEntry,
        deleteEntry,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
