
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChartOfAccounts, Entry, CategoryType } from '../types';
import { supabase } from '../supabase';
import { getMonthName } from '../utils/formatters';

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
  purchaseTypes: [],
  banks: [],
  paymentMethods: []
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts>(INITIAL_CHART);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper para exibir mensagens de erro reais do Supabase
  const formatError = (error: any) => {
    if (!error) return "Erro desconhecido";
    if (typeof error === 'string') return error;
    return error.message || error.details || error.hint || JSON.stringify(error);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Busca Plano de Contas
      const { data: chartData, error: chartError } = await supabase
        .from('planos_contas')
        .select('*');
      
      if (!chartError && chartData) {
        const newChart: ChartOfAccounts = {
          incomeTypes: [],
          expenseTypes: [],
          purchaseTypes: [],
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

      // 2. Busca Lançamentos
      const { data: entriesData, error: entriesError } = await supabase
        .from('lancamentos')
        .select('*')
        .order('data', { ascending: false });

      if (!entriesError && entriesData) {
        const mappedEntries: Entry[] = entriesData.map((e: any) => {
          // Lógica resiliente para detectar RECEITA mesmo com erro de digitação
          const rawType = (e.tipo || '').toString().toUpperCase().trim();
          let normalizedType: CategoryType = 'DESPESA';
          
          if (rawType.startsWith('REC')) normalizedType = 'RECEITA';
          else if (rawType.startsWith('COMP')) normalizedType = 'COMPRA';

          return {
            id: e.id.toString(),
            date: e.data,
            type: normalizedType,
            categoryId: e.classificacao?.toString() || '',
            description: e.item || '',
            paymentMethodId: e.forma_pagamento?.toString() || '',
            bankId: '', // Como não há coluna no banco, mantemos vazio no estado
            clientName: e.nome_cliente || '',
            value: Math.abs(Number(e.valor))
          };
        });
        setEntries(mappedEntries);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      alert("Erro no Plano de Contas: " + formatError(error));
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
    try {
      const dateObj = new Date(entry.date + 'T00:00:00');
      const monthName = getMonthName(dateObj.getMonth());

      // REMOVIDO: 'banco' ou 'banks' pois a coluna não existe na tabela lancamentos
      const payload = {
        data: entry.date,
        tipo: entry.type === 'RECEITA' ? 'RECEITA' : entry.type === 'COMPRA' ? 'COMPRA' : 'DESPESA',
        classificacao: entry.categoryId || null,
        item: entry.description,
        forma_pagamento: entry.paymentMethodId || null,
        nome_cliente: entry.clientName,
        valor: Math.abs(entry.value),
        mes: monthName
      };

      const { error } = await supabase.from('lancamentos').insert([payload]);

      if (!error) {
        await fetchData();
      } else {
        alert("Erro ao salvar lançamento: " + formatError(error));
      }
    } catch (err) {
      alert("Erro interno: " + err);
    }
  };

  const updateEntry = async (id: string, entry: Omit<Entry, 'id'>) => {
    try {
      const dateObj = new Date(entry.date + 'T00:00:00');
      const monthName = getMonthName(dateObj.getMonth());

      const payload = {
        data: entry.date,
        tipo: entry.type === 'RECEITA' ? 'RECEITA' : entry.type === 'COMPRA' ? 'COMPRA' : 'DESPESA',
        classificacao: entry.categoryId || null,
        item: entry.description,
        forma_pagamento: entry.paymentMethodId || null,
        nome_cliente: entry.clientName,
        valor: Math.abs(entry.value),
        mes: monthName
      };

      const { error } = await supabase
        .from('lancamentos')
        .update(payload)
        .eq('id', id);

      if (!error) {
        await fetchData();
      } else {
        alert("Erro ao atualizar lançamento: " + formatError(error));
      }
    } catch (err) {
      alert("Erro interno: " + err);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('lancamentos')
      .delete()
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.filter(item => item.id !== id));
    } else {
      alert("Erro ao excluir lançamento: " + formatError(error));
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
