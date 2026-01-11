
import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Shield, Key, Search, UserCheck, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';
import { useFinance } from '../context/FinanceContext';

const Users: React.FC = () => {
  const { users, currentUserProfile, addUser, updateUser, deleteUser } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<UserType & { password?: string }>>({
    login: '',
    password: '',
    role: 'operator'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await updateUser(editingUser.id, formData);
    } else {
      await addUser(formData as Omit<UserType, 'id'> & { password?: string });
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ login: '', password: '', role: 'operator' });
  };

  const handleDelete = async (user: UserType) => {
    if (user.login === 'admin') {
      alert('O usuário mestre (admin) não pode ser removido.');
      return;
    }

    if (currentUserProfile?.id === user.id) {
      alert('Você não pode remover o seu próprio usuário enquanto está logado.');
      return;
    }

    if (confirm(`Deseja realmente remover o usuário @${user.login}? Esta ação não pode ser desfeita na tabela de perfis.`)) {
      setDeletingId(user.id);
      try {
        await deleteUser(user.id);
      } catch (err: any) {
        alert("Não foi possível excluir o usuário: " + err.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500">Administre quem pode acessar o painel financeiro.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({ login: '', password: '', role: 'operator' }); setIsModalOpen(true); }}
          className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> 
          Novo Usuário
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Pesquisar por login..." 
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${user.login}&background=random&bold=true`} 
                    alt={user.login} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {user.role === 'admin' && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-lg shadow-lg">
                    <Shield className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => { 
                    setEditingUser(user); 
                    setFormData({ ...user, password: '' });
                    setIsModalOpen(true); 
                  }}
                  disabled={deletingId === user.id}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-30"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(user)}
                  disabled={deletingId === user.id}
                  className={`p-2 rounded-xl transition-colors ${deletingId === user.id ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                >
                  {deletingId === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900 truncate">@{user.login}</h3>
              {currentUserProfile?.id === user.id && (
                <span className="text-[8px] bg-blue-100 text-blue-600 font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Você</span>
              )}
            </div>
            
            <p className="text-slate-400 text-sm font-medium mb-4 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Acesso {user.role === 'admin' ? 'Total' : 'Limitado'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {user.role}
              </span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Ativo</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login / Usuário</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
                  value={formData.login} 
                  onChange={e => setFormData({...formData, login: e.target.value})}
                  placeholder="Ex: asaph"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      required={!editingUser}
                      placeholder={editingUser ? "Manter atual" : ""}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nível de Acesso</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as any})}
                  >
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-1">Informação Importante</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Ao cadastrar um login, o acesso será validado via email: <br/>
                  <strong className="font-bold">{formData.login || 'usuario'}@superjofi.local</strong>
                </p>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-2xl">Cancelar</button>
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 hover:bg-black text-white py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
