
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChartOfAccounts, Entry, CategoryType, User } from '../types';
import { supabase } from '../supabase';
import { getMonthName } from '../utils/formatters';

interface FinanceContextType {
  chartOfAccounts: ChartOfAccounts;
  entries: Entry[];
  users: User[];
  currentUserProfile: User | null;
  loading: boolean;
  addChartItem: (key: keyof ChartOfAccounts, name: string) => Promise<void>;
  updateChartItem: (key: keyof ChartOfAccounts, id: string, name: string) => Promise<void>;
  deleteChartItem: (key: keyof ChartOfAccounts, id: string) => Promise<void>;
  addEntry: (entry: Omit<Entry, 'id'>) => Promise<void>;
  updateEntry: (id: string, entry: Omit<Entry, 'id'>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  // Usuários
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const formatError = (error: any) => {
    if (!error) return "Erro desconhecido";
    if (typeof error === 'string') return error;
    return error.message || error.details || error.hint || JSON.stringify(error);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('usuarios').select('id, login, role').order('login');
    if (!error && data) {
      const mapped: User[] = data.map(u => ({
        id: u.id,
        login: u.login,
        role: u.role as 'admin' | 'operator'
      }));
      setUsers(mapped);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const login = authUser.email?.split('@')[0];
        const profile = mapped.find(u => u.login === login);
        if (profile) setCurrentUserProfile(profile);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: chartData, error: chartError } = await supabase.from('planos_contas').select('*');
      if (!chartError && chartData) {
        const newChart: ChartOfAccounts = { ...INITIAL_CHART, incomeTypes: [], expenseTypes: [], purchaseTypes: [], banks: [], paymentMethods: [] };
        chartData.forEach((item: any) => {
          const cat = item.categoria as keyof ChartOfAccounts;
          if (newChart[cat]) newChart[cat].push({ id: item.id.toString(), name: item.nome });
        });
        setChartOfAccounts(newChart);
      }

      const { data: entriesData, error: entriesError } = await supabase.from('lancamentos').select('*').order('data', { ascending: false });
      if (!entriesError && entriesData) {
        setEntries(entriesData.map((e: any) => ({
          id: e.id.toString(),
          date: e.data,
          type: (e.tipo || '').toString().toUpperCase().trim().startsWith('REC') ? 'RECEITA' : (e.tipo || '').toString().toUpperCase().trim().startsWith('COMP') ? 'COMPRA' : 'DESPESA',
          categoryId: e.classificacao?.toString() || '',
          description: e.item || '',
          paymentMethodId: e.forma_pagamento?.toString() || '',
          bankId: '',
          clientName: e.nome_cliente || '',
          value: Math.abs(Number(e.valor))
        })));
      }
      await fetchUsers();
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addUser = async (user: Omit<User, 'id'> & { password?: string }) => {
    try {
      const email = `${user.login.toLowerCase().trim()}@superjofi.local`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: user.password || '123456',
        options: { data: { login: user.login.toLowerCase().trim(), role: user.role } }
      });

      if (authError) throw new Error("Erro no Auth: " + authError.message);
      if (!authData.user) throw new Error("Não foi possível obter o ID do usuário.");

      const { error: profileError } = await supabase.from('usuarios').insert([{
        id: authData.user.id,
        login: user.login.toLowerCase().trim(),
        role: user.role
      }]);
      
      if (profileError) throw new Error("Erro na tabela usuários: " + profileError.message);

      await fetchUsers();
      alert(`Usuário ${user.login} criado com sucesso!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    const { error } = await supabase.from('usuarios').update({
      login: user.login?.toLowerCase().trim(),
      role: user.role
    }).eq('id', id);
    
    if (!error) await fetchUsers();
    else alert("Erro ao atualizar: " + formatError(error));
  };

  const deleteUser = async (id: string) => {
    if (currentUserProfile?.id === id) {
      throw new Error("Você não pode excluir o seu próprio usuário logado.");
    }

    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (!error) {
      await fetchUsers();
    } else {
      throw new Error(formatError(error));
    }
  };

  const addChartItem = async (key: keyof ChartOfAccounts, name: string) => {
    const { data, error } = await supabase.from('planos_contas').insert([{ categoria: key, nome: name }]).select();
    if (!error && data) setChartOfAccounts(prev => ({ ...prev, [key]: [...prev[key], { id: data[0].id.toString(), name: data[0].nome }] }));
  };

  const updateChartItem = async (key: keyof ChartOfAccounts, id: string, name: string) => {
    const { error } = await supabase.from('planos_contas').update({ nome: name }).eq('id', id);
    if (!error) setChartOfAccounts(prev => ({ ...prev, [key]: prev[key].map(item => item.id === id ? { ...item, name } : item) }));
  };

  const deleteChartItem = async (key: keyof ChartOfAccounts, id: string) => {
    const { error } = await supabase.from('planos_contas').delete().eq('id', id);
    if (!error) setChartOfAccounts(prev => ({ ...prev, [key]: prev[key].filter(item => item.id !== id) }));
  };

  const addEntry = async (entry: Omit<Entry, 'id'>) => {
    const monthIndex = parseInt(entry.date.split('-')[1], 10) - 1;
    const { error } = await supabase.from('lancamentos').insert([{
      data: entry.date,
      tipo: entry.type,
      classificacao: entry.categoryId || null,
      item: entry.description,
      forma_pagamento: entry.paymentMethodId || null,
      nome_cliente: entry.clientName,
      valor: Math.abs(entry.value),
      mes: getMonthName(monthIndex)
    }]);
    if (!error) await fetchData();
  };

  const updateEntry = async (id: string, entry: Omit<Entry, 'id'>) => {
    const monthIndex = parseInt(entry.date.split('-')[1], 10) - 1;
    const { error } = await supabase.from('lancamentos').update({
      data: entry.date,
      tipo: entry.type,
      classificacao: entry.categoryId || null,
      item: entry.description,
      forma_pagamento: entry.paymentMethodId || null,
      nome_cliente: entry.clientName,
      valor: Math.abs(entry.value),
      mes: getMonthName(monthIndex)
    }).eq('id', id);
    if (!error) await fetchData();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (!error) setEntries(prev => prev.filter(item => item.id !== id));
  };

  return (
    <FinanceContext.Provider value={{
      chartOfAccounts, entries, users, currentUserProfile, loading,
      addChartItem, updateChartItem, deleteChartItem,
      addEntry, updateEntry, deleteEntry,
      fetchUsers, addUser, updateUser, deleteUser
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
