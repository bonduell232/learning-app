# Implementation Plan: B.L.A.S.T. Phase 1 - Blueprint

## Goal Description
Build a premium, child-friendly (Gymnasium 5th grade+) learning web application in German.
The app allows users to upload school materials (images, PDFs, documents) and uses AI (Google NotebookLM, via a wrapper or alternative) to enable search, Q&A, and generation of learning materials (flashcards, videos, audio).
It features a tiered subscription model (Free vs. Premium) and is built using a modern stack (Next.js/React, deployed on Vercel) with Supabase for data and auth. 
Design will incorporate the provided brand guidelines (Manrope font, #9333EA primary color).

## User Review Required
> [!IMPORTANT]
> **API Keys & Accounts:** You mentioned that you don't have the Supabase, Vercel, or NotebookLM API keys/workspaces yet. To proceed to **Phase 2 (Link)**, we will need to set these up.
> **Design Note:** Your brand guideline specifies Background: `#060406` and Text Primary: `#060406`. I will assume text should be readable (e.g., white/light) on the dark background. 

## Proposed Changes

### Configuration & Architecture (Layer 1)
- Create `architecture/01_system_overview.md` to document the 3-Layer architecture rules.
- Create `architecture/02_data_schema.md` to reflect `gemini.md` definitions.

#### [NEW] architecture/01_system_overview.md
#### [NEW] architecture/02_data_schema.md

### Environment (Phase 2 Preparation)
- Create `.env.example` mapping out the required keys (Supabase URL, Supabase Anon Key, NotebookLM API key, etc.).

#### [NEW] .env.example

### Next.js Initialization & Tools (Layer 2 & 3)
- Initialize a Next.js (App router) frontend project in the root repository.
- Configure Tailwind CSS (using provided brand colors: Primary `#9333EA`, Background `#060406`, Font `Manrope`).
- Create `tools/` directory for Python scripts handling specific backend logic (e.g., NotebookLM communication wrappers).

## Verification Plan

### Automated Tests
- Once Next.js is configured, we will run `npm run dev` and verify it builds correctly without errors.
- For `tools/`, we will write atomic `pytest` Python scripts to verify the external API connections once keys are provided (Phase 2 Link).

### Manual Verification
- Review the Next.js landing page UI locally to ensure child-friendly aesthetics, proper German copy, and correct application of the brand guidelines.
- End-to-end manual test of the Free vs Premium login flow (once Supabase is integrated).
