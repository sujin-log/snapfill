'use client';

import { UploadResponse, ExtractedData } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ResultsViewProps {
  result: UploadResponse;
  preview?: string | null;
}

export default function ResultsView({ result, preview }: ResultsViewProps) {
  if (!result.success || !result.data) {
    return null;
  }

  const renderInsuranceFields = (data: ExtractedData) => (
    <div className="space-y-4">
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Applicant Name</label>
        <p className="text-white text-lg font-semibold">{data.applicant_name || '—'}</p>
      </div>
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Age</label>
        <p className="text-white text-lg font-semibold">{data.age || '—'}</p>
      </div>
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Medical History</label>
        <p className="text-white text-base">{data.medical_history || '—'}</p>
      </div>
    </div>
  );

  const renderReceiptFields = (data: ExtractedData) => (
    <div className="space-y-4">
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Merchant Name</label>
        <p className="text-white text-lg font-semibold">{data.merchant_name || '—'}</p>
      </div>
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Amount</label>
        <p className="text-white text-lg font-semibold">
          {data.total_amount !== undefined ? formatCurrency(data.total_amount) : '—'}
        </p>
      </div>
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Transaction Date</label>
        <p className="text-white text-base">
          {data.transaction_date ? formatDate(data.transaction_date) : '—'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left - Image Preview */}
      {preview && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-slate-900 p-4">
            <img
              src={preview}
              alt="Document"
              className="w-full h-auto max-h-96 object-contain rounded"
            />
          </div>
          <div className="bg-slate-800/50 border-t border-slate-600 px-4 py-3">
            <p className="text-xs text-slate-400">
              📄 {result.original_filename || 'Document'}
            </p>
          </div>
        </div>
      )}

      {/* Right - Extracted Data */}
      <div className="space-y-6">
        {/* Document Type Badge */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-600">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            result.document_type === 'insurance'
              ? 'bg-blue-500/20'
              : 'bg-purple-500/20'
          }`}>
            <span className="text-2xl">
              {result.document_type === 'insurance' ? '📄' : '🧾'}
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Document Type</p>
            <p className={`text-xl font-bold capitalize ${
              result.document_type === 'insurance'
                ? 'text-blue-400'
                : 'text-purple-400'
            }`}>
              {result.document_type === 'insurance' ? 'Insurance Form' : 'Receipt'}
            </p>
          </div>
          <div className="ml-auto">
            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Extracted Fields */}
        <div>
          <h4 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">Extracted Information</h4>
          {result.document_type === 'insurance'
            ? renderInsuranceFields(result.data)
            : renderReceiptFields(result.data)}
        </div>

        {/* Footer Info */}
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            <span>AI-powered extraction</span>
          </div>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
}
