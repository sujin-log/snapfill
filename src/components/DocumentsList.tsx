'use client';

import { useState } from 'react';
import { UploadResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface DocumentsListProps {
  documents: UploadResponse[];
  onSelectDocument?: (doc: UploadResponse) => void;
  onDocumentDeleted?: (documentId: number) => void;
}

export default function DocumentsList({ documents, onSelectDocument, onDocumentDeleted }: DocumentsListProps) {
  const [selectedTab, setSelectedTab] = useState<'insurance' | 'receipt'>('insurance');
  const [selectedDocument, setSelectedDocument] = useState<UploadResponse | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<UploadResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const handleDeleteClick = (doc: UploadResponse) => {
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete || !documentToDelete.document_id) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await apiClient.deleteDocument(documentToDelete.document_id);
      if (result.success) {
        setDeleteSuccess('문서가 삭제되었습니다.');
        setDeleteModalOpen(false);
        setDocumentToDelete(null);

        // 부모 컴포넌트에 삭제 알림
        if (onDocumentDeleted) {
          onDocumentDeleted(documentToDelete.document_id);
        }

        // 2초 후 성공 메시지 제거
        setTimeout(() => setDeleteSuccess(null), 2000);
      } else {
        setDeleteError(result.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDocumentToDelete(null);
    setDeleteError(null);
  };

  // 문서 필터링 및 정렬
  const filteredDocs = documents
    .filter(doc => doc.document_type === selectedTab)
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-400 text-sm">No documents processed yet. Upload your first document to get started.</p>
      </div>
    );
  }

  const insuranceCount = documents.filter(d => d.document_type === 'insurance').length;
  const receiptCount = documents.filter(d => d.document_type === 'receipt').length;

  return (
    <div className="space-y-6">
      {/* 삭제 성공 메시지 */}
      {deleteSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-400 text-sm font-medium">{deleteSuccess}</p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && documentToDelete && (
        <DeleteConfirmModal
          document={documentToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isLoading={deleting}
          error={deleteError}
        />
      )}

      {/* 탭 필터 */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => {
            setSelectedTab('insurance');
            setSelectedDocument(null);
          }}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
            selectedTab === 'insurance'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <span>📋</span> 신청서 ({insuranceCount})
        </button>
        <button
          onClick={() => {
            setSelectedTab('receipt');
            setSelectedDocument(null);
          }}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
            selectedTab === 'receipt'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <span>🧾</span> 영수증 ({receiptCount})
        </button>
      </div>

      {/* 테이블 또는 상세 보기 */}
      {selectedDocument ? (
        <DocumentDetailModal
          doc={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDelete={(doc) => handleDeleteClick(doc)}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">번호</th>
                {selectedTab !== 'receipt' && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">보험 종류</th>
                )}
                {selectedTab !== 'insurance' && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">상호명</th>
                )}
                {selectedTab !== 'insurance' && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">금액</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">등록일</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <p className="text-slate-400 text-sm">해당하는 문서가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedDocument(doc)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">#{filteredDocs.length - idx}</td>
                    {selectedTab !== 'receipt' && (
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {doc.data?.coverage_type || '—'}
                      </td>
                    )}
                    {selectedTab !== 'insurance' && (
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {doc.data?.merchant_name || '—'}
                      </td>
                    )}
                    {selectedTab !== 'insurance' && (
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {doc.data?.total_amount ? `₩${doc.data.total_amount.toLocaleString()}` : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {doc.created_at ? formatDate(doc.created_at) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.success
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {doc.success ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(doc);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface DocumentDetailModalProps {
  doc: UploadResponse;
  onClose: () => void;
  onDelete?: (doc: UploadResponse) => void;
}

function DocumentDetailModal({ doc, onClose, onDelete }: DocumentDetailModalProps) {
  const [showOCR, setShowOCR] = useState(false);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            doc.document_type === 'insurance'
              ? 'bg-blue-500/20'
              : 'bg-purple-500/20'
          }`}>
            <span className="text-2xl">
              {doc.document_type === 'insurance' ? '📋' : '🧾'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {doc.document_type === 'insurance' ? '보험 신청서' : '영수증'}
            </h3>
            <p className="text-sm text-slate-400">
              {doc.original_filename || 'Document'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-300 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 추출된 데이터 */}
      <div className="space-y-4">
        <h4 className="text-slate-200 font-semibold">추출된 정보</h4>
        {doc.document_type === 'insurance' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">신청자명</label>
              <p className="text-white text-lg font-semibold">{doc.data?.applicant_name || '—'}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">나이</label>
              <p className="text-white text-lg font-semibold">{doc.data?.age || '—'}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">보험 종류</label>
              <p className="text-white text-lg font-semibold">{doc.data?.coverage_type || '—'}</p>
            </div>
            <div className="col-span-full bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">의료 이력</label>
              <p className="text-slate-200">{doc.data?.medical_history || '—'}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">상호명</label>
              <p className="text-white text-lg font-semibold">{doc.data?.merchant_name || '—'}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">금액</label>
              <p className="text-white text-lg font-semibold">
                {doc.data?.total_amount ? `₩${doc.data.total_amount.toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <label className="text-slate-400 text-xs font-semibold uppercase mb-2 block">거래일</label>
              <p className="text-white text-lg font-semibold">
                {doc.data?.transaction_date || '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* OCR 원문 */}
      <div className="border-t border-slate-700 pt-4">
        <button
          onClick={() => setShowOCR(!showOCR)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition text-sm font-medium"
        >
          <svg className={`w-4 h-4 transition-transform ${showOCR ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          참고용 원본 텍스트 보기
        </button>
        {showOCR && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">ℹ️</span>
                <span>표 형태의 이미지는 OCR이 셀 단위로 인식하여 줄바꿈이 많을 수 있습니다. 추출된 정보가 정확하면 참고만 하셔도 됩니다.</span>
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                {doc.ocr_text || 'OCR text not available'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 닫기 및 삭제 버튼 */}
      <div className="flex justify-between pt-4 border-t border-slate-700">
        <button
          onClick={() => onDelete && onDelete(doc)}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          삭제
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  document: UploadResponse;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

function DeleteConfirmModal({ document, onConfirm, onCancel, isLoading, error }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-red-500/20">
            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">문서를 삭제하시겠어요?</h3>
            <p className="text-sm text-slate-400 mt-2">
              이 작업은 취소할 수 없습니다. {document.original_filename || '문서'}가 영구적으로 삭제됩니다.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
