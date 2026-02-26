# Power Interview - Privacy-First AI Interview Assistant

<div align="center">

**Your Personal AI-Powered Interview Coach with Real-Time Face Swap Technology**

[![Version](https://img.shields.io/badge/version-1.1.4-blue.svg)](https://github.com/PowerInterviewAI/power-interview-assistant/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

📧 [Email](mailto:power-interview@protonmail.com) | 🌐 [Website](https://www.powerinterviewai.com/) | 🌐 [GitHub Pages](https://powerinterviewai.github.io/hero/) | 💬 [Telegram](https://t.me/+uQuuBdrsIYBjY2Qx) | 💭 [Discord](https://discord.gg/TJJp5azK7Z) | 🐦 [X](https://x.com/power_interview)

</div>

## Overview

Power Interview is a privacy-first AI assistant designed to help you ace technical and behavioral interviews. With real-time transcription, intelligent suggestions, and cutting-edge face swap technology, you'll have the confidence and support you need during live interviews—all while maintaining your privacy.

## Privacy First

**Your data stays with you.** Power Interview is built with privacy as a core principle:

- **Client-Side Application**: This is a desktop client for account management and user interface
- **Secure Storage**: Credentials and personal information stored securely using Electron Store
- **AI Processing**: AI/LLM inference and face swap processing handled by secure backend services
- **No Data Mining**: We don't collect, sell, or share your personal information
- **Minimal Data Transfer**: Only necessary data sent for AI suggestions (transcripts, screenshots, profile)
- **Your Control**: All your CV, profile data, and configurations remain on your device

## Key Features

### Real-Time Face Swap

Transform your video appearance during live interviews with advanced face swap technology:

- **Virtual Camera Integration**: Seamlessly replaces your face with your chosen photo
- **WebRTC Streaming**: Low-latency, high-quality video processing
- **Face Enhancement**: Optional AI-powered face enhancement for natural-looking results
- **OBS Virtual Camera Support**: Professional-grade virtual camera output
- **Configurable Settings**: Adjust video resolution, quality, and audio sync

### Real-Time Transcription

Stay on top of the conversation with live ASR (Automatic Speech Recognition):

- **Dual-Channel Transcription**: Separate transcription for interviewer and yourself
- **WebSocket Streaming**: Real-time, low-latency transcription
- **Speaker Detection**: Automatically identifies who's speaking
- **Transcript History**: Full conversation history available during the interview

### Intelligent AI Suggestions

Get instant, context-aware help during interviews:

#### Reply Suggestions

- **Personalized Responses**: AI generates answers based on your CV, job description, and conversation
- **Streaming Responses**: Real-time suggestions as the conversation unfolds
- **Context-Aware**: Takes into account the full interview context
- **Natural Language**: Human-like responses tailored to your profile

#### Code Suggestions

- **Screenshot Analysis**: Captures your screen to understand coding problems
- **Multi-Image Support**: Analyzes up to 3 screenshots for comprehensive context
- **LLM-Powered**: Advanced language models generate optimal solutions
- **Syntax Highlighting**: Code rendered with proper highlighting for readability

### Stealth Mode & Hotkeys

Stealth mode allows you to operate discreetly during interviews, keeping your AI assistant out of sight while still providing real-time support.
Also, you will not lose focus on active tabs or windows during interviews, as the app can be controlled entirely through hotkeys.

Operate discreetly during interviews:

- **Stop Assistant** (`Ctrl+Shift+Q`): Stop the assistant
- **Stealth Mode** (`Ctrl+Shift+M`): Toggle stealth mode
- **Opacity Control** (`Ctrl+Shift+N`): Toggle window opacity for discreet viewing in stealth mode
- **Window Positioning** (`Ctrl+Shift+1-9`): Quick window placement (numpad layout)
- **Scroll Controls**:
  - `Ctrl+Shift+J/K`: Scroll interview suggestions
  - `Ctrl+Shift+U/I`: Scroll code suggestions
- **Window Management**:
  - `Ctrl+Alt+Shift+Arrow`: Move window
  - `Ctrl+Win+Shift+Arrow`: Resize window
- **Code Suggestion Controls**:
  - `Ctrl+Alt+Shift+P`: Take screenshot for code suggestions
  - `Ctrl+Alt+Shift+Enter`: Submit screenshots
  - `Ctrl+Alt+Shift+X`: Clear screenshots

### Smart Configuration

Tailor the experience to your needs:

- **Profile Management**: Store your name, CV/resume, and job descriptions
- **Photo Upload**: Choose your preferred face swap photo
- **Audio Device Selection**: Pick the right microphone for transcription
- **Camera Selection**: Choose your video input device
- **Language Support**: Currently supports English with more languages coming
- **Persistent Settings**: All configurations saved between sessions

### Advanced Features

- **Health Monitoring**: Real-time backend and GPU server status checks
- **Action Locking**: Prevents conflicting operations during critical tasks
- **Push Notifications**: Desktop notifications for important events
- **Auto-Scroll**: Smart scrolling for suggestions and transcripts
- **State Persistence**: All app state maintained across page refreshes
- **Audio Delay Compensation**: Configurable audio sync for perfect video/audio alignment

## Architecture

Power Interview follows a **client-server architecture** where the desktop application handles user interaction and local agent management, while AI/LLM processing and face swap inference are performed by backend services.

### Desktop Client Application

- **Framework**: Electron with React + TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: Zustand + React Query
- **IPC Communication**: Electron IPC for main-renderer communication
- **Role**: User interface, account management, configuration, and local agent orchestration

### Python Agents (Local)

- **ASR Agent**: Real-time audio capture and transcription routing
- **VCam Agent**: Virtual camera frame capture and streaming
- **Audio Control Agent**: Audio device management and routing

### Backend Services (Online)

- **AI/LLM Service**: Generates interview reply and code suggestions using advanced language models
- **Face Swap Service**: Performs real-time face swapping using deep learning models
- **ASR Service**: Speech-to-text transcription processing
- **Authentication Service**: Secure user authentication and session management

### Communication

- **ZeroMQ**: High-performance inter-process communication between local agents
- **WebSocket**: Real-time streaming between client and backend services
- **WebRTC**: Low-latency video streaming for face swap processing
- **REST API**: Configuration and data management

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.12)
- **OBS Virtual Camera** (for face swap feature)
- **VB-Audio Virtual Cable** (for audio routing)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/PowerInterviewAI/power-interview-assistant
   cd power-interview-assistant
   ```

2. **Install dependencies**

   ```bash
   # Install Node.js dependencies
   cd app
   npm install

   # Install Python dependencies
   cd ..
   pip install -r requirements.txt
   ```

3. **Build Python agents**

   ```bash
   python -m scripts.build_XXXX_agent
   ```

4. **Run the application**
   ```bash
   cd app
   npm run start
   ```

### Configuration

1. **Launch the app** and sign in with your credentials
2. **Configure your profile**:
   - Click the profile icon in the control panel
   - Set your face swap photo
   - Enter your name, profile(e.g. CV/resume, portfolio or bio) content, and context (e.g. job description or role requirements)
3. **Select your devices**:
   - Choose your microphone for transcription
   - Select your camera for video (if using face swap)
4. **Start your interview prep**:
   - Click "Start" to begin transcription and AI assistance
   - Enable face swap if needed for your video call

## Building for Production

### 1. Build Python Agents

```bash
python -m scripts.build_XXXX_agent
```

### 2. Build Electron App

```bash
python -m scripts.build_electron_app
```

The built application will be available in the `build` and `dist` directories.

### #. Build All

```bash
python -m scripts.build_all
```

This will build both the Python agents and the Electron app in one step.

## Use Cases

### Technical Interviews

- Real-time code suggestions for algorithm questions
- Screen capture analysis for debugging help
- Live transcription to review questions later

### Behavioral Interviews

- AI-generated responses based on your experience
- Context-aware suggestions using your CV
- Transcript history to maintain conversation flow

### Practice Sessions

- Monitor your own responses in real-time
- Get feedback on your answers
- Build confidence with AI support

### Anonymous Interviewing

- Use face swap for privacy protection
- Control your video appearance
- Maintain professionalism while staying anonymous

## Examples

### Live Interview Assistance

<div align="center">

![Live Interview Assistant Workflow](assets/live.interview.assistant.gif)

_Watch the complete interview assistance workflow_

</div>

### Code Suggestions

Get intelligent code suggestions by capturing your screen during technical interviews.

<div align="center">

![Code Suggestion Feature](assets/code.test.gif)

_Code suggestion feature analyzing coding problems_

</div>

<div align="center">

![Live Interview Assistant](assets/meeting.tonny.face.liveassist.png)

_Live interview with real-time AI suggestions and Tonny face swap_

</div>

### Face Swap Technology

Power Interview's advanced face swap technology allows you to transform your appearance during live interviews. Here's Victor (the real person) and examples of face-swapped interviews with Tonny and Henry.

#### Original Face - Victor

<div align="center">

![Victor - Real Person](assets/face.victor.gif)

_Victor - Real person without face swap_

</div>

#### Face Swap with Tonny

<div align="center">

![Tonny's Face](assets/face.tonny.jpg)

_Reference photo for Tonny's face swap_

</div>

<div align="center">

![Tonny Face Swap Demo](assets/face.tonny.gif)

_Face swap demonstration with Tonny_

</div>

<div align="center">

![Tonny Live Interview](assets/meeting.tonny.gif)

_Live interview with Tonny face swap_

</div>

#### Face Swap with Henry

<div align="center">

![Henry's Face](assets/face.henrry.jpg)

_Reference photo for Henry's face swap_

</div>

<div align="center">

![Henry Face Swap Demo](assets/face.henrry.gif)

_Face swap demonstration with Henry_

</div>

<div align="center">

![Henry Live Interview](assets/meeting.henry.gif)

_Live interview with Henry face swap_

</div>

### Settings & Configuration

Configure your profile, face swap photos, and interview context for personalized AI assistance.

#### Setting Up Face Swap with Tonny

<div align="center">

![Tonny Settings](assets/setting.tonny.png)

_Configure your profile with face swap photo and interview details_

</div>

#### Setting Up Face Swap with Henry

<div align="center">

![Henry Settings](assets/setting.henry.png)

_Upload your chosen face photo and personalize your interview context_

</div>

### Audio & Video Device Configuration

Select the right audio and video devices for optimal performance.

<div align="center">

![Meeting Audio Device](assets/meeting-audio-device.png)

_Configure your microphone and audio routing for transcription_

</div>

<div align="center">

![Meeting Video Device](assets/meeting-video-device.png)

_Select your camera and virtual camera output_

</div>

## Security & Privacy

### Local Data Storage

All sensitive data is stored locally using Electron Store with encryption:

- Login credentials
- Session tokens
- Profile information
- Interview configurations

### Secure Communication

- HTTPS for all backend API calls
- WebSocket secure connections for real-time data
- No persistent storage of transcripts on external servers

### Data Control

- Clear all data with one click
- Export your transcripts and suggestions
- Full control over what data is shared

## Technology Stack

### Frontend

- **Electron** - Cross-platform desktop framework
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library

### Backend Agents

- **Python 3.12** - Core agent language
- **PyAudio** - Audio capture and processing
- **OpenCV** - Video processing
- **PyVirtualCam** - Virtual camera driver
- **ZeroMQ** - Message queue communication
- **WebSocket** - Real-time streaming

### Build & Deployment

- **Electron Builder** - Desktop app packaging
- **Nuitka** - Python to executable compilation
- **Ruff** - Python linting and formatting

## Project Structure

```
power-interview-client/
├── agents/                  # Python agents
│   ├── asr/                # Automatic Speech Recognition
│   ├── audio_control/      # Audio device management
│   ├── vcam/               # Virtual camera with face swap
│   └── shared/             # Shared utilities
├── app/                    # Electron application
│   ├── src/
│   │   ├── main/          # Electron main process
│   │   └── renderer/      # React application
│   └── electron-dist/     # Compiled Electron code
├── build/                 # Build output
├── scripts/               # Build and deployment scripts
└── requirements.txt       # Python dependencies
```

## Legal Disclaimer

**IMPORTANT: This software is provided for legitimate educational and interview preparation purposes only.**

By using Power Interview, you agree to:

- Use this software only for **legal and ethical purposes**
- Comply with all applicable laws and regulations in your jurisdiction
- Respect the policies and terms of service of any platforms or services you use during interviews
- Obtain proper consent when recording or processing audio/video of other individuals
- Use the face swap feature only with your own likeness or with explicit permission from the person whose face is being used
- Not use this software to deceive, defraud, or misrepresent yourself in any unlawful manner

**User Responsibility**: Users are solely responsible for ensuring their use of this software complies with applicable laws, regulations, and ethical guidelines. The developers and maintainers of Power Interview assume no liability for any misuse of this software.

**Face Swap Ethics**: The face swap technology is intended for privacy protection and personal presentation preferences during legitimate interviews. Using face swap to impersonate another person or to engage in fraudulent activities is strictly prohibited and may be illegal.

If you are unsure about the legality or appropriateness of using this software in your specific situation, please consult with a legal professional before proceeding.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for interview candidates everywhere
- Special thanks to the open-source community
- Powered by cutting-edge AI and computer vision technology

## Support

For issues, questions, or suggestions:

- 📧 **Email**: [power-interview@protonmail.com](mailto:power-interview@protonmail.com)
- 🌐 **Website**: [https://www.powerinterviewai.com/](https://www.powerinterviewai.com/)
- 🌐 **GitHub Pages**: [https://powerinterviewai.github.io/hero/](https://powerinterviewai.github.io/hero/)
- 💬 **Telegram**: [https://t.me/+uQuuBdrsIYBjY2Qx](https://t.me/+uQuuBdrsIYBjY2Qx)
- 💭 **Discord**: [https://discord.gg/TJJp5azK7Z](https://discord.gg/TJJp5azK7Z)
- 🐦 **X**: [https://x.com/power_interview](https://x.com/power_interview)
- **GitHub**: Open an issue for bug reports and feature requests

---

<div align="center">

**Made to help you ace your interviews while protecting your privacy**

📧 [Email](mailto:power-interview@protonmail.com) | 🌐 [Website](https://www.powerinterviewai.com/) | 🌐 [GitHub Pages](https://powerinterviewai.github.io/hero/) | 💬 [Telegram](https://t.me/+uQuuBdrsIYBjY2Qx) | 💭 [Discord](https://discord.gg/TJJp5azK7Z) | 🐦 [X](https://x.com/power_interview)

</div>

