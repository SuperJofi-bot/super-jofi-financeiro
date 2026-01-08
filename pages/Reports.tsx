
import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertCircle, 
  PieChart as PieChartIcon, 
  LayoutList,
  ChevronDown,
  Info
} from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const Reports: React.FC = () => {
  const { entries, chartOfAccounts } = useFinance();
  const currentYear = new Date().getFullYear();

  // Monthly summary for the whole year
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      monthIndex: i,
      receitas: 0,
      despesas: 0,
      saldo: 0
    }));

    entries.forEach(entry => {
      const d = new Date(entry.date + 'T00:00:00');
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        if (entry.type === 'RECCEITA') {
          data[m].receitas += entry.value;
        } else {
          data[m].despesas += entry.value;
        }
        data[m].saldo = data[m].receitas - data[m].despesas;
      }
    });

    return data;
  }, [entries, currentYear]);

  const currentMonthIndex = new Date().getMonth();
  const currentMonthTotals = monthlyData[currentMonthIndex];

  // Expenses by Category
  const expenseByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    entries.forEach(entry => {
       const d = new Date(entry.date + 'T00:00:00');
       if (entry.type === 'DESPESA' && d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear) {
         const name = chartOfAccounts.expenseTypes.find(t => t.id === entry.categoryId)?.name || 'Outros';
         categories[name] = (categories[name] || 0) + entry.value;
       }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [entries, chartOfAccounts, currentMonthIndex, currentYear]);

  const totalAnnual = useMemo(() => {
    return monthlyData.reduce((acc, curr) => ({
      income: acc.income + curr.receitas,
      expense: acc.expense + curr.despesas
    }), { income: 0, expense: 0 });
  }, [monthlyData]);

  const isNegativeMonth = currentMonthTotals.saldo < 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios de Desempenho</h1>
          <p className="text-slate-500">Analise a saúde financeira da Super Jofi em {currentYear}.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm">
          Ano: {currentYear} <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-80 font-medium">
              <ArrowUpCircle className="w-5 h-5" />
              <span>Receitas (Total Anual)</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(totalAnnual.income)}</h3>
            <p className="text-sm opacity-70">Soma de todas as entradas do ano.</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 transform transition-transform group-hover:scale-[1.7]">
            <TrendingUp className="w-16 h-16" />
          </div>
        </div>

        <div className="bg-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden group">
           <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-80 font-medium">
              <ArrowDownCircle className="w-5 h-5" />
              <span>Despesas (Total Anual)</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(totalAnnual.expense)}</h3>
            <p className="text-sm opacity-70">Total acumulado de saídas.</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 transform transition-transform group-hover:scale-[1.7]">
            <TrendingDown className="w-16 h-16" />
          </div>
        </div>

        <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden group border ${isNegativeMonth ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-600 text-white shadow-blue-500/20 border-transparent'}`}>
           <div className="relative z-10">
            <div className={`flex items-center gap-2 mb-4 font-medium ${isNegativeMonth ? 'text-rose-600' : 'opacity-80'}`}>
              <AlertCircle className="w-5 h-5" />
              <span>Resultado de {getMonthName(currentMonthIndex)}</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(currentMonthTotals.saldo)}</h3>
            <p className={`text-sm ${isNegativeMonth ? 'text-rose-700' : 'opacity-70'}`}>
              {isNegativeMonth ? '⚠️ Atenção: Mês fechando no negativo!' : 'Performance positiva este mês.'}
            </p>
          </div>
           {isNegativeMonth && (
             <div className="absolute bottom-0 right-0 p-4 animate-bounce">
                <AlertCircle className="w-12 h-12 text-rose-200/50" />
             </div>
           )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Bar Chart: Receitas vs Despesas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <LayoutList className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800">Evolução Mensal</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receita</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Despesa</div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution: Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800">Distribuição de Despesas</h3>
          </div>
          <div className="flex-1 w-full flex flex-col md:flex-row items-center">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-4 md:mt-0 md:ml-4 max-h-[200px] overflow-y-auto w-full md:w-auto p-2">
              {expenseByCategory.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-semibold text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-slate-400 font-bold">{formatCurrency(item.value)}</span>
                </div>
              ))}
              {expenseByCategory.length === 0 && (
                <p className="text-xs text-slate-400 italic">Sem dados de despesas este mês.</p>
              )}
            </div>
          </div>
        </div>

        {/* Balance Evolution: Area Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[400px] lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800">Evolução do Saldo</h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                />
                <Area type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
         <div className="relative z-10 flex-1">
            <div className="flex items-center gap-3 mb-4">
               <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                 <Info className="w-6 h-6 text-emerald-400" />
               </div>
               <h4 className="text-xl font-bold">Resumo Estratégico</h4>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-2xl">
              Neste período, as suas receitas estão {totalAnnual.income > totalAnnual.expense ? 'superando' : 'abaixo das'} despesas. 
              {isNegativeMonth ? ' Recomendamos uma revisão imediata das despesas variáveis de este mês para equilibrar o caixa.' : ' Continue mantendo o controle rigoroso para garantir uma reserva de emergência robusta.'}
            </p>
            <div className="flex flex-wrap gap-4">
               <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Lucro Acumulado: {formatCurrency(Math.max(0, totalAnnual.income - totalAnnual.expense))}
               </div>
               <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-blue-400">
                  Ticket Médio: {formatCurrency(totalAnnual.income / (entries.filter(e => e.type === 'RECCEITA').length || 1))}
               </div>
            </div>
         </div>
         <div className="relative z-10 w-full md:w-auto flex flex-col gap-3">
            <button className="bg-emerald-500 hover:bg-emerald-600 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
               Exportar PDF
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/10 px-8 py-4 rounded-2xl font-bold transition-all">
               Enviar por E-mail
            </button>
         </div>
         
         {/* Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      </div>
    </div>
  );
};

export default Reports;

// Temporary usage of TrendingUp and TrendingDown from Lucide
import { TrendingUp, TrendingDown } from 'lucide-react';
