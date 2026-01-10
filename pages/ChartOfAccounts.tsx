
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Edit2, Check, X, Building2, ShoppingBag, Landmark, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const ChartSection: React.FC<{
  title: string;
  items: { id: string, name: string }[];
  icon: React.ElementType;
  onAdd: (name: string) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  accentColor: string;
}> = ({ title, items, icon: Icon, onAdd, onUpdate, onDelete, accentColor }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (inputValue.trim()) {
      onUpdate(id, inputValue);
      setEditingId(null);
      setInputValue('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${accentColor}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setInputValue('');
          }}
          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-2 flex-1 min-h-[150px]">
        {isAdding && (
          <div className="p-2 mb-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1"
              placeholder="Novo item..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-1">
              <button onClick={handleAdd} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setIsAdding(false)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} className="group p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-all">
              {editingId === item.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input 
                    autoFocus
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                  />
                  <button onClick={() => handleUpdate(item.id)} className="p-1 text-emerald-600"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-rose-600"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingId(item.id);
                        setInputValue(item.name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChartOfAccounts: React.FC = () => {
  const { chartOfAccounts, addChartItem, updateChartItem, deleteChartItem } = useFinance();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Plano de Contas</h1>
        <p className="text-slate-500">Defina as categorias de Receitas, Despesas e Compras separadamente.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <ChartSection 
          title="Receitas"
          items={chartOfAccounts.incomeTypes}
          icon={TrendingUp}
          onAdd={(name) => addChartItem('incomeTypes', name)}
          onUpdate={(id, name) => updateChartItem('incomeTypes', id, name)}
          onDelete={(id) => deleteChartItem('incomeTypes', id)}
          accentColor="bg-emerald-500"
        />

        <ChartSection 
          title="Despesas"
          items={chartOfAccounts.expenseTypes}
          icon={TrendingDown}
          onAdd={(name) => addChartItem('expenseTypes', name)}
          onUpdate={(id, name) => updateChartItem('expenseTypes', id, name)}
          onDelete={(id) => deleteChartItem('expenseTypes', id)}
          accentColor="bg-rose-500"
        />

        <ChartSection 
          title="Compras"
          items={chartOfAccounts.purchaseTypes}
          icon={ShoppingBag}
          onAdd={(name) => addChartItem('purchaseTypes', name)}
          onUpdate={(id, name) => updateChartItem('purchaseTypes', id, name)}
          onDelete={(id) => deleteChartItem('purchaseTypes', id)}
          accentColor="bg-blue-600"
        />

        <ChartSection 
          title="Bancos"
          items={chartOfAccounts.banks}
          icon={Landmark}
          onAdd={(name) => addChartItem('banks', name)}
          onUpdate={(id, name) => updateChartItem('banks', id, name)}
          onDelete={(id) => deleteChartItem('banks', id)}
          accentColor="bg-slate-700"
        />

        <ChartSection 
          title="Formas Pgto"
          items={chartOfAccounts.paymentMethods}
          icon={CreditCard}
          onAdd={(name) => addChartItem('paymentMethods', name)}
          onUpdate={(id, name) => updateChartItem('paymentMethods', id, name)}
          onDelete={(id) => deleteChartItem('paymentMethods', id)}
          accentColor="bg-amber-500"
        />
      </div>
    </div>
  );
};

export default ChartOfAccounts;
