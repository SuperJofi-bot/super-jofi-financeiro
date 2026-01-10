
import React, { useMemo, useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getMonthName, formatDate } from '../utils/formatters';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  ShoppingBag, 
  PieChart as PieChartIcon, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Mail, 
  Info, 
  Loader2, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Trophy,
  ListOrdered,
  Calendar
} from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9', '#84cc16', '#a855f7'];

const Reports: React.FC = () => {
  const { entries, chartOfAccounts } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const monthlyEvolution = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i).substring(0, 3),
      receitas: 0,
      despesas: 0,
      compras: 0
    }));

    entries.forEach(entry => {
      const d = new Date(entry.date + 'T00:00:00');
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (entry.type === 'RECEITA') data[m].receitas += entry.value;
        else if (entry.type === 'COMPRA') data[m].compras += entry.value;
        else data[m].despesas += entry.value;
      }
    });
    return data;
  }, [entries, selectedYear]);

  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [entries, selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    return monthEntries.reduce((acc, curr) => {
      if (curr.type === 'RECEITA') acc.income += curr.value;
      else if (curr.type === 'COMPRA') acc.purchase += curr.value;
      else acc.expense += curr.value;
      return acc;
    }, { income: 0, expense: 0, purchase: 0 });
  }, [monthEntries]);

  const getCategoryStats = (type: 'RECEITA' | 'DESPESA' | 'COMPRA', chartList: {id: string, name: string}[]) => {
    const stats: Record<string, number> = {};
    monthEntries.filter(e => e.type === type).forEach(entry => {
      const name = chartList.find(t => t.id === entry.categoryId)?.name || 'Outros';
      stats[name] = (stats[name] || 0) + entry.value;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const incomeStats = useMemo(() => getCategoryStats('RECEITA', chartOfAccounts.incomeTypes), [monthEntries, chartOfAccounts]);
  const expenseStats = useMemo(() => getCategoryStats('DESPESA', chartOfAccounts.expenseTypes), [monthEntries, chartOfAccounts]);
  const purchaseStats = useMemo(() => getCategoryStats('COMPRA', chartOfAccounts.purchaseTypes), [monthEntries, chartOfAccounts]);

  const topExpenses = useMemo(() => monthEntries.filter(e => e.type === 'DESPESA').sort((a, b) => b.value - a.value).slice(0, 10), [monthEntries]);
  const topPurchases = useMemo(() => monthEntries.filter(e => e.type === 'COMPRA').sort((a, b) => b.value - a.value).slice(0, 10), [monthEntries]);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    
    // Configurações para o canvas focado no conteúdo (sem botões)
    const originalStyle = reportRef.current.style.backgroundColor;
    reportRef.current.style.backgroundColor = '#ffffff';
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        ignoreElements: (element) => element.classList.contains('no-print')
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Primeira Página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas extras se o relatório for muito longo
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Relatorio_SuperJofi_${getMonthName(selectedMonth)}_${selectedYear}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Houve um erro ao gerar o PDF. Verifique se os dados estão carregados corretamente.');
    } finally {
      reportRef.current.style.backgroundColor = originalStyle;
      setIsGeneratingPDF(false);
    }
  };

  const insights = useMemo(() => {
    const totalOut = totals.expense + totals.purchase;
    const balance = totals.income - totalOut;
    if (monthEntries.length === 0) return "Nenhum dado para este período.";
    
    let text = `Em ${getMonthName(selectedMonth)}, a Super Jofi teve um desempenho `;
    text += balance >= 0 ? "POSITIVO. " : "NEGATIVO. ";
    text += `As despesas operacionais representam ${((totals.expense / (totalOut || 1)) * 100).toFixed(1)}% das saídas, enquanto as compras representam ${((totals.purchase / (totalOut || 1)) * 100).toFixed(1)}%. `;
    
    if (purchaseStats[0]) text += `O foco de investimento em compras foi "${purchaseStats[0].name}" (${formatCurrency(purchaseStats[0].value)}). `;
    if (expenseStats[0]) text += `O maior custo administrativo/operacional foi "${expenseStats[0].name}" (${formatCurrency(expenseStats[0].value)}). `;

    return text;
  }, [totals, monthEntries, purchaseStats, expenseStats, selectedMonth]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700" ref={reportRef}>
      {/* Cabeçalho de Impressão (Só aparece no PDF) */}
      <div className="hidden print-block border-b-2 border-slate-900 pb-4 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900">RELATÓRIO MENSAL</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Empresa: Super Jofi</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">Período: {getMonthName(selectedMonth)} / {selectedYear}</p>
            <p className="text-[10px] text-slate-400">Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatório Consolidado</h1>
          <p className="text-slate-500">Análise detalhada de fluxo, compras e performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 text-center min-w-[120px]">
            <span className="text-sm font-bold text-slate-800">{getMonthName(selectedMonth)}</span>
            <span className="text-[10px] block text-slate-400 font-medium">{selectedYear}</span>
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-500 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/10">
          <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Receitas</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totals.income)}</h3>
          <TrendingUp className="w-8 h-8 absolute top-4 right-4 opacity-20" />
        </div>
        <div className="bg-rose-500 rounded-3xl p-5 text-white shadow-lg shadow-rose-500/10">
          <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Despesas</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totals.expense)}</h3>
          <TrendingDown className="w-8 h-8 absolute top-4 right-4 opacity-20" />
        </div>
        <div className="bg-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-600/10">
          <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Compras</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totals.purchase)}</h3>
          <ShoppingBag className="w-8 h-8 absolute top-4 right-4 opacity-20" />
        </div>
        <div className={`rounded-3xl p-5 shadow-lg border ${totals.income - totals.expense - totals.purchase < 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-900 text-white'}`}>
          <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Saldo Líquido</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totals.income - totals.expense - totals.purchase)}</h3>
          <AlertCircle className="w-8 h-8 absolute top-4 right-4 opacity-20" />
        </div>
      </div>

      {/* Gráfico de Evolução Anual */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px] min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> Fluxo de Caixa Anual ({selectedYear})</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Rec</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Des</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Com</span>
          </div>
        </div>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minHeight={0}>
            <BarChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
              <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} />
              <Bar dataKey="compras" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos de Distribuição com Legenda Melhorada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Despesas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 min-w-0 flex flex-col">
          <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-rose-500" /> Distribuição de Despesas Operacionais</h4>
          <div className="flex flex-col sm:flex-row gap-8 items-center flex-1">
            <div className="h-[220px] w-full sm:w-1/2 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <PieChart>
                  <Pie data={expenseStats} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                    {expenseStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda Organizada */}
            <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {expenseStats.length > 0 ? expenseStats.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs font-medium text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 pl-4">{formatCurrency(item.value)}</span>
                </div>
              )) : <p className="text-xs text-slate-400 italic">Sem despesas registradas.</p>}
            </div>
          </div>
        </div>

        {/* Distribuição de Compras */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 min-w-0 flex flex-col">
          <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-blue-600" /> Foco de Investimento em Compras</h4>
          <div className="flex flex-col sm:flex-row gap-8 items-center flex-1">
            <div className="h-[220px] w-full sm:w-1/2 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <PieChart>
                  <Pie data={purchaseStats} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                    {purchaseStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda Organizada */}
            <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {purchaseStats.length > 0 ? purchaseStats.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs font-medium text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 pl-4">{formatCurrency(item.value)}</span>
                </div>
              )) : <p className="text-xs text-slate-400 italic">Sem compras registradas.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Rankings Section (Tabelas Profissionais) */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-rose-600"><ListOrdered className="w-5 h-5" /> Principais Saídas de Caixa (Despesas & Compras)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Data</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Tipo</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Beneficiário/Cliente</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Item/Descrição</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Valor Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...topExpenses, ...topPurchases].sort((a,b) => b.value - a.value).slice(0, 15).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${item.type === 'DESPESA' ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.clientName || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-500 italic">{item.description}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(item.value)}</td>
                  </tr>
                ))}
                {monthEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium italic">Nenhum dado encontrado para listagem neste período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insights & Export Section */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
         <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
               <div className="bg-emerald-500/20 p-2 rounded-xl"><Info className="w-6 h-6 text-emerald-400" /></div>
               <h4 className="text-xl font-bold">Resumo Estratégico do Período</h4>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-medium mb-6">
              {insights}
            </p>
            <div className="flex flex-wrap gap-4 no-print">
               <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                 Lucratividade: {totals.income > 0 ? (( (totals.income - (totals.expense + totals.purchase)) / totals.income ) * 100).toFixed(1) : 0}%
               </div>
               <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                 Op. Efetuadas: {monthEntries.length}
               </div>
            </div>
         </div>
         <div className="flex flex-col gap-3 w-full md:w-auto no-print">
            <button 
              onClick={exportToPDF} 
              disabled={isGeneratingPDF || monthEntries.length === 0} 
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isGeneratingPDF ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
              {isGeneratingPDF ? 'Gerando Relatório Profissional...' : 'Exportar Relatório PDF (A4)'}
            </button>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all">
              <Mail className="w-5 h-5" />
              Enviar para Diretoria
            </button>
         </div>
      </div>
      
      {/* Rodapé de Página (Só aparece no PDF) */}
      <div className="hidden print-block mt-12 pt-8 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        <span>© Super Jofi - Gestão Financeira Inteligente</span>
        <span>Página 1 de 1</span>
      </div>
    </div>
  );
};

export default Reports;
