'use client';

import { useState, useEffect } from 'react';
import UploadForm from '@/components/UploadForm';
import ResultsView from '@/components/ResultsView';
import ErrorAlert from '@/components/ErrorAlert';
import { UploadResponse } from '@/types';
import { apiClient } from '@/lib/api';

export default function Home() {
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ uploaded: 0, processed: 0 });

  useEffect(() => {
    const checkBackendHealth = async () => {
      const isHealthy = await apiClient.getHealth();
      setBackendHealth(isHealthy);
    };

    checkBackendHealth();
  }, []);

  const handleUploadSuccess = (data: UploadResponse) => {
    setResult(data);
    setError(null);
    setStats(prev => ({
      ...prev,
      uploaded: prev.uploaded + 1,
      processed: prev.processed + 1
    }));
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
    setResult(null);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SnapFill</h1>
                <p className="text-xs text-slate-400">AI Document Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                backendHealth === null ? 'bg-slate-700' :
                backendHealth ? 'bg-green-900/30' : 'bg-red-900/30'
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm font-medium">Documents Uploaded</p>
                      <p className="text-white text-3xl font-bold mt-1">{stats.uploaded}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm font-medium">Documents Processed</p>
                      <p className="text-white text-3xl font-bold mt-1">{stats.processed}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload/Result Area */}
              {!result ? (
                <div className="space-y-6">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Upload Document</h2>
                    <UploadForm
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  </div>

                  {error && (
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                  )}

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 border border-blue-700/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-blue-400 text-sm font-bold">📄</span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-sm">Insurance Forms</h4>
                          <p className="text-slate-400 text-xs mt-1">Extracts: Name, Age, Medical History</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 border border-purple-700/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-purple-400 text-sm font-bold">🧾</span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-sm">Receipts</h4>
                          <p className="text-slate-400 text-xs mt-1">Extracts: Merchant, Amount, Date</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-600 rounded-lg p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Processing Results</h2>
                    <ResultsView result={result} />
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/25"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Features & Info */}
          <div className="space-y-6">
            {/* Features */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                Features
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-300 text-sm">AI-powered classification</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-300 text-sm">Automatic field extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-300 text-sm">Fast processing</span>
                </li>
              </ul>
            </div>

            {/* Supported Formats */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Supported Formats</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-300 text-sm">JPG / JPEG</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-300 text-sm">PNG</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  <span className="text-slate-400 text-sm">Max size: 5MB</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm">Backend Health</span>
                    <span className={`text-xs font-semibold ${
                      backendHealth ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {backendHealth ? 'Healthy' : 'Down'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${
                      backendHealth ? 'w-full bg-green-500' : 'w-0'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">© 2026 SnapFill. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-200 text-sm transition">API Docs</a>
              <a href="#" className="text-slate-400 hover:text-slate-200 text-sm transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
