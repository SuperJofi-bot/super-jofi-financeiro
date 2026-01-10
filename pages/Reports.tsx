
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
  Target,
  FileSearch,
  CheckCircle2
} from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9', '#84cc16', '#a855f7'];

const Reports: React.FC = () => {
  const { entries, chartOfAccounts } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const evolutionChartRef = useRef<HTMLDivElement>(null);

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

  const balance = totals.income - (totals.expense + totals.purchase);

  const getCategoryStats = (type: 'RECEITA' | 'DESPESA' | 'COMPRA', chartList: {id: string, name: string}[]) => {
    const stats: Record<string, number> = {};
    const filtered = monthEntries.filter(e => e.type === type);
    
    if (filtered.length === 0) return [];

    filtered.forEach(entry => {
      const category = chartList.find(t => t.id === entry.categoryId);
      const name = category ? category.name : 'Não Classificado';
      stats[name] = (stats[name] || 0) + entry.value;
    });

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const incomeStats = useMemo(() => getCategoryStats('RECEITA', chartOfAccounts.incomeTypes), [monthEntries, chartOfAccounts]);
  const expenseStats = useMemo(() => getCategoryStats('DESPESA', chartOfAccounts.expenseTypes), [monthEntries, chartOfAccounts]);
  const purchaseStats = useMemo(() => getCategoryStats('COMPRA', chartOfAccounts.purchaseTypes), [monthEntries, chartOfAccounts]);

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

  const analysisPoints = useMemo(() => {
    if (monthEntries.length === 0) return ["Sem dados registrados para este período."];
    
    const purchasePercent = totals.income > 0 ? ((totals.purchase / totals.income) * 100).toFixed(0) : '0';
    const expensePercent = totals.income > 0 ? ((totals.expense / totals.income) * 100).toFixed(0) : '0';
    
    const points = [
      `A empresa encerrou o período com resultado ${balance >= 0 ? 'POSITIVO' : 'NEGATIVO'}.`,
      `As compras representaram aproximadamente ${purchasePercent}% da receita, impactando diretamente o lucro.`,
      `As despesas operacionais estão controladas, correspondendo a cerca de ${expensePercent}% da receita.`,
    ];

    const dailyIncome: Record<string, number> = {};
    monthEntries.filter(e => e.type === 'RECEITA').forEach(e => {
      dailyIncome[e.date] = (dailyIncome[e.date] || 0) + e.value;
    });
    const sortedDays = Object.values(dailyIncome).sort((a, b) => b - a);
    if (sortedDays[0] > (totals.income * 0.4)) {
      points.push("O faturamento apresenta concentração significativa em períodos específicos do mês.");
    }

    return points;
  }, [totals, monthEntries, balance]);

  const conclusionText = useMemo(() => {
    if (monthEntries.length === 0) return "Nenhum dado disponível para conclusão.";
    
    const status = balance >= 0 ? "boa geração de receita e lucro" : "desafio na manutenção da margem";
    const recommendation = balance < 0 || (totals.purchase / (totals.income || 1)) > 0.7 
      ? "recomendável atenção ao fluxo de caixa e à gestão de estoques para melhorar a rentabilidade"
      : "estratégia atual sustentável, mantendo o foco no controle de custos fixos";

    return `O Super Jofi apresentou ${status}, porém com margem ${balance < (totals.income * 0.15) ? 'apertada' : 'saudável'} devido ao volume de operações. O controle de despesas está adequado, mas é ${recommendation} nos próximos períodos.`;
  }, [totals, balance, monthEntries]);

  const exportToPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      // --- HEADER ---
      pdf.setFillColor(15, 23, 42); 
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUPER JOFI', margin, 22);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`RELATÓRIO FINANCEIRO – ${getMonthName(selectedMonth).toUpperCase()}/${selectedYear}`, margin, 32);
      
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, margin, 42);

      y = 65;

      // --- 1. RESUMO FINANCEIRO ---
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. RESUMO FINANCEIRO', margin, y);
      y += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const summaryItems = [
        { label: 'Receitas totais:', value: formatCurrency(totals.income) },
        { label: 'Despesas operacionais:', value: formatCurrency(totals.expense) },
        { label: 'Compras / investimentos:', value: formatCurrency(totals.purchase) },
        { label: 'Resultado líquido do período:', value: formatCurrency(balance), bold: true }
      ];

      summaryItems.forEach(item => {
        pdf.setFont('helvetica', item.bold ? 'bold' : 'normal');
        pdf.text(item.label, margin + 5, y);
        pdf.text(item.value, pageWidth - margin, y, { align: 'right' });
        y += 7;
      });
      y += 12;

      // --- 2. ANÁLISE OBJETIVA ---
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('2. ANÁLISE OBJETIVA', margin, y);
      y += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      
      analysisPoints.forEach(point => {
        const splitPoint = pdf.splitTextToSize(`• ${point}`, contentWidth - 5);
        pdf.text(splitPoint, margin + 5, y);
        y += (splitPoint.length * 6);
      });
      y += 10;

      // --- 3. CONCLUSÃO ---
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('3. CONCLUSÃO', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      
      const splitConclusion = pdf.splitTextToSize(conclusionText, contentWidth - 5);
      pdf.text(splitConclusion, margin + 5, y);
      y += (splitConclusion.length * 6) + 15;

      // --- GRÁFICO (ANEXO) ---
      if (evolutionChartRef.current) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(100, 116, 139);
        pdf.text('ANEXO: FLUXO DE CAIXA MENSAL', margin, y);
        y += 5;
        const canvas = await html2canvas(evolutionChartRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, y, contentWidth, 50);
      }

      const totalPages = pdf.internal.getNumberOfPages();
      for(let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`SUPER JOFI - RELATÓRIO CONFIDENCIAL | Página ${i} de ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
      }

      pdf.save(`Relatorio_SuperJofi_${getMonthName(selectedMonth)}_${selectedYear}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Erro ao gerar relatório.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inteligência Financeira</h1>
          <p className="text-slate-500">Relatórios profissionais baseados no seu plano de contas.</p>
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

      {/* 3. FLUXO DE CAIXA NO TOPO - LARGURA TOTAL */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-w-0" ref={evolutionChartRef}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> Fluxo de Caixa Mensal Consolidado ({selectedYear})
          </h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase no-print">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Despesas</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Compras</span>
          </div>
        </div>
        <div className="h-[250px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="compras" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Dados e Texto */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. RESUMO FINANCEIRO */}
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-indigo-500" /> 1. Resumo Financeiro
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Receitas Totais</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(totals.income)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Despesas Operacionais</span>
                    <span className="text-sm font-bold text-rose-600">{formatCurrency(totals.expense)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Compras / Investimentos</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(totals.purchase)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-slate-900">Resultado Líquido</span>
                    <span className={`text-lg font-black ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(balance)}</span>
                  </div>
               </div>
               <div className="flex flex-col justify-center items-center bg-slate-50 rounded-2xl p-4">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, totals.income > 0 ? (Math.max(0, balance) / totals.income) * 100 : 0)}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Lucro: {totals.income > 0 ? ((balance / totals.income) * 100).toFixed(1) : 0}%
                  </p>
               </div>
            </div>
          </section>

          {/* 2. ANÁLISE OBJETIVA */}
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" /> 2. Análise Objetiva
            </h3>
            <div className="space-y-3">
               {analysisPoints.map((point, idx) => (
                 <div key={idx} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{point}</p>
                 </div>
               ))}
            </div>
          </section>

          {/* 3. CONCLUSÃO - ATUALIZADO PARA 3 */}
          <section className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-indigo-400" /> 3. Conclusão
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {conclusionText}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 no-print">
               <button 
                onClick={exportToPDF}
                disabled={isGeneratingPDF || monthEntries.length === 0}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
               >
                 {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                 Exportar Relatório Profissional (PDF)
               </button>
               <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all">
                 <Mail className="w-5 h-5" />
                 Enviar para Gestão
               </button>
            </div>
          </section>
        </div>

        {/* Lado Direito: Gráficos de Componentes */}
        <div className="space-y-6">
          {/* GRÁFICOS DE COMPONENTES */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" /> Foco de Compras
            </h4>
            <div className="h-[180px] w-full mb-4">
               {purchaseStats.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={purchaseStats} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                        {purchaseStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                    <ShoppingBag className="w-10 h-10 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sem compras registradas</p>
                 </div>
               )}
            </div>
            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
               {purchaseStats.map((item, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 truncate">
                       <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                       <span className="text-[10px] font-medium text-slate-600 truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-800">{formatCurrency(item.value)}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-500" /> Distribuição de Despesas
            </h4>
            <div className="h-[180px] w-full mb-4">
               {expenseStats.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseStats} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                        {expenseStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                   <TrendingDown className="w-10 h-10 opacity-20" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">Sem despesas registradas</p>
                </div>
               )}
            </div>
            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
               {expenseStats.map((item, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 truncate">
                       <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                       <span className="text-[10px] font-medium text-slate-600 truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-800">{formatCurrency(item.value)}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CircleDollarSign = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
);

export default Reports;
