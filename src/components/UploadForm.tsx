'use client';

import { useState, useRef } from 'react';
import { validateFile } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { UploadResponse } from '@/types';

interface UploadFormProps {
  onUploadSuccess: (data: UploadResponse, preview: string | null) => void;
  onUploadError: (error: string) => void;
}

export default function UploadForm({ onUploadSuccess, onUploadError }: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const validation = validateFile(file);
    if (!validation.valid) {
      onUploadError(validation.error || '파일 검증 실패');
      setPreview(null);
      return;
    }

    setIsLoading(true);
    try {
      // 파일 크기 최종 확인 (클라이언트 측)
      if (file.size > 5 * 1024 * 1024) {
        onUploadError('파일 크기는 5MB 이하여야 합니다.');
        setPreview(null);
        return;
      }

      // 백엔드가 실행 중인지 먼저 확인
      const isBackendHealthy = await apiClient.getHealth();
      if (!isBackendHealthy) {
        onUploadError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
        setPreview(null);
        return;
      }

      const response = await apiClient.uploadDocument(file, 2); // 최대 2회 재시도
      if (response.success) {
        onUploadSuccess(response, preview);
      } else {
        onUploadError(response.error || '업로드 중 오류 발생');
        setPreview(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('요청 처리 중 오류가 발생했습니다');
      setPreview(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-6">
      {/* 미리보기 영역 */}
      {preview && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-slate-900"
            />
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
            {isLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-white font-medium text-sm">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 업로드 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          disabled={isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          {!isLoading ? (
            <>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <p className="text-white font-semibold text-lg mb-1">
                {dragActive ? 'Drop your file here' : 'Drag & drop your document here'}
              </p>
              <p className="text-slate-400 text-sm mb-4">or click to browse from your computer</p>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>📄 JPG, PNG</span>
                <span>•</span>
                <span>📦 Max 5MB</span>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-white font-medium">Processing your document...</p>
              <p className="mt-1 text-slate-400 text-sm">Please wait while we analyze your image</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
