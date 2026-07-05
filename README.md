# Agentic Recruiting Screener

A TypeScript backend for an AI-assisted recruiting pipeline. The application accepts candidate applications, parses uploaded resumes, runs a multi-agent screening workflow, generates technical assessments, evaluates submissions, and can send follow-up emails and scheduling information.

## What the project does

The service is built around an Express API plus a LangGraph-based workflow that simulates an end-to-end recruiting pipeline:

1. Receive an application through a webhook.
2. Extract text from the uploaded resume (PDF or DOCX).
3. Run a multi-step screening flow:
   - supervisor check
   - intake extraction
   - verification and fluff detection
   - assessment generation
   - submission evaluation
   - logistics and notification
4. Return a tracking token so the candidate can submit their assessment later.

## Main architecture

- Express server entrypoint in [src/app.ts](src/app.ts)
- LangGraph workflow orchestration in [src/services/langgraph.service.ts](src/services/langgraph.service.ts)
- Graph node implementations in [src/graph/nodes](src/graph/nodes)
- Shared graph state in [src/graph/state.ts](src/graph/state.ts)
- External integrations in [src/services](src/services)
- Convex schema definitions in [convex/schema.ts](convex/schema.ts)

## API surface

### Health check
- GET /health

### Incoming application webhook
- POST /webhooks/incoming-application
- Expects a resume file upload and application metadata.
- Returns a tracking token and thread ID for the candidate workflow.

### Assessment submission
- POST /submissions/submit-assessment
- Requires the candidate tracking token in the Authorization header.
- Accepts an uploaded assessment zip archive.

## Workflow flow

The current graph is organized as follows:

- supervisor node: validates core application artifacts
- intake node: extracts structured profile information
- verification node: checks claims against mock verification context
- screener node: generates a take-home technical assessment
- decision node: evaluates the candidate submission
- logistics node: provisions interview scheduling details
- watcher node: composes the final summary
- mailer node: sends final communications

## Tech stack

- TypeScript
- Express
- LangGraph
- Convex schema definitions
- Zod validation
- OpenAI-compatible LLM integration through LangChain
- Nodemailer for email
- Google Calendar API for interview scheduling
- Multer for file uploads

## Project structure

- [src/app.ts](src/app.ts) – API entrypoint and route wiring
- [src/graph](src/graph) – workflow state and agent nodes
- [src/middlewares](src/middlewares) – auth and error handling
- [src/schemas](src/schemas) – request validation schemas
- [src/services](src/services) – persistence, extraction, email, calendar, JWT, and workflow services
- [src/utils](src/utils) – shared LLM client setup
- [convex](convex) – Convex schema and generated artifacts

## Environment variables

The application expects the following environment variables:

- PORT
- JWT_SECRET
- LLM_BASE_URL
- LLM_MODEL_NAME
- GROQ_API_KEY
- EMAIL_USER
- EMAIL_PASS
- RECRUITER_EMAIL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REFRESH_TOKEN

## Running locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

## Current implementation notes

This repository is a working prototype with several parts wired together, but some integrations are still mocked or only partially connected:

- The Convex schema exists, but the current persistence layer is an in-memory implementation rather than a live Convex-backed store.
- The incoming webhook validation schema is present, but the route is not currently wired to enforce it.
- Some services such as email delivery and calendar scheduling are implemented, but they depend on runtime environment configuration.
- The workflow is functional as a prototype, but production hardening would require stronger validation, persistence, and error handling.
