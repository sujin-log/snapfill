"""
Mock responses for UI development without consuming Gemini API quota
"""

MOCK_CLASSIFICATION = {
    "document_type": "insurance",
    "confidence": 0.95,
    "reason": "Contains typical insurance form elements: applicant name, age, medical history, coverage type"
}

MOCK_INSURANCE_EXTRACTION = {
    "applicant_name": "John Smith",
    "age": 35,
    "medical_history": "High blood pressure (diagnosed 2020), currently on medication."
}

MOCK_RECEIPT_EXTRACTION = {
    "merchant_name": "Starbucks Coffee Shop",
    "total_amount": 5.50,
    "transaction_date": "2026-07-31"
}
