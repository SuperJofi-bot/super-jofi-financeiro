
import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Entry, CategoryType } from '../types';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  // Fixed: Added Wallet to the imports
  Wallet
} from 'lucide-react';

const EntryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<Entry, 'id'>) => void;
  editingEntry?: Entry;
}> = ({ isOpen, onClose, onSubmit, editingEntry }) => {
  const { chartOfAccounts } = useFinance();
  const [formData, setFormData] = useState<Omit<Entry, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'RECCEITA',
    categoryId: '',
    description: '',
    paymentMethodId: '',
    bankId: '',
    clientName: '',
    value: 0
  });

  React.useEffect(() => {
    if (editingEntry) {
      const { id, ...data } = editingEntry;
      setFormData(data);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'RECCEITA',
        categoryId: '',
        description: '',
        paymentMethodId: '',
        bankId: '',
        clientName: '',
        value: 0
      });
    }
  }, [editingEntry, isOpen]);

  if (!isOpen) return null;

  const categories = formData.type === 'RECCEITA' ? chartOfAccounts.incomeTypes : chartOfAccounts.expenseTypes;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">{editingEntry ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </header>

        <form className="p-6 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }}>
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'RECCEITA', categoryId: '' }))}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'RECCEITA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Receita
            </button>
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'DESPESA', categoryId: '' }))}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === 'DESPESA' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Despesa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
              <input 
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</label>
              <input 
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classificação</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forma de Pagto.</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.paymentMethodId}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodId: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {chartOfAccounts.paymentMethods.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco / Conta</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.bankId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankId: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {chartOfAccounts.banks.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome / Cliente</label>
              <input 
                type="text"
                placeholder="Ex: Fornecedor X ou Cliente Y"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição (Ítem)</label>
            <textarea 
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              placeholder="Descreva o lançamento..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl shadow-lg transition-all ${formData.type === 'RECCEITA' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
            >
              {editingEntry ? 'Salvar Alterações' : 'Salvar Lançamento'}
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
      const d = new Date(entry.date);
      // Correction for UTC conversion issues in simple dates
      const entryMonth = new Date(entry.date + 'T00:00:00').getMonth();
      const entryYear = new Date(entry.date + 'T00:00:00').getFullYear();
      
      const matchesMonth = entryMonth === currentMonth && entryYear === currentYear;
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           entry.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesMonth && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, currentMonth, currentYear, searchTerm]);

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      if (curr.type === 'RECCEITA') acc.income += curr.value;
      else acc.expense += curr.value;
      return acc;
    }, { income: 0, expense: 0 });
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

  const handleSubmit = (data: Omit<Entry, 'id'>) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, data);
    } else {
      addEntry(data);
    }
    setIsModalOpen(false);
    setEditingEntry(undefined);
  };

  const getCategoryName = (type: CategoryType, id: string) => {
    const list = type === 'RECCEITA' ? chartOfAccounts.incomeTypes : chartOfAccounts.expenseTypes;
    return list.find(c => c.id === id)?.name || 'N/A';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lançamentos Financeiros</h1>
          <p className="text-slate-500">Controle suas entradas e saídas diárias.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEntry(undefined);
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </header>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Receitas</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.income)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Despesas</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(totals.expense)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${totals.income - totals.expense >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-100 text-rose-700'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Saldo Mensal</p>
            <p className={`text-lg font-bold ${totals.income - totals.expense >= 0 ? 'text-blue-600' : 'text-rose-700'}`}>
              {formatCurrency(totals.income - totals.expense)}
            </p>
          </div>
        </div>
      </div>

      {/* Month Navigation & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex flex-col items-center min-w-[140px]">
            <span className="text-lg font-bold text-slate-800">{getMonthName(currentMonth)}</span>
            <span className="text-xs font-medium text-slate-400">{currentYear}</span>
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar lançamento..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Classificação / Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente / Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Forma / Banco</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'RECCEITA' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className="text-sm font-medium text-slate-600">{formatDate(entry.date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{getCategoryName(entry.type, entry.categoryId)}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{entry.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{entry.clientName || '-'}</span>
                  </td>
                   <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-700 uppercase">{chartOfAccounts.paymentMethods.find(p => p.id === entry.paymentMethodId)?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{chartOfAccounts.banks.find(b => b.id === entry.bankId)?.name}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${entry.type === 'RECCEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {entry.type === 'RECCEITA' ? '+' : '-'} {formatCurrency(entry.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingEntry(entry);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <CalendarDays className="w-8 h-8 opacity-20" />
                      <p className="text-sm italic">Nenhum lançamento encontrado neste período.</p>
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
        onSubmit={handleSubmit}
        editingEntry={editingEntry}
      />
    </div>
  );
};

export default Entries;
