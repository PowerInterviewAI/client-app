# Power Interview AI - Privacy-First AI Interview Assistant

<div align="center">

**Your Personal AI-Powered Interview Coach**

🌐 **Website**: [https://www.powerinterviewai.com](https://www.powerinterviewai.com)

[![Version](https://img.shields.io/badge/version-1.3.1-blue.svg)](https://github.com/PowerInterviewAI/client/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

📧 [Email](mailto:power-interview@protonmail.com) | 🌐 [Website](https://www.powerinterviewai.com/) | 🌐 [GitHub Pages](https://powerinterviewai.github.io/hero/) | 💬 [Telegram](https://t.me/+uQuuBdrsIYBjY2Qx) | 💭 [Discord](https://discord.gg/TJJp5azK7Z) | 🐦 [X](https://x.com/power_interview)

</div>

## Overview

Power Interview is a privacy-first AI assistant designed to help you ace technical and behavioral interviews. With real-time transcription and intelligent suggestions, you'll have the confidence and support you need during live interviews—all while maintaining your privacy.

## Privacy First

**Your data stays with you.** Power Interview is built with privacy as a core principle:

* **Client-Side Application**: Desktop client for account management and UI
* **Secure Storage**: Credentials and personal info stored using Electron Store
* **AI Processing**: Handled by secure backend services
* **No Data Mining**: No selling or sharing personal data
* **Minimal Data Transfer**: Only necessary data sent for AI suggestions
* **Your Control**: CV, profile, and configs remain on your device

## Key Features

### Real-Time Transcription

Stay on top of the conversation with live ASR:

* Dual-channel transcription (you + interviewer)
* WebSocket streaming for low latency
* Speaker detection
* Full transcript history

### Intelligent AI Suggestions

#### Live Suggestions

* Personalized responses based on CV and job description
* Streaming responses in real time
* Context-aware outputs
* Natural language responses

#### Action Suggestions

* Screenshot-based problem understanding
* Multi-image support (up to 3)
* LLM-powered solutions
* Syntax-highlighted code output

### Smart Configuration

* Profile management (CV, job description, etc.)
* Audio device selection
* Language support (English)
* Persistent settings

## Architecture

Power Interview follows a **client-server architecture**.

### Desktop Client

* Electron + React + TypeScript
* Zustand + React Query
* Handles UI and orchestration

### Backend Services

* AI/LLM Service for suggestions
* ASR Service for transcription
* Auth Service

### Communication

* WebSocket (real-time)
* REST API

## Getting Started

### Prerequisites

* Node.js v18+

### Installation

```bash
git clone https://github.com/PowerInterviewAI/client
cd client
npm install
```

### Run

```bash
npm run start
```

### Configuration

* Set profile (CV, job description)
* Select microphone
* Start assistant

## Use Cases

### Technical Interviews

* Code suggestions
* Debugging assistance
* Live transcription

### Behavioral Interviews

* AI-generated responses
* Context-aware answers

### Practice Sessions

* Self-monitoring
* Feedback loops

## Security & Privacy

* Local encrypted storage
* HTTPS + secure WebSockets
* No external transcript storage
* Full user control

## Technology Stack

### Frontend

* Electron
* React 19
* TypeScript
* Tailwind CSS

### Backend

* WebSocket

## Project Structure

```
power-interview-client/
├── src/
├── public/
├── build/
```

## Legal Disclaimer

Use for **ethical and legal interview preparation only**.

Users are responsible for complying with all applicable laws and platform policies.

## Contributing

Pull requests welcome.

## License

MIT License

## Support

* Email: [power-interview@protonmail.com](mailto:power-interview@protonmail.com)
* GitHub Issues for bugs/features

---

<div align="center">

**Built to help you succeed in interviews**

</div>
