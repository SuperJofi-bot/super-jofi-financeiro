
import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Entry, CategoryType } from '../types';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Wallet,
  CalendarDays
} from 'lucide-react';

const EntryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<Entry, 'id'>) => Promise<void>;
  editingEntry?: Entry;
}> = ({ isOpen, onClose, onSubmit, editingEntry }) => {
  const { chartOfAccounts } = useFinance();
  
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    type: 'RECEITA' as CategoryType,
    categoryId: '',
    description: '',
    paymentMethodId: '',
    bankId: '',
    clientName: '',
    value: 0
  };

  const [formData, setFormData] = useState<Omit<Entry, 'id'>>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingEntry) {
      const { id, ...data } = editingEntry;
      setFormData(data);
    } else if (isOpen) {
      setFormData(initialFormState);
    }
  }, [editingEntry, isOpen]);

  if (!isOpen) return null;

  const getCategories = () => {
    if (formData.type === 'RECEITA') return chartOfAccounts.incomeTypes;
    if (formData.type === 'COMPRA') return chartOfAccounts.purchaseTypes;
    return chartOfAccounts.expenseTypes;
  };

  const categories = getCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Se for um novo lançamento, não fecha, apenas limpa para o próximo
      if (!editingEntry) {
        setFormData({
          ...initialFormState,
          date: formData.date, // Mantém a data para agilizar lançamentos do mesmo dia
          type: formData.type, // Mantém o tipo para agilizar lançamentos da mesma categoria
        });
        // Opcional: focar no campo de valor ou descrição após limpar
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            {editingEntry ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </header>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'RECEITA', categoryId: '' }))}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'RECEITA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              Receita
            </button>
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'DESPESA', categoryId: '' }))}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'DESPESA' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
            >
              Despesa
            </button>
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'COMPRA', categoryId: '' }))}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'COMPRA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Compra
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
              <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</label>
              <input type="number" step="0.01" required placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none font-bold" value={formData.value || ''} onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classificação</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={formData.categoryId} onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}>
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forma Pgto.</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={formData.paymentMethodId} onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodId: e.target.value }))}>
                <option value="">Selecione...</option>
                {chartOfAccounts.paymentMethods.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={formData.bankId} onChange={(e) => setFormData(prev => ({ ...prev, bankId: e.target.value }))}>
                <option value="">Selecione...</option>
                {chartOfAccounts.banks.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente/Fornecedor</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição (Ítem)</label>
            <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none resize-none" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center ${formData.type === 'RECEITA' ? 'bg-emerald-500' : formData.type === 'COMPRA' ? 'bg-blue-600' : 'bg-rose-500'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Entries: React.FC = () => {
  const { entries, addEntry, updateEntry, deleteEntry, chartOfAccounts } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (!entry.date) return false;
      const d = new Date(entry.date + 'T00:00:00');
      const matchesDate = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [entries, currentMonth, currentYear, searchTerm]);

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      if (curr.type === 'RECEITA') acc.income += curr.value;
      else if (curr.type === 'COMPRA') acc.purchase += curr.value;
      else acc.expense += curr.value;
      return acc;
    }, { income: 0, expense: 0, purchase: 0 });
  }, [filteredEntries]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const getCategoryName = (type: CategoryType, id: string) => {
    const list = type === 'RECEITA' ? chartOfAccounts.incomeTypes : type === 'COMPRA' ? chartOfAccounts.purchaseTypes : chartOfAccounts.expenseTypes;
    return list.find(c => c.id === id)?.name || 'N/A';
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lançamentos</h1>
          <p className="text-slate-500">Gestão financeira da Super Jofi.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 text-center min-w-[120px]">
              <span className="text-sm font-bold text-slate-800">{getMonthName(currentMonth)}</span>
              <span className="text-[10px] block font-medium text-slate-400">{currentYear}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => { setEditingEntry(undefined); setIsModalOpen(true); }} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> 
            Novo Lançamento
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Pesquisar por item ou cliente..." 
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receitas</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.income)}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><TrendingDown className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas</p><p className="text-lg font-bold text-rose-600">{formatCurrency(totals.expense)}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><ShoppingBag className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compras</p><p className="text-lg font-bold text-blue-600">{formatCurrency(totals.purchase)}</p></div>
        </div>
        <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${totals.income - totals.expense - totals.purchase < 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className={`p-3 rounded-xl ${totals.income - totals.expense - totals.purchase < 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-600'}`}><Wallet className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo</p><p className={`text-lg font-bold ${totals.income - totals.expense - totals.purchase < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(totals.income - totals.expense - totals.purchase)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Classificação</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descrição / Item</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(entry.date)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${entry.type === 'RECEITA' ? 'bg-emerald-100 text-emerald-700' : entry.type === 'COMPRA' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm font-bold text-slate-900">{getCategoryName(entry.type, entry.categoryId)}</p>
                     <p className="text-[10px] text-slate-400 font-medium">{entry.clientName || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">{entry.description || '-'}</td>
                  <td className={`px-6 py-4 text-right text-sm font-bold ${entry.type === 'RECEITA' ? 'text-emerald-600' : entry.type === 'COMPRA' ? 'text-blue-600' : 'text-rose-600'}`}>
                    {entry.type === 'RECEITA' ? '+' : '-'} {formatCurrency(entry.value)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingEntry(entry); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteEntry(entry.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                       <CalendarDays className="w-12 h-12 opacity-20" />
                       <p className="text-sm font-medium">Nenhum lançamento encontrado em {getMonthName(currentMonth)} / {currentYear}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={async (data) => { 
          if (editingEntry) {
            await updateEntry(editingEntry.id, data); 
            setIsModalOpen(false); // Fecha o modal apenas se for edição
          } else {
            await addEntry(data); // Mantém aberto para novos lançamentos
          }
        }} 
        editingEntry={editingEntry} 
      />
    </div>
  );
};

export default Entries;
