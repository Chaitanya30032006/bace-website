import React from 'react';
import { Heart, Phone, Copy, Check, QrCode } from 'lucide-react';
const { useState } = React;

const DONATION_INFO = {
  trustName: 'Mayapur BACE',
  upiId: '9322139102@ibl',
  phoneNumber: '+91 9322139102',
  accountName: 'Yuvaraj Balasaheb Kapale',
  bankName: 'Union Bank of India',
  accountNumber: '167522010000677',
  ifsc: 'UBIN0916757',
  queryPhone: '+91 98608 49209',
  qrImageUrl: '/donate-qr.jpeg',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-400 hover:text-saffron-600 transition-colors" title="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-orange-100/20 dark:border-slate-800 last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</span>
      </div>
      <CopyButton text={value} />
    </div>
  );
}

export default function Donate() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-orange-50/10 dark:bg-slate-950 min-h-screen transition-colors">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-saffron-500 to-gold-500 text-white shadow-lg shadow-saffron-500/20 mb-4">
          <Heart className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Support Mayapur BACE
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
          Your generous contributions help us organize spiritual programs, festivals, and community services for devotees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* QR Code Section */}
        <div className="p-8 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col items-center gap-6">
          <h2 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Scan & Pay</h2>
          
          {DONATION_INFO.qrImageUrl ? (
            <div className="h-64 w-64 rounded-2xl overflow-hidden border-4 border-saffron-100 dark:border-slate-700 bg-white p-2">
              <img 
                src={DONATION_INFO.qrImageUrl} 
                alt="Donation QR Code" 
                className="h-full w-full object-contain scale-125" 
              />
            </div>
          ) : (
            <div className="h-64 w-64 rounded-2xl border-4 border-dashed border-saffron-200 dark:border-slate-700 bg-orange-50/30 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
              <QrCode className="h-16 w-16 text-saffron-300 dark:text-slate-600" />
              <span className="text-xs text-slate-400 font-semibold">QR Code Coming Soon</span>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            Scan the QR code above using any UPI app<br />(Google Pay, PhonePe, Paytm, etc.)
          </p>
        </div>

        {/* Payment Details Section */}
        <div className="flex flex-col gap-6">

          {/* UPI Details */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-orange-100/20 dark:border-slate-800 pb-2">
              UPI Payment
            </h2>
            <InfoRow label="UPI ID" value={DONATION_INFO.upiId} />
            <InfoRow label="Phone Number" value={DONATION_INFO.phoneNumber} />
          </div>

          {/* Bank Transfer Details */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-orange-100/20 dark:border-slate-800 pb-2">
              Bank Transfer
            </h2>
            <InfoRow label="Account Name" value={DONATION_INFO.accountName} />
            <InfoRow label="Bank Name" value={DONATION_INFO.bankName} />
            <InfoRow label="Account Number" value={DONATION_INFO.accountNumber} />
            <InfoRow label="IFSC Code" value={DONATION_INFO.ifsc} />
          </div>

          {/* Contact */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">For Queries</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{DONATION_INFO.queryPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-10 text-center">
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          All donations to {DONATION_INFO.trustName} may be eligible for tax exemption under Section 80G of the Income Tax Act. 
          Please contact us for receipts.
        </p>
      </div>
    </div>
  );
}
