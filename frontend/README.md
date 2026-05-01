# Frontend - Recruitment AI Screener

Client-side web application for the Recruitment AI Screener system. Built with Vue 3, TypeScript, and Vite.

## Overview

The frontend provides:
- Employer dashboard for candidate management
- Real-time chat interface for candidate communication
- Candidate tracking and evaluation interface
- Job posting and requirement management
- Settings and configuration interface
- Responsive design for desktop and tablet usage

## Technology Stack

- **Framework**: Vue 3.5.32
- **Language**: TypeScript 6.0.0
- **Build Tool**: Vite 8.0.8
- **State Management**: Pinia 3.0.4
- **Routing**: Vue Router 5.0.4
- **HTTP Client**: Axios 1.15.2
- **Linter**: ESLint with Vue 3 support
- **Code Formatter**: Prettier
- **CSS Linter**: Oxlint

## Project Structure

```
frontend/
├── src/
│   ├── views/
│   │   ├── Dashboard.vue        # Main dashboard view
│   │   ├── Candidates.vue       # Candidate list and management
│   │   ├── Chat.vue             # Real-time chat interface
│   │   └── Settings.vue         # Application settings
│   ├── components/              # Reusable Vue components
│   ├── router/
│   │   └── index.ts             # Vue Router configuration
│   ├── stores/
│   │   └── counter.ts           # Pinia store for state management
│   ├── services/
│   │   └── api.ts               # API client service
│   ├── App.vue                  # Root component
│   └── main.ts                  # Application entry point
├── public/                      # Static assets
├── .env                         # Environment variables (development)
├── .env.production              # Environment variables (production)
├── eslint.config.ts             # ESLint configuration
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.app.json            # TypeScript app configuration
├── tsconfig.node.json           # TypeScript node configuration
├── .prettierrc.json             # Prettier configuration
├── .oxlintrc.json               # Oxlint configuration
├── vercel.json                  # Vercel deployment config
├── index.html                   # HTML entry point
└── package.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Create .env if not exists
echo "VITE_API_URL=http://localhost:3141" > .env
```

## Development

### Scripts

```bash
# Start development server with hot module replacement
npm run dev

# Build for production
npm run build

# Preview production build locally
npm preview
```

### Development Server

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

Features:
- Hot Module Replacement (HMR) for instant code updates
- TypeScript compilation on save
- CSS module support

## Environment Configuration

### Development (.env)

```
VITE_API_URL=http://localhost:3141
```

### Production (.env.production)

```
VITE_API_URL=https://your-backend-url.com
```

The `VITE_API_URL` environment variable specifies the backend API endpoint.

## Views

### Dashboard
Main overview page displaying:
- Recent candidate submissions
- Application statistics
- System status
- Quick action buttons

### Candidates
Candidate management interface featuring:
- Candidate list with search and filtering
- Candidate profile details
- Evaluation scores and history
- Action buttons (accept, reject, schedule interview)

### Chat
Real-time chat interface for:
- Communication with candidates
- Message history
- Candidate information sidebar
- Quick action buttons

### Settings
Configuration interface for:
- Job requirements and rubric
- Email templates
- Integration settings
- User preferences

## API Client

The `services/api.ts` file provides centralized API communication:

```typescript
// Example usage
import { apiClient } from '@/services/api'

// Get candidates
const candidates = await apiClient.getCandidates()

// Send chat message
await apiClient.sendChatMessage(conversationId, message)

// Get candidate details
const candidate = await apiClient.getCandidate(candidateId)
```

## State Management

Pinia stores manage global application state:

- **counter.ts** - Example store (can be extended for global state)

Create new stores in `src/stores/` following Pinia conventions.

## Routing

Vue Router configuration in `src/router/index.ts` defines:

- `/` - Dashboard
- `/candidates` - Candidate management
- `/chat` - Chat interface
- `/settings` - Settings

Add new routes following the existing pattern.

## Styling

The application uses:
- Vue Single File Components with scoped styles
- CSS modules for component-specific styling
- Responsive design patterns
- Flexbox and Grid layouts

### Global Styles

Global styles should be imported in `main.ts`. Component-specific styles use the `scoped` attribute.

## Building

### Development Build

```bash
npm run build
```

Output: `dist/` directory with compiled assets

### Production Build

Production builds are optimized for:
- Minification of JavaScript and CSS
- Tree-shaking of unused code
- Code splitting for better performance

## Deployment

### Vercel

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch to trigger automatic deployment

Configuration in `vercel.json` specifies:
- Build command: `vite build`
- Output directory: `dist`
- Public directory: `public`

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` directory to your hosting provider

## Code Quality

### ESLint

Check code quality:
```bash
npm run lint
```

Runs:
- eslint-plugin-vue for Vue 3 rules
- eslint-plugin-oxlint for additional linting
- TypeScript awareness

### Prettier

Code formatting is enforced via Prettier. VS Code integration is recommended:
- Install "Prettier - Code formatter" extension
- Format on save in settings

### Type Safety

- Strict TypeScript mode enabled
- Vue 3 TypeScript support
- Type checking on build

## Components

### Creating a New Component

1. Create `.vue` file in `src/components/`
2. Use Vue 3 Composition API or Options API
3. Include `<template>`, `<script setup>`, and `<style scoped>`
4. Import and register in parent component

Example:
```vue
<template>
  <div class="component">
    <h2>{{ title }}</h2>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
}

defineProps<Props>()
</script>

<style scoped>
.component {
  padding: 20px;
}
</style>
```

## TypeScript

### Strict Mode

TypeScript strict mode is enabled. All code should:
- Have proper type annotations
- Avoid `any` types
- Use proper null/undefined handling
- Have proper interface definitions

### Type Definitions

- `env.d.ts` - Vite and Vue type definitions
- `tsconfig.json` - Root TypeScript config
- `tsconfig.app.json` - Application-specific config

## Performance Optimization

- Lazy loading of routes via Vue Router
- Component code splitting
- Image optimization for public assets
- Minification and compression in production

## Browser Support

- Modern browsers with ES2020 support
- Chrome, Firefox, Safari, Edge (latest versions)
- Responsive design for tablets

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify backend is running on correct port
   - Check `VITE_API_URL` in `.env` matches backend URL
   - Verify CORS is enabled in backend

2. **Hot Module Replacement (HMR) Not Working**
   - Restart dev server: `npm run dev`
   - Clear browser cache
   - Check VS Code extension compatibility

3. **TypeScript Errors After Update**
   - Reinstall dependencies: `npm install`
   - Run `npm run build` to check compilation
   - Restart VS Code

4. **Build Fails**
   - Clear `dist/` and `node_modules/`
   - Reinstall: `npm install`
   - Run `npm run build` with verbose output

## File Naming Conventions

- **Components**: PascalCase (e.g., `CandidateCard.vue`)
- **Views**: PascalCase (e.g., `Dashboard.vue`)
- **Stores**: camelCase (e.g., `candidateStore.ts`)
- **Services**: camelCase (e.g., `api.ts`)
- **Utilities**: camelCase in `utils/` directory

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur)

### Browser Extensions

- Chromium-based browsers: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

## License

ISC License
