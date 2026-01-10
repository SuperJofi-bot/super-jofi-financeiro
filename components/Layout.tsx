
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  BarChart3, 
  Menu, 
  X, 
  Wallet,
  CircleDollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Page } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: Page.CHART_OF_ACCOUNTS, label: 'Plano de Contas', icon: LayoutDashboard },
    { id: Page.ENTRIES, label: 'Lançamentos', icon: ArrowRightLeft },
    { id: Page.REPORTS, label: 'Relatórios', icon: BarChart3 },
  ];

  const logoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfq4BxEHtsFj1qCF3sTK3eyQy2sqv-QXRs8Q&s";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white flex-shrink-0">
            <img 
              src={logoUrl} 
              alt="Super Jofi Logo" 
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                // Fallback caso a imagem não exista
                e.currentTarget.src = 'https://via.placeholder.com/150?text=Jofi';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-tight">Super Jofi</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Financeiro</span>
          </div>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${currentPage === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-8">
          <div className="p-4 bg-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Versão 1.1.0</p>
            <p className="text-sm font-semibold text-white">Suporte Super Jofi</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">
               {navItems.find(i => i.id === currentPage)?.label}
             </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-slate-400">Status:</span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Online
                </span>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
