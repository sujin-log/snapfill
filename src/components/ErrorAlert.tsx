'use client';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

export default function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div className="relative">
      <div className="bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-700/30 rounded-lg p-6 flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold mb-1">Upload Failed</h3>
          <p className="text-red-200/70 text-sm">{message}</p>
          {message.includes('백엔드') && (
            <div className="mt-2 text-xs text-red-200/50 bg-red-900/20 p-2 rounded">
              <p className="font-semibold mb-1">💡 해결 방법:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>터미널에서 백엔드 서버 실행: <code className="bg-red-900/50 px-1 rounded">npm run dev</code></li>
                <li>백엔드가 http://localhost:8000 에서 실행 중인지 확인</li>
                <li>다시 이미지를 업로드해보세요</li>
              </ol>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-red-400/60 hover:text-red-300 transition flex-shrink-0 ml-2"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
