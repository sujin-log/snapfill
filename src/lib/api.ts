import axios, { AxiosInstance, AxiosError } from 'axios';
import { UploadResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30초 타임아웃
    });
  }

  private getErrorMessage(error: AxiosError | Error): string {
    if (axios.isAxiosError(error)) {
      // 백엔드 에러 응답
      if (error.response?.data) {
        const data = error.response.data as any;
        if (data.detail) return data.detail;
        if (data.error) return data.error;
      }

      // HTTP 상태 코드별 메시지
      switch (error.response?.status) {
        case 400:
          return 'Bad Request: 파일 형식이나 크기가 올바르지 않습니다.';
        case 401:
          return 'Unauthorized: 인증이 필요합니다.';
        case 403:
          return 'Forbidden: 접근 권한이 없습니다.';
        case 404:
          return 'Not Found: 서버를 찾을 수 없습니다.';
        case 408:
          return 'Request Timeout: 요청 시간이 초과되었습니다.';
        case 413:
          return 'Payload Too Large: 파일이 너무 큽니다.';
        case 500:
          return 'Server Error: 서버 내부 오류입니다.';
        case 502:
          return 'Bad Gateway: 서버에 연결할 수 없습니다.';
        case 503:
          return 'Service Unavailable: 서버가 일시적으로 사용 불가능합니다.';
        default:
          return error.message || 'Network error occurred';
      }
    }

    // 네트워크 에러
    if (error.message === 'Network Error') {
      return 'Network Error: 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.';
    }

    return error.message || 'An unexpected error occurred';
  }

  async uploadDocument(file: File, retries: number = 2): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    let lastError: AxiosError | Error | null = null;

    // 재시도 로직
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post<UploadResponse>('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        lastError = error as AxiosError | Error;

        // 마지막 시도가 아니면 잠시 기다렸다가 재시도
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // 모든 재시도 실패
    const errorMessage = this.getErrorMessage(lastError || new Error('Upload failed'));
    console.error('Upload error:', lastError);

    return {
      success: false,
      error: errorMessage,
    };
  }

  async classifyDocument(ocr_text: string): Promise<any> {
    try {
      const response = await this.client.post('/classify', {
        ocr_text,
      });
      return response.data;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error as AxiosError | Error);
      console.error('Classification error:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async extractInsurance(ocr_text: string): Promise<any> {
    try {
      const response = await this.client.post('/extract/insurance', {
        ocr_text,
      });
      return response.data;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error as AxiosError | Error);
      console.error('Insurance extraction error:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async extractReceipt(ocr_text: string): Promise<any> {
    try {
      const response = await this.client.post('/extract/receipt', {
        ocr_text,
      });
      return response.data;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error as AxiosError | Error);
      console.error('Receipt extraction error:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 5000, // 헬스 체크는 5초
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();
