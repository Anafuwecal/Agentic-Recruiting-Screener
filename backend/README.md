# Backend - Recruitment AI Screener

Server-side API and AI agent orchestration for the Recruitment AI Screener system. Built with Hono, TypeScript, and the Voltagen AI framework.

## Overview

The backend provides:
- RESTful API endpoints for candidate management and chat
- Multi-agent AI orchestration for candidate evaluation
- Email integration for candidate communication
- Slack notifications for team coordination
- Integration with external services (GitHub, Google Calendar, Google Search)
- Audit logging and scoring system
- Appwrite database management

## Technology Stack

- **Runtime**: Node.js 18.0.0+
- **Language**: TypeScript 6.0.3
- **Framework**: Hono 4.12.15
- **AI Framework**: Voltagen 2.7.3
- **LLM Provider**: Groq API
- **Database**: Appwrite
- **Email**: Nodemailer 8.0.6
- **HTTP Client**: Axios 1.15.2
- **Task Runner**: tsx 4.21.0

## Project Structure

```
backend/
├── src/
│   ├── agents/
│   │   ├── coordinatorAgent.ts     # Orchestration and decision-making
│   │   ├── intakeAgent.ts          # Initial candidate assessment
│   │   ├── judgeAgent.ts           # Final evaluation and scoring
│   │   ├── researcherAgent.ts      # Background research on candidates
│   │   └── screenerAgent.ts        # Technical fit assessment
│   ├── services/
│   │   ├── audit.ts                # Audit logging service
│   │   ├── database.ts             # Appwrite database client
│   │   ├── mailer.ts               # Email service (Nodemailer)
│   │   └── slack.ts                # Slack notification service
│   ├── tools/
│   │   ├── calendarTool.ts         # Google Calendar integration
│   │   ├── githubTool.ts           # GitHub profile analysis
│   │   └── googleSearchTool.ts     # Web search capability
│   ├── chatHandler.ts              # Real-time chat message handling
│   ├── orchestrator.ts             # Pipeline orchestration logic
│   ├── rubric.ts                   # Scoring rubric and job requirements
│   └── index.ts                    # Application entry point
├── .env.example                    # Environment variables template
├── Dockerfile                      # Container configuration
├── package.json
├── render.yaml                     # Render deployment config
└── tsconfig.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials for:
   - Groq API (LLM provider)
   - Slack Bot Token and Channel
   - Gmail credentials and app password
   - Appwrite project details
   - Optional: GitHub token, Google Search API, Google Calendar

## Development

### Scripts

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Start without build watching
npm run start:dev
```

### Development Server

The development server runs on port 3141 (configurable via PORT env var):
```bash
npm run dev
```

Access the server at `http://localhost:3141`

## Environment Variables

Required variables (see `.env.example` for complete list):

```
# LLM Configuration
GROQ_API_KEY=your_groq_api_key

# Slack Integration
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C...

# Email Configuration
EMPLOYER_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password
COMPANY_NAME=YourCompany

# Database (Appwrite)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...
APPWRITE_DATABASE_ID=recruitment_db
APPWRITE_CANDIDATES_COLLECTION_ID=...
APPWRITE_JOBS_COLLECTION_ID=...
APPWRITE_CHATS_COLLECTION_ID=...

# Server Configuration
PORT=3141

# Optional Integrations
GITHUB_TOKEN=
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_CX=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

## API Endpoints

The API follows RESTful conventions with CORS enabled for the frontend:

- `GET /` - Health check endpoint
- `POST /candidates` - Create candidate profile
- `GET /candidates/:id` - Retrieve candidate details
- `POST /chat` - Send chat message
- `GET /jobs/:id` - Retrieve job requirements
- Additional endpoints for job management and chat history

## Core Components

### Agents

The system uses five specialized AI agents working in coordination:

1. **Intake Agent** - Extracts key information from candidate submissions
2. **Researcher Agent** - Conducts background research and verification
3. **Screener Agent** - Evaluates technical and professional fit
4. **Judge Agent** - Provides final evaluation and scoring
5. **Coordinator Agent** - Orchestrates inter-agent communication

### Services

- **Database Service** - Manages Appwrite collections and document operations
- **Mailer Service** - Sends emails to candidates and employers via Gmail
- **Slack Service** - Notifies team of important events and decisions
- **Audit Service** - Logs all candidate interactions and decisions

### Tools

- **GitHub Tool** - Analyzes candidate GitHub profiles
- **Google Search Tool** - Conducts web searches for candidate validation
- **Calendar Tool** - Integrates with Google Calendar for interview scheduling

## Scoring System

The system implements a comprehensive scoring rubric with multiple evaluation criteria:

- Technical fit assessment (0-100)
- Experience relevance scoring (0-100)
- Cultural alignment evaluation (0-100)
- Overall recommendation (ACCEPT/REJECT/REVIEW)

Scoring thresholds and requirements are defined in `rubric.ts`.

## Deployment

### Docker

Build and run with Docker:
```bash
docker build -t recruitment-screener-backend .
docker run -p 3141:3141 --env-file .env recruitment-screener-backend
```

### Render

Deployment configuration is provided in `render.yaml`. Push to your repository to trigger automatic deployment:
```bash
git push origin main
```

## Troubleshooting

### Common Issues

1. **Groq API Key Error**
   - Verify `GROQ_API_KEY` is set in `.env`
   - Check API key validity in Groq dashboard

2. **Database Connection Failed**
   - Confirm Appwrite endpoint and credentials
   - Verify collection IDs match your Appwrite setup
   - Check network connectivity to Appwrite cloud

3. **Email Service Not Working**
   - Enable 2-factor authentication in Gmail
   - Generate app-specific password (16 characters)
   - Update `GMAIL_APP_PASSWORD` in `.env`

4. **Slack Notifications Failed**
   - Verify bot token has appropriate scopes
   - Confirm bot is added to the target channel
   - Check `SLACK_CHANNEL_ID` is correct

## Database Schema

### Collections

- **candidates** - Candidate profiles and application data
- **jobs** - Job postings and requirements
- **chats** - Chat messages and conversation history
- **audit_logs** - Audit trail of all decisions and actions

See `services/database.ts` for collection structure details.

## Extending the System

### Adding a New Agent

1. Create agent file in `src/agents/newAgent.ts`
2. Export agent creation function
3. Import and instantiate in `index.ts`
4. Integrate into orchestrator pipeline in `orchestrator.ts`

### Adding a New Tool

1. Create tool file in `src/tools/newTool.ts`
2. Implement tool interface compatible with Voltagen
3. Import into relevant agent
4. Define tool schema for LLM interaction

## Code Style

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting
- Async/await pattern for asynchronous operations

## License

ISC License
