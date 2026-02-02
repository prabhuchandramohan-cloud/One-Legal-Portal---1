import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2, 
  Scale,
  Calendar,
  User,
  ClipboardList,
  Fingerprint,
  Save,
  Loader2,
  AlertTriangle,
  Type,
  Plus,
  Trash2
} from 'lucide-react';

interface VettingReportBuilderProps {
  tsrData: any;
  onBack: () => void;
  onSave?: (data: any) => void;
}

const REQUIREMENT_OPTIONS = [
  'Original', 
  'Photostat copy', 
  'Online copy', 
  'Certified Copy', 
  'True Copy', 
  'Attested Copy', 
  'Notarized Copy', 
  'Duplicate Copy'
];

const CONDITION_OPTIONS = [
  'Good', 
  'Average', 
  'Torn', 
  'Taped', 
  'Mutilated', 
  'Brittle', 
  'Water Damaged', 
  'Laminated'
];

const LEGIBILITY_OPTIONS = [
  'Clear', 
  'Faded', 
  'Partially Illegible', 
  'Smudged'
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Good': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Average': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Torn':
    case 'Mutilated':
    case 'Brittle':
    case 'Water Damaged':
    case 'Taped':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'Laminated': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getLegibilityColor = (legibility: string) => {
  switch (legibility) {
    case 'Clear': return 'bg-emerald-50 text-emerald-600';
    case 'Faded':
    case 'Smudged':
    case 'Partially Illegible':
      return 'bg-rose-50 text-rose-600';
    default: return 'bg-slate-50 text-slate-600';
  }
};

export const VettingReportBuilder: React.FC<VettingReportBuilderProps> = ({ tsrData, onBack, onSave }) => {
  const [showOutput, setShowOutput] = useState(false);
  const [originalVerified, setOriginalVerified] = useState(tsrData?.vetting?.originalVerified ?? true);
  const [vettingRemarks, setVettingRemarks] = useState(tsrData?.vetting?.remarks ?? 'Based on the scrutiny of the documents provided and verification against the Encumbrance Certificate (EC), the title of the property is found to be clear, marketable, and free from all encumbrances.');
  const [finalDecision, setFinalDecision] = useState<'Recommended' | 'Rejected' | 'Conditional'>(tsrData?.vetting?.decision ?? 'Recommended');
  const [isSaving, setIsSaving] = useState(false);
  const [localDocs, setLocalDocs] = useState<any[]>(tsrData?.docsCollect || []);

  useEffect(() => {
    if (tsrData?.docsCollect) {
      // Ensure all docs have default condition and legibility
      const initialized = tsrData.docsCollect.map((d: any) => ({
        ...d,
        condition: d.condition || 'Good',
        legibility: d.legibility || 'Clear',
        damageDescription: d.damageDescription || '',
        totalPages: d.totalPages || '',
        pagesMissing: d.pagesMissing || ''
      }));
      setLocalDocs(initialized);
    }
  }, [tsrData]);

  const updateLocalDoc = (index: number, field: string, value: any) => {
    const updated = [...localDocs];
    updated[index] = { ...updated[index], [field]: value };
    setLocalDocs(updated);
  };

  const addManualDoc = () => {
    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      date: '',
      docNo: '',
      executant: '',
      claimant: '',
      totalPages: '',
      pagesMissing: '',
      original: 'Original',
      condition: 'Good',
      legibility: 'Clear',
      damageDescription: '',
      isManual: true
    };
    setLocalDocs([...localDocs, newDoc]);
  };

  const removeDoc = (index: number) => {
    const updated = [...localDocs];
    updated.splice(index, 1);
    setLocalDocs(updated);
  };

  const handleSave = () => {
    setIsSaving(true);
    const vettingData = {
      originalVerified,
      remarks: vettingRemarks,
      decision: finalDecision,
      lastUpdated: new Date().toISOString()
    };

    const updatedTsrData = { ...tsrData, docsCollect: localDocs, vetting: vettingData };

    if (onSave) {
      onSave(vettingData);
    }

    const blob = new Blob([JSON.stringify(updatedTsrData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LVR_Draft_${tsrData.customerName || 'unnamed'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsSaving(false), 800);
  };

  const handlePdfDownload = () => {
    const element = document.getElementById('vettingA4');
    if (!element) return;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Vetting_Report_${tsrData.customerName || 'Report'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'legal', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
       // @ts-ignore
       window.html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const downloadWord = () => {
    const content = document.getElementById('vettingA4')?.innerHTML;
    if (!content) return;
    
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { size: 21.59cm 35.56cm; margin: 2cm; mso-page-orientation: portrait; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; }
          .header-bar { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
          .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 20px; margin-bottom: 10px; font-size: 12pt; }
          .info-grid { width: 100%; margin-bottom: 20px; }
          .info-label { font-weight: bold; text-transform: uppercase; width: 150px; }
          .document-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .document-table th, .document-table td { border: 1px solid #000; padding: 5pt; text-align: left; }
          .document-table th { background-color: #f0f0f0; }
          .verified-stamp { border: 2px solid #059669; color: #059669; padding: 10px; display: inline-block; font-weight: bold; text-transform: uppercase; margin: 20px 0; }
        </style>
      </head>
      <body>`;
    
    const footer = "</body></html>";
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Vetting_Report_${tsrData.customerName || 'Draft'}.doc`;
    link.click();
  };

  if (showOutput) {
    const allHoldersNames = tsrData?.titleHolders?.map((th: any) => th.name ? `${th.salutation} ${th.name}` : '').filter(Boolean).join(' & ') || `${tsrData.customerSalutation} ${tsrData.customerName}`;

    return (
      <div className="h-full flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-500">
        <div className="max-w-4xl w-full mx-auto flex justify-between items-center p-6 shrink-0 print:hidden">
          <button onClick={() => setShowOutput(false)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Edit Vetting Details
          </button>
          <div className="flex gap-4">
            <button onClick={handlePdfDownload} className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-slate-800 transition-all">
              <Printer size={18} /> Print / PDF
            </button>
            <button onClick={downloadWord} className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-indigo-700 transition-all">
              <Download size={18} /> Download Word
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-slate-200/50">
          <div id="vettingA4" className="bg-white p-16 shadow-2xl mx-auto min-h-[297mm] w-[210mm] text-slate-900 font-serif leading-relaxed text-justify text-sm mb-20 relative">
            <style>{`
              @media print { body { background: white !important; } .print-hidden { display: none !important; } #vettingA4 { box-shadow: none !important; width: 100%; padding: 0; margin: 0; } }
              #vettingA4 {
                word-break: break-word;
                overflow-wrap: anywhere;
                box-sizing: border-box;
                width: 100%;
              }
              .header-bar { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 30px; text-align: center; }
              .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 25px; margin-bottom: 10px; font-size: 13px; }
              .info-grid { display: grid; grid-template-cols: 150px 1fr; gap: 5px; margin-bottom: 20px; }
              .info-label { font-weight: bold; text-transform: uppercase; font-size: 11px; }
              .verified-stamp { border: 2px solid #059669; color: #059669; padding: 10px; display: inline-block; font-weight: 900; transform: rotate(-5deg); text-transform: uppercase; border-radius: 4px; margin: 20px 0; }
              .document-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; table-layout: fixed; }
              .document-table th, .document-table td { border: 1px solid #000; padding: 6px; text-align: left; word-break: break-word; overflow-wrap: anywhere; }
              .document-table th { background-color: #f8fafc; text-transform: uppercase; }
              .signature-stamp { border: 2px solid #334155; padding: 8px; color: #334155; font-size: 10px; text-align: center; font-weight: 900; width: 140px; transform: rotate(-5deg); border-radius: 6px; margin: 10px 0; display: inline-block; }
              p { word-wrap: break-word; overflow-wrap: anywhere; margin-bottom: 1rem; }
              .dmg-note { font-style: italic; color: #b91c1c; margin-top: 4px; display: block; font-weight: bold; }
            `}</style>

            <div className="header-bar">
              <h1 className="text-2xl font-black uppercase tracking-tighter">Legal Vetting Report (LVR)</h1>
              <p className="font-bold text-base">L&T Finance Limited - Micro LAP Division</p>
            </div>

            <div className="info-grid">
              <div className="info-label">Report Date:</div> <div>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div className="info-label">Customer Name:</div> <div className="font-bold uppercase">{allHoldersNames}</div>
              <div className="info-label">Loan Account:</div> <div>{tsrData.loanAgreementNo || 'PENDING'}</div>
              <div className="info-label">Loan Amount:</div> <div className="font-bold">₹{tsrData.appliedLoanAmt?.toLocaleString('en-IN')}</div>
              <div className="info-label">Legal Manager:</div> <div>{tsrData.legalManager}</div>
            </div>

            <div className="section-title">1. Document Vetting Summary</div>
            <p className="mb-4">I/We have completed the legal vetting of the property documents submitted for the purpose of creating an mortgage. The documents have been cross-verified with the Title Scrutiny Report (TSR) and are found to be sufficient for further processing, subject to the collection of original documents listed below.</p>

            <div className="section-title">2. Mandatory Documents to be Collected</div>
            <p className="text-[10px] italic text-slate-500 mb-2">The following documents must be obtained as per the requirement specified below at the time of disbursement / MODT execution:</p>
            <table className="document-table">
              <thead>
                <tr>
                  <th style={{ width: '25px' }}>S.No</th>
                  <th style={{ width: '100px' }}>Nature</th>
                  <th style={{ width: '60px' }}>Doc No</th>
                  <th>Parties Involved</th>
                  <th style={{ width: '35px' }}>Pages</th>
                  <th style={{ width: '45px' }}>Pages missing</th>
                  <th style={{ width: '70px' }}>Req</th>
                  <th style={{ width: '80px' }}>Condition</th>
                  <th style={{ width: '70px' }}>Legibility</th>
                </tr>
              </thead>
              <tbody>
                {localDocs.length > 0 ? (
                  localDocs.map((doc: any, idx: number) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="font-bold">{doc.name}</td>
                      <td>{doc.docNo}</td>
                      <td>{doc.executant} / {doc.claimant}</td>
                      <td className="text-center">{doc.totalPages || '-'}</td>
                      <td className="text-center">{doc.pagesMissing || '-'}</td>
                      <td className="font-bold">{doc.original}</td>
                      <td>
                        {doc.condition}
                        {(doc.condition === 'Torn' || doc.condition === 'Mutilated') && doc.damageDescription && (
                          <span className="dmg-note">Note: {doc.damageDescription}</span>
                        )}
                      </td>
                      <td>{doc.legibility}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={9} className="text-center italic">No pending documents for collection.</td></tr>
                )}
              </tbody>
            </table>

            <div className="section-title">3. Original Document Verification Statement</div>
            <div className="p-6 bg-slate-50 border-l-4 border-slate-900 my-4">
              <p className="font-bold italic text-slate-800">
                {originalVerified ? 
                  "“I / We hereby confirm that we have verified all primary title deeds and parent documents as listed in the Scrutiny Report. The physical documents appear to be authentic, matching the digital copies provided, and show no signs of tampering or unauthorized alteration.”" :
                  "“Original verification is PENDING. Scrutiny performed on photostat/scanned copies only. Final recommendation is subject to satisfactory verification of physical originals.”"
                }
              </p>
            </div>

            <div className="section-title">4. Legal Opinion & Recommendation</div>
            <p className="mb-4">{vettingRemarks}</p>
            
            <div className="flex justify-between items-end mt-12">
              <div className="text-center">
                <div className={`verified-stamp ${finalDecision === 'Recommended' ? 'border-emerald-600 text-emerald-600' : 'border-rose-600 text-rose-600'}`}>
                  {finalDecision}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase mb-2">Digitally Verified By</p>
                <div className="signature-stamp">
                   DIGITALLY SIGNED<br/>
                   {tsrData.legalManager}<br/>
                   {tsrData.employeeCode}<br/>
                   VETTING COMPLETE<br/>
                   {new Date().toLocaleDateString()}<br/>
                   L&T One Legal
                </div>
                <p className="font-bold underline">{tsrData.legalManager}</p>
                <p className="text-[10px] font-bold">Legal Manager, L&T Finance Ltd.</p>
                <p className="text-[9px] text-slate-500 italic">Generated via AI-Legal One Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 p-6 md:p-10 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm text-slate-600 transition-all">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Final Legal Vetting</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Converting Scrutiny into Final Opinion</p>
            </div>
          </div>
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
             {isSaving ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Save size={16} />}
             {isSaving ? 'Save Progress' : 'Save Progress'}
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200">
          <div className="flex items-center gap-4 mb-10 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em]">Source Work: TSR Builder</p>
              <h3 className="text-lg font-bold">Linked to Case: {tsrData.customerName}</h3>
            </div>
          </div>

          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name (Locked)</label>
                <div className="p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-500 border border-slate-100">{tsrData?.titleHolders?.map((th: any) => th.name ? `${th.salutation} ${th.name}` : '').filter(Boolean).join(' & ') || tsrData.customerName}</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Amount (Locked)</label>
                <div className="p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-500 border border-slate-100">₹{tsrData.appliedLoanAmt?.toLocaleString()}</div>
              </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Scale size={14} className="text-indigo-500" /> Vetting Checks
               </h3>
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><Fingerprint size={20}/></div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Original Document Verification</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Have you verified physical originals?</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl">
                       <button 
                        onClick={() => setOriginalVerified(true)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${originalVerified ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
                       >Yes, Verified</button>
                       <button 
                        onClick={() => setOriginalVerified(false)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!originalVerified ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400'}`}
                       >No / Pending</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Vetting Opinion</label>
                    <textarea 
                      value={vettingRemarks}
                      onChange={(e) => setVettingRemarks(e.target.value)}
                      rows={4}
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />
                  </div>
               </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <CheckCircle2 size={14} className="text-emerald-500" /> Vetting Document Conditions
              </h3>
              <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-white/50">
                    <div className="col-span-2">Nature & Parties</div>
                    <div className="col-span-1">Doc No</div>
                    <div className="col-span-1 text-center">Pages</div>
                    <div className="col-span-1 text-center">Pages missing</div>
                    <div className="col-span-1">Requirement</div>
                    <div className="col-span-3">Condition Status</div>
                    <div className="col-span-2">Legibility</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="divide-y divide-slate-100">
                    {localDocs.length > 0 ? localDocs.map((doc: any, i: number) => (
                      <div key={doc.id || i} className="px-6 py-5 hover:bg-white transition-colors space-y-4">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-2 space-y-1">
                             {doc.isManual ? (
                               <>
                                 <input 
                                    placeholder="Nature" 
                                    value={doc.name} 
                                    onChange={(e) => updateLocalDoc(i, 'name', e.target.value)} 
                                    className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                 />
                                 <input 
                                    placeholder="Parties" 
                                    value={doc.executant} 
                                    onChange={(e) => updateLocalDoc(i, 'executant', e.target.value)} 
                                    className="w-full p-1 bg-white border border-slate-200 rounded text-[8px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                 />
                               </>
                             ) : (
                               <>
                                 <div className="text-[10px] font-black text-slate-700 truncate">{doc.name}</div>
                                 <div className="text-[8px] text-slate-400 uppercase font-bold truncate">{doc.executant}</div>
                               </>
                             )}
                          </div>
                          <div className="col-span-1">
                             {doc.isManual ? (
                               <input 
                                  placeholder="No" 
                                  value={doc.docNo} 
                                  onChange={(e) => updateLocalDoc(i, 'docNo', e.target.value)} 
                                  className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                               />
                             ) : (
                               <div className="text-[10px] font-black text-slate-800">{doc.docNo}</div>
                             )}
                          </div>
                          <div className="col-span-1 text-center">
                             <input 
                                type="number" 
                                value={doc.totalPages || ''} 
                                onChange={(e) => updateLocalDoc(i, 'totalPages', e.target.value)}
                                placeholder="0"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-center shadow-sm"
                             />
                          </div>
                          <div className="col-span-1 text-center">
                             <input 
                                type="number" 
                                value={doc.pagesMissing || ''} 
                                onChange={(e) => updateLocalDoc(i, 'pagesMissing', e.target.value)}
                                placeholder="0"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-center shadow-sm"
                             />
                          </div>
                          <div className="col-span-1">
                             <select 
                                value={doc.original} 
                                onChange={(e) => updateLocalDoc(i, 'original', e.target.value)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-indigo-700 outline-none shadow-sm"
                             >
                                {REQUIREMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                          </div>
                          <div className="col-span-3">
                             <select 
                                value={doc.condition || 'Good'} 
                                onChange={(e) => updateLocalDoc(i, 'condition', e.target.value)}
                                className={`w-full p-2 border-2 rounded-xl text-[10px] font-black uppercase outline-none shadow-sm transition-all ${getStatusColor(doc.condition || 'Good')}`}
                             >
                                {CONDITION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                          </div>
                          <div className="col-span-2">
                             <select 
                                value={doc.legibility || 'Clear'} 
                                onChange={(e) => updateLocalDoc(i, 'legibility', e.target.value)}
                                className={`w-full p-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none shadow-sm transition-all ${getLegibilityColor(doc.legibility || 'Clear')}`}
                             >
                                {LEGIBILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                          </div>
                          <div className="col-span-1 text-right">
                             <button 
                                onClick={() => removeDoc(i)} 
                                className="p-2 text-rose-300 hover:text-rose-600 transition-colors"
                                title="Remove Document"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>

                        {(doc.condition === 'Torn' || doc.condition === 'Mutilated') && (
                          <div className="pl-6 border-l-2 border-rose-200 animate-in slide-in-from-left-2 duration-300">
                             <div className="flex items-center gap-3">
                               <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                               <div className="flex-1 space-y-1">
                                 <label className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Damage Assessment</label>
                                 <input 
                                   type="text"
                                   value={doc.damageDescription || ''}
                                   onChange={(e) => updateLocalDoc(i, 'damageDescription', e.target.value)}
                                   placeholder="Describe the location of damage (e.g., affecting signature/stamp)?"
                                   className="w-full p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-[10px] font-bold placeholder:text-rose-300 outline-none focus:ring-1 focus:ring-rose-500"
                                 />
                               </div>
                             </div>
                          </div>
                        )}
                      </div>
                    )) : (
                        <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">No documents captured in collection list.</div>
                    )}
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                  <button 
                    onClick={addManualDoc} 
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16}/> Add Additional Document
                  </button>
                </div>
              </div>
            </section>

            <div className="pt-10 flex items-center justify-between border-t border-slate-100">
               <div className="flex items-center gap-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Final Verdict</label>
                 <div className="flex gap-2">
                   {['Recommended', 'Conditional', 'Rejected'].map(v => (
                     <button 
                      key={v}
                      onClick={() => setFinalDecision(v as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        finalDecision === v 
                          ? (v === 'Recommended' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : v === 'Rejected' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-amber-500 border-amber-500 text-white shadow-lg')
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                      }`}
                     >{v}</button>
                   ))}
                 </div>
               </div>
               <button 
                onClick={() => setShowOutput(true)}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-3"
               >
                 <ShieldCheck size={18} className="text-yellow-400" />
                 Generate Final LVR
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};