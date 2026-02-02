import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  FileText, 
  User, 
  Save,
  Loader2,
  Scale,
  Fingerprint,
  Sparkles,
  AlertOctagon,
  Languages,
  Users,
  Plus,
  Trash2,
  BrainCircuit,
  MessageSquare,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateAIResponse } from '../services/geminiService';

interface AffidavitBuilderProps {
  tsrData: any;
  onBack: () => void;
  onSave?: (data: any) => void;
}

const LANGUAGES = [
  "English", "Tamil", "Kannada", "Telugu", "Marathi", "Hindi", "Gujarati"
];

const LOCALIZED_UI: Record<string, any> = {
  English: {
    title: "Affidavit cum Declaration",
    verification: "VERIFICATION",
    deponent: "DEPONENT",
    schedule: "Schedule \"A\" - Property Description",
    witnesses: "Witnesses Signature & Address:",
    signature: "Signature",
    date: "Date",
    place: "Place",
    tsrRefDate: "TSR Preparation Date",
    notary: "Solemnly affirmed & Signed before me",
    advocate: "Advocate",
    identifiedBy: "Identified by me:",
    notaryPublic: "Notary Public",
    photoText: "AFFIX PASSPORT SIZE PHOTO OF DEPONENT",
    crossSign: "(Cross-sign across photo)",
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    declarationHeader: "Applicant's Declaration",
    declarationLabel: "Declaration of Accuracy & Understanding",
    declarationDefault: "I/We hereby confirm that all the information provided in this affidavit is true, correct, and accurate to the best of my/our knowledge and belief. I/We further declare that I/we fully understand the legal implications and consequences of this affidavit and have affirmed its contents of my/our own free will.",
    scheduleHeaders: {
      zone: "Reg. Zone",
      district: "District",
      sro: "SRO Name",
      village: "Village",
      ids: "Identification Nos.",
      extent: "Total Extent",
      boundaries: "Boundaries & Measurements (Exact Translation)",
      direction: "Direction",
      boundary: "Boundary (Exact Translation from Title Deed)",
      measurement: "Measurement"
    }
  },
  Tamil: {
    title: "உறுதிமொழி ஆவணம் மற்றும் பிரகடனம்",
    verification: "சரிபார்ப்பு",
    deponent: "உறுதிமொழி அளிப்பவர்",
    schedule: "அட்டவணை \"அ\" - சொத்து விவரம்",
    witnesses: "சாட்சிகளின் கையொப்பம் மற்றும் முகவரி:",
    signature: "கையொப்பம்",
    date: "தேதி",
    place: "இடம்",
    tsrRefDate: "TSR தயாரிப்பு தேதி",
    notary: "எனக்கு முன்னால் உறுதிமொழி அளிக்கப்பட்டு கையெழுத்திடப்பட்டது",
    advocate: "வழக்கறிஞர்",
    identifiedBy: "என்னால் அடையாளம் காணப்பட்டது:",
    notaryPublic: "நோட்டரி பப்ளிக்",
    photoText: "புகைப்படத்தை இங்கே ஒட்டவும்",
    crossSign: "(புகைப்படத்தின் குறுக்கே கையெழுத்திடவும்)",
    monthNames: ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
    declarationHeader: "விண்ணப்பதாரரின் பிரகடனம்",
    declarationLabel: "துல்லியம் மற்றும் புரிதல் பற்றிய பிரகடனம்",
    declarationDefault: "இந்த உறுதிமொழி ஆவணத்தில் வழங்கப்பட்டுள்ள அனைத்து தகவல்களும் எனது அறிவுக்கு எட்டிய வரையில் உண்மையானவை, சரியானவை மற்றும் துல்லியமானவை என்று நான் இதன் மூலம் உறுதிப்படுத்துகிறேன். இந்த உறுதிமொழியின் சட்டரீதியான விளைவுகள் மற்றும் பின்விளைவுகளை நான் முழுமையாகப் புரிந்துகொண்டுள்ளேன் என்றும், அதன் உள்ளடக்கங்களை எனது முழு விருப்பத்துடன் உறுதிப்படுத்தியுள்ளேன் என்றும் நான் மேலும் அறிவிக்கிறேன்.",
    scheduleHeaders: {
        zone: "பதிவு மண்டலம்",
        district: "மாவட்டம்",
        sro: "சார்பதிவாளர் அலுவலகம்",
        village: "கிராமம்",
        ids: "அடையாள எண்கள்",
        extent: "மொத்த பரப்பளவு",
        boundaries: "எல்லைகள் மற்றும் அளவீடுகள் (மொழிபெயர்ப்பு)",
        direction: "திசை",
        boundary: "எல்லை (ஆவணத்தின்படி சரியான மொழிபெயர்ப்பு)",
        measurement: "அளவு"
    }
  },
};

