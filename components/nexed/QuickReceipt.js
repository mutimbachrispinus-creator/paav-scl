'use client';

import React, { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Search, CreditCard, Banknote, FileText, Loader2, X } from 'lucide-react';
import { searchStudents, recordManualPayment } from '@/lib/actions/ledger';
import { initiateSTKPush } from '@/lib/actions/daraja';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const ReceiptPDF = dynamic(
  () => import('./ReceiptPDF').then((mod) => mod.ReceiptPDF),
  { ssr: false }
);

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function QuickReceipt({ schoolName = 'Nexed Portal' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [desc, setDesc] = useState('');
  const [isPending, startTransition] = useTransition();
  const [receiptData, setReceiptData] = useState(null);

  // CMD+K Listener
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search Logic
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      const res = await searchStudents(query);
      setResults(res);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSTKPush = async () => {
    if (!selectedStudent || !amount) return;
    
    startTransition(async () => {
      const res = await initiateSTKPush({
        phoneNumber: selectedStudent.phone || '',
        amount: parseFloat(amount),
        accountReference: selectedStudent.adm,
        transactionDesc: desc || `Fees for ${selectedStudent.name}`
      });

      if (res.success) {
        alert('STK Push Sent! Please check the parent\'s phone.');
      } else {
        alert('STK Push Error: ' + res.error);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !amount) return;

    startTransition(async () => {
      const res = await recordManualPayment({
        studentId: selectedStudent.id,
        amount: parseFloat(amount),
        method,
        description: desc || `Payment for ${selectedStudent.name}`,
        tenantId: selectedStudent.tenantId
      });

      if (res.success) {
        setReceiptData({
          schoolName,
          studentName: selectedStudent.name,
          adm: selectedStudent.adm,
          amount: amount,
          method: method,
          reference: res.transaction.reference,
          description: desc,
          newBalance: res.newBalance
        });
        // Reset form but keep receipt available
        setAmount('');
        setDesc('');
      } else {
        alert('Error: ' + res.error);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-bottom border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-maroon-600 rounded-lg text-white">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quick Receipt</h2>
              <p className="text-sm text-slate-500">Record a manual payment instantly</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Search & Select */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                autoFocus
                placeholder="Search student (Name or ADM)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-maroon-500 transition-all outline-none text-slate-900"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setQuery(''); setResults([]); }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all border border-transparent",
                    selectedStudent?.id === s.id ? "bg-maroon-50 border-maroon-200" : "hover:bg-slate-50 hover:border-slate-200"
                  )}
                >
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ADM: {s.adm}</div>
                </button>
              ))}
              {query.length >= 2 && results.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-sm">No students found</div>
              )}
            </div>
          </div>

          {/* Right Column: Payment Form */}
          <div className={cn("space-y-6 transition-opacity", !selectedStudent && "opacity-30 pointer-events-none")}>
            {selectedStudent && (
              <div className="p-4 bg-maroon-50 rounded-xl border border-maroon-100">
                <div className="text-xs text-maroon-600 font-bold uppercase tracking-widest mb-1">Paying For</div>
                <div className="font-bold text-maroon-900">{selectedStudent.name}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount (KES)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">KES</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-maroon-500 focus:ring-0 transition-all outline-none text-xl font-black text-slate-900"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button 
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm",
                    method === 'cash' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <Banknote size={16} /> Cash
                </button>
                <button 
                  type="button"
                  onClick={() => setMethod('cheque')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm",
                    method === 'cheque' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <CreditCard size={16} /> Cheque
                </button>
                <button 
                  type="button"
                  onClick={() => setMethod('mpesa')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm",
                    method === 'mpesa' ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <span className="font-black">M</span> M-Pesa
                </button>
              </div>

              {method === 'mpesa' && (
                <button
                  type="button"
                  onClick={handleSTKPush}
                  disabled={isPending || !selectedStudent?.phone}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <>📲 Send STK Push to {selectedStudent?.phone || 'Parent'}</>}
                </button>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description (Optional)</label>
                <input 
                  placeholder="e.g. Term 1 Balance"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-maroon-500 focus:ring-0 transition-all outline-none text-slate-900"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              {receiptData ? (
                <PDFDownloadLink 
                  document={<ReceiptPDF data={receiptData} />} 
                  fileName={`Receipt_${receiptData.reference}.pdf`}
                  className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-green-200 animate-bounce"
                >
                  {({ loading }) => (loading ? <Loader2 className="animate-spin" /> : <>🖨️ Download Receipt</>)}
                </PDFDownloadLink>
              ) : (
                <button 
                  type="submit" 
                  disabled={isPending || !selectedStudent || !amount}
                  className="w-full flex items-center justify-center gap-3 bg-maroon-600 hover:bg-maroon-700 disabled:opacity-50 disabled:hover:bg-maroon-600 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-maroon-200"
                >
                  {isPending ? <Loader2 className="animate-spin" /> : "Confirm Payment"}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Press ESC to close · Powered by Nexed Financial Core
        </div>
      </div>
      <style jsx>{`
        .bg-maroon-600 { background-color: #8B1A1A; }
        .bg-maroon-50 { background-color: #FFF5F5; }
        .text-maroon-600 { color: #8B1A1A; }
        .text-maroon-900 { color: #5B1111; }
        .border-maroon-100 { border-color: #FED7D7; }
        .border-maroon-200 { border-color: #FEB2B2; }
        .focus\\:ring-maroon-500:focus { --tw-ring-color: #8B1A1A; }
        .focus\\:border-maroon-500:focus { border-color: #8B1A1A; }
        .hover\\:bg-maroon-700:hover { background-color: #6B1414; }
        .shadow-maroon-200 { --tw-shadow-color: #FED7D7; }
      `}</style>
    </div>
  );
}
