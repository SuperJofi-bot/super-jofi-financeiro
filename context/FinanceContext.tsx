
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
      
      try {
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

        // 2. Busca Lançamentos com os nomes de colunas exatos do Supabase
        const { data: entriesData, error: entriesError } = await supabase
          .from('lancamentos')
          .select('*')
          .order('data', { ascending: false });

        if (!entriesError && entriesData) {
          const mappedEntries: Entry[] = entriesData.map((e: any) => ({
            id: e.id.toString(),
            date: e.data, // mapeado de 'data'
            type: e.tipo as CategoryType, // mapeado de 'tipo'
            categoryId: e.classificacao?.toString() || '', // mapeado de 'classificacao'
            description: e.item || '', // mapeado de 'item'
            paymentMethodId: e.forma_pagamento?.toString() || '', // mapeado de 'forma_pagamento'
            bankId: '', // Não especificado na lista de colunas do usuário, mantido vazio
            clientName: e.nome_cliente || '', // mapeado de 'nome_cliente'
            value: Number(e.valor) // mapeado de 'valor'
          }));
          setEntries(mappedEntries);
        }
      } catch (err) {
        console.error("Erro geral ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
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
    // Calcula o nome do mês para a coluna 'mes'
    const dateObj = new Date(entry.date + 'T00:00:00');
    const monthName = getMonthName(dateObj.getMonth());

    // Mapeia do código para as colunas reais do banco (snake_case e nomes pt-br)
    const payload = {
      data: entry.date,
      tipo: entry.type,
      classificacao: entry.categoryId,
      item: entry.description,
      forma_pagamento: entry.paymentMethodId,
      nome_cliente: entry.clientName,
      valor: entry.value,
      mes: monthName
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
      console.error("Erro ao salvar lançamento no Supabase:", error);
      alert("Erro ao salvar no banco de dados. Verifique as permissões ou se as colunas estão corretas.");
    }
  };

  const updateEntry = async (id: string, entry: Omit<Entry, 'id'>) => {
    const dateObj = new Date(entry.date + 'T00:00:00');
    const monthName = getMonthName(dateObj.getMonth());

    const payload = {
      data: entry.date,
      tipo: entry.type,
      classificacao: entry.categoryId,
      item: entry.description,
      forma_pagamento: entry.paymentMethodId,
      nome_cliente: entry.clientName,
      valor: entry.value,
      mes: monthName
    };

    const { error } = await supabase
      .from('lancamentos')
      .update(payload)
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.map(item => item.id === id ? { ...entry, id } : item));
    } else {
      console.error("Erro ao atualizar lançamento:", error);
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
      console.error("Erro ao excluir lançamento:", error);
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
