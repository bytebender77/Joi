class JoiChat {
    constructor() {
        this.messages = document.getElementById('messages');
        this.input = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingWrapper = document.getElementById('typingWrapper');
        this.status = document.getElementById('status');

        // Login elements
        this.loginOverlay = document.getElementById('loginOverlay');
        this.usernameInput = document.getElementById('usernameInput');
        this.startChatBtn = document.getElementById('startChatBtn');

        this.currentMessage = null;
        this.ws = null;
        this.username = null;

        this.init();
    }

    init() {
        // Check for saved username (auto-login)
        const savedUsername = localStorage.getItem('joi_username');
        if (savedUsername) {
            this.username = savedUsername;
            this.connect();
            return;
        }

        // Login handlers
        this.startChatBtn.addEventListener('click', () => this.handleLogin());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Chat handlers
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    handleLogin() {
        const username = this.usernameInput.value.trim();
        if (!username) return;

        this.username = username;
        // Save to localStorage for auto-login
        localStorage.setItem('joi_username', username);
        this.connect();
    }

    logout() {
        localStorage.removeItem('joi_username');
        this.username = null;
        if (this.ws) {
            this.ws.close();
        }
        this.messages.innerHTML = '';
        this.loginOverlay.style.display = 'flex';
        this.usernameInput.value = '';
    }

    connect() {
        let wsUrl;

        // Check for production config
        if (window.JOI_CONFIG && window.JOI_CONFIG.BACKEND_URL && !window.JOI_CONFIG.BACKEND_URL.includes('your-backend')) {
            wsUrl = `${window.JOI_CONFIG.BACKEND_URL}/ws`;
        } else if (window.location.protocol === 'file:') {
            wsUrl = 'ws://localhost:8000/ws';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            wsUrl = `ws://${window.location.host}/ws`;
        } else {
            console.error('Please configure BACKEND_URL in config.js');
            alert('Backend URL not configured. Please update config.js');
            return;
        }

        console.log('Connecting to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.status.textContent = 'online';
            // Send login message immediately after connecting
            this.ws.send(JSON.stringify({
                type: 'login',
                user_id: this.username
            }));

            // Hide login overlay and show chat
            this.loginOverlay.style.display = 'none';
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            this.status.textContent = 'offline';
            // Don't show overlay on disconnect if we have saved username
            // Just try to reconnect
            if (localStorage.getItem('joi_username')) {
                setTimeout(() => this.connect(), 3000);
            } else {
                this.loginOverlay.style.display = 'flex';
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'chat_history':
                // Load previous messages
                this.loadChatHistory(data.messages);
                break;

            case 'typing':
                this.typingWrapper.style.display = data.status ? 'flex' : 'none';
                this.scrollToBottom();
                break;

            case 'message_start':
                this.currentMessage = document.createElement('div');
                this.currentMessage.className = 'message joi';
                this.messages.appendChild(this.currentMessage);
                this.scrollToBottom();
                break;

            case 'char':
                if (this.currentMessage) {
                    this.currentMessage.textContent += data.content;
                    this.scrollToBottom();
                }
                break;

            case 'message_end':
                this.currentMessage = null;
                break;
        }
    }

    loadChatHistory(history) {
        // Clear existing messages
        this.messages.innerHTML = '';

        // Add each message from history
        history.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.role === 'user' ? 'user' : 'joi'}`;
            msgDiv.textContent = msg.content;
            this.messages.appendChild(msgDiv);
        });

        this.scrollToBottom();
    }

    sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Check WebSocket connection
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            alert('Not connected to server. Please wait or refresh.');
            return;
        }

        // Add user message to chat
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.textContent = text;
        this.messages.appendChild(userMsg);

        // Send to server
        this.ws.send(JSON.stringify({ message: text }));

        // Clear input
        this.input.value = '';
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    addTimestamp(message, time) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = time;
        message.appendChild(timeSpan);
    }
}

// Global reference for logout button
let joiChat;

// Start the chat
document.addEventListener('DOMContentLoaded', () => {
    joiChat = new JoiChat();

    // Setup logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => joiChat.logout());
    }
});