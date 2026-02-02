import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  Download,
  CheckCircle2,
  FileSearch,
  Loader2,
  Copy,
  Zap,
  RefreshCw,
  Scale,
  Calendar,
  User,
  AlertOctagon,
  BrainCircuit,
  FileBadge,
  MapPin,
  GitMerge,
  ArrowDown,
  ChevronRight,
  ClipboardList,
  GitCommit,
  Info,
  Compass,
  Search,
  X,
  FileJson,
  Type as TypeIcon,
  Maximize2,
  Split,
  Eye,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Link2Off,
  Minus,
  MessageSquare,
  Link as LinkIcon,
  Highlighter,
  AlertTriangle,
  ShieldAlert,
  UploadCloud,
  Layers,
  CornerDownRight,
  PenLine,
  FolderOpen,
  FolderPlus
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generateAIResponse, analyzeImageWithAI } from '../services/geminiService';

interface TitleScrutinyReportBuilderProps {
  onBack: () => void;
  onComplete?: (data: any) => void;
  initialData?: any;
}

const STORAGE_KEY = 'tsr_builder_active_work';

const PREDEFINED_DOC_TYPES = [
  'Sale Deed',
  'Parent Deed',
  'Gift Deed',
  'Settlement Deed',
  'Release Deed',
  'Partition Deed',
  'Exchange Deed',
  'Mortgage Deed',
  'Patta (Computerized)',
  'Patta (Manual)',
  'Chitta/Adangal',
  'FMB Sketch',
  'Encumbrance Certificate (Online)',
  'Encumbrance Certificate (Manual)',
  'Property Tax Receipt (Current)',
  'Electricity Bill (Current)',
  'Legal Heirship Certificate',
  'Death Certificate',
  'Will / Probate',
  'Approved Building Plan',
  'Planning Permission',
  'Collector NOC',
  'Khata Certificate / Extract',
  'Possession Certificate'
];

const IDENTIFIER_TYPES = [
  'Survey No',
  'Old Survey No',
  'New Survey No',
  'Town Survey No (TS)',
  'Door No',
  'Tax Assessment No',
  'EB Service Connection No',
  'Flat No',
  'Plot No',
  'Milkat No',
  'CTS No',
  'Gat No',
  'Khasra No',
  'Khata No',
  'Patta No',
  'Sheet No'
];

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

interface DocEntry {
  id: string;
  name: string;
  date: string;
  docNo: string;
  executant: string;
  claimant: string;
  original: string;
}

interface TitleFlowItem {
  year: string;
  event: string;
  parties: string;
  docNo?: string;
  date?: string;
  extent?: string;
}

interface PropertyEntry {
  id: number;
  regZone: string;
  regDistrict: string;
  sroName: string;
  villageName: string;
  totalExtent: string;
  extentUnit: string;
  identifiers: { type: string; value: string }[];
  otherLocation: string;
  dimNorth: string;
  dimSouth: string;
  dimEast: string;
  dimWest: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;
  fullScheduleText: string;
  remarks: string;
}

interface AttachedFile {
  name: string;
  type: string;
  base64: string;
  extractedText?: string;
  isOcrLoading?: boolean;
}

interface CriticalAudit {
  hasTitleDeed: boolean;
  hasLatestEC: boolean;
  hasLatestTax: boolean;
  revenueRecordIsRecent: boolean;
}

