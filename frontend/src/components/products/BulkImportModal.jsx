import React, { useState, useRef, useMemo } from 'react';
import { productService } from '../../services/productService';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Download,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  RefreshCw,
  Info
} from 'lucide-react';

const SAMPLE_CSV = `product_name,sku,category,cost_price,target_price,preferred_minimum,absolute_lower_limit,quantity
iPhone 15,IPH001,Apple,52000,59999,57000,55000,8
iPhone 15 Pro,IPH002,Apple,78000,89999,85000,82000,5
iPhone 16,IPH003,Apple,61000,69999,67000,64000,7
iPhone 16 Pro,IPH004,Apple,82000,94999,90000,86000,4
Samsung Galaxy S24,SAM005,Samsung,58000,69999,66000,62000,9
Samsung Galaxy S24 Ultra,SAM006,Samsung,88000,109999,102000,95000,4
Samsung Galaxy A55,SAM007,Samsung,29000,34999,33000,31000,12
OnePlus 12,OP008,OnePlus,52000,64999,61000,57000,6
OnePlus Nord 4,OP009,OnePlus,26000,32999,31000,28500,10
Google Pixel 9,PIX010,Google,56000,69999,65000,60000,5
Google Pixel 9 Pro,PIX011,Google,72000,89999,84000,78000,3
Xiaomi 14,XIA012,Xiaomi,42000,49999,47000,44500,8
Redmi Note 14 Pro,RED013,Xiaomi,22000,27999,26000,24000,15
Vivo V40,VIV014,Vivo,28000,34999,33000,30500,11
Vivo X100,VIV015,Vivo,48000,59999,56000,52000,6
Oppo Reno 12,OPP016,Oppo,30000,37999,35000,32500,9
Oppo Find X8,OPP017,Oppo,55000,69999,65000,60000,4
Realme GT 6,REL018,Realme,33000,41999,39000,36000,10
Realme 13 Pro+,REL019,Realme,27000,34999,32500,30000,12
Nothing Phone (2a),NOT020,Nothing,21000,27999,26000,23500,14
Nothing Phone (3),NOT021,Nothing,38000,44999,42500,40000,6
Motorola Edge 50 Pro,MOT022,Motorola,31000,39999,37000,34000,8
Motorola Razr 50,MOT023,Motorola,52000,64999,61000,57000,3
Samsung Galaxy M35,SAM024,Samsung,16000,20999,19500,18000,18
Redmi 13 5G,RED025,Xiaomi,12000,15999,15000,13500,20
Poco X6 Pro,POC026,Poco,22000,29999,28000,25000,13
iQOO Neo 9 Pro,IQO027,iQOO,34000,42999,40000,37000,7
Vivo T3 Pro,VIV028,Vivo,24000,29999,28000,26000,10
Oppo A3 Pro,OPP029,Oppo,23000,29999,28000,25500,12
Realme P3 Pro,REL030,Realme,19000,24999,23500,21500,16`;

