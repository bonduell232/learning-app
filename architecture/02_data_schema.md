# Architecture Layer 1: Data Schema

*(Sourced from `gemini.md`)*

## 1. User
```json
{
  "id": "uuid",
  "email": "string",
  "role": "enum('FREE', 'PREMIUM')",
  "created_at": "timestamp",
  "preferences": {
    "grade_level": "integer",
    "subjects": ["string"]
  }
}
```

## 2. Document/Upload
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "type": "enum('IMAGE', 'PDF', 'WORD', 'PRESENTATION')",
  "subject": "enum('GERMAN', 'ENGLISH', 'MATH', ...)",
  "storage_path": "string (Supabase Storage URL)",
  "created_at": "timestamp",
  "extracted_text": "string (optional)"
}
```

## 3. Learning Object
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "source_document_ids": ["uuid"],
  "type": "enum('FLASHCARD_DECK', 'VIDEO', 'AUDIO', 'SUMMARY')",
  "content": "json/string",
  "notebook_lm_reference": "string (optional)",
  "created_at": "timestamp"
}
```
