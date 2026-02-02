import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowRightLeft, 
  FileText, 
  Calculator, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  Maximize,
  Compass
} from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", 
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
].sort();

const DOC_TYPES = [
  "Sale Deed", 
  "Agreement to Sale", 
  "Gift Deed", 
  "Mortgage Deed (MODT)", 
  "Simple Mortgage Deed",
  "Equitable Mortgage",
  "Power of Attorney", 
  "Lease Deed", 
  "Release Deed", 
  "Indemnity Bond",
  "Further Charge",
  "Reconveyance Deed",
  "Development Agreement",
  "Partition Deed",
  "Surrender of Lease"
].sort();

const COMMON_SCENARIOS = [
  { label: "MH Sale", state: "Maharashtra", doc: "Sale Deed", val: 50000000 },
  { label: "KA MODT", state: "Karnataka", doc: "Mortgage Deed (MODT)", val: 5000000 },
  { label: "DL Gift", state: "Delhi", doc: "Gift Deed", val: 10000000 }
];

const CONVERSION_RATES: Record<string, number> = {
  'Sq. Ft.': 1,
  'Sq. Meter': 10.7639,
  'Sq. Yards': 9,
  'Acre': 43560,
  'Hectare': 107639,
  'Guntha': 1089,
  'Cent': 435.6,
  'Bigha': 27000
};

// Markdown Styles for AI Response Boxes
const markdownStyles = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-sm font-bold border-b pb-1 mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xs font-bold mb-1 uppercase tracking-wider text-slate-500">{children}</h2>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
  li: ({ children }: any) => <li className="text-[11px]">{children}</li>,
  strong: ({ children }: any) => <strong className="font-bold text-slate-900">{children}</strong>,
};

const CardWrapper = ({ children, icon: Icon, colorClass, title }: { children?: React.ReactNode, icon: any, colorClass: string, title: string }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[550px] border-t-4 ${colorClass}`}>
    <div className="flex items-center justify-between mb-6 shrink-0">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${colorClass.replace('border-t-', 'bg-').replace('-600', '-100').replace('-900', '-100').replace('-blue-600', '-blue-100')} ${colorClass.includes('slate-900') ? 'text-slate-900 bg-slate-100' : ''}`}>
          <Icon size={20} />
        </div>
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
    </div>
    <div className="flex flex-col flex-1 overflow-hidden">
      {children}
    </div>
  </div>
);