export const TitleScrutinyReportBuilder: React.FC<TitleScrutinyReportBuilderProps> = ({ onBack, onComplete, initialData }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestingProp, setIsSuggestingProp] = useState<Record<number, boolean>>({});
  const [isSuggestingTimeline, setIsSuggestingTimeline] = useState(false);
  const [isLinkingDocs, setIsLinkingDocs] = useState(false);
  const [isAutoAuditing, setIsAutoAuditing] = useState(false);
  const [showSaveReminder, setShowSaveReminder] = useState(false);
  
  // Scrutiny Cycle States
  const [cyclingIndex, setCyclingIndex] = useState(0);
  const cyclingWords = ['Parsing', 'Triangulating', 'Translating', 'Abstracting', 'Auditing', 'Vetting', 'Synthesizing'];

  // Handle Cycling words for Scrutiny
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setCyclingIndex((prev) => (prev + 1) % cyclingWords.length);
      }, 1000);
    } else {
      cyclingWords;
      setCyclingIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Header Visibility State
  const [showHeader, setShowHeader] = useState(true);

  // File Input Ref for Load Draft
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Validation States
  const [loanAmountError, setLoanAmountError] = useState(false);

  // Missing Docs Prompting banner state
  const [criticalAudit, setCriticalAudit] = useState<CriticalAudit>({
    hasTitleDeed: true,
    hasLatestEC: true,
    hasLatestTax: true,
    revenueRecordIsRecent: true
  });

  const [formData, setFormData] = useState(() => {
    return initialData ? {
      id: initialData.id,
      scrutinyDate: initialData.scrutinyDate || new Date().toISOString().split('T')[0],
      productName: initialData.productName || '',
      customerSalutation: initialData.customerSalutation || '',
      customerName: initialData.customerName || '',
      sameAsCustomer: initialData.sameAsCustomer || false,
      loanAgreementNo: initialData.loanAgreementNo || '',
      branchName: initialData.branchName || '',
      appliedLoanAmt: initialData.appliedLoanAmt || '',
      legalManager: initialData.legalManager || '',
      employeeCode: initialData.employeeCode || '',
      propTaxStatus: initialData.propTaxStatus || '',
      ebConnectionStatus: initialData.ebConnectionStatus || '',
      otherRevenue: initialData.otherRevenue || '',
      tracingTitle: initialData.tracingTitle || '',
      tracingEC: initialData.tracingEC || '',
      tracingRevenue: initialData.tracingRevenue || '',
      tracingPossession: initialData.tracingPossession || '',
      flowOfTitle: Array.isArray(initialData.flowOfTitle) ? initialData.flowOfTitle : [],
      discrepancies: initialData.discrepancies || '', 
      missingLinks: initialData.missingLinks || '',
      aiSummary: initialData.aiSummary || '', 
      clauses: initialData.clauses || '',
      remarks: initialData.remarks || '',
      vetting: initialData.vetting || null,
      modt: initialData.modt || null,
      nameComparison: initialData.nameComparison || {
        titleDeed: '',
        propertyTax: '',
        ebBill: '',
        ec: '',
        others: ''
      }
    } : {
      id: undefined,
      scrutinyDate: new Date().toISOString().split('T')[0],
      productName: '',
      customerSalutation: '',
      customerName: '',
      sameAsCustomer: false,
      loanAgreementNo: '',
      branchName: '',
      appliedLoanAmt: '',
      legalManager: '',
      employeeCode: '',
      propTaxStatus: '',
      ebConnectionStatus: '',
      otherRevenue: '',
      tracingTitle: '',
      tracingEC: '',
      tracingRevenue: '',
      tracingPossession: '',
      flowOfTitle: [] as TitleFlowItem[],
      discrepancies: '', 
      missingLinks: '',
      aiSummary: '', 
      clauses: '',
      remarks: '',
      nameComparison: {
        titleDeed: '',
        propertyTax: '',
        ebBill: '',
        ec: '',
        others: ''
      }
    };
  });

  const [titleHolders, setTitleHolders] = useState(() => {
    return initialData?.titleHolders || [{ id: 1, salutation: '', name: '', father: '' }];
  });

  const [properties, setProperties] = useState<PropertyEntry[]>(() => {
    return initialData?.properties || [{
      id: 1,
      regZone: '', regDistrict: '', sroName: '', villageName: '',
      totalExtent: '', extentUnit: 'Sqft',
      identifiers: [{ type: 'Survey No', value: '' }],
      otherLocation: '',
      dimNorth: '', dimSouth: '', dimEast: '', dimWest: '',
      boundaryNorth: '', boundarySouth: '', boundaryEast: '', boundaryWest: '',
      fullScheduleText: '',
      remarks: ''
    }];
  });
  
  const [docsSubmitted, setDocsSubmitted] = useState<DocEntry[]>(() => {
    return initialData?.docsSubmitted || [];
  });

  const [docsCollect, setDocsCollect] = useState<DocEntry[]>(() => {
    return initialData?.docsCollect || [];
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(() => {
    return initialData?.attachedFiles || [];
  });

  const [selectedOcrFile, setSelectedOcrFile] = useState<AttachedFile | null>(null);
  const [ocrSearchQuery, setOcrSearchQuery] = useState('');

  // Automatic Document Audit useEffect
  useEffect(() => {
    if (attachedFiles.length > 0 && !isAnalyzing && formData.appliedLoanAmt) {
      const debounceTimer = setTimeout(() => {
        runAutomaticDocAudit();
      }, 1500);
      return () => clearTimeout(debounceTimer);
    } else if (attachedFiles.length === 0) {
      setCriticalAudit({ hasTitleDeed: true, hasLatestEC: true, hasLatestTax: true, revenueRecordIsRecent: true });
    }
  }, [attachedFiles.length, formData.appliedLoanAmt]);

  const runAutomaticDocAudit = async () => {
    if (!formData.appliedLoanAmt) return;
    setIsAutoAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fileNames = attachedFiles.map(f => f.name).join(", ");
      const loanAmt = Number(formData.appliedLoanAmt);
      
      const prompt = `Act as a Legal Document Auditor for a Mortgage company. 
      LOAN AMOUNT: ₹${loanAmt.toLocaleString()}
      POLICY: If Loan Amount > 15,00,000 (15 Lakhs), then at least 13 years of Encumbrance Certificates (EC) and Chain documents are MANDATORY. If <= 15 Lakhs, only recent docs are strictly required.
      
      Based strictly on the following list of uploaded file names: [${fileNames}], determine if the following mandatory documents for a property mortgage are present or missing:
      1. Primary Title Deed (Sale Deed, Gift Deed, Settlement Deed, etc.)
      2. Latest Encumbrance Certificate (EC) - Check if 13-year requirement is met if loan > 15L.
      3. Latest Property Tax Receipt (current or last year)
      4. REVENUE RECORDS (Patta, Chitta, Khata, etc.) MUST be issued within the last 30 days. If any revenue records in the list appear older than 1 month based on the filename/date, set 'revenueRecordIsRecent' to false.
      
      Instructions: Return ONLY a valid JSON object. Do not explain.
      JSON Format: { "hasTitleDeed": boolean, "hasLatestEC": boolean, "hasLatestTax": boolean, "revenueRecordIsRecent": boolean }`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const cleanJson = (result.text || "").replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      setCriticalAudit(data);
    } catch (e) {
      console.warn("Auto-audit failed", e);
    } finally {
      setIsAutoAuditing(false);
    }
  };

  // Universal State Sync to LocalStorage (Current Session)
  useEffect(() => {
    const state = {
      formData,
      titleHolders,
      properties,
      docsSubmitted,
      docsCollect,
      attachedFiles,
      lastSaved: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage quota safety
    }
  }, [formData, titleHolders, properties, docsSubmitted, docsCollect, attachedFiles]);

  // Signature Pad Methods
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureImage(canvas.toDataURL());
    setShowSignaturePad(false);
  };

  const addTitleHolder = () => {
    setTitleHolders([...titleHolders, { id: Date.now(), salutation: '', name: '', father: '' }]);
  };

  const addProperty = () => {
    setProperties([...properties, {
      id: Date.now(),
      regZone: '', regDistrict: '', sroName: '', villageName: '',
      totalExtent: '', extentUnit: 'Sqft',
      identifiers: [{ type: 'Survey No', value: '' }],
      otherLocation: '',
      dimNorth: '', dimSouth: '', dimEast: '', dimWest: '',
      boundaryNorth: '', boundarySouth: '', boundaryEast: '', boundaryWest: '',
      fullScheduleText: '',
      remarks: ''
    }]);
  };

  const addIdentifier = (propIdx: number) => {
    const newProps = [...properties];
    newProps[propIdx].identifiers.push({ type: '', value: '' });
    setProperties(newProps);
  };

  const removeIdentifier = (propIdx: number, idIdx: number) => {
    const newProps = [...properties];
    if (newProps[propIdx].identifiers.length > 1) {
      newProps[propIdx].identifiers.splice(idIdx, 1);
      setProperties(newProps);
    }
  };

  const handleSuggestBoundaries = async (idx: number) => {
    const property = properties[idx];
    if (!property.fullScheduleText) {
      alert("Please provide the Verbatim Schedule text first.");
      return;
    }
    
    setIsSuggestingProp(prev => ({ ...prev, [idx]: true }));
    try {
      const prompt = `ROLE: Expert Legal Drafter and Boundary Specialist.
      TASK: Precisely extract Four Boundaries (adjacent properties/roads) AND explicit Linear Measurements (dimensions) for North, South, East, and West from the following legal property description.
      
      Description: "${property.fullScheduleText}"
      
      INSTRUCTIONS:
      1. EXTRACT VERBATIM: Copy the boundary description exactly as written for each direction.
      2. DIMENSIONS: Identify explicit measurement strings (e.g., '40 ft 6 in', '12.5 Meters', '60.0 feet').
      3. FORMAT: Return ONLY a valid JSON object.
      
      JSON Format:
      {
        "north": { "boundary": "Verbatim text", "measurement": "Verbatim measurement" },
        "south": { "boundary": "Verbatim text", "measurement": "Verbatim measurement" },
        "east": { "boundary": "Verbatim text", "measurement": "Verbatim measurement" },
        "west": { "boundary": "Verbatim text", "measurement": "Verbatim measurement" }
      }`;

      const response = await generateAIResponse(prompt, "Expert legal metadata extractor focused on property schedules.");
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        const newProps = [...properties];
        newProps[idx] = {
          ...newProps[idx],
          boundaryNorth: data.north?.boundary || property.boundaryNorth,
          boundarySouth: data.south?.boundary || property.boundarySouth,
          boundaryEast: data.east?.boundary || property.boundaryEast,
          boundaryWest: data.west?.boundary || property.boundaryWest,
          dimNorth: data.north?.measurement || property.dimNorth,
          dimSouth: data.south?.measurement || property.dimSouth,
          dimEast: data.east?.measurement || property.dimEast,
          dimWest: data.west?.measurement || property.dimWest,
        };
        setProperties(newProps);
      }
    } catch (e) {
      console.error(e);
      alert("AI was unable to extract boundaries or linear measurements from the text provided.");
    } finally {
      setIsSuggestingProp(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleSuggestTimeline = async () => {
    if (attachedFiles.length === 0) {
      alert("Please upload documents first.");
      return;
    }

    setIsSuggestingTimeline(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contentsParts: any[] = [];
      attachedFiles.forEach(file => {
        if (file.extractedText) {
          contentsParts.push({ text: `Document ${file.name} OCR Content:\n${file.extractedText}` });
        } else {
          contentsParts.push({ inlineData: { mimeType: file.type, data: file.base64 } });
        }
      });

      const prompt = `ROLE: Senior Title Scrutiny Advocate and Property Chain Expert.
      MISSION: Reconstruct an exhaustive, chronological "Flow of Title" (Timeline) for the subject property by analyzing the provided document context.
      
      REQUIREMENTS:
      1. IDENTIFY ALL OWNERSHIP TRANSFERS: Analyze every legal instrument (Deeds, Court Orders, Certificates).
      2. SURGICAL EXTRACTION FOR EACH STEP:
         - YEAR: Year of execution.
         - DATE: Exact Registration Date (DD-MM-YYYY).
         - EVENT: Precise nature of transfer (e.g. "Absolute Sale", "Gift Deed Settlement", "Partition among heirs", "Release of Rights").
         - PARTIES: Full names of ALL Executants and ALL Claimants. Specify roles (e.g. "Vendor to Vendee", "Settlor to Settlee").
         - DOC NO: Complete document number, book index, year, and SRO details (e.g. 1234/2018 of SRO Tambaram).
         - EXTENT: Total property area/extent mentioned in that specific instrument (e.g. "2400 Sq.ft", "1 Acre 20 Cents").
      3. LOGICAL RECONSTRUCTION: Sequence from the earliest known parent deed down to the present applicant.
      4. AUDIT: Note any breaks or inconsistencies in area/extent between steps.
      
      Return ONLY a JSON array of objects:
      [
        { 
          "year": "YYYY", 
          "date": "DD-MM-YYYY", 
          "event": "[Instrument Type] Recital", 
          "parties": "[Executants] to [Claimants]", 
          "docNo": "[No]/[Year] of SRO [Name]", 
          "extent": "[Area in this deed]" 
        }
      ]`;

      contentsParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", // Complex task requirement
        contents: { parts: contentsParts }
      });

      const cleanJson = (response.text || "").replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (Array.isArray(data)) {
        setFormData(prev => ({ ...prev, flowOfTitle: data }));
      }
    } catch (e) {
      console.error(e);
      alert("AI was unable to reconstruct the timeline automatically. Please ensure deeds are clear.");
    } finally {
      setIsSuggestingTimeline(false);
    }
  };

  const handleSmartLinkDocs = async () => {
    if (attachedFiles.length === 0) {
      alert("Please upload document images or PDFs first to use Smart Link.");
      return;
    }
    
    setIsLinkingDocs(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const filesContext = attachedFiles.map(f => ({ name: f.name, text: f.extractedText?.substring(0, 3000) }));
      
      const prompt = `Analyze these uploaded property document files and extract a list of UNIQUE formal legal documents (Sale Deeds, ECs, Pattas, etc.) to populate the submission tables. 
      IMPORTANT: Ensure NO DUPLICATE entries are returned. If a document with the same nature and document number appears in multiple files, return it only once in the final list.
      Use keywords like 'Deed', 'Encumbrance', 'Patta', 'Tax', and look for Registration Dates and Document Numbers. For each document, determine if it is an 'Original' or 'Photostat copy' based on context or explicit text markings.
      
      Files Data: ${JSON.stringify(filesContext)}
      
      Return ONLY a JSON array of document entries for the 'Submitted Documents' table:
      [{ "name": "Nature of Deed", "date": "YYYY-MM-DD", "docNo": "Number", "executant": "Name", "claimant": "Name", "original": "Original or Photostat copy" }]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const cleanJson = (response.text || "").replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (Array.isArray(data)) {
        // Client-side deduplication against existing list and within the AI response itself
        const existingKeys = new Set(docsSubmitted.map(d => `${(d.name || '').toLowerCase()}|${(d.docNo || '').toLowerCase()}`));
        const uniqueIncoming = [];
        const seenInIncoming = new Set();

        for (const d of data) {
          const key = `${(d.name || '').toLowerCase()}|${(d.docNo || '').toLowerCase()}`;
          if (!existingKeys.has(key) && !seenInIncoming.add(key)) {
            seenInIncoming.add(key);
            uniqueIncoming.push(d);
          }
        }

        const mapped = uniqueIncoming.map(d => ({ 
          id: Math.random().toString(36).substr(2, 9),
          name: d.name || 'Unidentified Document',
          date: d.date || '',
          docNo: d.docNo || '',
          executant: d.executant || '',
          claimant: d.claimant || '',
          original: d.original || 'Photostat copy'
        }));

        if (mapped.length > 0) {
          setDocsSubmitted(prev => [...prev, ...mapped]);
          setDocsCollect(prev => [...prev, ...mapped.map(d => ({ ...d, original: 'Original' }))]);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Smart Link functionality failed to extract metadata.");
    } finally {
      setIsLinkingDocs(false);
    }
  };

  const sortFlowOfTitle = () => {
    if (!Array.isArray(formData.flowOfTitle)) return;
    const sorted = [...formData.flowOfTitle].sort((a, b) => {
      const yearA = parseInt(String(a.year).replace(/\D/g, '')) || 0;
      const yearB = parseInt(String(b.year).replace(/\D/g, '')) || 0;
      return yearA - yearB;
    });
    setFormData(prev => ({ ...prev, flowOfTitle: sorted }));
  };

  const handleSaveProgress = () => {
    setIsSaving(true);
    const fullData = { ...formData, titleHolders, properties, docsSubmitted, docsCollect, attachedFiles };
    
    try {
        if (onComplete) {
            onComplete(fullData);
        }

        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `TSR_Draft_${formData.customerName || 'unnamed'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Save process failed:", e);
        alert("Save failed. The document data might be too large for storage.");
    } finally {
        setTimeout(() => setIsSaving(false), 800);
    }
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        setFormData({
          id: json.id,
          scrutinyDate: json.scrutinyDate || '',
          productName: json.productName || '',
          customerSalutation: json.customerSalutation || '',
          customerName: json.customerName || '',
          sameAsCustomer: json.sameAsCustomer || false,
          loanAgreementNo: json.loanAgreementNo || '',
          branchName: json.branchName || '',
          appliedLoanAmt: json.appliedLoanAmt || '',
          legalManager: json.legalManager || '',
          employeeCode: json.employeeCode || '',
          propTaxStatus: json.propTaxStatus || '',
          ebConnectionStatus: json.ebConnectionStatus || '',
          otherRevenue: json.otherRevenue || '',
          tracingTitle: json.tracingTitle || '',
          tracingEC: json.tracingEC || '',
          tracingRevenue: json.tracingRevenue || '',
          tracingPossession: json.tracingPossession || '',
          flowOfTitle: Array.isArray(json.flowOfTitle) ? json.flowOfTitle : [],
          discrepancies: json.discrepancies || '',
          missingLinks: json.missingLinks || '',
          aiSummary: json.aiSummary || '',
          clauses: json.clauses || '',
          remarks: json.remarks || '',
          vetting: json.vetting || null,
          modt: json.modt || null,
          nameComparison: json.nameComparison || { titleDeed: '', propertyTax: '', ebBill: '', ec: '', others: '' }
        });

        if (json.titleHolders) setTitleHolders(json.titleHolders);
        if (json.properties) setProperties(json.properties);
        if (json.docsSubmitted) setDocsSubmitted(json.docsSubmitted);
        if (json.docsCollect) setDocsCollect(json.docsCollect);
        if (json.attachedFiles) setAttachedFiles(json.attachedFiles);
        
        e.target.value = '';
      } catch (err) {
        alert("Could not load the document. Please ensure it is a valid JSON draft.");
      }
    };
    reader.readAsText(file);
  };

  const updateSubmittedDoc = (index: number, field: keyof DocEntry, value: string) => {
    const updatedDocs = [...docsSubmitted];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    setDocsSubmitted(updatedDocs);

    setDocsCollect(prev => prev.map(cd => {
      if (cd.id === updatedDocs[index].id) {
        return { 
          ...cd, 
          name: updatedDocs[index].name,
          date: updatedDocs[index].date,
          docNo: updatedDocs[index].docNo,
          executant: updatedDocs[index].executant,
          claimant: updatedDocs[index].claimant
        };
      }
      return cd;
    }));
  };

  const updateCollectedDoc = (index: number, field: keyof DocEntry, value: string) => {
    const updatedDocs = [...docsCollect];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    setDocsCollect(updatedDocs);
  };

  const removeSubmittedDoc = (id: string) => {
    setDocsSubmitted(docsSubmitted.filter(d => d.id !== id));
    setDocsCollect(docsCollect.filter(d => d.id !== id));
  };

  const addSubmittedDoc = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newDoc: DocEntry = { id: newId, name: '', date: '', docNo: '', executant: '', claimant: '', original: 'Photostat copy' };
    setDocsSubmitted([...docsSubmitted, newDoc]);
    setDocsCollect([...docsCollect, { ...newDoc, original: 'Original' }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = await Promise.all(Array.from(files).map(async (file: File) => {
      return new Promise<AttachedFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            name: file.name,
            type: file.type || 'image/jpeg',
            base64: (ev.target?.result as string).split(',')[1]
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const performOCRForFile = async (index: number) => {
    const file = attachedFiles[index];
    if (file.extractedText) return; 

    const updatedFiles = [...attachedFiles];
    updatedFiles[index].isOcrLoading = true;
    setAttachedFiles(updatedFiles);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Perform high-accuracy OCR on this document. Transcribe all text content exactly as it appears. 
      Preserve the structure (headings, tables, lists) where possible. 
      Do not add commentary, return only the extracted text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: file.base64 } },
            { text: prompt }
          ]
        }
      });

      const extracted = response.text || "No text could be extracted.";
      const finalFiles = [...attachedFiles];
      finalFiles[index].extractedText = extracted;
      finalFiles[index].isOcrLoading = false;
      setAttachedFiles(finalFiles);
    } catch (error) {
      console.error(error);
      const errorFiles = [...attachedFiles];
      errorFiles[index].isOcrLoading = false;
      setAttachedFiles(errorFiles);
      alert("OCR failed for this file.");
    }
  };

  const analyzeAndAutofill = async () => {
    if (!formData.appliedLoanAmt) {
      setLoanAmountError(true);
      alert("MANDATORY: Please mention the Loan Amount before running Scrutiny. Policy requirements (13-year flow) depend on this value.");
      return;
    }
    
    setLoanAmountError(false);

    if (attachedFiles.length === 0) {
      alert("Please upload documents first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const loanAmt = Number(formData.appliedLoanAmt);
      
      const contentsParts: any[] = [];
      attachedFiles.forEach(file => {
        contentsParts.push({ inlineData: { mimeType: file.type, data: file.base64 } });
        if (file.extractedText) {
          contentsParts.push({ text: `[Reference OCR Text for ${file.name}]: ${file.extractedText}` });
        }
      });

      const prompt = `
      ROLE & OBJECTIVE:
      You are an expert Legal Scrutiny advocate and Property Law Analyst for L&T Finance. Your objective is to scrutinize the uploaded property documents to identify "Breaks in Title," discrepancies, or missing links.

      MISSION: ACCURATE EXHAUSTIVE TRACING NARRATIVE
      - Produce a surgical, chronological legal narrative of the entire ownership chain for the "tracingTitle" field. 
      - Include registration numbers, SRO details, areas, and exact party names. No summaries, only deep legal tracing.

      LOAN AMOUNT: ₹${loanAmt.toLocaleString()}
      POLICY RULE: 
      - If Loan Amount > ₹15,00,000 (15 Lakhs), then at least 13 YEARS OF FLOW DOCUMENTS (chain deeds and ECs) are MANDATORY.
      - If Loan Amount <= ₹15,00,000, 13 years of flow is not strictly required.
      Apply this policy when determining 'missingLinks' and 'discrepancies'.

      IMPORTANT - DRAFT OPINION REQUIREMENT:
      - You must NEVER issue the final legal opinion.
      - Instead, generate a "DRAFT OPINION" for a human lawyer to review in the 'opinion' field.
      - SYNTAX FOR DRAFT OPINION:
        - Wrap text that is based on clear, high-confidence digital data in [G] and [/G] (will appear Green).
        - Wrap text that is based on uncertain handwritten text, blurry scans, or missing pages in [R] and [/R] (will appear Red).
      - Example: "[G]The title flow from 2005 to 2018 is clearly documented via registered Sale Deeds.[/G] [R]However, the release deed dated 1998 contains illegible handwritten endorsements regarding legal heirs.[/R]"

      Return ONLY a JSON object:
      {
          "criticalAudit": { 
              "hasTitleDeed": boolean, 
              "hasLatestEC": boolean, 
              "hasLatestTax": boolean,
              "revenueRecordIsRecent": boolean
          },
          "customer": { "name": "", "salutation": "Mr/Mrs" },
          "titleHolders": [ { "name": "", "salutation": "Mr", "fatherName": "" } ],
          "nameComparison": {
              "titleDeed": "Name in Deed",
              "propertyTax": "Name in Tax",
              "ebBill": "Name in EB",
              "ec": "Name in EC",
              "others": ""
          },
          "properties": [
              {
                  "totalExtent": "", "extentUnit": "Sqft",
                  "regZone": "", "regDistrict": "", "sroName": "", "villageName": "",
                  "identifiers": [{"type": "Survey No/Door No/Milkat No", "value": ""}],
                  "boundaryNorth": "Adjacent property verbatim",
                  "boundarySouth": "Adjacent property verbatim",
                  "boundaryEast": "Adjacent property verbatim",
                  "boundaryWest": "Adjacent property verbatim",
                  "dimNorth": "Verbatim measurement",
                  "dimSouth": "Verbatim measurement",
                  "dimEast": "Verbatim measurement",
                  "dimWest": "Verbatim measurement",
                  "fullScheduleText": "EXACT AND FAITHFUL VERBATIM ENGLISH TRANSLATION OF THE ENTIRE PROPERTY SCHEDULE AS FOUND IN THE DEED.",
                  "otherLocation": ""
              }
          ],
          "documents": [
              { "name": "Nature", "date": "YYYY-MM-DD", "docNo": "123", "executant": "", "claimant": "", "type": "Original or Photostat copy" }
          ],
          "tracings": {
              "tracingEC": "Narrative analysis of EC mapping.",
              "tracingRevenue": "Mutation history tracking.",
              "tracingPossession": "Evidence of occupancy.",
              "tracingTitle": "ACCURATE EXHAUSTIVE ADVOCATE-STYLE LEGAL NARRATIVE OF THE TITLE CHAIN WITH COMPLETE DETAILS AND EVIDENCE CITATIONS.",
              "flowOfTitle": [
                  { "year": "YYYY", "date": "DD-MM-YYYY", "event": "Nature of Deed Recital", "parties": "Executants to Claimants", "docNo": "No/Year of SRO", "extent": "Area detail" }
              ]
          },
          "findings": { 
              "discrepancies": "DETAILED LIST OF MISMATCHES FOUND.",
              "missingLinks": "LIST OF DOCUMENTS REFERENCED BUT NOT UPLOADED.",
              "opinion": "DRAFT OPINION WITH [G] AND [R] HIGHLIGHTS FOR HUMAN REVIEW.",
              "executiveSummary": "Short highlights."
          }
      }`;

      contentsParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: contentsParts }
      });

      const cleanJson = (response.text || "").replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);

      if (data.criticalAudit) {
        setCriticalAudit(data.criticalAudit);
      }

      if (data.customer) {
        setFormData(prev => ({ 
          ...prev, 
          customerName: data.customer.name || prev.customerName,
          customerSalutation: data.customer.salutation || prev.customerSalutation
        }));
      }

      if (data.nameComparison) {
        setFormData(prev => ({
          ...prev,
          nameComparison: data.nameComparison
        }));
      }

      if (data.titleHolders) {
        setTitleHolders(data.titleHolders.map((th: any, i: number) => ({
          id: i + 1,
          salutation: th.salutation || '',
          name: th.name || '',
          father: th.fatherName || ''
        })));
      }

      if (data.properties) {
        setProperties(data.properties.map((p: any, i: number) => ({
          id: i + 1,
          ...p,
          boundaryNorth: p.boundaryNorth || '',
          boundarySouth: p.boundarySouth || '',
          boundaryEast: p.boundaryEast || '',
          boundaryWest: p.boundaryWest || '',
          dimNorth: p.dimNorth || '',
          dimSouth: p.dimSouth || '',
          dimEast: p.dimEast || '',
          dimWest: p.dimWest || '',
          fullScheduleText: p.fullScheduleText || '',
          identifiers: p.identifiers || [{ type: 'Survey No', value: '' }],
          remarks: p.remarks || ''
        })));
      }

      if (data.documents) {
        const mappedDocs: DocEntry[] = data.documents.map((d: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: d.name,
          date: d.date,
          docNo: d.docNo,
          executant: d.executant || '',
          claimant: d.claimant || '',
          original: d.type || 'Photostat copy'
        }));
        setDocsSubmitted(mappedDocs);
        setDocsCollect(mappedDocs.map(d => ({ ...d, original: d.original })));
      }

      if (data.tracings) {
        setFormData(prev => ({
          ...prev,
          tracingTitle: data.tracings.tracingTitle || '',
          tracingEC: data.tracings.tracingEC || '',
          tracingRevenue: data.tracings.tracingRevenue || '',
          tracingPossession: data.tracings.tracingPossession || '',
          flowOfTitle: data.tracings.flowOfTitle || []
        }));
      }

      if (data.findings) {
        setFormData(prev => ({
          ...prev,
          discrepancies: data.findings.discrepancies || '',
          missingLinks: data.findings.missingLinks || '',
          remarks: data.findings.opinion || '',
          aiSummary: data.findings.executiveSummary || ''
        }));
      }

      setAnalysisStatus("Generated via AI Title investigation... Draft Opinion ready for human vetting.");
    } catch (error) {
      console.error(error);
      setAnalysisStatus("❌ Title scrutiny failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateExecutiveSummary = async () => {
    setIsSummarizing(true);
    try {
      const prompt = `Generate a concise legal summary (max 100 words) for a Title Scrutiny Report. 
      Discrepancies: ${formData.discrepancies}
      Missing Links: ${formData.missingLinks}
      Opinion: ${formData.remarks}`;
      const response = await generateAIResponse(prompt, "Lead Legal Auditor.");
      setFormData(prev => ({ ...prev, aiSummary: response }));
    } catch (error) {} finally { setIsSummarizing(false); }
  };

  const handlePdfDownload = () => {
    const element = document.getElementById('reportA4');
    if (!element) return;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `TSR_${formData.customerName || 'Report'}.pdf`,
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
    const content = document.getElementById('reportA4')?.innerHTML;
    if (!content) return;
    
    // Comprehensive Word document header with all visual styles from the preview
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { size: 21.59cm 35.56cm; margin: 1.5cm; mso-page-orientation: portrait; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.1; color: #000; text-align: justify; margin: 0; padding: 0; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
          .report-section { font-weight: bold; text-transform: uppercase; margin-top: 15pt; margin-bottom: 8pt; border-bottom: 1.5pt solid #000; padding-bottom: 2pt; font-size: 13pt; text-align: left; }
          table { border-collapse: collapse; width: 100%; border: 1px solid black; margin-bottom: 10pt; }
          td, th { border: 1px solid black; padding: 4pt; vertical-align: top; }
          th { background-color: #f8fafc; font-weight: bold; }
          .bg-slate-50 { background-color: #f8fafc; }
          .summary-box { border-left: 5pt solid #4f46e5; padding: 10pt; background-color: #f8fafc; margin-top: 15pt; border-radius: 3pt; }
          .verbatim-schedule { background-color: #fafafa; border: 1pt solid #ddd; padding: 8pt; font-style: italic; white-space: pre-wrap; font-size: 9pt; line-height: 1.4; color: #111; margin-top: 5pt; }
          .signature-stamp { border: 1.5pt solid #334155; padding: 6pt; color: #334155; font-size: 9pt; text-align: center; font-weight: 900; width: 130pt; border-radius: 5pt; margin: 8pt 0; display: inline-block; }
          .page-break { page-break-before: always; mso-break-type: section-break; }
          .flow-visual-block { page-break-inside: avoid; border: none; margin-top: 20pt; }
          .flow-table { margin-left: auto; margin-right: auto; width: 300pt; border-collapse: collapse; border: none; }
          .flow-node-table { border: 1.5pt solid black; width: 100%; background-color: #ffffff; margin-bottom: 0; }
          .arrow-td { text-align: center; font-size: 20pt; padding: 5pt 0; font-weight: bold; line-height: 1; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .pl-4 { padding-left: 12pt; }
          .border-l-2 { border-left: 1.5pt solid #e2e8f0; }
          .mb-8 { margin-bottom: 15pt; }
          .mb-10 { margin-bottom: 18pt; }
          .mt-12 { margin-top: 20pt; }
          .text-xs { font-size: 8pt; }
          .text-sm { font-size: 9pt; }
        </style>
      </head>
      <body>`;
      
    // Clean up unnecessary whitespace from the content before creating the blob
    const cleanedContent = (content || '').replace(/>\s+</g, '><').trim();
    const blob = new Blob([header + cleanedContent + "</body></html>"], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TSR_${formData.customerName || 'Draft'}.doc`;
    link.click();
  };

  const generateReport = () => {
    setIsGeneratingReport(true);
    const fullState = {
      ...formData,
      titleHolders,
      properties,
      docsSubmitted,
      docsCollect
    };
    
    try {
        if (onComplete) {
            onComplete(fullState);
        }
        setTimeout(() => { 
            setShowOutput(true); 
            setIsGeneratingReport(false); 
        }, 1200);
    } catch (e) {
        setIsGeneratingReport(false);
        alert("Generating report failed.");
    }
  };

  const highlightMatches = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm">{part}</mark> 
            : part
        )}
      </>
    );
  };

  // Helper to render color-coded Draft Opinion with confidence highlighting
  const renderDraftOpinion = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[G\].*?\[\/G\]|\[R\].*?\[\/R\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[G]')) {
        return (
          <span key={i} className="text-emerald-700 bg-emerald-50 px-1 rounded-sm border border-emerald-100/50">
            {part.replace(/\[\/?G\]/g, '')}
          </span>
        );
      }
      if (part.startsWith('[R]')) {
        return (
          <span key={i} className="text-rose-700 bg-rose-50 px-1 rounded-sm border border-rose-200 font-bold">
            {part.replace(/\[\/?R\]/g, '')}
          </span>
        );
      }
      return part;
    });
  };

  const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 50 && showHeader) {
      setShowHeader(false);
    } else if (scrollTop <= 50 && !showHeader) {
      setShowHeader(true);
    }
  };

  if (showOutput) {
    const allHoldersNames = titleHolders.map(th => th.name ? `${th.salutation} ${th.name}` : '').filter(Boolean).join(' & ');

    // Filter out highlighting tags for the final clean preview
    const cleanOpinionText = (formData.remarks || '').replace(/\[\/?G\]|\[\/?R\]/g, '');

    return (
      <div className="h-full flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-500">
        <div className="max-w-4xl w-full mx-auto flex justify-between items-center p-6 shrink-0 print:hidden">
          <button onClick={() => setShowOutput(false)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Back to Editor
          </button>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowSignaturePad(true)} 
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-emerald-700 transition-all"
            >
              <PenLine size={18} /> Sign Document
            </button>
            <button onClick={handlePdfDownload} className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-slate-800 transition-all">
              <Printer size={18} /> Print / PDF
            </button>
            <button onClick={downloadWord} className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-indigo-700 transition-all">
              <Download size={18} /> Download Word
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-slate-200/50">
          <div id="reportA4" className="bg-white p-12 shadow-2xl mx-auto w-[210mm] text-slate-900 font-serif leading-relaxed text-justify text-sm mb-20 relative">
            <style>{`
              @media print { 
                body { background: white !important; margin: 0; padding: 0; } 
                .print-hidden { display: none !important; } 
                #reportA4 { box-shadow: none !important; width: 100%; padding: 0; margin: 0; } 
                .page-break { page-break-before: always; }
                .flow-visual-block { page-break-inside: avoid; }
              }
              #reportA4 {
                word-break: break-word;
                overflow-wrap: anywhere;
                box-sizing: border-box;
                width: 100%;
              }
              .report-section { font-weight: bold; text-transform: uppercase; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px; font-size: 14px; }
              .summary-box { border-left: 6px solid #4f46e5; padding: 16px; background: #f8fafc; margin-top: 24px; border-radius: 4px; }
              .verbatim-schedule { background-color: #fafafa; border: 1px solid #ddd; padding: 8pt; font-style: italic; white-space: pre-wrap; font-size: 10px; line-height: 1.6; color: #111; margin-top: 10px; word-break: break-word; }
              .signature-stamp { border: 2px solid #334155; padding: 8px; color: #334155; font-size: 10px; text-align: center; font-weight: 900; width: 140px; transform: rotate(-5deg); border-radius: 6px; margin: 10px 0; display: inline-block; }
              .page-break { page-break-before: always; margin-top: 40px; }
              .flow-visual-block { margin-top: 20px; page-break-inside: avoid; border: none; }
              .flow-table { margin-left: auto; margin-right: auto; width: 320px; border-collapse: collapse; border: none; table-layout: fixed; }
              .flow-node-table { border: 2px solid black; width: 100%; background-color: #ffffff; table-layout: fixed; }
              .arrow-td { text-align: center; font-size: 24px; padding: 10px 0; font-weight: bold; }
              table { table-layout: fixed; width: 100%; word-break: break-word; border-collapse: collapse; }
              td, th { word-wrap: break-word; overflow-wrap: anywhere; padding: 4px; }
              .consistency-check { border: 1px solid black; width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
              .consistency-check td, .consistency-check th { border: 1px solid black; padding: 6px; }
              .consistency-check th { background: #f1f5f9; text-transform: uppercase; text-align: left; }
            `}</style>
            
            <div className="text-center mb-10">
              <h1 className="text-2xl font-black underline uppercase tracking-tight">Title Scrutiny Report</h1>
              <p className="font-bold text-lg mt-1">L&T Finance Limited</p>
            </div>

            <div className="mb-8 space-y-2 text-xs">
              <div className="flex"><span className="w-32 font-bold uppercase">Date:</span> <span>{formData.scrutinyDate}</span></div>
              <div className="flex"><span className="w-32 font-bold uppercase">Sub:</span> <span className="flex-1 text-justify">Detailed Legal Search report and Scrutiny of Title Deeds in respect of the Customer <strong className="uppercase">{allHoldersNames || `${formData.customerSalutation} ${formData.customerName}`}</strong> for property mortgage purposes.</span></div>
              <div className="flex"><span className="w-32 font-bold uppercase">Ref:</span> <span>Loan Agreement No: {formData.loanAgreementNo}</span></div>
              <div className="flex"><span className="w-32 font-bold uppercase">Branch Name:</span> <span>{formData.branchName}</span></div>
              <div className="flex"><span className="w-32 font-bold uppercase">Loan Amount:</span> <span>₹{formData.appliedLoanAmt} ({numberToWords(formData.appliedLoanAmt)})</span></div>
              <div className="flex"><span className="w-32 font-bold uppercase">Title Holder(s):</span> <span className="flex-1">{titleHolders.map((th, i) => <div key={th.id}>{i+1}. {th.salutation} {th.name} {th.father && `S/o ${th.father}`}</div>)}</span></div>
              <div className="flex"><span className="w-32 font-bold uppercase">Legal Manager:</span> <span>{formData.legalManager} {formData.employeeCode && `(EC: ${formData.employeeCode})`}</span></div>
            </div>

            <h3 className="report-section">Part I: Schedule of Property</h3>
            {properties.map((p, i) => (
              <div key={p.id} className="mb-8">
                <table className="w-full border-collapse border border-black text-[11px] mb-4">
                  <tbody>
                    <tr><td className="border border-black p-2 font-bold bg-slate-50" colSpan={2}>Item No {i+1} - Structured Details</td></tr>
                    <tr><td className="border border-black p-2 w-1/3 font-bold">Property Identification</td><td className="border border-black p-2">{p.identifiers.map((id, idx) => (<div key={idx}>{id.type}: {id.value}</div>))}</td></tr>
                    <tr><td className="border border-black p-2 font-bold">Total Extent</td><td className="border border-black p-2">{p.totalExtent} {p.extentUnit}</td></tr>
                    <tr><td className="border border-black p-2 font-bold">Location & Jurisdiction</td><td className="border border-black p-2">Village: {p.villageName}, SRO: {p.sroName}, District: {p.regDistrict}, Zone: {p.regZone}</td></tr>
                  </tbody>
                </table>
                
                <p className="text-[10px] font-bold uppercase mb-2">Boundaries & Linear Measurements (Tabular View):</p>
                <table className="w-full border-collapse border border-black text-[11px] mb-4">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-black p-1 text-left w-1/4">DIRECTION</th>
                      <th className="border border-black p-1 text-left">BOUNDARY (Property Adjacent)</th>
                      <th className="border border-black p-1 text-left w-1/4">MEASUREMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 font-bold">NORTH</td>
                      <td className="border border-black p-2">{p.boundaryNorth}</td>
                      <td className="border border-black p-2">{p.dimNorth}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">SOUTH</td>
                      <td className="border border-black p-2">{p.boundarySouth}</td>
                      <td className="border border-black p-2">{p.dimSouth}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">EAST</td>
                      <td className="border border-black p-2">{p.boundaryEast}</td>
                      <td className="border border-black p-2">{p.dimEast}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">WEST</td>
                      <td className="border border-black p-2">{p.boundaryWest}</td>
                      <td className="border border-black p-2">{p.dimWest}</td>
                    </tr>
                    {p.remarks && (
                      <tr>
                        <td className="border border-black p-2 font-bold">PROPERTY REMARKS</td>
                        <td className="border border-black p-2" colSpan={2}>{p.remarks}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}

            <h3 className="report-section">Part II: Documents Submitted for Title Scrutiny</h3>
            <table className="w-full border-collapse border border-black text-[9px] mb-6">
              <thead className="bg-slate-50">
                <tr><th className="border border-black p-1 w-[40px]">S.No</th><th className="border border-black p-1">Nature</th><th className="border border-black p-1 w-[80px]">Date</th><th className="border border-black p-1 w-[80px]">Doc No</th><th className="border border-black p-1">Parties</th><th className="border border-black p-1 w-[80px]">Type</th></tr>
              </thead>
              <tbody>
                {docsSubmitted.map((d, idx) => (
                  <tr key={d.id}>
                    <td className="border border-black p-1 text-center">{idx+1}</td>
                    <td className="border border-black p-1 font-bold">{d.name}</td>
                    <td className="border border-black p-1 text-center">{d.date}</td>
                    <td className="border border-black p-1 text-center">{d.docNo}</td>
                    <td className="border border-black p-1">{d.executant} / {d.claimant}</td>
                    <td className="border border-black p-1 text-center">{d.original}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="report-section">Part III: Tracings of Title</h3>
            <div className="space-y-6 text-[11px]">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded mb-4">
                 <p className="font-bold text-[10px] uppercase mb-1">Current Title Holder(s):</p>
                 <div className="text-[11px] uppercase">{allHoldersNames || `${formData.customerSalutation} ${formData.customerName}`}</div>
              </div>

              <div className="pl-4 border-l-2 border-slate-200">
                <h4 className="font-bold underline mb-1">A. Tracing of Title (Chain Narrative)</h4>
                <div className="whitespace-pre-wrap">{formData.tracingTitle}</div>
              </div>

              <div className="pl-4 border-l-2 border-slate-200">
                <h4 className="font-bold underline mb-1">B. Tracing on Encumbrance Certificate</h4>
                <div className="whitespace-pre-wrap">{formData.tracingEC}</div>
              </div>

              <div className="pl-4 border-l-2 border-slate-200">
                <h4 className="font-bold underline mb-1">C. Tracing on Revenue Records</h4>
                <div className="whitespace-pre-wrap">{formData.tracingRevenue}</div>
              </div>

              <div className="pl-4 border-l-2 border-slate-200">
                <h4 className="font-bold underline mb-1">D. Tracing on Possession Proof</h4>
                <div className="whitespace-pre-wrap">{formData.tracingPossession}</div>
              </div>
            </div>

            <h3 className="report-section">Part IV: Title Holder Name Consistency Check</h3>
            <table className="consistency-check">
              <thead>
                <tr>
                  <th>Nature of Record</th>
                  <th>Title Holder Name (As per Document)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Primary Title Deed</td><td>{formData.nameComparison.titleDeed || 'NOT PROVIDED'}</td></tr>
                <tr><td>Property Tax Receipt</td><td>{formData.nameComparison.propertyTax || 'NOT PROVIDED'}</td></tr>
                <tr><td>EB Connection Record</td><td>{formData.nameComparison.ebBill || 'NOT PROVIDED'}</td></tr>
                <tr><td>Encumbrance Certificate</td><td>{formData.nameComparison.ec || 'NOT PROVIDED'}</td></tr>
                {formData.nameComparison.others && <tr><td>Other Records</td><td>{formData.nameComparison.others}</td></tr>}
              </tbody>
            </table>

            {formData.aiSummary && (
              <div className="summary-box">
                <div className="text-[12px] font-black uppercase text-indigo-600 mb-2 flex items-center gap-2"><BrainCircuit size={16}/> Summary</div>
                <div className="text-[11px] italic leading-relaxed text-slate-700">{formData.aiSummary}</div>
              </div>
            )}

            <h3 className="report-section">Opinion</h3>
            <div className="text-[11px] leading-relaxed text-justify mb-8">
              <p className="font-bold mb-2">I am of the opinion that,</p>
              <p className="mb-4">
                This Mortgage created by <strong>{allHoldersNames || `${formData.customerSalutation} ${formData.customerName}`}</strong> will bind the property which will be available for realizing any amount due to the Financial Institution under the transaction. The L & T Finance is at liberty to proceed against the property under the Provisions of the law applicable in case of default of the repayment of the loan amount.  
              </p>
              <p className="mb-4">
                For creation of Mortgage by Deposit of title deeds, it is necessary to deposit of following title deeds/ documents along with the sale deed/Possession certificate in the name of the applicant(s) <strong>{allHoldersNames || `${formData.customerSalutation} ${formData.customerName}`}</strong> would create a valid and enforceable mortgage.
              </p>
              
              {cleanOpinionText && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg italic text-slate-700">
                  {cleanOpinionText}
                </div>
              )}

              <table className="w-full border-collapse border border-black text-[9px] mb-6">
                <thead className="bg-slate-50">
                  <tr><th className="border border-black p-1 w-[40px]">S.No</th><th className="border border-black p-1">Nature</th><th className="border border-black p-1 w-[80px]">Date</th><th className="border border-black p-1 w-[80px]">Doc No</th><th className="border border-black p-1">Parties</th><th className="border border-black p-1 w-[80px]">Requirement</th></tr>
                </thead>
                <tbody>
                  {docsCollect.length > 0 ? docsCollect.map((d, idx) => (
                    <tr key={d.id}>
                      <td className="border border-black p-1 text-center">{idx+1}</td>
                      <td className="border border-black p-1 font-bold">{d.name}</td>
                      <td className="border border-black p-1 text-center">{d.date}</td>
                      <td className="border border-black p-1 text-center">{d.docNo}</td>
                      <td className="border border-black p-1">{d.executant} / {d.claimant}</td>
                      <td className="border border-black p-1 text-center font-bold">{d.original}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="border border-black p-4 text-center italic">No additional documents pending collection.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="report-section">Certificate</h3>
            <div className="text-[11px] leading-relaxed text-justify mb-8">
              <p className="mb-4">
                In view of the foregoing, I/We certify that the title deeds intended to be deposited, relating to the property and offered as security by way of Equitable mortgage and the documents of title referred to above are perfect evidence of the title and that if the said Equitable mortgage is created in the manner required by law, it would satisfy the requirements of creation of Equitable mortgage.
              </p>
              <p className="mb-4">
                I/We further certify that <strong>{allHoldersNames || `${formData.customerSalutation} ${formData.customerName}`}</strong> has/would derive a valid, clear, marketable and unencumbered title in the property/ies stated above.
              </p>
              <p>
                The mortgage, if created will be available to L&T Finance Limited for the liability of the intending Borrower(s) <strong>{allHoldersNames || `${formData.customerSalutation} ${formData.customerName}`}</strong> & the property can enforceable under the Provisions of the law applicable if applicable in case of default of the repayment of the loan amount.
              </p>
            </div>

            <div className="mt-12 flex justify-between border-t border-black pt-8 text-[10px]">
              <div className="text-left font-bold"><p>Place: {formData.branchName || '_______'}</p><p>Date: {formData.scrutinyDate}</p></div>
              <div className="text-right">
                <p className="font-bold uppercase mb-2">Prepared & Verified By</p>
                <div className="flex flex-col items-end">
                   {signatureImage ? (
                     <div className="relative inline-block mb-2">
                        <img src={signatureImage} alt="Signature" className="h-14 object-contain mix-blend-multiply" />
                        <div className="signature-stamp absolute -top-2 -right-2 opacity-40 pointer-events-none scale-50 origin-top-right">
                          DIGITALLY SIGNED<br/>
                          {formData.legalManager}<br/>
                          {formData.employeeCode}<br/>
                          L&T One Legal<br/>
                          {new Date().toLocaleDateString()}<br/>
                          VERIFIED-OK
                        </div>
                     </div>
                   ) : (
                     <div className="signature-stamp">
                        DIGITALLY SIGNED<br/>
                        {formData.legalManager}<br/>
                        {formData.employeeCode}<br/>
                        L&T One Legal<br/>
                        {new Date().toLocaleDateString()}<br/>
                        VERIFIED-OK
                     </div>
                   )}
                </div>
                <p className="font-bold underline">{formData.legalManager}</p>
                <p>Legal Manager {formData.employeeCode && `(EC: ${formData.employeeCode})`}, L&T Finance Limited</p>
              </div>
            </div>

            {/* ANNEXURE I: FLOW CHART STYLE - SMALL BOXES */}
            {Array.isArray(formData.flowOfTitle) && formData.flowOfTitle.length > 0 && (
              <div className="page-break flow-visual-block">
                 <div className="text-center mb-6">
                    <h2 className="text-xl font-black underline uppercase tracking-tight">Annexure I: Detailed Visual Representation of Title Chain</h2>
                    <p className="font-bold text-sm mt-1 uppercase text-slate-500 text-center">Sequence of Ownership Transfers</p>
                 </div>
                 
                 <div className="flow-visual-root">
                    <table className="flow-table">
                      <tbody>
                        {formData.flowOfTitle.map((item, idx) => (
                          <React.Fragment key={idx}>
                            <tr>
                              <td style={{ padding: '0' }}>
                                <table className="flow-node-table">
                                  <tbody>
                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                      <td style={{ padding: '6px', borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '10px' }}>
                                        YEAR: {item.year || 'N/A'}
                                      </td>
                                      <td style={{ padding: '6px', borderBottom: '1px solid black', textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>
                                        DATE: {item.date || 'N/A'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={2} style={{ padding: '8px', fontSize: '11px', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', backgroundColor: '#fefce8', wordBreak: 'break-word' }}>
                                        {item.event}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={2} style={{ padding: '4px', fontSize: '9px', textAlign: 'center', color: '#1e40af', fontStyle: 'italic', borderTop: '0.5px solid #eee', wordBreak: 'break-all' }}>
                                        DOC NO: {item.docNo || 'N/A'} | EXTENT: {item.extent || 'N/A'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={2} style={{ padding: '8px', fontSize: '10px', textAlign: 'center', borderTop: '1px solid black', backgroundColor: '#f8fafc', wordBreak: 'break-word' }}>
                                        <strong>PARTIES:</strong> {item.parties}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                            {idx < formData.flowOfTitle.length - 1 && (
                              <tr>
                                <td className="arrow-td">↓</td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                 </div>

                 <div className="mt-8 p-6 border-2 border-dashed border-slate-300 rounded-[2rem] bg-slate-50/50">
                    <p className="text-[11px] text-slate-600 font-bold italic text-center leading-relaxed">
                       This visual representation summarizes the chronological progression of the title. Boxes detail the document specifics and the parties involved in each transfer of the property.
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* OCR Search/View Modal */}
        {selectedOcrFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><TypeIcon size={20}/></div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Extracted Text Content</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{selectedOcrFile.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search text..." 
                      value={ocrSearchQuery}
                      onChange={e => setOcrSearchQuery(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  </div>
                  <button onClick={() => setSelectedOcrFile(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><X size={20}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50 custom-scrollbar">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm font-serif text-sm leading-relaxed whitespace-pre-wrap text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
                  {highlightMatches(selectedOcrFile.extractedText || "No text available.", ocrSearchQuery)}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit size={14} className="text-indigo-500" />
                  OCR text is used to refine AI property discrepancy analysis.
                </p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(selectedOcrFile.extractedText || ""); alert("Copied to clipboard!"); }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2"
                >
                  <Copy size={14} /> Copy All Text
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Pad Modal */}
        {showSignaturePad && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <PenLine size={20} className="text-emerald-400" />
                            <h3 className="font-black uppercase tracking-widest text-sm">Draw Your Signature</h3>
                        </div>
                        <button onClick={() => setShowSignaturePad(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><X size={20}/></button>
                    </div>
                    <div className="p-8">
                        <canvas 
                            ref={canvasRef}
                            width={400}
                            height={200}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchEnd={stopDrawing}
                            className="w-full h-[200px] border-2 border-slate-200 rounded-3xl bg-slate-50 cursor-crosshair touch-none shadow-inner"
                        />
                        <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest">Sign inside the box using your mouse or touch screen</p>
                    </div>
                    <div className="p-6 bg-slate-50 flex justify-between gap-4">
                        <button onClick={clearSignature} className="px-6 py-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100">Clear Pad</button>
                        <button onClick={saveSignature} className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95">Apply Signature</button>
                    </div>
                </div>
            </div>
        )}

        <div id="reportA4" style={{ display: 'none' }}>
          {/* This hidden div is for pdf generation logic if needed elsewhere, 
              but actual preview is in the showOutput block */}
        </div>

        <datalist id="pre-docs">{PREDEFINED_DOC_TYPES.map(t => <option key={t} value={t}/>)}</datalist>
        <datalist id="id-types">{IDENTIFIER_TYPES.map(t => <option key={t} value={t}/>)}</datalist>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 4px; }
        `}</style>
      </div>
    );
  }

  const missingDocsCount = [criticalAudit.hasTitleDeed, criticalAudit.hasLatestEC, criticalAudit.hasLatestTax, criticalAudit.revenueRecordIsRecent].filter(v => v === false).length;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      {/* Hidden File Input for loading JSON draft */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleFileLoad} 
      />

      {/* Header */}
      <div className={`bg-white border-b border-slate-200 px-8 shrink-0 z-20 shadow-sm flex items-center justify-between transition-all duration-500 ease-in-out overflow-hidden ${showHeader ? 'py-6 opacity-100 h-auto' : 'py-0 opacity-0 h-0 border-none pointer-events-none'}`}>
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm text-slate-600 transition-all border border-slate-100">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">TSR Builder</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">L&T Finance Legal Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <FolderOpen size={16} className="text-indigo-600" />
            Load Draft
          </button>
          <button 
            onClick={handleSaveProgress}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : <Save size={16} />}
            {isSaving ? 'Save Progress' : 'Save Progress'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area (Form) */}
        <div onScroll={handleMainScroll} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-10 pb-20">
            
            {/* AI Scrutiny & OCR Section */}
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-l-[16px] border-emerald-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none rotate-12"><Scale size={200}/></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase">AI Expert Scrutiny</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Deep Title Chain reconstruction with exhaustive legal narrative and color-coded draft opinion for review.</p>
                  </div>
                  <button onClick={analyzeAndAutofill} disabled={attachedFiles.length === 0 || isAnalyzing} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-yellow-400" />}
                    Run Title Scrutiny
                  </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                  <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
                    <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center bg-slate-50/50 hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-center flex-1" onClick={() => document.getElementById('ai-files')?.click()}>
                      <input id="ai-files" type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <UploadCloud size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-sm font-black text-slate-600 uppercase">Upload Chain Docs</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Sale Deeds, Patta, EC, FMB Sketch</p>
                    </div>

                    {/* Missing Documents Prompting Banner */}
                    {(missingDocsCount > 0 && !isAnalyzing) && (
                      <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-5 animate-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <ShieldAlert size={18} />
                          </div>
                          <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Critical Documents Missing</h4>
                        </div>
                        <ul className="space-y-2">
                           {!criticalAudit.hasTitleDeed && (
                             <li className="flex items-center gap-2 text-[10px] font-bold text-rose-700 bg-white/60 p-2 rounded-lg border border-rose-100">
                               <AlertTriangle size={12} /> Primary Title Deed Missing
                             </li>
                           )}
                           {!criticalAudit.hasLatestEC && (
                             <li className="flex items-center gap-2 text-[10px] font-bold text-rose-700 bg-white/60 p-2 rounded-lg border border-rose-100">
                               <AlertTriangle size={12} /> Latest EC Not Detected
                             </li>
                           )}
                           {!criticalAudit.hasLatestTax && (
                             <li className="flex items-center gap-2 text-[10px] font-bold text-rose-700 bg-white/60 p-2 rounded-lg border border-rose-100">
                               <AlertTriangle size={12} /> Current Property Tax Missing
                             </li>
                           )}
                           {!criticalAudit.revenueRecordIsRecent && (
                             <li className="flex items-center gap-2 text-[10px] font-black text-rose-800 bg-rose-200 p-2 rounded-lg border border-rose-300 animate-pulse">
                               <AlertTriangle size={12} /> Revenue Record Older than 1 Month
                             </li>
                           )}
                        </ul>
                        <button 
                          onClick={() => document.getElementById('ai-files')?.click()}
                          className="mt-4 w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
                        >
                          <UploadCloud size={14} /> Upload Missing Documents
                        </button>
                        <p className="text-[8px] font-black text-rose-400 uppercase mt-3 tracking-tighter">* {isAutoAuditing ? 'Detecting...' : 'AI analysis suggests these are mandatory for valid mortgage.'}</p>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200 flex flex-col min-h-[250px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> Document Stack & OCR Results</h3>
                        {isAutoAuditing && (
                          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full animate-pulse">
                            <Loader2 size={10} className="animate-spin" />
                            <span className="text-[8px] font-black uppercase">Auto-Auditing...</span>
                          </div>
                        )}
                      </div>
                      {attachedFiles.length > 0 && <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">{attachedFiles.length} Files</span>}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar max-h-[350px] pr-2">
                      {attachedFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs">No files uploaded yet.</div>
                      ) : (
                        attachedFiles.map((f, i) => (
                          <div key={i} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm group hover:border-emerald-300 transition-all cursor-pointer border-slate-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                                <FileText size={20} />
                              </div>
                              <div className="truncate">
                                <p className="text-[11px] font-black text-slate-700 truncate">{f.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {f.extractedText ? (
                                    <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1"><CheckCircle2 size={8}/> OCR Complete</span>
                                  ) : (
                                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">OCR Pending</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!f.extractedText ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); performOCRForFile(i); }} 
                                  disabled={f.isOcrLoading}
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                  title="Extract Text (OCR)"
                                >
                                  {f.isOcrLoading ? <Loader2 size={14} className="animate-spin" /> : <TypeIcon size={14} />}
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedOcrFile(f); }}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                  title="View Extracted Text"
                                >
                                  <FileJson size={14} />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); setAttachedFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
              </div>

              {(isAnalyzing || analysisStatus) && (
                <div className="mt-8 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center bg-emerald-50 text-emerald-700 animate-in slide-in-from-bottom-2">
                  {isAnalyzing ? `🔍 ${cyclingWords[cyclingIndex]} documents and conducting deep Title investigation...` : analysisStatus}
                </div>
              )}
            </div>

            {/* Form Sections */}
            <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-200 space-y-16">
              <section>
                <h2 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm">I</span>
                  Case Intelligence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12}/> Report Date</label>
                    <input type="date" value={formData.scrutinyDate} onChange={e => setFormData({...formData, scrutinyDate: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Name</label>
                    <input type="text" value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} placeholder="e.g. Pune Main" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Manager Name</label>
                    <input 
                      type="text" 
                      value={formData.legalManager} 
                      onChange={e => setFormData({...formData, legalManager: e.target.value})} 
                      placeholder="Enter Full Name"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Code</label>
                    <input 
                      type="text" 
                      value={formData.employeeCode} 
                      onChange={e => setFormData({...formData, employeeCode: e.target.value})} 
                      placeholder="e.g. LT12345"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner" 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                    <div className="flex gap-2">
                      <select value={formData.customerSalutation} onChange={e => setFormData({...formData, customerSalutation: e.target.value})} className="w-28 p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner"><option value=""></option><option value="Thiru">Thiru</option><option value="Mr">Mr</option><option value="Mrs">Mrs</option></select>
                      <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Applicant Name" className="flex-1 p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest font-black">Loan Amount (₹) *Mandatory</label>
                    <input type="number" value={formData.appliedLoanAmt} onChange={e => setFormData({...formData, appliedLoanAmt: e.target.value})} placeholder="₹" className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-xs font-black shadow-inner transition-colors ${(!formData.appliedLoanAmt || loanAmountError) ? 'border-rose-300 bg-rose-50' : 'border-transparent'}`} />
                    {formData.appliedLoanAmt && !isNaN(Number(formData.appliedLoanAmt)) && Number(formData.appliedLoanAmt) > 0 && (
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mt-1 animate-in fade-in slide-in-from-top-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Amount in words</p>
                        <p className="text-[10px] font-bold text-indigo-700 leading-tight uppercase">
                          {numberToWords(formData.appliedLoanAmt)}
                        </p>
                      </div>
                    )}
                    {loanAmountError && <p className="text-[9px] font-black text-rose-600 uppercase mt-1 animate-bounce">Please enter loan amount to proceed with AI scrutiny</p>}
                    {!formData.appliedLoanAmt && !loanAmountError && <p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mt-1">Required to apply Legal Scrutiny Policies (13-year flow) depend on amount</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Agreement No</label>
                    <input type="text" value={formData.loanAgreementNo} onChange={e => setFormData({...formData, loanAgreementNo: e.target.value})} placeholder="" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black shadow-inner" />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Proposed Title Holders</h3>
                  <button onClick={addTitleHolder} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline"><Plus size={14} /> Add Owner</button>
                </div>
                <div className="space-y-3">
                  {titleHolders.map((th, i) => (
                    <div key={th.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in slide-in-from-left-2">
                      <div className="flex gap-2">
                        <select value={th.salutation} onChange={e => { const n = [...titleHolders]; n[i].salutation = e.target.value; setTitleHolders(n); }} className="w-24 p-3 rounded-xl text-[11px] font-black bg-white shadow-sm border-none"><option value=""></option><option value="Mr">Mr</option><option value="Mrs">Mrs</option></select>
                        <input type="text" value={th.name} onChange={e => { const n = [...titleHolders]; n[i].name = e.target.value; setTitleHolders(n); }} placeholder="Name" className="flex-1 p-3 rounded-xl text-[11px] font-black bg-white shadow-sm border-none" />
                      </div>
                      <input type="text" value={th.father} onChange={e => { const n = [...titleHolders]; n[i].father = e.target.value; setTitleHolders(n); }} placeholder="Father / Spouse Name" className="p-3 rounded-xl text-[11px] font-black bg-white shadow-sm border-none" />
                      <div className="flex items-center justify-end">
                        {i > 0 && <button onClick={() => setTitleHolders(titleHolders.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-600"><Trash2 size={18}/></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm">II</span>
                  Schedule of Property
                </h2>
                {properties.map((p, idx) => (
                  <div key={p.id} className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 mb-8 space-y-5 relative group shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Reg. Zone</label>
                        <input value={p.regZone} onChange={e => { const n = [...properties]; n[idx].regZone = e.target.value; setProperties(n); }} className="w-full p-2.5 rounded-xl bg-white border-none text-[11px] font-bold shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">District</label>
                        <input value={p.regDistrict} onChange={e => { const n = [...properties]; n[idx].regDistrict = e.target.value; setProperties(n); }} className="w-full p-2.5 rounded-xl bg-white border-none text-[11px] font-bold shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">SRO Name</label>
                        <input value={p.sroName} onChange={e => { const n = [...properties]; n[idx].sroName = e.target.value; setProperties(n); }} className="w-full p-2.5 rounded-xl bg-white border-none text-[11px] font-bold shadow-sm" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Village</label>
                        <input value={p.villageName} onChange={e => { const n = [...properties]; n[idx].villageName = e.target.value; setProperties(n); }} className="w-full p-2.5 rounded-xl bg-white border-none text-[11px] font-bold shadow-sm" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Property Identification Numbers (Survey / Door / Milkat)</label>
                          <button onClick={() => addIdentifier(idx)} className="text-[8px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline"><Plus size={12}/> Add ID</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {p.identifiers.map((id, idIdx) => (
                            <div key={idIdx} className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100 items-center animate-in fade-in zoom-in-95">
                              <input list="id-types" placeholder="Type" value={id.type} onChange={e => { const n = [...properties]; n[idx].identifiers[idIdx].type = e.target.value; setProperties(n); }} className="w-full p-2 rounded-lg bg-slate-50 border-none text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                              <div className="w-px h-6 bg-slate-200 self-center shrink-0"></div>
                              <input placeholder="Value/Number" value={id.value} onChange={e => { const n = [...properties]; n[idx].identifiers[idIdx].value = e.target.value; setProperties(n); }} className="w-full p-2 rounded-lg bg-slate-50 border-none text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                              {p.identifiers.length > 1 && (
                                <button onClick={() => removeIdentifier(idx, idIdx)} className="p-1.5 text-rose-300 hover:text-rose-500 shrink-0">
                                  <Minus size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total Extent</label>
                        <input value={p.totalExtent} onChange={e => { const n = [...properties]; n[idx].totalExtent = e.target.value; setProperties(n); }} className="w-full p-2.5 rounded-xl bg-white border-none text-[11px] font-bold shadow-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Unit</label>
                        <input value={p.extentUnit} onChange={e => { const n = [...properties]; n[idx].extentUnit = e.target.value; setProperties(n); }} className="w-full p-2.5 rounded-xl bg-white border-none text-[11px] font-bold shadow-sm" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={12} className="text-indigo-500" />
                        Verbatim Schedule (English Translation)
                      </label>
                      <textarea 
                        value={p.fullScheduleText} 
                        onChange={e => { const n = [...properties]; n[idx].fullScheduleText = e.target.value; setProperties(n); }}
                        rows={4}
                        placeholder="Enter full legal property description verbatim from the deed in English..."
                        className="w-full p-4 rounded-[1.5rem] bg-white border border-slate-100 text-[10px] font-medium leading-relaxed italic text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-4 bg-slate-100/50 p-6 rounded-[2.5rem] border border-slate-200">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Compass size={14} className="text-rose-500 animate-pulse" />
                          Four Boundaries & Linear Measurements
                        </label>
                        <button 
                          onClick={() => handleSuggestBoundaries(idx)}
                          disabled={isSuggestingProp[idx] || !p.fullScheduleText}
                          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
                        >
                          {isSuggestingProp[idx] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          Extract Precisely
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {sideLabels.map(side => {
                          const boundaryKey = `boundary${side}` as keyof PropertyEntry;
                          const dimKey = `dim${side}` as keyof PropertyEntry;
                          return (
                            <div key={side} className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-300 transition-all duration-300">
                              <div className="w-24 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                {side}
                              </div>
                              <div className="flex-1 w-full space-y-1.5">
                                <span className="text-[7px] font-black text-slate-300 uppercase pl-1 tracking-tighter">Boundary Description (Verbatim from Deed)</span>
                                <input 
                                  placeholder={`Adjacent property or road on the ${side}`} 
                                  value={p[boundaryKey] as string} 
                                  onChange={e => { const n = [...properties]; (n[idx] as any)[boundaryKey] = e.target.value; setProperties(n); }} 
                                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold outline-none focus:ring-1 focus:ring-rose-500 transition-all" 
                                />
                                <p className="text-[7px] text-slate-400 mt-0.5 ml-1 italic">Mention adjacent property owners, survey numbers, or roads exactly as per the deed.</p>
                              </div>
                              <div className="w-full lg:w-56 space-y-1.5">
                                <span className="text-[7px] font-black text-slate-300 uppercase pl-1 tracking-tighter">Linear Dimension / Measurement</span>
                                <input 
                                  placeholder="e.g. 40 Ft 6 In" 
                                  value={p[dimKey] as string} 
                                  onChange={e => { const n = [...properties]; (n[idx] as any)[dimKey] = e.target.value; setProperties(n); }} 
                                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-black text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" 
                                />
                                <p className="text-[7px] text-slate-400 mt-0.5 ml-1 italic">Use formats like '40 Ft 6 In' or '12.5 Mtrs'. Include units.</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} className="text-slate-400" />
                        Property Remarks
                      </label>
                      <textarea 
                        value={p.remarks} 
                        onChange={e => { const n = [...properties]; n[idx].remarks = e.target.value; setProperties(n); }}
                        rows={2}
                        placeholder="Any specific observations..."
                        className="w-full p-4 rounded-[1.5rem] bg-white border border-slate-100 text-[10px] font-medium outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-inner"
                      />
                    </div>

                    {idx > 0 && <button onClick={() => setProperties(properties.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>}
                  </div>
                ))}
                <button onClick={addProperty} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline"><Plus size={14} /> Add Property Item</button>
              </section>

              <section className="space-y-10">
                <div className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-black text-slate-900 uppercase">Documents Submitted for Title Scrutiny</h2>
                      <div className="h-px bg-slate-100 w-32"></div>
                   </div>
                   <button 
                      onClick={handleSmartLinkDocs}
                      disabled={isLinkingDocs || attachedFiles.length === 0}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50"
                   >
                      {isLinkingDocs ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                      AI Smart Link Docs
                   </button>
                </div>
                <div className="grid grid-cols-12 gap-2 px-6 text-[8px] font-black text-slate-400 uppercase tracking-widest hidden md:grid">
                    <div className="col-span-4">Nature of Document</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Doc No</div>
                    <div className="col-span-3">Executant / Claimant</div>
                </div>
                <div className="space-y-4">
                    {docsSubmitted.map((d, i) => (
                      <div key={d.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4 flex items-center gap-2">
                            <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg shrink-0" title="Document Submitted">
                              <CheckCircle2 size={14} />
                            </div>
                            <input list="pre-docs" value={d.name} onChange={e => updateSubmittedDoc(i, 'name', e.target.value)} placeholder="Sale Deed" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" />
                          </div>
                          <div className="col-span-2"><input value={d.date} onChange={e => updateSubmittedDoc(i, 'date', e.target.value)} placeholder="YYYY-MM-DD" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" /></div>
                          <div className="col-span-2"><input value={d.docNo} onChange={e => updateSubmittedDoc(i, 'docNo', e.target.value)} placeholder="No" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" /></div>
                          <div className="col-span-3"><input value={d.executant} onChange={e => updateSubmittedDoc(i, 'executant', e.target.value)} placeholder="Parties" className="w-full p-3 bg-white rounded-xl text-[10px] font-bold italic border-none" /></div>
                          <div className="col-span-1 flex justify-end"><button onClick={() => removeSubmittedDoc(d.id)} className="text-rose-200 hover:text-rose-500"><Trash2 size={16}/></button></div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addSubmittedDoc} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 flex items-center justify-center gap-2"><Plus size={16}/> Add Document Manually</button>
                </div>
              </section>

              <section className="space-y-10">
                <div className="flex items-center gap-4"><h2 className="text-2xl font-black text-indigo-600 uppercase">Documents to be Collected before Loan disbursement</h2><div className="h-px bg-slate-100 flex-1"></div></div>
                <div className="grid grid-cols-12 gap-2 px-6 text-[8px] font-black text-slate-400 uppercase tracking-widest hidden md:grid">
                    <div className="col-span-2">Nature of Document</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-1">Doc No</div>
                    <div className="col-span-3">Executant</div>
                    <div className="col-span-3">Claimant</div>
                    <div className="col-span-1">Requirement</div>
                </div>
                <div className="space-y-4">
                    {docsCollect.map((d, i) => (
                      <div key={d.id} className="bg-indigo-50/10 p-6 rounded-[2rem] border border-indigo-100 shadow-sm">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-2 flex items-center gap-2">
                            <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg shrink-0" title="Pending Collection">
                              <AlertTriangle size={14} />
                            </div>
                            <input value={d.name} onChange={e => updateCollectedDoc(i, 'name', e.target.value)} placeholder="Title" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" />
                          </div>
                          <div className="col-span-1"><input value={d.date} onChange={e => updateCollectedDoc(i, 'date', e.target.value)} placeholder="Date" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" /></div>
                          <div className="col-span-1"><input value={d.docNo} onChange={e => updateCollectedDoc(i, 'docNo', e.target.value)} placeholder="Doc No" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" /></div>
                          <div className="col-span-3"><input value={d.executant} onChange={e => updateCollectedDoc(i, 'executant', e.target.value)} placeholder="Executant" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" /></div>
                          <div className="col-span-3"><input value={d.claimant} onChange={e => updateCollectedDoc(i, 'claimant', e.target.value)} placeholder="Claimant" className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none" /></div>
                          <div className="col-span-1">
                            <select 
                              value={d.original} 
                              onChange={e => updateCollectedDoc(i, 'original', e.target.value)} 
                              className="w-full p-3 bg-white rounded-xl text-[10px] font-black border-none text-indigo-700 outline-none"
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
                          <div className="col-span-1 flex justify-end"><button onClick={() => setDocsCollect(docsCollect.filter((_, idx) => idx !== i))} className="text-rose-200 hover:text-rose-500"><Trash2 size={16}/></button></div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { const id = Math.random().toString(36).substr(2, 9); setDocsCollect([...docsCollect, { id, name: '', date: '', docNo: '', executant: '', claimant: '', original: 'Original' }]); }} className="w-full py-4 border-2 border-dashed border-indigo-100 rounded-[2rem] text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-50 flex items-center justify-center gap-2"><Plus size={16}/> Add Manual Requirement</button>
                </div>
              </section>

              <section className="space-y-10">
                <h2 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-4"><span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm">III</span>Scrutiny Tracing</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileBadge size={14} className="text-indigo-500" /> Tracing on Encumbrance Certificate</label>
                        </div>
                        <textarea value={formData.tracingEC} onChange={e => setFormData({...formData, tracingEC: e.target.value})} rows={5} className="w-full p-4 bg-slate-50 border-none rounded-[2rem] text-xs font-medium outline-none shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scale size={14} className="text-emerald-500" /> Tracing on Revenue Records</label>
                        </div>
                        <textarea value={formData.tracingRevenue} onChange={e => setFormData({...formData, tracingRevenue: e.target.value})} rows={5} className="w-full p-4 bg-slate-50 border-none rounded-[2rem] text-xs font-medium outline-none shadow-inner" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-amber-500" /> Tracing on Possession Proof</label>
                        </div>
                        <textarea value={formData.tracingPossession} onChange={e => setFormData({...formData, tracingPossession: e.target.value})} rows={5} className="w-full p-4 bg-slate-50 border-none rounded-[2rem] text-xs font-medium outline-none shadow-inner" />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <GitMerge size={14} className="text-indigo-400" /> 
                            Ownership Timeline (Annexure I)
                          </label>
                          <button 
                            onClick={handleSuggestTimeline}
                            disabled={isSuggestingTimeline || attachedFiles.length === 0}
                            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
                          >
                            {isSuggestingTimeline ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Reconstruct Timeline
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {Array.isArray(formData.flowOfTitle) && formData.flowOfTitle.length > 0 ? (
                            formData.flowOfTitle.map((f, idx) => (
                              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative group animate-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                  <div className="md:col-span-1 space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Year / Date</label>
                                    <div className="flex flex-col gap-2">
                                      <input type="text" value={f.year} onChange={e => { const n = [...formData.flowOfTitle]; n[idx].year = e.target.value; setFormData({...formData, flowOfTitle: n}); }} placeholder="Year" className="w-full p-2.5 rounded-xl bg-slate-50 border-none text-[10px] font-black shadow-inner" />
                                      <input type="text" value={f.date} onChange={e => { const n = [...formData.flowOfTitle]; n[idx].date = e.target.value; setFormData({...formData, flowOfTitle: n}); }} placeholder="Date" className="w-full p-2.5 rounded-xl bg-slate-50 border-none text-[10px] font-black shadow-inner" />
                                    </div>
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Event Description</label>
                                    <textarea value={f.event} onChange={e => { const n = [...formData.flowOfTitle]; n[idx].event = e.target.value; setFormData({...formData, flowOfTitle: n}); }} placeholder="Recital of instrument (Sale Deed, Partition, etc)..." className="w-full p-3 rounded-xl bg-slate-50 border-none text-[10px] font-medium leading-relaxed resize-none h-[88px] shadow-inner" />
                                  </div>
                                  <div className="md:col-span-1 space-y-2">
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Doc No / SRO</label>
                                        <input type="text" value={f.docNo} onChange={e => { const n = [...formData.flowOfTitle]; n[idx].docNo = e.target.value; setFormData({...formData, flowOfTitle: n}); }} placeholder="Number" className="w-full p-2.5 rounded-xl bg-slate-50 border-none text-[10px] font-black shadow-inner" />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extent</label>
                                        <input type="text" value={f.extent} onChange={e => { const n = [...formData.flowOfTitle]; n[idx].extent = e.target.value; setFormData({...formData, flowOfTitle: n}); }} placeholder="Area" className="w-full p-2.5 rounded-xl bg-slate-50 border-none text-[10px] font-black shadow-inner" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parties Involved</label>
                                    <textarea value={f.parties} onChange={e => { const n = [...formData.flowOfTitle]; n[idx].parties = e.target.value; setFormData({...formData, flowOfTitle: n}); }} placeholder="Full names of Executants and Claimants with roles..." className="w-full p-3 rounded-xl bg-slate-50 border-none text-[10px] font-medium leading-relaxed resize-none h-[88px] shadow-inner" />
                                  </div>
                                </div>
                                <button onClick={() => setFormData({...formData, flowOfTitle: formData.flowOfTitle.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 text-rose-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-full">
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center text-slate-400 text-xs italic">
                              No timeline entries yet. Use the AI button above to reconstruct the flow from documents.
                            </div>
                          )}
                          
                          <div className="flex justify-center gap-4 mt-4">
                            <button 
                              onClick={() => setFormData({...formData, flowOfTitle: [...(Array.isArray(formData.flowOfTitle) ? formData.flowOfTitle : []), { year: '', event: '', parties: '', docNo: '', date: '', extent: '' }]})} 
                              className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2 shadow-sm"
                            >
                              <Plus size={16}/> Add Manual Step
                            </button>
                            {formData.flowOfTitle?.length > 0 && (
                              <button 
                                onClick={sortFlowOfTitle}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-xl"
                              >
                                <ArrowDown size={16}/> Sort Chronologically
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </section>

              <section className="space-y-10">
                <h2 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-4"><span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm"></span>Summary & Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2"><AlertOctagon size={14} /> Title Scrutiny Discrepancies (Red Letters)</label>
                        </div>
                        <textarea value={formData.discrepancies} onChange={e => setFormData({...formData, discrepancies: e.target.value})} rows={4} className="w-full p-6 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] text-xs font-black text-rose-700 outline-none shadow-inner" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2"><Link2Off size={14} /> Gaps & Missing Links</label>
                        </div>
                        <textarea value={formData.missingLinks} onChange={e => setFormData({...formData, missingLinks: e.target.value})} rows={4} className="w-full p-6 bg-amber-50 border-2 border-amber-100 rounded-[2.5rem] text-xs font-black text-amber-700 outline-none shadow-inner" placeholder="Referenced docs missing in upload..." />
                    </div>
                    
                    {/* CONFIDENCE-HIGHLIGHTED DRAFT OPINION */}
                    <div className="space-y-2 bg-slate-100/50 p-6 rounded-[2.5rem] border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2"><Eye size={14} className="text-indigo-500" /> Draft Opinion (AI Review Mode)</label>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-[8px] font-black uppercase text-emerald-600"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Confident</span>
                            <span className="flex items-center gap-1.5 text-[8px] font-black uppercase text-rose-600"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Uncertain</span>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner min-h-[150px] text-xs font-serif leading-relaxed text-slate-700 select-none">
                           {renderDraftOpinion(formData.remarks) || <p className="italic text-slate-400">Run Title Scrutiny to generate draft opinion...</p>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                           <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Edit Source Content (Human Lawyer Override)</label>
                           <textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-medium outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Use [G] and [R] tags for confidence highlighting..." />
                        </div>
                        <p className="text-[7px] text-slate-400 mt-2 italic">* Highlights are only visible in this builder, not in the final printed TSR report.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">General Tracing Narrative (Accurate & Exhaustive)</label>
                    </div>
                    <textarea value={formData.tracingTitle} onChange={e => setFormData({...formData, tracingTitle: e.target.value})} rows={20} className="w-full p-6 bg-slate-50 border-none rounded-[2.5rem] text-xs font-serif leading-relaxed text-slate-700 outline-none shadow-inner" placeholder="Complete exhaustive legal history details..." />
                  </div>
                </div>

                <div className="mt-12 space-y-6 bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center"><User size={18}/></div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Title Holder Name Consistency Check</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Compare current owner name across documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><FileBadge size={12}/> Title Deed</label>
                      <input type="text" value={formData.nameComparison.titleDeed} onChange={e => setFormData({...formData, nameComparison: {...formData.nameComparison, titleDeed: e.target.value}})} placeholder="As per Deed" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12}/> Property Tax</label>
                      <input type="text" value={formData.nameComparison.propertyTax} onChange={e => setFormData({...formData, nameComparison: {...formData.nameComparison, propertyTax: e.target.value}})} placeholder="As per Tax Receipt" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={12}/> EB Bill</label>
                      <input type="text" value={formData.nameComparison.ebBill} onChange={e => setFormData({...formData, nameComparison: {...formData.nameComparison, ebBill: e.target.value}})} placeholder="As per EB Connection" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><RefreshCw size={12}/> EC Record</label>
                      <input type="text" value={formData.nameComparison.ec} onChange={e => setFormData({...formData, nameComparison: {...formData.nameComparison, ec: e.target.value}})} placeholder="As per EC" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold shadow-sm" />
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-2">
                  <div className="flex items-center justify-between mb-2 px-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2"><BrainCircuit size={16} /> Executive Summary</label>
                      <div className="flex gap-2">
                        <button onClick={generateExecutiveSummary} disabled={isSummarizing} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100">{isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Regenerate AI</button>
                      </div>
                  </div>
                  <textarea value={formData.aiSummary} onChange={e => setFormData({...formData, aiSummary: e.target.value})} rows={3} className="w-full p-6 bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem] text-xs font-medium italic outline-none shadow-inner" />
                </div>
                
                <div className="mt-16 p-10 bg-slate-900 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="relative z-10 text-center md:text-left"><h4 className="text-white font-black text-2xl uppercase tracking-tighter">Finalize report</h4><p className="text-slate-400 text-sm font-medium mt-1">Generate high-impact TSR with detailed ownership timeline.</p></div>
                  <button onClick={() => setShowSaveReminder(true)} disabled={isGeneratingReport} className="relative z-10 bg-yellow-400 text-slate-900 px-16 py-5 rounded-[2rem] font-black text-base uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 transition-all">{isGeneratingReport ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} />} Export TSR</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Save Draft Reminder Modal */}
      {showSaveReminder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-10 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                <FolderPlus size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Final Scrutiny Export</h3>
             <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
               Please ensure you have saved the <strong className="text-indigo-600">Draft</strong> first in the relevant case folder before exporting the final report.
             </p>
             <div className="grid grid-cols-1 w-full gap-4">
                <button 
                   onClick={() => setShowSaveReminder(false)}
                   className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} className="text-indigo-600" />
                  Ok, Lets save it
                </button>
                <button 
                   onClick={() => { setShowSaveReminder(false); generateReport(); }}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Yes, Already saved
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const sideLabels = ['North', 'South', 'East', 'West'];