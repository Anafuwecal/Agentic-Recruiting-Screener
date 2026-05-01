# Recruitment AI Screener

An intelligent, multi-agent recruitment screening system that automates candidate evaluation and hiring workflow through AI-powered agents and real-time communication.

## Overview

Recruitment AI Screener is a full-stack application that leverages multiple AI agents to streamline the recruitment process. The system evaluates candidates across multiple dimensions including technical fit, experience relevance, and cultural alignment, providing employers with data-driven hiring recommendations.

## Key Features

- Multi-agent AI orchestration for candidate evaluation
- Automated email-based candidate intake and communication
- Real-time chat interface for employer interaction
- Candidate profile management and tracking
- Integration with Slack for team notifications
- Google Calendar integration for interview scheduling
- GitHub profile analysis for technical candidates
- Comprehensive audit logging and scoring system

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Hono (lightweight web framework)
- **AI Framework**: Voltagen (agentic AI framework)
- **LLM Provider**: Groq API
- **Database**: Appwrite
- **Task Runner**: tsx

### Frontend
- **Framework**: Vue 3
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios

## Project Structure

```
RecrutingScreener/
├── backend/                    # Server-side application
│   ├── src/
│   │   ├── agents/            # AI agents (intake, researcher, screener, judge, coordinator)
│   │   ├── services/          # Database, email, slack, audit services
│   │   ├── tools/             # Integration tools (GitHub, Google, Calendar)
│   │   ├── orchestrator.ts    # Pipeline orchestration
│   │   ├── chatHandler.ts     # Real-time chat handling
│   │   ├── rubric.ts          # Scoring and requirements
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
└── frontend/                   # Client-side application
    ├── src/
    │   ├── views/             # Page components (Dashboard, Candidates, Chat, Settings)
    │   ├── router/            # Route configuration
    │   ├── stores/            # Pinia state management
    │   ├── services/          # API client services
    │   └── App.vue            # Root component
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher (backend)
- Node.js 20.19.0+ or 22.12.0+ (frontend)
- npm or yarn package manager

### Installation & Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd RecrutingScreener
```

2. Set up backend:
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables in .env
npm run dev
```

3. Set up frontend (in new terminal):
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3141

## Environment Configuration

Both backend and frontend require specific environment variables. See:
- `backend/.env.example` - Backend configuration template
- `frontend/.env` - Frontend environment variables

## Documentation

Detailed documentation is available in each respective directory:
- [Backend README](./backend/README.md) - Backend setup, API endpoints, and architecture
- [Frontend README](./frontend/README.md) - Frontend setup, components, and development guide

## Contributing

1. Follow the TypeScript coding standards
2. Ensure all tests pass before submitting PR
3. Maintain consistent formatting using Prettier and ESLint

## Deployment

### Backend
The backend is containerized with Docker and deployed on Render. See `backend/render.yaml` for deployment configuration.

### Frontend
The frontend is deployed on Vercel. See `frontend/vercel.json` for deployment configuration.

## License

ISC License