export const LegalToolbox = () => {
  // --- States ---
  const [converter, setConverter] = useState({ value: 1000, from: 'Sq. Ft.', to: 'Sq. Meter' });
  const [stampCalc, setStampCalc] = useState({ state: 'Maharashtra', docType: 'Sale Deed', marketValue: 5000000 });
  const [stampResult, setStampResult] = useState<string | null>(null);
  const [isCalculatingStamp, setIsCalculatingStamp] = useState(false);
  const [dob, setDob] = useState('');
  
  // Linear Extent Calculator State
  const [linearCalc, setLinearCalc] = useState({ north: 0, south: 0, east: 0, west: 0, unit: 'Sq. Ft.' });

  // --- Handlers ---
  const getConvertedValue = () => {
    const valInSqFt = converter.value * CONVERSION_RATES[converter.from];
    const finalVal = valInSqFt / CONVERSION_RATES[converter.to];
    return finalVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getLinearArea = () => {
    const avgNS = (linearCalc.north + linearCalc.south) / 2;
    const avgEW = (linearCalc.east + linearCalc.west) / 2;
    const areaInSqFt = avgNS * avgEW;
    const finalArea = areaInSqFt / CONVERSION_RATES[linearCalc.unit];
    return finalArea.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleCalculateStampDuty = async () => {
    setIsCalculatingStamp(true);
    try {
      const prompt = `Act as a legal expert for L&T Finance. Calculate ESTIMATED Stamp Duty/Registration. State: ${stampCalc.state}, Doc: ${stampCalc.docType}, Value: ₹${stampCalc.marketValue.toLocaleString('en-IN')}. Provide output in a clean Markdown format with bold labels for Stamp Duty, Registration Fee, and Total Payable.`;
      const response = await generateAIResponse(prompt, "Provide clear rates and amounts in markdown format.");
      setStampResult(response);
    } catch (error) { setStampResult("Error fetching data."); }
    finally { setIsCalculatingStamp(false); }
  };

  const getAgeInfo = () => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return {
      age,
      status: age >= 18 ? 'MAJOR' : 'MINOR',
      isMajor: age >= 18
    };
  };

  const ageInfo = getAgeInfo();

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              Legal Toolbox
            </h1>
            <p className="text-slate-500 text-sm">Professional AI-powered calculators with structured legal guidance.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <RefreshCw size={14} className="text-emerald-500 animate-pulse" />
            LIVE COMPLIANCE FEED
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          
          {/* 1. Stamp Duty Estimator */}
          <CardWrapper title="Stamp Duty Check" icon={FileText} colorClass="border-t-slate-900">
            <div className="space-y-4 flex flex-col h-full">
              <div className="shrink-0 space-y-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {COMMON_SCENARIOS.map((s, idx) => (
                    <button key={idx} onClick={() => { setStampCalc({state: s.state, docType: s.doc, marketValue: s.val}); setStampResult(null); }} className="text-[8px] font-black bg-slate-50 border border-slate-200 px-2 py-1 rounded-md hover:border-yellow-400 hover:bg-yellow-50 transition-all text-slate-500">
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">State</label>
                    <select value={stampCalc.state} onChange={(e) => setStampCalc({...stampCalc, state: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50/50 outline-none focus:ring-1 focus:ring-slate-900">
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Document</label>
                    <select value={stampCalc.docType} onChange={(e) => setStampCalc({...stampCalc, docType: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50/50 outline-none focus:ring-1 focus:ring-slate-900">
                      {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Property Value (₹)</label>
                  <input type="number" value={stampCalc.marketValue} onChange={(e) => setStampCalc({...stampCalc, marketValue: Number(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 text-sm bg-slate-50/50 outline-none focus:ring-1 focus:ring-slate-900" />
                </div>
                <button onClick={handleCalculateStampDuty} disabled={isCalculatingStamp} className="w-full bg-slate-900 hover:bg-yellow-400 hover:text-slate-900 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                  {isCalculatingStamp ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                  <span>Calculate Estimation</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 pr-1 custom-scrollbar">
                {stampResult && !isCalculatingStamp && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] leading-relaxed animate-in fade-in slide-in-from-top-2 font-medium text-slate-700 shadow-inner">
                    <ReactMarkdown components={markdownStyles}>{stampResult}</ReactMarkdown>
                  </div>
                )}
                {isCalculatingStamp && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Loader2 size={24} className="animate-spin text-slate-400 mb-2" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </CardWrapper>

          {/* 2. Area Unit Converter */}
          <CardWrapper title="Area Unit Converter" icon={ArrowRightLeft} colorClass="border-t-yellow-400">
            <div className="space-y-4 flex flex-col h-full">
              <div className="shrink-0 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Measurement Value</label>
                  <input type="number" value={converter.value} onChange={(e) => setConverter({...converter, value: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl text-xl font-bold text-slate-800 bg-slate-50/50 outline-none focus:ring-1 focus:ring-yellow-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">From</label>
                    <select value={converter.from} onChange={(e) => setConverter({...converter, from: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-yellow-400">
                      {Object.keys(CONVERSION_RATES).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">To</label>
                    <select value={converter.to} onChange={(e) => setConverter({...converter, to: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-yellow-400">
                      {Object.keys(CONVERSION_RATES).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 shrink-0">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-b-4 border-yellow-400">
                  <p className="text-[9px] text-yellow-400/60 font-black uppercase tracking-[0.2em] mb-1">Result</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{getConvertedValue()}</span>
                    <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">{converter.to}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardWrapper>

          {/* 3. Linear Extent Calculator */}
          <CardWrapper title="Linear Extent Calculator" icon={Maximize} colorClass="border-t-emerald-600">
             <div className="space-y-4 flex flex-col h-full">
                <div className="shrink-0">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Compass size={14} className="text-emerald-500" /> Calculate Area from Boundaries
                   </p>
                   
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">North (Linear)</label>
                        <input 
                           type="number" 
                           value={linearCalc.north || ''} 
                           onChange={(e) => setLinearCalc({...linearCalc, north: Number(e.target.value)})}
                           className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">South (Linear)</label>
                        <input 
                           type="number" 
                           value={linearCalc.south || ''} 
                           onChange={(e) => setLinearCalc({...linearCalc, south: Number(e.target.value)})}
                           className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">East (Linear)</label>
                        <input 
                           type="number" 
                           value={linearCalc.east || ''} 
                           onChange={(e) => setLinearCalc({...linearCalc, east: Number(e.target.value)})}
                           className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">West (Linear)</label>
                        <input 
                           type="number" 
                           value={linearCalc.west || ''} 
                           onChange={(e) => setLinearCalc({...linearCalc, west: Number(e.target.value)})}
                           className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Output Unit</label>
                      <select 
                        value={linearCalc.unit} 
                        onChange={(e) => setLinearCalc({...linearCalc, unit: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {Object.keys(CONVERSION_RATES).map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                   </div>
                </div>

                <div className="mt-auto pt-6 shrink-0">
                  <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg border-b-4 border-emerald-800 text-white">
                    <p className="text-[9px] text-emerald-100 font-black uppercase tracking-[0.2em] mb-1">Total Extent</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">{getLinearArea()}</span>
                      <span className="text-xs text-emerald-100 font-bold uppercase tracking-wider">{linearCalc.unit}</span>
                    </div>
                  </div>
                </div>
             </div>
          </CardWrapper>

          {/* 4. Age Calculator */}
          <CardWrapper title="Age Calculator" icon={User} colorClass="border-t-indigo-600">
            <div className="space-y-6 flex flex-col h-full">
              <div className="shrink-0 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Date of Birth</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)} 
                      className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {ageInfo ? (
                  <div className="space-y-4 animate-in zoom-in duration-300">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-inner">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calculated Age</p>
                        <p className="text-4xl font-black text-slate-900">{ageInfo.age} <span className="text-sm text-slate-400 font-bold uppercase">Years</span></p>
                      </div>
                      <div className={`p-4 rounded-2xl ${ageInfo.isMajor ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} shadow-sm`}>
                        <User size={32} />
                      </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] border-b-8 shadow-xl text-center transition-all ${
                      ageInfo.isMajor 
                        ? 'bg-emerald-600 border-emerald-800 text-white' 
                        : 'bg-rose-600 border-rose-800 text-white'
                    }`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Legal Status</p>
                      <h3 className="text-3xl font-black uppercase tracking-tighter">{ageInfo.status}</h3>
                      <p className="text-[9px] font-bold mt-2 opacity-90">
                        {ageInfo.isMajor 
                          ? 'Eligible for independent legal contracting.' 
                          : 'Requires natural/appointed guardian for legal execution.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                      <CalendarIcon size={40} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Select DOB to determine<br/>Minor/Major status</p>
                  </div>
                )}
              </div>
            </div>
          </CardWrapper>

        </div>
      </div>
    </div>
  );
};