
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

  // Busca dados iniciais traduzindo do banco para o código
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Busca Itens do Plano de Contas
      const { data: chartData, error: chartError } = await supabase
        .from('planos_contas')
        .select('*');
      
      if (!chartError && chartData) {
        const newChart: ChartOfAccounts = {
          incomeTypes: [],
          expenseTypes: [],
          banks: [],
          paymentMethods: []
        };
        
        chartData.forEach((item: any) => {
          const cat = item.categoria as keyof ChartOfAccounts;
          if (newChart[cat]) {
            newChart[cat].push({ id: item.id.toString(), name: item.nome });
          }
        });
        setChartOfAccounts(newChart);
      }

      // 2. Busca Lançamentos com mapeamento de colunas
      const { data: entriesData, error: entriesError } = await supabase
        .from('lancamentos')
        .select('*')
        .order('date', { ascending: false });

      if (!entriesError && entriesData) {
        const mappedEntries: Entry[] = entriesData.map((e: any) => ({
          id: e.id.toString(),
          date: e.date,
          type: e.type as CategoryType,
          categoryId: e.category_id?.toString() || '',
          description: e.description || '',
          paymentMethodId: e.payment_method_id?.toString() || '',
          bankId: e.bank_id?.toString() || '',
          clientName: e.client_name || '',
          value: Number(e.value)
        }));
        setEntries(mappedEntries);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const addChartItem = async (key: keyof ChartOfAccounts, name: string) => {
    const { data, error } = await supabase
      .from('planos_contas')
      .insert([{ categoria: key, nome: name }])
      .select();

    if (!error && data) {
      setChartOfAccounts(prev => ({
        ...prev,
        [key]: [...prev[key], { id: data[0].id.toString(), name: data[0].nome }]
      }));
    } else if (error) {
      console.error("Erro ao adicionar item no plano de contas:", error);
    }
  };

  const updateChartItem = async (key: keyof ChartOfAccounts, id: string, name: string) => {
    const { error } = await supabase
      .from('planos_contas')
      .update({ nome: name })
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
      .from('planos_contas')
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
    // Mapeia do CamelCase do site para o snake_case do banco
    const payload = {
      date: entry.date,
      type: entry.type,
      category_id: entry.categoryId,
      description: entry.description,
      payment_method_id: entry.paymentMethodId,
      bank_id: entry.bankId,
      client_name: entry.clientName,
      value: entry.value
    };

    const { data, error } = await supabase
      .from('lancamentos')
      .insert([payload])
      .select();

    if (!error && data) {
      const newEntry: Entry = {
        ...entry,
        id: data[0].id.toString()
      };
      setEntries(prev => [newEntry, ...prev]);
    } else if (error) {
      console.error("Erro ao salvar lançamento:", error);
    }
  };

  const updateEntry = async (id: string, entry: Omit<Entry, 'id'>) => {
    const payload = {
      date: entry.date,
      type: entry.type,
      category_id: entry.categoryId,
      description: entry.description,
      payment_method_id: entry.paymentMethodId,
      bank_id: entry.bankId,
      client_name: entry.clientName,
      value: entry.value
    };

    const { error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.map(item => item.id === id ? { ...entry, id } : item));
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('lancamentos')
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
