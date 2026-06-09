-- Track which OCR method was used (local pdf.js extraction vs Mistral API)
alter table documents add column ocr_method text
  check (ocr_method in ('pdf2txt', 'mistral_ocr'));