export const AffidavitBuilder: React.FC<AffidavitBuilderProps> = ({ tsrData, onBack, onSave }) => {
  if (!tsrData) {
    return (
      <div className="flex items-center justify-center h-full p-10 text-slate-500 font-bold uppercase">
        <AlertOctagon className="mr-2 text-rose-500" /> No Case Data Loaded
      </div>
    );
  }

  const [showOutput, setShowOutput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDeponent, setExpandedDeponent] = useState<number | null>(0);

  const [affidavitDetails, setAffidavitDetails] = useState({
    deponents: [] as any[],
    discrepancyClarification: tsrData?.affidavit?.discrepancyClarification ?? '',
    selectedLanguage: tsrData?.affidavit?.selectedLanguage ?? 'English',
    applicantDeclaration: tsrData?.affidavit?.applicantDeclaration ?? '',
    useCustomRequirement: tsrData?.affidavit?.useCustomRequirement ?? false,
    customRequirement: tsrData?.affidavit?.customRequirement ?? '',
    witness1: tsrData?.affidavit?.witness1 ?? { name: '', relation: 'Son of', relName: '', address: '' },
    witness2: tsrData?.affidavit?.witness2 ?? { name: '', relation: 'Son of', relName: '', address: '' }
  });

  useEffect(() => {
    if (tsrData?.affidavit?.deponents) {
      setAffidavitDetails(prev => ({ ...prev, deponents: tsrData.affidavit.deponents }));
    } else {
      const initialDeponents = (tsrData?.titleHolders || [{ salutation: tsrData.customerSalutation, name: tsrData.customerName }]).map((th: any) => ({
        salutation: th.salutation || '',
        name: th.name || '',
        father: th.father || '',
        age: '',
        address: ''
      }));
      setAffidavitDetails(prev => ({ ...prev, deponents: initialDeponents }));
    }
  }, [tsrData]);

  const updateDeponent = (idx: number, field: string, value: string) => {
    const updated = [...affidavitDetails.deponents];
    updated[idx] = { ...updated[idx], [field]: value };
    setAffidavitDetails({ ...affidavitDetails, deponents: updated });
  };

  const ui = LOCALIZED_UI[affidavitDetails.selectedLanguage] || LOCALIZED_UI.English;
  const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const generateFullAffidavit = async () => {
    setIsGenerating(true);
    try {
        const requirementSource = affidavitDetails.useCustomRequirement 
            ? affidavitDetails.customRequirement 
            : (tsrData?.discrepancies || 'General confirmation of title requested.');

        const deponentsContext = affidavitDetails.deponents.map((d, i) => 
          `Deponent ${i+1}: ${d.salutation} ${d.name}, Age: ${d.age}, Father/Spouse: ${d.father}, Address: ${d.address}`
        ).join('\n');

        const prompt = `
        Role: Expert Legal Consultant for Mortgage Banking (L&T Finance).
        Task: Draft a COMPLETE Affidavit cum Declaration in ${affidavitDetails.selectedLanguage}.
        
        Deponents (${affidavitDetails.deponents.length}):
        ${deponentsContext}
        
        TSR Preparation Date: ${todayDate}
        
        Requirement / Specific Clarification to be addressed:
        "${requirementSource}"
        
        CRITICAL INSTRUCTION: DO NOT INCLUDE A PROPERTY SCHEDULE OR 'SCHEDULE A' TABLE IN YOUR RESPONSE.
        
        The draft MUST include:
        1. A formal preamble listing ALL deponents.
        2. Point 1: Confirmation of absolute ownership and peaceful possession of the subject property by all deponents.
        3. Point 2: Mention of the loan application to L&T Finance and the Title Scrutiny Report (TSR) prepared on ${todayDate}.
        4. Point 3: A DETAILED legal clarification/declaration addressing the specific requirement/discrepancies.
        5. Point 4: Declaration that property is free from encumbrances, liens, and litigation.
        6. Point 5: Confirmation that this affidavit is for mortgage purpose.
        7. A formal VERIFICATION section at the end.
        
        Language Requirement: Output EVERYTHING strictly in ${affidavitDetails.selectedLanguage}. Use a highly professional, solemn, and legally sound tone.
        `;
        
        const response = await generateAIResponse(prompt, `Expert Legal Consultant fluent in ${affidavitDetails.selectedLanguage}. Provide narrative body text only.`);
        
        setAffidavitDetails(prev => ({ 
          ...prev, 
          discrepancyClarification: response 
        }));
    } catch (e) {
        alert("AI Generation failed.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    if (onSave) {
      onSave(affidavitDetails);
    }
    
    const fullCaseData = { ...tsrData, affidavit: affidavitDetails };
    const blob = new Blob([JSON.stringify(fullCaseData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Affidavit_Draft_${tsrData?.customerName || 'unnamed'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsSaving(false), 800);
  };

  const handlePdfDownload = () => {
    const element = document.getElementById('affidavitA4');
    if (!element) return;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Affidavit_${tsrData.customerName || 'Draft'}.pdf`,
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
    const content = document.getElementById('affidavitA4')?.innerHTML;
    if (!content) return;

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { size: 21.59cm 35.56cm; margin: 2cm; mso-page-orientation: portrait; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; text-align: justify; color: #000; }
          .affidavit-title { text-align: center; font-size: 16pt; font-weight: bold; text-decoration: underline; margin-bottom: 30pt; text-transform: uppercase; }
          .affidavit-section-title { font-weight: bold; text-transform: uppercase; text-decoration: underline; margin-top: 25pt; margin-bottom: 10pt; font-size: 12pt; text-align: left; }
          .signature-layout { width: 100%; border-collapse: collapse; margin-top: 20pt; }
          .signature-layout td { vertical-align: middle; padding: 5pt; border: 1px solid #ddd; }
          .photo-box { border: 1.5pt solid #000; width: 90pt; height: 110pt; text-align: center; vertical-align: middle; font-size: 8pt; background-color: #fff; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
        </style>
      </head>
      <body>`;
    
    const blob = new Blob([header + content + "</body></html>"], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Affidavit_${tsrData?.customerName || 'Draft'}.doc`;
    link.click();
  };

  if (showOutput) {
    return (
      <div className="h-full flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-500">
        <div className="max-w-4xl w-full mx-auto flex justify-between items-center p-6 shrink-0 print:hidden">
          <button onClick={() => setShowOutput(false)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Back to Editor
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
          <div id="affidavitA4" className="bg-white p-[20mm] shadow-2xl mx-auto min-h-[297mm] w-[210mm] text-slate-900 font-serif leading-relaxed text-sm mb-20 relative overflow-hidden flex flex-col box-border">
             <style>{`
               @media print { 
                 @page { size: A4; margin: 15mm 20mm 25mm 20mm; }
                 body { background: white !important; margin: 0; padding: 0; } 
                 .print-hidden { display: none !important; } 
                 #affidavitA4 { box-shadow: none !important; width: 100%; padding: 0; margin: 0; min-height: auto; } 
                 .page-break { page-break-before: always; page-break-inside: avoid; }
               }
               #affidavitA4 {
                word-break: break-word;
                overflow-wrap: anywhere;
                box-sizing: border-box;
                width: 100%;
               }
               .affidavit-title { text-align: center; font-size: 16px; font-weight: 900; text-decoration: underline; margin-bottom: 40px; text-transform: uppercase; }
               .affidavit-section-title { font-weight: 900; text-transform: uppercase; text-decoration: underline; margin-top: 25px; margin-bottom: 10px; text-align: left; }
               .signature-layout { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
               .signature-layout td { vertical-align: middle; padding: 10px; border: 0.5pt solid #eee; }
               .photo-box { border: 1.5px solid #000; width: 100px; height: 125px; text-align: center; vertical-align: middle; color: #64748b; font-weight: bold; font-size: 9px; line-height: 1.4; background-color: #fff; margin: 0 auto; }
               .cross-sign-note { font-size: 8px; text-align: center; margin-top: 4px; font-weight: bold; text-transform: uppercase; color: #475569; }
               .witness-block { font-size: 10px; line-height: 1.4; margin-bottom: 20px; }
               .witness-block p { margin-bottom: 2px; }
               .aff-sched-table { width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 12px; }
               .aff-sched-table td, .aff-sched-table th { border: 1px solid black; padding: 6px; font-size: 10px; }
               .aff-sched-header { background-color: #f1f5f9; font-weight: bold; width: 140px; text-transform: uppercase; }
             `}</style>

             <div className="mb-12 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 print:hidden shrink-0">
                <p className="text-xs font-black uppercase tracking-[0.2em]">Non-Judicial Stamp Paper Space</p>
             </div>
             <div className="hidden print:block h-[120px]"></div>

             <div className="affidavit-title">{ui.title}</div>

             <div className="mb-8 space-y-1 text-xs font-bold uppercase">
                <div className="flex justify-between">
                   <span>{ui.date}: {todayDate}</span>
                   <span>{ui.place}: {tsrData?.branchName || '__________'}</span>
                </div>
                <div>{ui.tsrRefDate}: {todayDate}</div>
             </div>

             <div className="whitespace-pre-wrap text-justify leading-relaxed flex-1 mb-8">
               {affidavitDetails.discrepancyClarification || (
                 <p className="italic text-slate-400">Please generate theLocalized content.</p>
               )}
             </div>

             <div className="affidavit-section-title">{ui.declarationHeader}</div>
             <div className="whitespace-pre-wrap text-justify leading-relaxed mb-8">
               {affidavitDetails.applicantDeclaration || ui.declarationDefault}
             </div>

             <div className="affidavit-section-title">{ui.schedule}</div>
             <div className="mb-8">
                {tsrData?.properties?.map((p: any, idx: number) => (
                  <div key={idx} className="mb-8 last:mb-0">
                    <p className="font-bold underline mb-3 uppercase text-[11px]">Item No. {idx + 1} - Property Details</p>
                    <table className="aff-sched-table">
                       <tbody>
                          <tr><td className="aff-sched-header">{ui.scheduleHeaders.zone}</td><td>{p.regZone}</td></tr>
                          <tr><td className="aff-sched-header">{ui.scheduleHeaders.district}</td><td>{p.regDistrict}</td></tr>
                          <tr><td className="aff-sched-header">{ui.scheduleHeaders.sro}</td><td>{p.sroName}</td></tr>
                          <tr><td className="aff-sched-header">{ui.scheduleHeaders.village}</td><td>{p.villageName}</td></tr>
                          <tr>
                            <td className="aff-sched-header">{ui.scheduleHeaders.ids}</td>
                            <td>{p.identifiers?.map((id: any) => `${id.type}: ${id.value}`).join(', ') || '-'}</td>
                          </tr>
                          <tr><td className="aff-sched-header">{ui.scheduleHeaders.extent}</td><td>{p.totalExtent} {p.extentUnit}</td></tr>
                       </tbody>
                    </table>
                    <p className="font-bold text-[10px] uppercase mb-1">{ui.scheduleHeaders.boundaries}:</p>
                    <table className="aff-sched-table">
                       <thead>
                          <tr className="bg-slate-50">
                             <th style={{ border: '1px solid black' }}>{ui.scheduleHeaders.direction}</th>
                             <th style={{ border: '1px solid black' }}>{ui.scheduleHeaders.boundary}</th>
                             <th style={{ border: '1px solid black' }}>{ui.scheduleHeaders.measurement}</th>
                          </tr>
                       </thead>
                       <tbody>
                          <tr><td className="font-bold text-center">NORTH</td><td>{p.boundaryNorth}</td><td>{p.dimNorth}</td></tr>
                          <tr><td className="font-bold text-center">SOUTH</td><td>{p.boundarySouth}</td><td>{p.dimSouth}</td></tr>
                          <tr><td className="font-bold text-center">EAST</td><td>{p.boundaryEast}</td><td>{p.dimEast}</td></tr>
                          <tr><td className="font-bold text-center">WEST</td><td>{p.boundaryWest}</td><td>{p.dimWest}</td></tr>
                          {p.remarks && (
                            <tr>
                              <td className="aff-sched-header" colSpan={1}>Property Remarks</td>
                              <td colSpan={2}>{p.remarks}</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                  </div>
                ))}
             </div>

             <div className="space-y-12">
                {affidavitDetails.deponents.map((d, i) => (
                  <table key={i} className="signature-layout page-break-inside-avoid">
                    <tbody>
                      <tr>
                        <td style={{ width: '25%', textAlign: 'center' }}>
                           <div className="photo-box">
                              {ui.photoText}<br/>({d.name})
                           </div>
                           <div className="cross-sign-note">{ui.crossSign}</div>
                        </td>
                        <td style={{ width: '40%' }}>
                           <p className="text-xs font-bold uppercase mb-1">{ui.deponent} {i+1}:</p>
                           <p className="text-sm font-black uppercase mb-1">{d.salutation} {d.name}</p>
                           <p className="text-[10px] mb-6">Age: {d.age} | Father: {d.father}</p>
                        </td>
                        <td style={{ width: '35%', textAlign: 'center' }}>
                           <p className="font-bold mb-14 uppercase">{ui.signature}</p>
                           <div className="h-px w-32 bg-black mx-auto"></div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ))}
             </div>

             <div className="mt-14 pt-6 border-t border-slate-200 page-break-inside-avoid">
                <p className="font-bold underline mb-6 text-[10px] uppercase">{ui.witnesses}</p>
                <div className="grid grid-cols-2 gap-12">
                   <div className="witness-block">
                      <p className="font-bold mb-1 uppercase">1. {affidavitDetails.witness1.name || '________________'}</p>
                      <p>{affidavitDetails.witness1.relation} {affidavitDetails.witness1.relName || '________________'}</p>
                      <p className="mb-6">{affidavitDetails.witness1.address || '________________'}</p>
                      <div className="h-px w-32 bg-black mb-1"></div>
                      <p className="text-[8px] font-bold">{ui.signature}</p>
                   </div>
                   <div className="witness-block">
                      <p className="font-bold mb-1 uppercase">2. {affidavitDetails.witness2.name || '________________'}</p>
                      <p>{affidavitDetails.witness2.relation} {affidavitDetails.witness2.relName || '________________'}</p>
                      <p className="mb-6">{affidavitDetails.witness2.address || '________________'}</p>
                      <div className="h-px w-32 bg-black mb-1"></div>
                      <p className="text-[8px] font-bold">{ui.signature}</p>
                   </div>
                </div>
             </div>

             <div className="verification-area page-break-inside-avoid">
                <h4 className="font-bold underline mb-2 uppercase">{ui.verification}</h4>
                <p className="italic">
                   {affidavitDetails.selectedLanguage === 'English' ? 
                     `Verified at ${tsrData?.branchName || '__________'} on this ${new Date().getDate()} day of ${ui.monthNames[new Date().getMonth()]}, ${new Date().getFullYear()} that the contents of the above affidavit are true and correct to the best of my/our knowledge and belief and nothing material has been concealed therefrom.` : 
                     "Use the AI Drafting Engine for full localized verification."
                   }
                </p>
                <div className="mt-12 text-right">
                   <p className="font-bold uppercase">DEPONENT(S) SIGNATURE</p>
                </div>
             </div>

             <div className="mt-20 pt-8 border-t-2 border-black flex justify-between items-start page-break-inside-avoid">
                <div className="text-center">
                    <p className="font-black mb-10 uppercase tracking-widest text-xs">{ui.notary}</p>
                    <div className="w-24 h-24 border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 opacity-30">
                        <span className="text-[9px] font-black text-center leading-tight uppercase">NOTARY<br/>SEAL</span>
                    </div>
                    <p className="font-black uppercase text-sm">{ui.notaryPublic}</p>
                </div>
                <div className="text-right mt-12">
                    <p className="text-xs font-bold mb-12">{ui.identifiedBy}</p>
                    <div className="h-px w-48 bg-black mb-2 ml-auto"></div>
                    <p className="font-black uppercase text-sm">{ui.advocate}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 p-6 md:p-10 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm text-slate-600 transition-all border border-slate-100">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Affidavit Generator</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Localized Resolution Engine</p>
            </div>
          </div>
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
             {isSaving ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Save size={16} />}
             {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   {affidavitDetails.useCustomRequirement ? (
                     <><Edit3 size={16} className="text-indigo-500" /> Custom Requirement</>
                   ) : (
                     <><AlertOctagon size={16} className="text-rose-500" /> TSR Discrepancies</>
                   )}
                 </h3>
                 <button 
                  onClick={() => setAffidavitDetails({...affidavitDetails, useCustomRequirement: !affidavitDetails.useCustomRequirement})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${affidavitDetails.useCustomRequirement ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                 >
                   {affidavitDetails.useCustomRequirement ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                   {affidavitDetails.useCustomRequirement ? 'Using Custom' : 'Enable Custom'}
                 </button>
               </div>
               {affidavitDetails.useCustomRequirement ? (
                 <textarea 
                   value={affidavitDetails.customRequirement}
                   onChange={(e) => setAffidavitDetails({...affidavitDetails, customRequirement: e.target.value})}
                   placeholder="Enter requirement..."
                   rows={3}
                   className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-medium text-indigo-800 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                 />
               ) : (
                 <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-medium text-rose-800 leading-relaxed italic shadow-inner">
                   "{tsrData?.discrepancies || 'No specific discrepancies found in TSR.'}"
                 </div>
               )}
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 space-y-12">
                <section className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
                         <Users size={24} className="text-indigo-600" /> Deponent Particulars ({affidavitDetails.deponents.length})
                      </h3>
                      <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                        <Languages size={16} className="text-indigo-600" />
                        <select 
                            value={affidavitDetails.selectedLanguage}
                            onChange={(e) => setAffidavitDetails({...affidavitDetails, selectedLanguage: e.target.value})}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      {affidavitDetails.deponents.map((d, i) => (
                        <div key={i} className="bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden transition-all">
                           <button 
                            onClick={() => setExpandedDeponent(expandedDeponent === i ? null : i)}
                            className="w-full flex items-center justify-between p-4 bg-white border-b border-slate-100"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">{i+1}</div>
                                 <p className="text-sm font-bold text-slate-800">{d.salutation} {d.name || 'Unnamed Deponent'}</p>
                              </div>
                              {expandedDeponent === i ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                           </button>
                           {expandedDeponent === i && (
                             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Father / Spouse Name</label>
                                   <input value={d.father} onChange={(e) => updateDeponent(i, 'father', e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-inner" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Deponent Age</label>
                                   <input type="number" value={d.age} onChange={(e) => updateDeponent(i, 'age', e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-inner" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Current Address</label>
                                   <input value={d.address} onChange={(e) => updateDeponent(i, 'address', e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-inner" />
                                </div>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </section>

                <section>
                   <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                      <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
                          <Scale size={24} className="text-emerald-600" /> AI Drafting Engine
                      </h3>
                      <button 
                        onClick={generateFullAffidavit}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Generate Full Narrative ({affidavitDetails.selectedLanguage})
                      </button>
                   </div>
                   <div className="relative">
                      <textarea 
                        rows={10}
                        value={affidavitDetails.discrepancyClarification}
                        onChange={(e) => setAffidavitDetails({...affidavitDetails, discrepancyClarification: e.target.value})}
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner font-serif text-justify"
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center">
                           <Loader2 size={32} className="animate-spin text-emerald-600" />
                        </div>
                      )}
                   </div>
                </section>

                <section>
                   <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2 mb-6">
                      <Fingerprint size={24} className="text-amber-600" /> Verification Text
                   </h3>
                   <textarea 
                     rows={3}
                     value={affidavitDetails.applicantDeclaration || ui.declarationDefault}
                     onChange={(e) => setAffidavitDetails({...affidavitDetails, applicantDeclaration: e.target.value})}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                   />
                </section>

                <div className="pt-8 border-t border-slate-100 flex justify-end">
                   <button 
                      onClick={() => setShowOutput(true)}
                      disabled={!affidavitDetails.discrepancyClarification}
                      className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Fingerprint size={20} className="text-emerald-400" />
                      Preview Final Affidavit
                   </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};