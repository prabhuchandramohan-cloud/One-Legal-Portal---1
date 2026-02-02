import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Landmark, 
  Scale, 
  Loader2,
  ArrowLeft,
  Search,
  FileSearch,
  FileCheck,
  Zap,
  ClipboardCheck,
  Download,
  CheckCircle2,
  X,
  ShieldAlert,
  AlertCircle,
  FolderOpen,
  Save,
  Trash2,
  History,
  Clock,
  ChevronRight,
  FileText,
  ListTodo,
  CheckSquare,
  Square,
  ClipboardList
} from 'lucide-react';
import { TitleScrutinyReportBuilder } from './TitleScrutinyReportBuilder';
import { VettingReportBuilder } from './VettingReportBuilder';
import { ModtDraftBuilder } from './ModtDraftBuilder';
import { AffidavitBuilder } from './AffidavitBuilder';

type ViewMode = 'overview' | 'mlap' | 'tsr_builder' | 'vetting_builder' | 'modt_builder' | 'affidavit_builder';

const DRAFTS_KEY = 'ltf_legal_mortgage_drafts';

export const MortgageExpert = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showUploadAlert, setShowUploadAlert] = useState(false);
  
  // Shared state for the current active case/scrutiny
  const [activeTsrData, setActiveTsrData] = useState<any>(null);
  const [savedDrafts, setSavedDrafts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load drafts from storage:", e);
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync drafts to local storage for persistent saves
  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(savedDrafts));
    } catch (e) {
      console.warn("Storage quota exceeded. Drafts could not be fully persisted to local storage.");
    }
  }, [savedDrafts]);

  const saveToDrafts = (data: any) => {
    const draftId = data.id || `draft_${Date.now()}`;
    const updatedData = { ...data, id: draftId, lastSaved: new Date().toISOString() };
    
    setSavedDrafts(prev => {
      const existingIdx = prev.findIndex(d => d.id === draftId);
      if (existingIdx >= 0) {
        const newDrafts = [...prev];
        newDrafts[existingIdx] = updatedData;
        return newDrafts;
      }
      return [updatedData, ...prev];
    });
    
    setActiveTsrData(updatedData);
  };

  const handleTsrComplete = (data: any) => {
    saveToDrafts(data);
  };

  const handleSaveModuleData = (moduleKey: string, moduleData: any) => {
    if (!activeTsrData) return;
    const updated = { ...activeTsrData, [moduleKey]: moduleData };
    saveToDrafts(updated);
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setActiveTsrData(json);
        if (viewMode === 'overview') setViewMode('mlap');
        // Reset file input for future selections
        e.target.value = '';
      } catch (err) {
        alert("Could not load the document. Please ensure it is a valid JSON draft.");
      }
    };
    reader.readAsText(file);
  };

  const handleStartVetting = () => {
    if (!activeTsrData) {
      setShowUploadAlert(true);
      return;
    }
    setViewMode('vetting_builder');
  };

  const handleStartModt = () => {
    if (!activeTsrData) {
      setShowUploadAlert(true);
      return;
    }
    setViewMode('modt_builder');
  };

  const handleStartAffidavit = () => {
    if (!activeTsrData) {
      setShowUploadAlert(true);
      return;
    }
    setViewMode('affidavit_builder');
  };

  const getCaseStatus = (data: any) => {
    if (!data) return null;
    if (data.modt) return { label: 'MODT Drafted', color: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-100', bg: 'bg-indigo-50' };
    if (data.vetting) return { label: 'Vetting Complete', color: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-100', bg: 'bg-emerald-50' };
    if (data.affidavit) return { label: 'Affidavit Generated', color: 'bg-violet-500', text: 'text-violet-700', border: 'border-violet-100', bg: 'bg-violet-50' };
    return { label: 'TSR Submitted', color: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-100', bg: 'bg-blue-50' };
  };

  if (viewMode === 'tsr_builder') {
    return <TitleScrutinyReportBuilder 
      onBack={() => setViewMode('mlap')} 
      onComplete={handleTsrComplete}
      initialData={activeTsrData}
    />;
  }

  if (viewMode === 'vetting_builder') {
    return <VettingReportBuilder 
      tsrData={activeTsrData} 
      onBack={() => setViewMode('mlap')}
      onSave={(data) => handleSaveModuleData('vetting', data)}
    />;
  }

  if (viewMode === 'modt_builder') {
    return <ModtDraftBuilder 
      tsrData={activeTsrData} 
      onBack={() => setViewMode('mlap')}
      onSave={(data) => handleSaveModuleData('modt', data)}
    />;
  }

  if (viewMode === 'affidavit_builder') {
    return <AffidavitBuilder 
      tsrData={activeTsrData} 
      onBack={() => setViewMode('mlap')}
      onSave={(data) => handleSaveModuleData('affidavit', data)}
    />;
  }

  if (viewMode === 'mlap') {
    const caseStatus = getCaseStatus(activeTsrData);
    
    return (
      <div className="h-full overflow-hidden flex flex-col bg-slate-50 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleFileLoad} 
        />

        {/* Fixed Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('overview')}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">MLAP Legal Hub</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Micro Loan Against Property Workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
             >
                <FolderOpen size={16} />
                Load Draft
             </button>
             {activeTsrData && caseStatus && (
                <div className={`flex items-center gap-3 ${caseStatus.bg} px-4 py-2 rounded-xl border ${caseStatus.border} animate-in zoom-in duration-300`}>
                   <div className={`w-2 h-2 rounded-full ${caseStatus.color} animate-pulse shadow-sm`}></div>
                   <div className="flex flex-col">
                     <div className={`text-[9px] font-black ${caseStatus.text} uppercase tracking-widest leading-none mb-1`}>
                        {activeTsrData.customerName}
                     </div>
                     <div className={`text-[7px] font-black uppercase tracking-widest opacity-70`}>
                        {caseStatus.label}
                     </div>
                   </div>
                </div>
             )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-10 pb-20">
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col border-t-4 border-t-blue-500">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileSearch size={20} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase mb-2">Title Scrutiny (TSR)</h3>
                  <p className="text-slate-500 text-[10px] mb-4 flex-1 leading-relaxed">Analyze chain documents and verify history.</p>
                  <button 
                    onClick={() => setViewMode('tsr_builder')}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{activeTsrData ? 'Update' : 'Analyze'}</span>
                    <Search size={12} />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col relative overflow-hidden border-t-4 border-t-emerald-500">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileCheck size={20} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase mb-2">Vetting (LVR)</h3>
                  <p className="text-slate-500 text-[10px] mb-4 flex-1 leading-relaxed">Generate final vetting opinion & risk decision.</p>
                  <button 
                    onClick={handleStartVetting}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Run Vetting</span>
                    <ClipboardCheck size={12} />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col border-t-4 border-t-yellow-400">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase mb-2">MODT Auto Gen</h3>
                  <p className="text-slate-500 text-[10px] mb-4 flex-1 leading-relaxed">Instantly draft MODT deeds from TSR data.</p>
                  <button 
                    onClick={handleStartModt}
                    className="w-full py-2 bg-yellow-400 text-slate-900 rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Draft MODT</span>
                    <Download size={12} />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col border-t-4 border-t-indigo-500">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase mb-2">Customer Affid.</h3>
                  <p className="text-slate-500 text-[10px] mb-4 flex-1 leading-relaxed">Resolve Title mismatches for customer.</p>
                  <button 
                    onClick={handleStartAffidavit}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Gen Affidavit</span>
                    <Download size={12} />
                  </button>
                </div>
              </div>

              {!activeTsrData && (
                <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-400 mb-4 shadow-sm">
                      <AlertCircle size={32} />
                   </div>
                   <h4 className="text-lg font-black text-indigo-900 uppercase tracking-tight">No Active Workflow Detected</h4>
                   <p className="text-indigo-600 text-sm font-medium mt-2 max-w-sm">Start by uploading chain documents in the **Title Scrutiny** module or load a saved draft.</p>
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6 flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl"
                   >
                      <FolderOpen size={18} /> Import JSON Draft
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Upload Alert Modal */}
        {showUploadAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight mb-2">Upload Required</h3>
              <p className="text-slate-500 text-center text-sm font-medium mb-8">Please upload the draft first to proceed with this action.</p>
              <button 
                onClick={() => setShowUploadAlert(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-all active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 bg-slate-50">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleFileLoad} 
      />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Mortgage Expert</h1>
            <p className="text-slate-500 font-bold text-sm">Unified Legal Scrutiny & Processing Workflows</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
             >
                <FolderOpen size={16} className="text-indigo-600" />
                Load Draft
             </button>
             <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Active</span>
             </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => setViewMode('mlap')}
            className="group bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border-l-[12px] border-yellow-400 relative overflow-hidden text-left block w-full max-w-2xl hover:scale-[1.02] transition-all duration-500"
          >
             <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity">
               <Building size={200} className="text-white"/>
             </div>
             <div className="flex items-center gap-6 mb-8">
               <div className="bg-yellow-400 p-4 rounded-3xl text-black shadow-xl ring-8 ring-slate-800"><Landmark size={40}/></div>
               <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">MLAP Hub</h3>
                  <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.2em]">Micro Loan Against Property</p>
               </div>
             </div>
             <p className="text-slate-400 text-sm mb-10 max-w-sm leading-relaxed font-medium">Access Title Scrutiny, Automated Vetting, and Instant MODT Generation for the micro-segment.</p>
             <div className="inline-flex items-center gap-3 text-[11px] font-black bg-white text-slate-900 px-8 py-4 rounded-2xl group-hover:bg-yellow-400 transition-colors uppercase tracking-[0.2em] shadow-lg">
               Open Hub <ArrowLeft className="rotate-180" size={18} />
             </div>
          </button>
        </div>
      </div>
    </div>
  );
};