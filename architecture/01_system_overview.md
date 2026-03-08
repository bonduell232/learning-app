# Architecture Layer 1: System Overview

## B.L.A.S.T. Architecture

The system follows a strict 3-Layer structure to ensure reliability over speed.

### Layer 1: Architecture (`architecture/`)
Maintains technical SOPs written in Markdown. These files define goals, inputs, tool logic, and edge cases.
- **Rule:** If logic changes, update the SOP before updating the code.

### Layer 2: Navigation (Decision Making)
The reasoning layer. This routes data between SOPs and Tools. Complex tasks are broken down and tools are called in the right order.

### Layer 3: Tools (`tools/`)
Deterministic Python scripts and backend API routes. Atomic and testable.
- Environment variables/tokens are stored in `.env`.
- Use `.tmp/` for all intermediate file operations.

## Web Application Stack
- **Frontend Layer:** Next.js (React), Tailwind CSS.
- **Backend/Auth/Database:** Supabase.
- **AI Core:** Google NotebookLM via Python wrapper (`tools/`). 
