
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChartOfAccounts, Entry, CategoryType } from '../types';
import { supabase } from '../supabase';

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
  paymentMethods: []
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts>(INITIAL_CHART);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Chart Items
      const { data: chartData, error: chartError } = await supabase
        .from('chart_items')
        .select('*');
      
      if (!chartError && chartData) {
        const newChart: ChartOfAccounts = { ...INITIAL_CHART };
        chartData.forEach((item: any) => {
          const category = item.category as keyof ChartOfAccounts;
          if (newChart[category]) {
            newChart[category].push({ id: item.id, name: item.name });
          }
        });
        setChartOfAccounts(newChart);
      }

      // Fetch Entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: false });

      if (!entriesError && entriesData) {
        setEntries(entriesData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const addChartItem = async (key: keyof ChartOfAccounts, name: string) => {
    const { data, error } = await supabase
      .from('chart_items')
      .insert([{ category: key, name }])
      .select();

    if (!error && data) {
      setChartOfAccounts(prev => ({
        ...prev,
        [key]: [...prev[key], { id: data[0].id, name: data[0].name }]
      }));
    }
  };

  const updateChartItem = async (key: keyof ChartOfAccounts, id: string, name: string) => {
    const { error } = await supabase
      .from('chart_items')
      .update({ name })
      .eq('id', id);

    if (!error) {
      setChartOfAccounts(prev => ({
        ...prev,
        [key]: prev[key].map(item => item.id === id ? { ...item, name } : item)
      }));
    }
  };

  const deleteChartItem = async (key: keyof ChartOfAccounts, id: string) => {
    const { error } = await supabase
      .from('chart_items')
      .delete()
      .eq('id', id);

    if (!error) {
      setChartOfAccounts(prev => ({
        ...prev,
        [key]: prev[key].filter(item => item.id !== id)
      }));
    }
  };

  const addEntry = async (entry: Omit<Entry, 'id'>) => {
    const { data, error } = await supabase
      .from('entries')
      .insert([entry])
      .select();

    if (!error && data) {
      setEntries(prev => [data[0], ...prev]);
    }
  };

  const updateEntry = async (id: string, entry: Omit<Entry, 'id'>) => {
    const { error } = await supabase
      .from('entries')
      .update(entry)
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.map(item => item.id === id ? { ...entry, id } : item));
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <FinanceContext.Provider value={{
      chartOfAccounts,
      entries,
      loading,
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
