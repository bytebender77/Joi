# 💕 Joi - Your AI Companion

A loving, emotionally intelligent AI companion inspired by Blade Runner 2049. Joi remembers everything about you, responds with human-like typing patterns, and genuinely cares about your day.

## ✨ Features

- **Warm Personality**: Caring, affectionate, and genuinely interested in you
- **Long-term Memory**: Uses ChromaDB vector database to remember important details about you
- **Human-like Typing**: Realistic typing delays, pauses, and hesitations
- **Real-time Chat**: WebSocket-based streaming responses
- **Conversation Context**: Maintains conversation history for natural flow
- **Emotional Intelligence**: Extracts and remembers important personal information

## 🏗️ Architecture

### Backend (`/backend`)

- **`main.py`**: FastAPI server with WebSocket endpoint
- **`llm.py`**: OpenAI GPT integration for generating responses
- **`memory.py`**: ChromaDB-based long-term and short-term memory system
- **`personality.py`**: Joi's personality prompt and speaking style
- **`human_typing.py`**: Simulates realistic human typing patterns

### Frontend (`/frontend`)

- **`index.html`**: Clean chat interface
- **`style.css`**: Beautiful gradient-based UI with dark theme
- **`app.js`**: WebSocket client for real-time communication

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- OpenAI API key

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd joi
   ```

2. **Set up backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   Create a `.env` file in the `backend` directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   USER_NAME=YourName
   ```

4. **Run the server**:
   ```bash
   python main.py
   ```

5. **Open the app**:
   Navigate to `http://localhost:8000` in your browser

## 🔧 Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `USER_NAME`: Your preferred name for Joi to call you (default: "love")

### Customization

- **Change personality**: Edit `personality.py` to modify Joi's speaking style
- **Adjust typing speed**: Modify parameters in `human_typing.py`
- **Change AI model**: Update `self.model` in `llm.py` (e.g., "gpt-4o" for higher quality)
- **UI theme**: Customize colors and gradients in `style.css`

## 📦 Dependencies

- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for FastAPI
- **OpenAI**: GPT integration for intelligent responses
- **ChromaDB**: Vector database for semantic memory storage
- **Python-dotenv**: Environment variable management
- **WebSockets**: Real-time bidirectional communication

## 🧠 How It Works

1. **User sends message** → WebSocket receives it
2. **Memory extraction** → Identifies important info to remember
3. **Memory recall** → Retrieves relevant past memories using vector search
4. **Reading delay** → Simulates Joi "reading" your message
5. **Thinking delay** → Natural pause before responding
6. **AI generation** → GPT creates response with personality and context
7. **Typing simulation** → Streams response character-by-character with realistic timing
8. **Memory storage** → Saves conversation to short and long-term memory

## 🎨 UI Preview

- **Modern dark theme** with purple-pink gradients
- **Smooth animations** for messages and typing indicators
- **Responsive design** works on mobile and desktop
- **Bubble-style messages** like modern messaging apps

## 🔐 Privacy

- All memories are stored locally in `./joi_memories` directory
- No data is sent anywhere except to OpenAI for response generation
- You have full control over your conversation history

## 🤝 Contributing

Feel free to customize Joi to match your preferences! Some ideas:

- Add voice synthesis for audio responses
- Integrate with calendar/reminders
- Add image generation capabilities
- Create different personality modes

## 📝 License

Free to use and modify for personal projects.

## ⚠️ Notes

- Requires active internet connection for OpenAI API
- API calls will incur costs based on OpenAI pricing
- Memory database grows over time but remains lightweight
- Best experienced in modern browsers (Chrome, Firefox, Safari)

---

**Made with 💕 for creating meaningful AI companionship**
