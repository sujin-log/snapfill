'use client';

import { useState } from 'react';
import { UploadResponse, ExtractedData } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ResultsViewProps {
  result: UploadResponse;
  preview?: string | null;
}

export default function ResultsView({ result, preview }: ResultsViewProps) {
  const [showOCR, setShowOCR] = useState(false);

  if (!result.success || !result.data) {
    return null;
  }

  const renderInsuranceFields = (data: ExtractedData) => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-lg p-5 border border-blue-700/30">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider">신청자명</label>
          <span className="text-xs text-blue-400/70">Applicant Name</span>
        </div>
        <p className="text-white text-2xl font-bold">{data.applicant_name || '—'}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-lg p-5 border border-purple-700/30">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-purple-300 text-xs font-semibold uppercase tracking-wider">나이</label>
          <span className="text-xs text-purple-400/70">Age</span>
        </div>
        <p className="text-white text-2xl font-bold">{data.age || '—'}</p>
      </div>
      <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 rounded-lg p-5 border border-cyan-700/30">
        <label className="block text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">의료 이력</label>
        <span className="text-xs text-cyan-400/70 block mb-2">Medical History</span>
        <p className="text-slate-200 text-base leading-relaxed">{data.medical_history || '—'}</p>
      </div>
    </div>
  );

  const renderReceiptFields = (data: ExtractedData) => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 rounded-lg p-5 border border-emerald-700/30">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-emerald-300 text-xs font-semibold uppercase tracking-wider">가게명</label>
          <span className="text-xs text-emerald-400/70">Merchant</span>
        </div>
        <p className="text-white text-2xl font-bold">{data.merchant_name || '—'}</p>
      </div>
      <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 rounded-lg p-5 border border-amber-700/30">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-amber-300 text-xs font-semibold uppercase tracking-wider">총액</label>
          <span className="text-xs text-amber-400/70">Amount</span>
        </div>
        <p className="text-white text-2xl font-bold">
          {data.total_amount !== undefined && data.total_amount !== null
            ? `₩${data.total_amount.toLocaleString()}`
            : '—'}
        </p>
      </div>
      <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-lg p-5 border border-orange-700/30">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-orange-300 text-xs font-semibold uppercase tracking-wider">거래 날짜</label>
          <span className="text-xs text-orange-400/70">Date</span>
        </div>
        <p className="text-white text-lg font-semibold">
          {data.transaction_date ? formatDate(data.transaction_date) : '—'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Document Type Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-600">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          result.document_type === 'insurance'
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-purple-500 to-purple-600'
        }`}>
          <span className="text-3xl">
            {result.document_type === 'insurance' ? '📋' : '🧾'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-slate-400 text-sm">분류된 문서 타입</p>
          <p className={`text-2xl font-bold capitalize ${
            result.document_type === 'insurance'
              ? 'text-blue-400'
              : 'text-purple-400'
          }`}>
            {result.document_type === 'insurance' ? '보험 신청서' : '영수증'}
          </p>
        </div>
        <div className="bg-green-500/20 rounded-lg p-2">
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Image Preview */}
        {preview && (
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-slate-900 p-4 min-h-96">
              <img
                src={preview}
                alt="Document"
                className="w-full h-auto max-h-96 object-contain rounded"
              />
            </div>
            <div className="bg-slate-800/50 border-t border-slate-600 px-4 py-3">
              <p className="text-xs text-slate-400 truncate">
                📄 {result.original_filename || 'Document'}
              </p>
            </div>
          </div>
        )}

        {/* Right - Extracted Data */}
        <div className="space-y-4">
          <h4 className="text-slate-200 text-base font-semibold flex items-center gap-2">
            <span>추출된 정보</span>
            <span className="text-xs text-slate-500">(Extracted Fields)</span>
          </h4>
          {result.document_type === 'insurance'
            ? renderInsuranceFields(result.data)
            : renderReceiptFields(result.data)}
        </div>
      </div>

      {/* OCR Text Section */}
      <div className="border-t border-slate-600 pt-4">
        <button
          onClick={() => setShowOCR(!showOCR)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition text-sm"
        >
          <svg className={`w-4 h-4 transition-transform ${showOCR ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          OCR 원본 텍스트 보기
        </button>
        {showOCR && (
          <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="max-h-48 overflow-y-auto">
              <p className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                {result.ocr_text || 'OCR text not available'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>AI 기반 자동 추출 (AI-powered extraction)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">🔐</span>
          <span>보안 저장됨 (Saved Securely)</span>
        </div>
      </div>
    </div>
  );
}
