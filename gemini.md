# Project Constitution

## Data Schemas

### 1. User
```json
{
  "id": "uuid",
  "email": "string",
  "role": "enum('FREE', 'PREMIUM')",
  "created_at": "timestamp",
  "preferences": {
    "grade_level": "integer (e.g., 5)",
    "subjects": ["string"]
  }
}
```

### 2. Document/Upload
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

### 3. Learning Object (Flashcards, NotebookLM generated)
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

## Behavioral Rules
- **Tone & Safety:** Child-friendly, intuitive, and ergonomic UI/UX. Absolutely NO vulgar, sexual, criminal, or aggressive language.
- **Language:** The web application and all outputs must be completely in German.
- **Reliability:** Priority is reliability over speed.
- **Logic:** Never guess at business logic.
- **Protocol:** Follow the Data-First Rule: before building any tool, data schema must be defined here.

## Architectural Invariants
- **Layer 1:** Architecture (`architecture/`) - Technical SOPs and rules.
- **Layer 2:** Navigation - Decision making layer, routing data between SOPs and Tools.
- **Layer 3:** Tools (`tools/`) - Deterministic Python scripts. Atomic and testable.
- Intermediate file operations exist only in `.tmp/`.
- `gemini.md` is law.
