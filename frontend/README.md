# RAG Chatbot Frontend

Docusaurus frontend with integrated RAG chatbot for the "Physical AI & Humanoid Robotics" textbook.

## Quick Start

For detailed setup instructions, see [Quickstart Guide](../specs/001-rag-chatbot-integration/quickstart.md).

### Prerequisites

- Node.js 18+
- Backend running on localhost:8000 (for development)

### Setup

```bash
# Install dependencies
npm install

# Configure API endpoint
# Edit frontend/src/utils/constants.js with your backend URL

# Run development server
npm start
```

The site will open at `http://localhost:3000`.

### Features

- **Floating Chat Widget**: Always-accessible chat button in bottom-right corner
- **Full-Page Chat Mode**: Dedicated `/chat` route for full-screen experience
- **Text Selection Query**: Right-click selected text → "Ask from Selection"
- **Real-time Streaming**: Responses stream token-by-token via Server-Sent Events
- **Mobile Responsive**: Optimized for mobile and desktop

### Build for Production

```bash
# Build static site
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Testing

```bash
# Run tests
npm test

# Run end-to-end tests
npx playwright test
```

### Configuration

Update `src/utils/constants.js` with:
- `API_BASE_URL`: Your backend URL (Railway for production, localhost for dev)
- `API_KEY`: Your backend API key (same as backend .env API_KEY)

### Deployment

See [Quickstart Guide - Deployment section](../specs/001-rag-chatbot-integration/quickstart.md#deployment) for GitHub Pages deployment instructions.