export const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'upload'
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'valid' | 'invalid'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // Parse CSV string into headers and rows
  const parseCSV = (text) => {
    if (!text || !text.trim()) return [];

    const lines = text.trim().split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Helper to parse line respecting quotes
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === '\t') && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, '_'));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || values.every(v => v === '')) continue;

      const rowObj = { _rowIndex: i };
      rawHeaders.forEach((header, index) => {
        rowObj[header] = values[index] !== undefined ? values[index] : '';
      });
      rows.push(rowObj);
    }

    return rows;
  };

  // Validate and normalize product rows
  const parsedProducts = useMemo(() => {
    const rawRows = parseCSV(csvContent);

    return rawRows.map((row, idx) => {
      // Find field values with flexible aliases
      const name = row.product_name || row.name || row.title || row.product || '';
      const sku = (row.sku || row.code || `SKU-${idx + 1}`).toUpperCase().trim();
      const category = row.category || 'Consumer Electronics';
      const rawCost = row.cost_price || row.costprice || row.cost || '';
      const rawTarget = row.target_price || row.targetprice || row.target || row.selling_price || '';
      const rawPreferred = row.preferred_minimum || row.preferred_min_price || row.preferredminprice || row.preferred_min || row.pref_min || '';
      const rawLower = row.absolute_lower_limit || row.absolutelowerlimit || row.floor_price || row.floor || '';
      const rawStock = row.quantity || row.stock || row.qty || '10';

      const costPrice = parseFloat(rawCost);
      const targetPrice = parseFloat(rawTarget);
      const preferredMinPrice = parseFloat(rawPreferred);
      const absoluteLowerLimit = parseFloat(rawLower);
      const quantity = parseInt(rawStock, 10);

      const errors = [];

      if (!name.trim()) {
        errors.push("Missing product title");
      }
      if (isNaN(costPrice) || costPrice <= 0) {
        errors.push("Cost price must be > 0");
      }
      if (isNaN(absoluteLowerLimit) || absoluteLowerLimit <= costPrice) {
        errors.push(`Floor (₹${isNaN(absoluteLowerLimit) ? '—' : absoluteLowerLimit}) must be > Cost (₹${isNaN(costPrice) ? '—' : costPrice})`);
      }
      if (isNaN(preferredMinPrice) || preferredMinPrice < absoluteLowerLimit) {
        errors.push(`Pref. Min (₹${isNaN(preferredMinPrice) ? '—' : preferredMinPrice}) must be ≥ Floor (₹${isNaN(absoluteLowerLimit) ? '—' : absoluteLowerLimit})`);
      }
      if (isNaN(targetPrice) || targetPrice < preferredMinPrice) {
        errors.push(`Target (₹${isNaN(targetPrice) ? '—' : targetPrice}) must be ≥ Pref. Min (₹${isNaN(preferredMinPrice) ? '—' : preferredMinPrice})`);
      }

      const isValid = errors.length === 0;
      const margin = isValid && targetPrice > 0 ? (((targetPrice - costPrice) / targetPrice) * 100).toFixed(1) : null;

      return {
        _rowIndex: row._rowIndex,
        name,
        sku,
        category,
        costPrice,
        absoluteLowerLimit,
        preferredMinPrice,
        targetPrice,
        stock: isNaN(quantity) ? 0 : quantity,
        margin,
        isValid,
        errors
      };
    });
  }, [csvContent]);

  // Summary counts
  const validProducts = parsedProducts.filter(p => p.isValid);
  const invalidProducts = parsedProducts.filter(p => !p.isValid);
  const totalStock = validProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

  const displayedProducts = useMemo(() => {
    if (filterMode === 'valid') return validProducts;
    if (filterMode === 'invalid') return invalidProducts;
    return parsedProducts;
  }, [filterMode, parsedProducts, validProducts, invalidProducts]);

  // Handle file selection
  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setCsvContent(content);
      setActiveTab('paste'); // Switch to preview tab
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV);
    setFileName('sample_30_smartphones.csv');
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    const template = `product_name,sku,category,cost_price,target_price,preferred_minimum,absolute_lower_limit,quantity\niPhone 15,IPH001,Apple,52000,59999,57000,55000,8\nSamsung Galaxy S24,SAM005,Samsung,58000,69999,66000,62000,9\nOnePlus 12,OP008,OnePlus,52000,64999,61000,57000,6`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ai_crm_product_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (validProducts.length === 0) return;

    try {
      setIsSubmitting(true);
      setImportResult(null);

      const payload = validProducts.map(p => ({
        product_name: p.name,
        sku: p.sku,
        category: p.category,
        cost_price: p.costPrice,
        target_price: p.targetPrice,
        preferred_minimum: p.preferredMinPrice,
        absolute_lower_limit: p.absoluteLowerLimit,
        quantity: p.stock
      }));

      const res = await productService.bulkImport(payload);
      setImportResult({
        success: true,
        message: res.message || `Successfully imported ${validProducts.length} products to Cloud Firestore.`,
        createdCount: res.data?.createdCount ?? validProducts.length,
        updatedCount: res.data?.updatedCount ?? 0,
        skippedCount: res.data?.errorCount ?? 0
      });

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: err.message || 'Bulk import failed. Please check your data and retry.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl glass-panel bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Bulk Import Products via CSV
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
                  Retail & Wholesale
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload or paste multi-product batches with live pricing ladder guardrail verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
              title="Download empty CSV template with standard headers"
            >
              <Download className="w-3.5 h-3.5 text-brand-400" />
              Template
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Raw CSV Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File (.csv)
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              1-Click Load 30 Smartphones (Provided Dataset)
            </button>
          </div>

          {/* Input Area based on tab */}
          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Click to browse or drag and drop your CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports <span className="font-mono text-slate-300">.csv</span> or comma/tab-delimited <span className="font-mono text-slate-300">.txt</span> up to 5MB
              </p>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-brand-300 border border-slate-700">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {fileName}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-medium text-slate-300 flex items-center gap-1.5">
                  <span>Raw CSV Content</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (product_name, sku, category, cost_price, target_price, preferred_minimum, absolute_lower_limit, quantity)
                  </span>
                </label>
                {csvContent && (
                  <button
                    onClick={() => { setCsvContent(''); setFileName(''); setImportResult(null); }}
                    className="text-slate-400 hover:text-rose-400 text-[11px] transition-colors"
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setImportResult(null);
                }}
                placeholder="product_name,sku,category,cost_price,target_price,preferred_minimum,absolute_lower_limit,quantity&#10;iPhone 15,IPH001,Apple,52000,59999,57000,55000,8"
                className="w-full p-3 font-mono text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 resize-y"
              />
            </div>
          )}

          {/* Results Notification */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                importResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold">{importResult.message}</div>
                {importResult.success && (
                  <div className="mt-1 text-[11px] text-emerald-400/90 flex gap-4">
                    <span>Created: <strong>{importResult.createdCount}</strong></span>
                    <span>Updated: <strong>{importResult.updatedCount}</strong></span>
                    <span>Skipped: <strong>{importResult.skippedCount}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parsed Preview Table & Mathematical Ladder Verification */}
          {parsedProducts.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Total Rows:</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-800 text-slate-200">
                      {parsedProducts.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Valid:</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {validProducts.length}
                    </span>
                  </div>
                  {invalidProducts.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Invalid:</span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        {invalidProducts.length}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Total Stock:</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {totalStock} units
                    </span>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 text-[11px] bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({parsedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('valid')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'valid' ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Valid ({validProducts.length})
                  </button>
                  {invalidProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('invalid')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        filterMode === 'invalid' ? 'bg-rose-950/80 text-rose-300 font-semibold border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Invalid ({invalidProducts.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 sticky top-0 border-b border-slate-800 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Product Name</th>
                      <th className="py-2.5 px-3 font-semibold">SKU</th>
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Cost</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Abs. Floor</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Pref. Min</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Target</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Margin</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
                    {displayedProducts.map((p, index) => (
                      <tr
                        key={p.sku || index}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !p.isValid ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          {p.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-sans text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid
                            </span>
                          ) : (
                            <div className="group relative inline-block">
                              <span className="inline-flex items-center gap-1 text-rose-400 font-sans text-[10px] cursor-help">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Error
                              </span>
                              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-20 w-48 p-2 rounded-lg bg-rose-950 text-rose-200 text-[10px] border border-rose-800 shadow-xl font-sans">
                                {p.errors.join(' • ')}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-100 max-w-[180px] truncate">
                          {p.name}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {p.sku}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400">
                          {p.category}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          ₹{isNaN(p.costPrice) ? '—' : p.costPrice.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-400">
                          ₹{isNaN(p.absoluteLowerLimit) ? '—' : p.absoluteLowerLimit.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-300">
                          ₹{isNaN(p.preferredMinPrice) ? '—' : p.preferredMinPrice.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                          ₹{isNaN(p.targetPrice) ? '—' : p.targetPrice.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {p.margin ? (
                            <span className="text-emerald-400 font-bold">+{p.margin}%</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-200">
                          {p.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Guardrails Reminder Badge */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                <span>
                  <strong>Guardrails enforced:</strong> Cost &lt; Floor ≤ Preferred Min ≤ Target Selling Price. Deals during AI WhatsApp negotiation can never breach the absolute floor.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs text-slate-400">
            {parsedProducts.length > 0 && (
              <span>
                Ready to commit: <strong className="text-emerald-400">{validProducts.length}</strong> of {parsedProducts.length} products
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validProducts.length === 0 || isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing to Cloud Firestore...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Import {validProducts.length} Products into Catalog
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BulkImportModal;
