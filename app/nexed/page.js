'use client';

import QuickReceipt from '@/components/nexed/QuickReceipt';
import ExpenseVoucher from '@/components/nexed/ExpenseVoucher';
import { useState } from 'react';

export default function NexedPage() {
  const [showReceipt, setShowReceipt] = useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nexed Financial Core</h1>
          <p className="text-slate-500 mt-1 font-medium">Institutional Ledger & Payment Gateway</p>
        </div>
        <div className="flex gap-4">
          <button 
            className="flex items-center gap-2 bg-white text-slate-900 border-2 border-slate-100 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
            onClick={() => { /* This would be for the expense voucher but we use hotkeys */ }}
          >
            <span>💸 New Expense</span>
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono opacity-60">
              <span className="text-xs">⌘</span> J
            </kbd>
          </button>
          <button 
            onClick={() => { /* Handled by QuickReceipt hotkey */ }}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform active:scale-95"
          >
            <span>🖨️ Quick Receipt</span>
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-[10px] font-mono opacity-60">
              <span className="text-xs">⌘</span> K
            </kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Today's Collections</div>
          <div className="text-4xl font-black text-slate-900">KES 0.00</div>
          <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-sm">
            <span>↑ 0%</span>
            <span className="text-slate-400 font-normal">vs yesterday</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">M-Pesa Success Rate</div>
          <div className="text-4xl font-black text-slate-900">100%</div>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-sm">
             <span>0 transactions today</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Reconciliation</div>
          <div className="text-4xl font-black text-red-600">0</div>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-sm">
             <span>Audit Required</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
         <div className="text-4xl mb-4">📊</div>
         <div className="text-slate-900 font-bold text-xl">Financial Activity Ledger</div>
         <p className="text-slate-400 max-w-sm mx-auto mt-2">Real-time ledger events will appear here as payments are processed through STK Push or manual entry.</p>
      </div>

      <QuickReceipt />
      <ExpenseVoucher />
    </div>
  );
}
