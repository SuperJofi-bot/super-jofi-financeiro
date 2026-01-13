
import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

interface LoginProps {
  onLogin: (success: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanLogin = login.trim().toLowerCase();
    
    // Agora o domínio principal é o .local, como solicitado.
    const emailsToTry = [
      `${cleanLogin}@superjofi.local`,
      `${cleanLogin}@superjofi.com` // Mantendo .com como fallback caso algum tenha sido criado
    ];

    let lastError = '';
    let success = false;

    for (const email of emailsToTry) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!sbError && data.user) {
          success = true;
          onLogin(true);
          break;
        } else if (sbError) {
          lastError = sbError.message;
        }
      } catch (err) {
        lastError = 'Erro de conexão. Verifique sua internet.';
      }
    }

    if (!success) {
      if (lastError === 'Invalid login credentials') {
        setError('Usuário ou senha incorretos.');
      } else {
        setError(lastError || 'Erro ao realizar login.');
      }
      setIsLoading(false);
    }
  };

  const logoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfq4BxEHtsFj1qCF3sTK3eyQy2sqv-QXRs8Q&s";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 bg-white mb-4 shadow-lg">
            <img src={logoUrl} alt="Super Jofi" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Jofi</h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1 text-center">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Usuário</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 font-semibold"
                placeholder="Usuário"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 font-semibold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Autenticando...
              </>
            ) : (
              'Acessar Sistema'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-2">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Super Jofi © 2025</p>
           <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
