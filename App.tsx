
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Menu, 
  X, 
  LayoutGrid,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
  Bell,
  LogOut,
  Sparkles,
  Command,
  Sun,
  Moon
} from 'lucide-react';
import { AppModule, User, UserRole } from './types';
import { Dashboard } from './pages/Dashboard';
import { MortgageExpert } from './pages/MortgageExpert';
import { LegalToolbox } from './pages/LegalToolbox';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  // Navigation State
  const [history, setHistory] = useState<AppModule[]>([AppModule.DASHBOARD]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sidebar State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const activeModule = history[currentIndex];
  // All modules are now accessible since access control is removed
  const allModules = [AppModule.DASHBOARD, AppModule.MORTGAGE, AppModule.TOOLBOX];

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigateTo = (module: AppModule) => {
    if (activeModule === module) {
      setIsMobileMenuOpen(false);
      return;
    }
    
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(module);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setIsMobileMenuOpen(false);
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const MagicNavItem = ({ module, icon: Icon, label }: { module: AppModule, icon: any, label: string }) => {
    const isActive = activeModule === module;
    
    return (
      <button
        onClick={() => navigateTo(module)}
        className={`group relative w-full flex items-center h-12 mb-2 transition-all duration-300 ease-in-out px-4 rounded-xl ${
          isActive 
            ? 'bg-yellow-400/10 text-yellow-400' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
        }`}
      >
        <div className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-lg transition-all ${
          isActive ? 'bg-yellow-400 text-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : ''
        }`}>
          <Icon size={20} />
        </div>
        
        <span className={`ml-4 whitespace-nowrap font-semibold text-sm transition-all duration-300 ${
          isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
        }`}>
          {label}
        </span>

        {!isSidebarExpanded && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700 shadow-xl">
            {label}
          </div>
        )}
      </button>
    );
  };

  const renderContent = () => {
    switch (activeModule) {
      case AppModule.DASHBOARD: return <Dashboard onNavigate={navigateTo} allowedModules={allModules} />;
      case AppModule.MORTGAGE: return <MortgageExpert />;
      case AppModule.TOOLBOX: return <LegalToolbox />;
      default: return <Dashboard onNavigate={navigateTo} allowedModules={allModules} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      {/* Magic Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-[#0f172a] text-slate-300 shadow-2xl z-20 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative ${isSidebarExpanded ? 'w-64' : 'w-[88px]'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-20 bg-yellow-400 text-slate-900 p-1.5 rounded-full shadow-lg border-2 border-[#0f172a] z-30 hover:scale-110 transition-transform active:scale-95"
        >
          {isSidebarExpanded ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>

        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 overflow-hidden shrink-0 border-b border-slate-800/50">
          <div className="flex items-center shrink-0">
             <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                <span className="text-slate-900 font-black text-[10px]">LTF</span>
             </div>
             <div className={`ml-4 transition-all duration-500 ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">LTF Legal</h1>
                <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest mt-1">One Legal</p>
             </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 mt-6 px-4 overflow-y-auto no-scrollbar">
          <MagicNavItem module={AppModule.DASHBOARD} icon={LayoutGrid} label="Main Dashboard" />
          
          <div className={`mt-8 mb-4 transition-all duration-300 flex items-center overflow-hidden ${isSidebarExpanded ? 'px-4' : 'justify-center'}`}>
            <div className={`h-px bg-slate-800 transition-all ${isSidebarExpanded ? 'w-full mr-2' : 'w-6'}`} />
            {isSidebarExpanded && <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Expert Apps</span>}
          </div>
          
          <MagicNavItem module={AppModule.MORTGAGE} icon={Home} label="Mortgage Expert" />
          <MagicNavItem module={AppModule.TOOLBOX} icon={Wrench} label="Legal Toolbox" />
        </nav>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#0f172a] text-white z-50 px-4 py-3 flex items-center justify-between shadow-xl border-b border-yellow-500/20">
        <div className="flex items-center space-x-3">
           <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-400/10">
               <span className="text-slate-900 font-black text-[8px]">LTF</span>
           </div>
           <span className="font-black text-sm uppercase tracking-tighter">LTF Legal Hub</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-yellow-400 bg-slate-800 p-1.5 rounded-lg">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#0f172a] z-40 pt-20 px-6 space-y-2 overflow-y-auto pb-10 flex flex-col">
           <MagicNavItem module={AppModule.DASHBOARD} icon={LayoutGrid} label="Dashboard" />
           <MagicNavItem module={AppModule.MORTGAGE} icon={Home} label="Mortgage Expert" />
           <MagicNavItem module={AppModule.TOOLBOX} icon={Wrench} label="Legal Toolbox" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative h-full overflow-hidden flex flex-col md:ml-0 pt-16 md:pt-0">
        {/* Modern Navigation/Breadcrumb Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0 transition-colors duration-300">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-200 dark:border-slate-700">
               <button 
                 onClick={goBack} 
                 disabled={currentIndex === 0} 
                 className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:shadow-none text-slate-700 dark:text-slate-300 transition-all"
                 title="Go Back"
               >
                 <ChevronLeft size={16} />
               </button>
               <button 
                 onClick={goForward} 
                 disabled={currentIndex === history.length - 1} 
                 className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:shadow-none text-slate-700 dark:text-slate-300 transition-all"
                 title="Go Forward"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
             
             <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
             
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  {activeModule === AppModule.MORTGAGE ? 'Mortgage Expert' : 
                   activeModule === AppModule.DASHBOARD ? 'System Terminal' :
                   activeModule.replace('_', ' ')}
                </span>
             </div>
           </div>

           {/* Theme Toggle Button */}
           <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 transition-all"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
           </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
