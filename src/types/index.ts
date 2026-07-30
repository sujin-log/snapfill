export type DocumentType = 'insurance' | 'receipt' | 'unknown';

export interface ExtractedData {
  applicant_name?: string;
  age?: number;
  medical_history?: string;
  merchant_name?: string;
  total_amount?: number;
  transaction_date?: string;
}

export interface UploadResponse {
  success: boolean;
  document_id?: number;
  document_type?: DocumentType;
  data?: ExtractedData;
  error?: string;
  file_url?: string;
  original_filename?: string;
}

export interface Document {
  id: number;
  original_filename: string;
  document_type: DocumentType;
  extracted_text?: string;
  created_at: string;
}

export interface InsuranceRecord {
  id: number;
  document_id: number;
  applicant_name?: string;
  age?: number;
  medical_history?: string;
  extraction_status: 'success' | 'partial' | 'failed';
  created_at: string;
}

export interface ReceiptRecord {
  id: number;
  document_id: number;
  merchant_name?: string;
  total_amount?: number;
  transaction_date?: string;
  extraction_status: 'success' | 'partial' | 'failed';
  created_at: string;
}
