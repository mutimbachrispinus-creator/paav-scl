'use client';

import React, { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Search, ShoppingCart, Wallet, FileText, Loader2, X, Tag } from 'lucide-react';
import { searchSuppliers, getVoteheads, recordExpenditure } from '@/lib/actions/ledger';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const ExpensePDF = dynamic(
  () => import('./ExpensePDF').then((mod) => mod.ExpensePDF),
  { ssr: false }
);

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ExpenseVoucher({ schoolName = 'Nexed Portal' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suppliersList, setSuppliersList] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [voteheads, setVoteheads] = useState([]);
  const [selectedVotehead, setSelectedVotehead] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [desc, setDesc] = useState('');
  const [isPending, startTransition] = useTransition();
  const [voucherData, setVoucherData] = useState(null);

  // Hotkey CMD+J for Expenses
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch Voteheads
  useEffect(() => {
    if (isOpen) {
      getVoteheads().then(setVoteheads);
    }
  }, [isOpen]);

  // Supplier Search
  useEffect(() => {
    if (query.length < 2) {
      setSuppliersList([]);
      return;
    }
    const delay = setTimeout(async () => {
      const res = await searchSuppliers(query);
      setSuppliersList(res);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVotehead || !amount) return;

    startTransition(async () => {
      const res = await recordExpenditure({
        supplierId: selectedSupplier?.id || null,
        voteheadId: selectedVotehead.id,
        amount: parseFloat(amount),
        method,
        description: desc || `Expenditure for ${selectedVotehead.name}`,
        tenantId: 'paav-gitombo' // Mock tenant for now
      });

      if (res.success) {
        setVoucherData({
          schoolName,
          supplierName: selectedSupplier?.name || 'General Payee',
          voteheadName: selectedVotehead.name,
          amount: amount,
          method: method,
          reference: res.transaction.reference,
          description: desc || `Payment for ${selectedVotehead.name}`
        });
        setAmount('');
        setDesc('');
      } else {
        alert('Error: ' + res.error);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Expenditure Voucher</h2>
              <p className="text-xs text-slate-400 font-medium">Record institutional spending and payouts</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left Column: Source & Payee */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={14} /> Select Votehead
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                {voteheads.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVotehead(v)}
                    className={cn(
                      "text-left p-3 rounded-xl border-2 transition-all font-bold text-sm",
                      selectedVotehead?.id === v.id ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-600"
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Search size={14} /> Payee / Supplier (Optional)
              </label>
              <div className="relative">
                <input 
                  placeholder="Search supplier..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-slate-900 focus:ring-0 transition-all outline-none text-slate-900 text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {suppliersList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-[150px] overflow-y-auto">
                    {suppliersList.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => { setSelectedSupplier(s); setQuery(''); setSuppliersList([]); }}
                        className="w-full text-left p-3 hover:bg-slate-50 text-sm font-bold border-b border-slate-50 last:border-0"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSupplier && (
                <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl">
                  <span className="text-sm font-bold">{selectedSupplier.name}</span>
                  <button onClick={() => setSelectedSupplier(null)}><X size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Amount & Method */}
          <div className={cn("space-y-6 transition-opacity", !selectedVotehead && "opacity-30 pointer-events-none")}>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount to Pay</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">KES</span>
                <input 
                  type="number" 
                  required
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-4 bg-slate-900 text-white border-none rounded-xl focus:ring-4 focus:ring-slate-100 transition-all outline-none text-2xl font-black"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all",
                    method === 'cash' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-100"
                  )}
                >
                  <Wallet size={16} /> Cash
                </button>
                <button 
                  type="button"
                  onClick={() => setMethod('bank_transfer')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all",
                    method === 'bank_transfer' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-100"
                  )}
                >
                  <FileText size={16} /> Bank
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Purpose</label>
              <textarea 
                rows={2}
                placeholder="Briefly describe the expenditure..."
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-slate-900 focus:ring-0 transition-all outline-none text-slate-900 text-sm resize-none"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {voucherData ? (
              <PDFDownloadLink 
                document={<ExpensePDF data={voucherData} />} 
                fileName={`Voucher_${voucherData.reference}.pdf`}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl font-black transition-all shadow-xl hover:scale-[1.02] active:scale-95"
              >
                {({ loading }) => (loading ? <Loader2 className="animate-spin" /> : <>🖨️ Download Voucher</>)}
              </PDFDownloadLink>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isPending || !selectedVotehead || !amount}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-xl font-black transition-all shadow-xl"
              >
                {isPending ? <Loader2 className="animate-spin" /> : "Record Expenditure"}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 text-center text-[10px] text-slate-400 uppercase tracking-widest font-black border-t border-slate-100">
          Press ESC to close · Institutional Ledger Core
        </div>
      </div>
    </div>
  );
}
