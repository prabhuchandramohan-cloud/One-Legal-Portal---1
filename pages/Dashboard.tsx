
import React from 'react';
import { 
  Home, 
  ArrowRight,
  Wrench
} from 'lucide-react';
import { AppModule } from '../types';

interface DashboardProps {
  onNavigate: (module: AppModule) => void;
  allowedModules: AppModule[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, allowedModules }) => {
  const allCards = [
    { id: AppModule.MORTGAGE, title: "Mortgage Expert", description: "Ai-Title Scrutiny, Original Documents vetting, and MODT Auto Gen, Affidavit Auto gen portal.", icon: Home, color: "bg-yellow-50 text-yellow-700" },
    { id: AppModule.TOOLBOX, title: "Legal Toolbox", description: "Essential calculators: Stamp Duty, Unit Converter, Etc.", icon: Wrench, color: "bg-slate-900 text-yellow-400" },
  ];

  const visibleCards = allCards.filter(card => allowedModules.includes(card.id));

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">L&T Finance One Legal Portal</h1>
          <p className="text-slate-500 font-medium">Your unified platform for Legal Intelligence and Operations.</p>
        </div>

        {/* Modules Grid */}
        <div className="flex items-center mb-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
            EXPERT APPLICATIONS
          </h2>
          <div className="h-px bg-slate-200 flex-1 ml-4"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {visibleCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="group bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl hover:border-yellow-400 transition-all text-left flex flex-col h-full relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${card.color} group-hover:bg-yellow-400 group-hover:text-black transition-colors shadow-sm`}>
                  <card.icon size={28} />
                </div>
                <div className="p-2.5 bg-slate-50 rounded-full text-slate-300 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-all border border-slate-100">
                  <ArrowRight size={20} />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-yellow-600 transition-colors uppercase tracking-tight">
                {card.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 font-medium">
                {card.description}
              </p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
