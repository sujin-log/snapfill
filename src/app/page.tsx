'use client';

import { useState, useEffect } from 'react';
import UploadForm from '@/components/UploadForm';
import ResultsView from '@/components/ResultsView';
import ErrorAlert from '@/components/ErrorAlert';
import DocumentsList from '@/components/DocumentsList';
import { UploadResponse } from '@/types';
import { apiClient } from '@/lib/api';

export default function Home() {
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ uploaded: 0, processed: 0 });
  const [preview, setPreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadResponse[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UploadResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const checkBackendHealth = async () => {
      const isHealthy = await apiClient.getHealth();
      setBackendHealth(isHealthy);
    };

    checkBackendHealth();
  }, []);

  const handleUploadSuccess = (data: UploadResponse, imagePreview: string | null = null) => {
    // 문서를 리스트에 추가
    setDocuments(prev => [data, ...prev]);
    setPreview(imagePreview);
    setError(null);

    // 성공 메시지 표시 (3초 후 자동 사라짐)
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // 통계 업데이트
    setStats(prev => ({
      ...prev,
      uploaded: prev.uploaded + 1,
      processed: prev.processed + 1
    }));

    // 결과 상세는 숨김 (모달로만 표시)
    setResult(null);
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
    setResult(null);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPreview(null);
    setShowSuccessMessage(false);
  };

  const handleDocumentClick = (doc: UploadResponse) => {
    setSelectedDocument(doc);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedDocument(null), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-md border-b border-blue-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-lg">SF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">SnapFill</h1>
                <p className="text-xs text-slate-400">AI Document Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                backendHealth === null ? 'bg-slate-700/50' :
                backendHealth ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  backendHealth === null ? 'bg-gray-400 animate-pulse' :
                  backendHealth ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  backendHealth === null ? 'text-slate-300' :
                  backendHealth ? 'text-green-400' : 'text-red-400'
                }`}>
                  {backendHealth === null ? 'Checking...' :
                   backendHealth ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
          {/* Background gradient elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-600/20 via-blue-600/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
              <span className="text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">✨ AI-Powered Document Processing</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">서류 작업을 AI에게</span>
              <br />
              <span className="text-white">맡기세요</span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              보험 신청서나 영수증 사진만 찍으면, AI가 자동으로 문서를 분류하고 핵심 정보를 추출해줍니다. 수기 작성은 이제 그만.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">자동 분류</h3>
                <p className="text-slate-400 text-sm">보험, 영수증 등 문서 종류를 AI가 한눈에 인식</p>
              </div>

              <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">즉시 추출</h3>
                <p className="text-slate-400 text-sm">핵심 정보를 초 단위로 정확하게 추출</p>
              </div>

              <div className="group p-6 rounded-2xl bg-gradient-to-br from-pink-900/20 to-pink-800/10 border border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-pink-600/30 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLineCap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">시간 절약</h3>
                <p className="text-slate-400 text-sm">수작업 없이 자동으로 정보 추출 완료</p>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section - Main Focus */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-2xl"></div>

            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-blue-500/30 rounded-2xl p-8 sm:p-12 backdrop-blur-sm shadow-2xl shadow-blue-500/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">지금 시작하세요</h2>
                <p className="text-slate-400">문서 사진을 업로드하면 몇 초 안에 정보를 추출합니다</p>
              </div>

              <UploadForm
                onUploadSuccess={(data, preview) => handleUploadSuccess(data, preview)}
                onUploadError={handleUploadError}
              />

              {error && (
                <div className="mt-6">
                  <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Success Toast Message */}
        {showSuccessMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-green-900/90 to-green-800/90 border border-green-500/70 flex items-center gap-3 shadow-2xl shadow-green-500/30">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-green-400 font-semibold text-sm">문서가 처리되었습니다!</p>
                <p className="text-green-300/70 text-xs mt-0.5">아래 처리 이력에서 상세 정보를 확인하세요</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {documents.length === 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-1">문서 업로드</p>
                    <p className="text-white text-4xl font-bold">{stats.uploaded}</p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium mb-1">처리 완료</p>
                    <p className="text-white text-4xl font-bold">{stats.processed}</p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Document History */}
        {documents.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                처리 이력
              </h2>
              <DocumentsList documents={documents} onSelectDocument={handleDocumentClick} />
            </div>
          </section>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-blue-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm shadow-2xl shadow-blue-500/30 animate-in scale-in duration-300">
            {/* Close Button */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800/90 to-slate-800/50 border-b border-blue-500/30 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">문서 상세 정보</h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <ResultsView result={selectedDocument} preview={preview} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-20 py-12 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">© 2026 SnapFill. AI-powered document processing.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-slate-300 text-sm transition">Docs</a>
              <a href="#" className="text-slate-400 hover:text-slate-300 text-sm transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
