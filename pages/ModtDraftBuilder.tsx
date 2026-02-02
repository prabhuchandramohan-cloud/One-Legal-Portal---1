import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  FileText, 
  ShieldCheck, 
  Stamp,
  User,
  Home,
  FileBadge,
  Loader2,
  AlertCircle,
  FileCheck,
  Scale,
  Save,
  CheckCircle2,
  MapPin,
  Smartphone,
  BadgeInfo,
  CreditCard,
  Camera,
  ImageIcon,
  Users,
  FileSignature,
  ToggleLeft,
  ToggleRight,
  Wrench,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  ClipboardList,
  Compass
} from 'lucide-react';

interface ModtDraftBuilderProps {
  tsrData: any;
  onBack: () => void;
  onSave?: (data: any) => void;
}

const numberToWords = (number: number | string) => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  let numStr = number.toString();
  if (numStr.length > 9) return 'overflow';
  let n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'only ' : '';
  return str.toUpperCase();
};

export const ModtDraftBuilder: React.FC<ModtDraftBuilderProps> = ({ tsrData, onBack, onSave }) => {
  const [showOutput, setShowOutput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMortgagor, setExpandedMortgagor] = useState<number | null>(0);
  const [expandedProperty, setExpandedProperty] = useState<number | null>(0);

  // Expanded local state for detailed MODT and Simple Mortgage template
  const [modtState, setModtState] = useState({
    deedType: tsrData?.modt?.deedType ?? 'MODT', // 'MODT' or 'Simple'
    branchAddress: tsrData?.modt?.branchAddress ?? '',
    titleDeedRef: tsrData?.modt?.titleDeedRef ?? '',
    includePropertyPhoto: tsrData?.modt?.includePropertyPhoto ?? false,
    includeMortgageeSignature: tsrData?.modt?.includeMortgageeSignature ?? true,
    propertyPhotoBase64: tsrData?.modt?.propertyPhotoBase64 ?? null,
    mortgagors: [] as any[],
    docsCollect: [] as any[],
    properties: [] as any[],
    witness1: tsrData?.modt?.witness1 ?? { name: '', relation: 'Son of', relName: '', address: '' },
    witness2: tsrData?.modt?.witness2 ?? { name: '', relation: 'Son of', relName: '', address: '' }
  });

  useEffect(() => {
    if (tsrData?.modt) {
      setModtState({
        deedType: tsrData.modt.deedType || 'MODT',
        branchAddress: tsrData.modt.branchAddress || '',
        titleDeedRef: tsrData.modt.titleDeedRef || '',
        includePropertyPhoto: tsrData.modt.includePropertyPhoto ?? false,
        includeMortgageeSignature: tsrData.modt.includeMortgageeSignature ?? true,
        propertyPhotoBase64: tsrData.modt.propertyPhotoBase64 || null,
        mortgagors: tsrData.modt.mortgagors || [],
        docsCollect: tsrData.modt.docsCollect || tsrData.docsCollect || [],
        properties: tsrData.modt.properties || tsrData.properties || [],
        witness1: tsrData.modt.witness1 || { name: '', relation: 'Son of', relName: '', address: '' },
        witness2: tsrData.modt.witness2 || { name: '', relation: 'Son of', relName: '', address: '' }
      });
    } else {
        const initialMortgagors = (tsrData?.titleHolders || []).map((th: any) => ({
          name: th.name,
          salutation: th.salutation,
          relationType: 'Son of',
          relationName: th.father || '',
          age: '',
          mobile: '',
          idType: 'AADHAAR',
          idNumber: '',
          panNumber: '',
          mortgagorAddress: ''
        }));
        
        let titleRef = '';
        if (tsrData?.docsSubmitted?.length > 0) {
            // Find the primary title deed if available, otherwise take first doc
            const primaryDeed = tsrData.docsSubmitted.find((d: any) => 
              d.name.toLowerCase().includes('sale') || 
              d.name.toLowerCase().includes('gift') || 
              d.name.toLowerCase().includes('settlement') ||
              d.name.toLowerCase().includes('partition')
            ) || tsrData.docsSubmitted[0];
            
            titleRef = `${primaryDeed.name} No. ${primaryDeed.docNo} dated ${primaryDeed.date}`;
        }

        setModtState(prev => ({
          ...prev,
          mortgagors: initialMortgagors,
          titleDeedRef: titleRef,
          branchAddress: '',
          docsCollect: tsrData?.docsCollect || [],
          properties: tsrData?.properties || []
        }));
    }
  }, [tsrData]);

  const updateMortgagor = (idx: number, field: string, value: string) => {
    const updated = [...modtState.mortgagors];
    updated[idx] = { ...updated[idx], [field]: value };
    setModtState({ ...modtState, mortgagors: updated });
  };

  const updateDoc = (idx: number, field: string, value: string) => {
    const updated = [...modtState.docsCollect];
    updated[idx] = { ...updated[idx], [field]: value };
    setModtState({ ...modtState, docsCollect: updated });
  };

  const updateProperty = (idx: number, field: string, value: any) => {
    const updated = [...modtState.properties];
    updated[idx] = { ...updated[idx], [field]: value };
    setModtState({ ...modtState, properties: updated });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 906;
          canvas.height = 505;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 906, 505);
            setModtState(prev => ({ 
              ...prev, 
              propertyPhotoBase64: canvas.toDataURL('image/jpeg', 0.85) 
            }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    if (onSave) {
      onSave(modtState);
    }
    const fullCaseData = { ...tsrData, modt: modtState };
    const blob = new Blob([JSON.stringify(fullCaseData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${modtState.deedType === 'Simple' ? 'Simple_Mortgage' : 'MODT'}_Draft_${tsrData?.customerName || 'unnamed'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setTimeout(() => setIsSaving(false), 800);
  };

  const generateDraft = () => {
    if (!modtState.branchAddress.trim()) {
      alert("Please enter the Branch Address to proceed.");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setShowOutput(true);
      setIsGenerating(false);
    }, 1200);
  };

  const handlePdfDownload = () => {
    const element = document.getElementById('modtA4');
    if (!element) return;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `${modtState.deedType === 'Simple' ? 'Simple_Mortgage' : 'MODT'}_Draft_${tsrData?.customerName || 'Report'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'legal', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
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
    const content = document.getElementById('modtA4')?.innerHTML;
    if (!content) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><style>
      @page { size: 21.59cm 35.56cm; margin: 2cm; mso-page-orientation: portrait; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; text-align: justify; }
      .modt-header { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 20px; font-size: 14pt; }
      table { border-collapse: collapse; width: 100%; margin: 10px 0; }
      td, th { border: 1px solid black; padding: 5px; text-align: left; }
      .schedule-text { border: 1px solid black; padding: 10px; background: #f9f9f9; }
      .property-photo-box { width: 15.34cm !important; height: 8.56cm !important; margin: 20px auto; border: 1px solid black; text-align: center; overflow: hidden; }
      .property-photo-box img { width: 15.34cm !important; height: 8.56cm !important; object-fit: fill; display: block; margin: 0 auto; }
      .word-footer { margin-top: 50pt; border-top: 1pt solid #000; padding-top: 10pt; font-size: 10pt; font-weight: bold; }
      </style></head><body>`;
    const blob = new Blob([header + content + "</body></html>"], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${modtState.deedType === 'Simple' ? 'Simple_Mortgage' : 'MODT'}_Draft_${tsrData?.customerName || 'Draft'}.doc`;
    link.click();
  };

  if (showOutput) {
    const executionPlace = tsrData?.branchName || '_______';
    const executionDate = new Date();
    const formattedDate = executionDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const day = executionDate.getDate();
    const month = executionDate.toLocaleString('en-IN', { month: 'long' });
    const year = executionDate.getFullYear();
    const loanAmt = tsrData?.appliedLoanAmt || 0;
    const loanWords = numberToWords(loanAmt);

    return (
      <div className="h-full flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-500">
        <div className="max-w-4xl w-full mx-auto flex justify-between items-center p-6 shrink-0 print:hidden">
          <button onClick={() => setShowOutput(false)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Back to Editor
          </button>
          <div className="flex gap-4">
            <button onClick={handlePdfDownload} className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-slate-800 transition-all">
              <Printer size={18} /> Download PDF
            </button>
            <button onClick={downloadWord} className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-indigo-700 transition-all">
              <Download size={18} /> Download Word
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-slate-200/50">
          <div id="modtA4" className="bg-white p-14 shadow-2xl mx-auto min-h-[297mm] w-[210mm] text-slate-900 font-serif leading-relaxed text-justify text-sm mb-20 relative selection:bg-indigo-100">
             <style>{`
               @media print { 
                 body { background: white !important; } 
                 .print-hidden { display: none !important; } 
                 #modtA4 { box-shadow: none !important; width: 100%; padding: 30px 40px; margin: 0; }
                 .signature-footer {
                   display: flex !important;
                   position: fixed;
                   bottom: 10mm;
                   left: 15mm;
                   right: 15mm;
                   justify-content: space-between;
                   border-top: 1px solid #000;
                   padding-top: 5mm;
                   font-size: 10px;
                   font-family: 'Times New Roman', serif;
                   font-weight: bold;
                 }
               }
               #modtA4 {
                word-break: break-word;
                overflow-wrap: anywhere;
                box-sizing: border-box;
                width: 100%;
               }
               .modt-title { text-align: center; font-size: 16px; font-weight: 900; text-decoration: underline; margin-bottom: 30px; text-transform: uppercase; }
               .modt-section-title { font-weight: 900; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; text-align: left; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
               p { text-align: justify; margin-bottom: 14px; word-wrap: break-word; overflow-wrap: anywhere; }
               .list-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
               .list-item:before { content: "•"; position: absolute; left: 0; font-weight: bold; }
               .signature-block { margin-top: 80px; display: flex; flex-direction: column; gap: 40px; }
               .witness-block { margin-top: 40px; display: grid; grid-template-cols: 1fr 1fr; gap: 40px; }
               .witness-entry { font-size: 11px; line-height: 1.6; }
               table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 20px; table-layout: fixed; }
               th, td { border: 1px solid black; padding: 4px; text-align: left; word-break: break-word; overflow-wrap: anywhere; }
               th { background-color: #f1f5f9; text-transform: uppercase; font-size: 8px; }
               .signature-footer { display: none; }
               .word-footer { display: none; }
               .dmg-text { color: #b91c1c; font-weight: bold; display: block; font-size: 8px; }
               .schedule-table { width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 15px; }
               .schedule-table th, .schedule-table td { border: 1px solid black; padding: 6px; font-size: 10px; }
               .schedule-header { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; width: 150px; }
               .deed-bold { font-weight: bold; }
               .deed-center { text-align: center; }
               .deed-underline { text-decoration: underline; }
             `}</style>

             {modtState.deedType === 'MODT' ? (
               <>
                 <div className="modt-title">MEMORANDUM OF DEPOSIT OF TITLE DEEDS</div>

                 <p>
                   This Agreement of Deposit of Title deeds executed at <strong>{executionPlace}</strong> on <strong>{formattedDate}</strong> by:
                 </p>

                 <div className="space-y-4 mb-6">
                   {modtState.mortgagors.map((m, i) => (
                     <p key={i}>
                       {i + 1}. <strong>{m.salutation} {m.name}</strong>, {m.relationType} <strong>{m.relationName}</strong>, aged <strong>{m.age}</strong>, Mobile No: <strong>{m.mobile}</strong>, Identification Type: <strong>{m.idType}</strong>, Identification No: <strong>{m.idNumber}</strong> residing at <strong>{m.mortgagorAddress}</strong>.
                     </p>
                   ))}
                 </div>

                 <p>
                   hereinafter called the <strong>MORTGAGOR(S)/DEPOSITOR(S)</strong> which term shall wherever the context mean and include their heirs, executors, administrators, legal representative and assigns of the one part.
                 </p>

                 <p>
                   <strong>IN FAVOUR OF L&T Finance Limited</strong>, <strong>{tsrData?.branchName}</strong>, located at <strong>{modtState.branchAddress}</strong>. Registered under the Companies Act 1956 and Having its Registered Office at <strong>Brindavan, Plot No. 177, CST Road, Kalina, Santacruz (East), Mumbai 400098</strong>.
                 </p>

                 <p>
                   hereinafter called the <strong>MORTGAGEE</strong> which term shall wherever the context admits, mean and include its successors and assigns of the other part.
                 </p>

                 <p>
                   Whereas the MORTGAGOR(S)/DEPOSITOR(S) herein has possessed the said property more fully described in the Schedule(s) hereunder through <strong>{modtState.titleDeedRef}</strong>.
                 </p>

                 <div className="modt-section-title">NOW THIS MEMORANDUM OF DEPOSIT OF TITLE DEEDS WITNESHEATH</div>

                 <p>
                   That in consideration of the sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords})</strong> to be received by Mortgagor/s as agreed in the Sanction Letter/KFS executed between the Parties and in accordance with the terms of the Loan Agreement executed/ to be executed between the Parties as security for due repayment of the said sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords})</strong> together with interest and other monies thereon that may become due and payable, the Mortgagor/s has on this day deposited with mortgagee, the title deeds more fully described in the list of Document relating to his property more fully described in the Schedule of Property hereunder, as security with the intent to create an equitable mortgage by deposit of title deeds of the said property to secure the loan amount. The Mortgagor/s hereby covenants that the said property is not subject to any mortgage, lien, charge, or any kind of encumbrance whatsoever and the Depositor is the absolute owner of the same. The Mortgagor/s further agrees to keep mortgagee indemnified against all claims and demands whatsoever by raised by any person lawfully or equitably claiming under them by any other person whatsoever. The Mortgagor/s hereby covenants that the title documents/deeds, and writings deposited with the mortgagee are the only documents that are in their possession and that title deeds of the Schedule of Property shall remain as security till the entire amount of the said Loan inclusive of all interest, cost, charges and expenses incidental thereto are fully repaid by the Mortgagor/s. The Mortgagor/s hereby covenants and declares that they have full power and absolute authority to in their own right to mortgage by way of deposit of Title deeds and/or to create security in favor of the mortgagee and execute his Memorandum of Deposit of Title Deeds. The Mortgagor/s hereby covenants that no other person has any right title, interest, claim or demand into or upon the said Schedule of Property either by way of mortgage, gift, lease, inheritance or otherwise and there is no pending litigation of any kind whatsoever. The Mortgagor/s hereby covenants that henceforth the Mortgagor/s shall not enter into any agreement/ writing with any third Party for creating any rights of whatsoever nature in respect of Schedule of Property until and unless the entire mortgage debt is repaid to the mortgagee in full. The Mortgagor/s hereby covenants that the title deeds, documents mentioned in the List of Documents deposited with the mortgagee are the only documents of title relating to the schedule property and that there are no other documents of title to the schedule property in his/her/their possession and custody. Whereas the Mortgagor/Depositor applied to the Mortgagee for a loan of <strong>₹ {loanAmt.toLocaleString('en-IN')}/- ({loanWords})</strong> and the Mortgagee is willing to advance the loan, if the Mortgagor/Depositor deposit the title deeds of his immovable property as collateral security for the due repayment of the principal and interest, thereby creating an equitable mortgage over the same.
                 </p>

                 <div className="modt-section-title">NOW THIS AGREEMENT OF DEPOSIT OF TITLE DEEDS WITNESSETH:</div>

                 <p>
                   That in consideration of the above said sum of <strong>₹ {loanAmt.toLocaleString('en-IN')}/-</strong> received by the Mortgagor/Depositor from the Mortgagee, as security for the payment of the said sum with interest due thereon and the Mortgagor/Depositor has, this day, deposited with the Mortgagee, the Title Deeds more fully described hereunder under “List of Documents of Title Deposited”, in respect of his property more fully described in the Schedule hereunder as collateral security thereby intending to create an equitable mortgage over the same in favour of the Mortgagee.
                 </p>

                 <div className="modt-section-title">List of documents of Title deposited</div>
                 <p className="text-[9px] italic mb-2">The following documents have been deposited with the mortgagee in original/photostat as noted below:</p>
                 <table>
                    <thead>
                      <tr>
                        <th style={{ width: '25px' }}>S.No</th>
                        <th style={{ width: '120px' }}>Nature of Document</th>
                        <th style={{ width: '60px' }}>Date</th>
                        <th style={{ width: '70px' }}>Doc No</th>
                        <th>Parties</th>
                        <th style={{ width: '60px' }}>Document Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modtState.docsCollect?.map((doc: any, i: number) => (
                        <tr key={doc.id || i}>
                          <td>{i+1}</td>
                          <td className="font-bold">{doc.name}</td>
                          <td>{doc.date}</td>
                          <td>{doc.docNo}</td>
                          <td>{doc.executant} / {doc.claimant}</td>
                          <td className="font-bold">{doc.original}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </>
             ) : (
               <>
                 <div className="modt-title">DEED OF SIMPLE MORTGAGE<br/>(WITHOUT POSSESSION)</div>

                 <p>
                   THIS DEED OF SIMPLE MORTGAGE is made at <strong>{executionPlace}</strong> on this <strong>{day}</strong> of <strong>{month}</strong>, <strong>{year}</strong>.
                 </p>

                 <p>
                   <strong>BETWEEN</strong>
                 </p>

                 <div className="space-y-4 mb-6">
                   {modtState.mortgagors.map((m, i) => (
                     <p key={i}>
                       {i + 1}. <strong>{m.salutation} {m.name}</strong>, aged about <strong>{m.age}</strong> years, Aadhar No. <strong>{m.idNumber}</strong>, PAN No. <strong>{m.panNumber}</strong>, residing at <strong>{m.mortgagorAddress}</strong>, hereinafter referred to as the <strong>"MORTGAGOR(S)"</strong> (which expression shall unless it be repugnant to the context or meaning thereof mean and include their heirs, executors, administrators, and legal representatives) of the <strong>ONE PART</strong>.
                     </p>
                   ))}
                 </div>

                 <p>
                   <strong>AND</strong>
                 </p>

                 <p>
                   <strong>L&T Finance Limited</strong>, a company registered under the Companies Act, having its Corporate Office at <strong>Brindavan, Plot No. 177, CST Road, Kalina, Santacruz (East), Mumbai 400098</strong> and branch office at <strong>{tsrData?.branchName}</strong>, hereinafter referred to as the <strong>"MORTGAGEE"</strong> (which expression shall unless it be repugnant to the context or meaning thereof mean and include its successors and assigns) of the <strong>OTHER PART</strong>.
                 </p>

                 <p><strong>WHEREAS:</strong></p>
                 <ol className="space-y-4 mb-6">
                   <li className="list-decimal ml-6">Mortgagors are absolute owners and seized and possessed of the House more particularly described in Schedule-I below, having acquired the absolute right, title and interest in the same through <strong>{modtState.titleDeedRef}</strong>.</li>
                   <li className="list-decimal ml-6">The Mortgagors have requested the Mortgagee to grant them loan, which the Mortgagee has agreed to grant them a sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords} Only)</strong> which the Mortgagee has agreed to give on the Mortgagors executing these presents, with a view to secure the repayment thereof with interest as hereinafter provided.</li>
                 </ol>

                 <p><strong>NOW THIS DEED WITNESSETH AS FOLLOWS:</strong></p>
                 
                 <div className="space-y-6">
                    <p>
                       NOW  THIS  DEED  WITNESSETH  that  pursuant  to  the  said  agreement  and in consideration of the sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords} Only)</strong> lent and advanced by the Mortgagee to the Mortgagors on the execution of these presents (receipt whereof the Mortgagors both hereby admit) they, the Mortgagors, hereby covenants with the Mortgagee that they shall pay to the Mortgagee the said sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords} Only)</strong> with interest thereon and until repayment of the above sum is made in full, at the rate mentioned in the respective sanction letter / offer letter accepted and agreed by Mortgagors, until the said principal sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords} Only)</strong> is repaid in full with applicable interest thereon. AND the Mortgagors further covenants with the Mortgagee that in the event of the Mortgagors failing to pay monthly installment on regular basis, Mortgagors shall be liable to pay interest on the said installment in default at the same rate as aforesaid from the date of default until payment of such installment as and by way of compound interest, without prejudice to the right of the Mortgagee to take any action on default as herein after provided. AND it is agreed and declared that in the event of the Mortgagors committing default in payment of installments or in payment of the principal and interest on the due date or committing breach of any other term(s) of this deed, the whole amount of principal then due with interest thereon shall at the option of the Mortgagee become payable forthwith as if the said due date had expired.
                    </p>

                    <p>
                       AND THIS DEED FURTHER WITNESSETH that the Mortgagors hereby transfer by way of mortgage property referred above more fully described in the schedule hereunder written as a security for repayment of the said sum with interest and all other moneys due and payable hereunder with a condition that on the Mortgagors repaying the said principal a sum of <strong>Rs. {loanAmt.toLocaleString('en-IN')}/- ({loanWords} Only)</strong> with all interest and other moneys due to the Mortgagee (hereinafter referred to as the “Loan Amount”), the Mortgagee shall redeem the premises from the mortgage security and shall if so required by the Mortgagors execute a deed of release but at the costs of the Mortgagors.
                    </p>

                    <div className="modt-section-title">LIST OF DOCUMENTS DEPOSITED</div>
                    <table className="schedule-table">
                        <thead>
                            <tr className="bg-slate-50">
                                <th style={{ border: '1px solid black', width: '25px' }}>S.No</th>
                                <th style={{ border: '1px solid black' }}>Nature of Document</th>
                                <th style={{ border: '1px solid black', width: '70px' }}>Doc No</th>
                                <th style={{ border: '1px solid black', width: '60px' }}>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modtState.docsCollect?.map((doc: any, i: number) => (
                                <tr key={i}>
                                    <td>{i+1}</td>
                                    <td>{doc.name}</td>
                                    <td>{doc.docNo}</td>
                                    <td>{doc.original}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p>
                       And it is further agreed and declared by the Mortgagors that they shall also be liable to pay all the costs, charges and expenses that the Mortgagee will incur for the protection of the mortgage security and or for the realization of the Loan Amount and the same shall be deemed to form part of that Loan Amount and the security therefore as aforesaid.
                    </p>

                    <p>
                       And it is further agreed that during pendency of the security hereby created and until repayment of the Loan Amount, the Mortgagors shall get insured and keep insured the above house against any loss and damages due to fire or any other accident for the such sum to the extent of Loan Amount from an insurance company of a repute and pay all premium on the insurance policy as and when it becomes due and payable in respect thereof to such company and shall hand over the policy to the Mortgagee duly endorsed in name of Mortgagee as assignee and in the event of the Mortgagors failing to do so or to pay the premium, the Mortgagee shall be entitled to insure the said building and structures and / or to pay the premium thereon and the amount paid by the Mortgagee in respect thereof shall be deemed to form part of the Loan Amount.
                    </p>

                    <p>
                       And it is further agreed that in the event of the said house premises being destroyed or damaged by fire or any accident as aforesaid, the Mortgagee shall be entitled to receive the insurance claim under such policy to the exclusion to the Mortgagors and to appropriate the same first towards all arrears of interest and then the principal amount or any part thereof and may be sufficient to pay the Loan Amount due and if any surplus remains the same only will become payable to Mortgagors.
                    </p>

                    <p>
                       AND it is hereby agreed and declared that if the said mortgage property or any portion thereof shall at any time be taken by the Government or any public body which is entitled to do so in lawful capacity for a public purpose etc., the Mortgagee shall be entitled to receive the whole of the compensation, damages etc. which the Mortgagors shall be entitled or be declared to be entitled to, and to apply the same or a sufficient portion thereof towards the repayment of the principal and interest hereby secured and that all the proceeding for ascertainment and apportionment of the compensation payable for the said mortgaged property shall be conducted by the Mortgagors through the lawyers and engineers selected by the Mortgagee, but if the Mortgagors shall not do so then the Mortgagee shall be entitled to appoint lawyers and engineers of its choice for the conduct of such proceedings and expenses that may be incurred by the Mortgagee with interest thereon at the rate aforesaid from the time of the same having been so incurred and until such repayment, the same shall be a charge upon the said mortgaged property and that in all proceedings in the court of law or tribunals or before public or other officers wherein the Mortgagee shall be entitled to appear by the Attorneys, counselor or architect and other professional persons and all the costs, charges and expenses of attorneys incurred by the Mortgagee shall be repaid by the Mortgagors with interest at the rate aforesaid, all such moneys, and interest shall be a charge on the said mortgaged property as if the same had been originally advanced under these presents.
                    </p>

                    <p>
                       AND it is hereby further agreed and declared that the Mortgagors shall pay all the costs, charges and expenses between attorneys incurred or paid by the Mortgagee of and incidental to and in connection with the said security as well as for the assertion or defense of the rights of the Mortgagee as for the protection and security of the mortgaged property or any part thereof or for the demand realization and recovery of the said amount of principal, interest and other moneys due under these presents or any part thereof and all such costs, charges and expenses shall on demand be paid by the Mortgagors to the Mortgagee with interest thereon at the rate aforesaid from time to time the same having been so incurred and until such payment the same shall be a charge upon the said mortgaged property.
                    </p>

                    <p>
                       AND it is further agreed and declared by the Mortgagors that they shall also be liable to pay and shall pay all the costs, charges, expenses that the Mortgagee shall incur for the protection of the mortgage security and or for the realization of the Loan Amount and the same shall be deemed to form part of the Loan Amount and security thereof as aforesaid.
                    </p>

                    <p>
                       <strong>THAT the Mortgagors hereby covenant with the Mortgagee as follows:</strong>
                    </p>

                    <p className="list-item">That the Mortgagors shall duly and punctually pay and discharge all the revenues, rents, rates, taxes, impositions another charges from time to time as payable in respect of the said mortgaged property or any of them and will at all times hereafter produce at the request of the Mortgagee the receipts for such payments.</p>
                    <p className="list-item">That the Mortgagee shall have the right to inspect at all reasonable times, the mortgaged property from time to time with intimation to the concerned authority and/or the Mortgagor.</p>
                    <p className="list-item">That the Mortgagors shall be liable to pay any charges incurred by the Mortgagee in connection with the inspection of the mortgaged property and/or any service or technical or a legal advice obtained by the Mortgagee in connection therewith.</p>
                    <p className="list-item">That the Mortgagors shall not put up the mortgaged property to any other use except using the same for his residential use only, during the continuance of this security.</p>

                    <p>
                       <strong>LASTLY</strong> it is hereby agreed and declared by the Mortgagors that all expenses towards stamp duty, registration charges, advocates fees etc. incurred or to be incurred for the present deed and charges, costs, expenses related to or to be incurred on account of protection of mortgage security and for the realization of the Loan Amount are to be borne by the Mortgagors only.
                    </p>

                    <p>
                       And it is specifically agreed that the Mortgagors should not sell the schedule property mortgaged herein to any third party and shall not create any other charge on this property.
                    </p>
                 </div>
               </>
             )}

             <div className="modt-section-title">SCHEDULE - I<br/>(Description of the Property)</div>
             <div className="word-break-break-word">
                {modtState.properties?.map((p: any, idx: number) => {
                  const idLabels = p.identifiers?.map((id: any) => `${id.type}: ${id.value}`).join(', ');
                  
                  return (
                    <div key={idx} className="mb-8 last:mb-0">
                      <p className="font-bold underline uppercase mb-3">Item No. {idx+1} - Schedule Details</p>
                      
                      <p>
                        All that piece and parcel of immovable Residential Property bearing <strong>{idLabels || '_______'}</strong>, known as <strong>"{p.villageName || '_______'}"</strong>, having a total land area admeasuring <strong>{p.totalExtent} {p.extentUnit}</strong>, property constructed there in and with all the amenities.
                      </p>
                      <p>
                        Situated at: Village <strong>{p.villageName}</strong>, Taluka <strong>{p.regDistrict}</strong>, District <strong>{p.regDistrict}</strong>.
                      </p>

                      <table className="schedule-table mt-4">
                         <thead>
                            <tr className="bg-slate-50">
                               <th style={{ border: '1px solid black', width: '100px' }}>DIRECTION</th>
                               <th style={{ border: '1px solid black' }}>DESCRIPTION / BOUNDARIES</th>
                               <th style={{ border: '1px solid black', width: '120px' }}>MEASUREMENT</th>
                            </tr>
                         </thead>
                         <tbody>
                            <tr><td>NORTH</td><td>{p.boundaryNorth}</td><td>{p.dimNorth}</td></tr>
                            <tr><td>SOUTH</td><td>{p.boundarySouth}</td><td>{p.dimSouth}</td></tr>
                            <tr><td>EAST</td><td>{p.boundaryEast}</td><td>{p.dimEast}</td></tr>
                            <tr><td>WEST</td><td>{p.boundaryWest}</td><td>{p.dimWest}</td></tr>
                            {p.remarks && <tr><td className="font-bold">PROPERTY REMARKS</td><td colSpan={2}>{p.remarks}</td></tr>}
                         </tbody>
                      </table>

                      {modtState.includePropertyPhoto && modtState.propertyPhotoBase64 && idx === 0 && (
                         <div className="mt-4 mb-6 flex justify-center">
                            <div className="property-photo-box" style={{ width: '15.34cm', height: '8.56cm', padding: '0', border: '1px solid #ccc', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
                              <img 
                                src={modtState.propertyPhotoBase64} 
                                alt="Property" 
                                style={{ width: '15.34cm', height: '8.56cm', objectFit: 'fill', display: 'block', margin: '0 auto' }}
                              />
                            </div>
                         </div>
                      )}
                    </div>
                  );
                })}
             </div>

             <div className="signature-block">
                <div className="space-y-12">
                   {modtState.mortgagors.map((m, i) => (
                     <div key={i}>
                        <p className="font-bold mb-14 uppercase">SIGNED AND DELIVERED BY THE MORTGAGOR ({m.name})</p>
                        <p className="text-[10px] mb-1">(Signature & Thumb Impression)</p>
                        <div className="h-px w-40 bg-black mb-2"></div>
                        <p className="font-bold">{m.name}</p>
                     </div>
                   ))}
                </div>
                {modtState.includeMortgageeSignature && (
                <div className="text-right mt-10">
                   <p className="font-bold mb-14 uppercase">SIGNED AND DELIVERED BY THE MORTGAGEE</p>
                   <p className="text-[10px] mb-1">(Authorized Signatory)</p>
                   <div className="h-px w-40 bg-black ml-auto mb-2"></div>
                   <p className="font-bold uppercase">For, L&T Finance Limited</p>
                </div>
                )}
             </div>

             <div className="modt-section-title">WITNESSES</div>
             <div className="witness-block">
                <div className="witness-entry">
                   <p className="font-bold mb-1 underline uppercase">Witness 1:</p>
                   <p><strong>Name:</strong> {modtState.witness1.name || '________________'}</p>
                   <p><strong>Relation:</strong> {modtState.witness1.relation} {modtState.witness1.relName || '________________'}</p>
                   <p><strong>Address:</strong> {modtState.witness1.address || '________________'}</p>
                   <div className="mt-10 h-px w-32 bg-black/50"></div>
                   <p className="text-[9px] mt-1 font-bold">Signature</p>
                </div>
                <div className="witness-entry">
                   <p className="font-bold mb-1 underline uppercase">Witness 2:</p>
                   <p><strong>Name:</strong> {modtState.witness2.name || '________________'}</p>
                   <p><strong>Relation:</strong> {modtState.witness2.relation} {modtState.witness2.relName || '________________'}</p>
                   <p><strong>Address:</strong> {modtState.witness2.address || '________________'}</p>
                   <div className="mt-10 h-px w-32 bg-black/50"></div>
                   <p className="text-[9px] mt-1 font-bold">Signature</p>
                </div>
             </div>

             <div className="signature-footer">
                <div>
                  <div style={{ width: '120px', height: '1px', backgroundColor: '#000', marginBottom: '4px' }}></div>
                  <span>MORTGAGOR(S)</span>
                </div>
                {modtState.includeMortgageeSignature && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: '120px', height: '1px', backgroundColor: '#000', marginBottom: '4px', marginLeft: 'auto' }}></div>
                  <span>FOR L&T FINANCE LTD</span>
                </div>
                )}
             </div>

             <div className="word-footer" style={{ marginTop: '60pt', borderTop: '1pt solid #000', paddingTop: '10pt' }}>
                <table style={{ border: 'none', width: '100%' }}>
                  <tr>
                    <td style={{ border: 'none', textAlign: 'left', fontWeight: 'bold', fontSize: '10pt' }}>MORTGAGOR(S) SIGNATURE</td>
                    {modtState.includeMortgageeSignature && (
                    <td style={{ border: 'none', textAlign: 'right', fontWeight: 'bold', fontSize: '10pt' }}>FOR L&T FINANCE LTD</td>
                    )}
                  </tr>
                </table>
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
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Mortgage Draft Builder</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Auto-generation of Legal Deed Instruments</p>
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

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 space-y-12">
            <section className="flex flex-col md:flex-row gap-6 items-center">
               <div className="flex-1 space-y-1 w-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Deed Type</label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                     <button 
                        onClick={() => setModtState({...modtState, deedType: 'MODT'})}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modtState.deedType === 'MODT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                     >
                        <FileBadge size={14} />
                        MODT (Memorandum)
                     </button>
                     <button 
                        onClick={() => setModtState({...modtState, deedType: 'Simple'})}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modtState.deedType === 'Simple' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                     >
                        <FileSignature size={14} />
                        Simple Mortgage
                     </button>
                  </div>
               </div>
            </section>

            <section className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg">
                    <FileBadge size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em]">Source Work: TSR Workflow</p>
                    <h3 className="text-lg font-bold">Case: {tsrData?.customerName || 'No Case Data'}</h3>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Amount</p>
                  <span className="text-yellow-400 font-black text-lg">₹{tsrData?.appliedLoanAmt?.toLocaleString()}</span>
               </div>
            </section>

            {!tsrData ? (
               <div className="p-10 text-center bg-rose-50 border-2 border-dashed border-rose-200 rounded-[2rem]">
                  <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
                  <p className="font-bold text-rose-800 uppercase tracking-widest">Missing Case Data</p>
                  <p className="text-xs text-rose-600 mt-2">Please complete a Title Scrutiny report first.</p>
               </div>
            ) : (
               <>
                  <div className="space-y-10">
                     <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                           <Wrench size={16} className="text-indigo-600" /> Configuration & Annexures
                        </h3>
                        <div className="flex flex-wrap items-start gap-6">
                           <button 
                             onClick={() => setModtState({...modtState, includeMortgageeSignature: !modtState.includeMortgageeSignature})}
                             className={`flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border transition-all min-w-[280px] ${modtState.includeMortgageeSignature ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-100 opacity-60'}`}
                           >
                              {modtState.includeMortgageeSignature ? (
                                <ToggleRight size={24} className="text-indigo-600" />
                              ) : (
                                <ToggleLeft size={24} className="text-slate-400" />
                              )}
                              <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase text-left">Include Mortgagee Signature</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase text-left">(Authorized Signatory) For, L&T Finance Limited</p>
                              </div>
                           </button>

                           <button 
                             onClick={() => setModtState({...modtState, includePropertyPhoto: !modtState.includePropertyPhoto})}
                             className={`flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border transition-all min-w-[280px] ${modtState.includePropertyPhoto ? 'border-rose-500 ring-2 ring-rose-50' : 'border-slate-100 opacity-60'}`}
                           >
                              {modtState.includePropertyPhoto ? (
                                <ToggleRight size={24} className="text-rose-500" />
                              ) : (
                                <ToggleLeft size={24} className="text-slate-400" />
                              )}
                              <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase text-left">Include Property Photograph</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase text-left">Include Site Photo in Schedule Annexure</p>
                              </div>
                           </button>
                           
                           {modtState.includePropertyPhoto && (
                              <div className="flex flex-1 items-center gap-4 animate-in slide-in-from-left-4 duration-300">
                                 <div className="relative group">
                                    <input 
                                       type="file" 
                                       id="prop-photo"
                                       accept="image/*" 
                                       onChange={handlePhotoUpload} 
                                       className="hidden"
                                    />
                                    <label 
                                       htmlFor="prop-photo"
                                       className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all cursor-pointer shadow-lg"
                                    >
                                       <ImageIcon size={16} />
                                       {modtState.propertyPhotoBase64 ? 'Change Photograph' : 'Upload Photograph'}
                                    </label>
                                 </div>
                                 {modtState.propertyPhotoBase64 && (
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 text-[10px] font-black uppercase">
                                       <CheckCircle2 size={14} /> Photo Attached
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     </section>

                     <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users size={16} className="text-indigo-500" /> Mortgagor / Depositor Particulars ({modtState.mortgagors.length})
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                           {modtState.mortgagors.map((m, i) => (
                             <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 transition-all">
                                <button 
                                  onClick={() => setExpandedMortgagor(expandedMortgagor === i ? null : i)}
                                  className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                >
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                                        {i + 1}
                                      </div>
                                      <div className="text-left">
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mortgagor Name</p>
                                         <p className="text-sm font-bold text-slate-900">{m.salutation} {m.name || 'Unnamed'}</p>
                                      </div>
                                   </div>
                                   {expandedMortgagor === i ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </button>
                                
                                {expandedMortgagor === i && (
                                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Relation Type</label>
                                        <select 
                                           value={m.relationType} 
                                           onChange={(e) => updateMortgagor(i, 'relationType', e.target.value)}
                                           className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        >
                                           <option>Son of</option>
                                           <option>Daughter of</option>
                                           <option>Wife of</option>
                                           <option>Proprietor of</option>
                                        </select>
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Relation Name</label>
                                        <input 
                                           value={m.relationName} 
                                           onChange={(e) => updateMortgagor(i, 'relationName', e.target.value)}
                                           className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                           placeholder="Father / Spouse / Firm Name"
                                        />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Age</label>
                                        <input 
                                           type="number"
                                           value={m.age} 
                                           onChange={(e) => updateMortgagor(i, 'age', e.target.value)}
                                           className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                           placeholder="Years"
                                        />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mobile No</label>
                                        <div className="relative">
                                           <input 
                                              value={m.mobile} 
                                              onChange={(e) => updateMortgagor(i, 'mobile', e.target.value)}
                                              className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                              placeholder="+91"
                                           />
                                           <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Aadhar Number</label>
                                        <div className="relative">
                                           <input 
                                              value={m.idNumber} 
                                              onChange={(e) => updateMortgagor(i, 'idNumber', e.target.value)}
                                              className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                              placeholder="12 Digit No."
                                           />
                                           <BadgeInfo size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">PAN Number</label>
                                        <div className="relative">
                                           <input 
                                              value={m.panNumber} 
                                              onChange={(e) => updateMortgagor(i, 'panNumber', e.target.value)}
                                              className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                              placeholder="ABCDE1234F"
                                           />
                                           <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                     </div>
                                     <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Residential Address</label>
                                        <div className="relative">
                                           <textarea 
                                              value={m.mortgagorAddress} 
                                              onChange={(e) => updateMortgagor(i, 'mortgagorAddress', e.target.value)}
                                              rows={2}
                                              className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                              placeholder="Complete address as per ID proof"
                                           />
                                           <MapPin size={16} className="absolute left-3 top-5 text-slate-300" />
                                        </div>
                                     </div>
                                  </div>
                                )}
                             </div>
                           ))}
                        </div>
                     </section>

                     {/* List of Documents to be Deposited */}
                     <section className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                           <FileText size={16} className="text-amber-500" /> List of Documents to be Deposited
                        </h3>
                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                           <div className="grid grid-cols-12 gap-3 px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-white/50">
                              <div className="col-span-4">Nature of Document</div>
                              <div className="col-span-2">Date</div>
                              <div className="col-span-2">Doc No</div>
                              <div className="col-span-2">Parties</div>
                              <div className="col-span-1">Type</div>
                              <div className="col-span-1 text-right">Actions</div>
                           </div>
                           <div className="divide-y divide-slate-100">
                              {modtState.docsCollect.map((doc, i) => (
                                 <div key={doc.id || i} className="grid grid-cols-12 gap-3 px-6 py-4 items-center bg-white/30 hover:bg-white transition-colors">
                                    <div className="col-span-4">
                                       <input 
                                          value={doc.name} 
                                          onChange={(e) => updateDoc(i, 'name', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                       />
                                    </div>
                                    <div className="col-span-2">
                                       <input 
                                          value={doc.date} 
                                          onChange={(e) => updateDoc(i, 'date', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                       />
                                    </div>
                                    <div className="col-span-2">
                                       <input 
                                          value={doc.docNo} 
                                          onChange={(e) => updateDoc(i, 'docNo', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                       />
                                    </div>
                                    <div className="col-span-2">
                                       <input 
                                          value={`${doc.executant}${doc.claimant ? ' / ' + doc.claimant : ''}`} 
                                          onChange={(e) => {
                                             const parts = e.target.value.split('/');
                                             updateDoc(i, 'executant', parts[0]?.trim() || '');
                                             updateDoc(i, 'claimant', parts[1]?.trim() || '');
                                          }}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                       />
                                    </div>
                                    <div className="col-span-1">
                                       <select 
                                          value={doc.original} 
                                          onChange={(e) => updateDoc(i, 'original', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500"
                                       >
                                          <option value="Original">Original</option>
                                          <option value="Photostat Copy">Photostat Copy</option>
                                          <option value="Online Copy">Online Copy</option>
                                          <option value="Certified Copy">Certified Copy</option>
                                          <option value="True Copy">True Copy</option>
                                          <option value="Attested Copy">Attested Copy</option>
                                          <option value="Notarized Copy">Notarized Copy</option>
                                          <option value="Duplicate Copy">Duplicate Copy</option>
                                       </select>
                                    </div>
                                    <div className="col-span-1 text-right">
                                       <button 
                                          onClick={() => setModtState({...modtState, docsCollect: modtState.docsCollect.filter((_, idx) => idx !== i)})}
                                          className="p-2 text-rose-300 hover:text-rose-500 transition-colors"
                                       >
                                          <Trash2 size={14} />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                              <div className="p-4 bg-slate-50/50">
                                 <button 
                                    onClick={() => setModtState({...modtState, docsCollect: [...modtState.docsCollect, { id: Date.now(), name: '', date: '', docNo: '', executant: '', claimant: '', original: 'Original' }]})}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                 >
                                    <Plus size={14}/> Add Missing Title Document
                                 </button>
                              </div>
                           </div>
                        </div>
                     </section>

                     {/* Schedule of Property Section */}
                     <section className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                           <MapPin size={16} className="text-rose-500" /> Schedule of Property (Editable for Deed)
                        </h3>
                        <div className="space-y-6">
                           {modtState.properties.map((p, idx) => (
                              <div key={p.id || idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                 <button 
                                    onClick={() => setExpandedProperty(expandedProperty === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-black text-sm">
                                          {idx + 1}
                                       </div>
                                       <div className="text-left">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Identification</p>
                                          <p className="text-sm font-bold text-slate-900">
                                             {p.identifiers?.map((id: any) => `${id.type}: ${id.value}`).join(', ') || 'Item No ' + (idx + 1)}
                                          </p>
                                       </div>
                                    </div>
                                    {expandedProperty === idx ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                 </button>

                                 {expandedProperty === idx && (
                                    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-top-2">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-1">
                                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Village Name</label>
                                             <input 
                                                value={p.villageName} 
                                                onChange={(e) => updateProperty(idx, 'villageName', e.target.value)}
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                             />
                                          </div>
                                          <div className="flex gap-4">
                                             <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Extent</label>
                                                <input 
                                                   value={p.totalExtent} 
                                                   onChange={(e) => updateProperty(idx, 'totalExtent', e.target.value)}
                                                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                                />
                                             </div>
                                             <div className="w-28 space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit</label>
                                                <input 
                                                   value={p.extentUnit} 
                                                   onChange={(e) => updateProperty(idx, 'extentUnit', e.target.value)}
                                                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                                />
                                             </div>
                                          </div>
                                       </div>

                                       <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                             <Compass size={14} className="text-rose-500" /> Boundaries & Linear Measurements
                                          </p>
                                          <div className="grid grid-cols-1 gap-3">
                                             {['North', 'South', 'East', 'West'].map(side => {
                                                const boundaryKey = `boundary${side}`;
                                                const dimKey = `dim${side}`;
                                                return (
                                                   <div key={side} className="flex flex-col lg:flex-row gap-3 items-center">
                                                      <div className="w-20 text-[9px] font-black uppercase text-slate-400 tracking-tighter shrink-0">{side}</div>
                                                      <input 
                                                         placeholder="Boundary Detail"
                                                         value={p[boundaryKey]} 
                                                         onChange={(e) => updateProperty(idx, boundaryKey, e.target.value)}
                                                         className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                      />
                                                      <input 
                                                         placeholder="Dimension"
                                                         value={p[dimKey]} 
                                                         onChange={(e) => updateProperty(idx, dimKey, e.target.value)}
                                                         className="w-40 p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                                      />
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       </div>

                                       <div className="space-y-1">
                                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Property Remarks / Identification Labels</label>
                                          <textarea 
                                             value={p.remarks} 
                                             onChange={(e) => updateProperty(idx, 'remarks', e.target.value)}
                                             rows={2}
                                             className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                             placeholder="Any additional identification info for the deed..."
                                          />
                                       </div>
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     </section>

                     <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Home size={16} className="text-emerald-500" /> Institution Details
                           </h3>
                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                                   Branch Address <span className="text-rose-500">*Mandatory</span>
                                 </label>
                                 <textarea 
                                    value={modtState.branchAddress} 
                                    onChange={(e) => setModtState({...modtState, branchAddress: e.target.value})}
                                    rows={3}
                                    className={`w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-inner ${!modtState.branchAddress.trim() ? 'border-rose-300 bg-rose-50' : 'border-slate-100'}`}
                                    placeholder="Enter complete branch address here..."
                                 />
                                 {!modtState.branchAddress.trim() && (
                                   <p className="text-[8px] font-black text-rose-500 uppercase mt-1">Please enter the branch address to proceed with draft generation.</p>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <FileCheck size={16} className="text-indigo-500" /> Title Reference
                           </h3>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ownership Evidence / Title Deed Ref</label>
                              <textarea 
                                 value={modtState.titleDeedRef} 
                                 onChange={(e) => setModtState({...modtState, titleDeedRef: e.target.value})}
                                 rows={3}
                                 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-inner"
                                 placeholder="e.g. Sale Deed Doc No. 123/2024 of SRO Madipakkam"
                              />
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">* Used in recitals of the legal instrument.</p>
                           </div>
                        </div>
                     </section>

                     <div className="pt-10 flex justify-center border-t border-slate-100">
                        <button 
                         onClick={generateDraft}
                         disabled={isGenerating || modtState.mortgagors.length === 0 || !modtState.branchAddress.trim()}
                         className="px-20 py-5 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group overflow-hidden relative disabled:opacity-50"
                        >
                          <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-[90%] transition-transform duration-500 opacity-20"></div>
                          {isGenerating ? <Loader2 size={24} className="animate-spin text-emerald-400" /> : <Scale size={24} className="text-yellow-400" />}
                          {isGenerating ? 'Drafting Legal Instrument...' : `Generate ${modtState.deedType === 'Simple' ? 'Simple Mortgage' : 'MODT Gen'} Draft`}
                        </button>
                     </div>
                  </div>
               </>
            )}
        </div>
      </div>
    </div>
  );
};