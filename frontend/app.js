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
        // Always set up chat handlers
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Login handlers
        this.startChatBtn.addEventListener('click', () => this.handleLogin());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Check for saved username (auto-login)
        const savedUsername = localStorage.getItem('joi_username');
        if (savedUsername) {
            this.username = savedUsername;
            // Show connecting state for auto-login
            this.showConnectingOverlay();
            this.connect();
        }
    }

    handleLogin() {
        const username = this.usernameInput.value.trim();
        if (!username) return;

        this.username = username;
        // Save to localStorage for auto-login
        localStorage.setItem('joi_username', username);

        // Show connecting state
        this.startChatBtn.textContent = 'Connecting...';
        this.startChatBtn.disabled = true;
        this.usernameInput.disabled = true;

        this.connect();
    }

    resetLoginUI() {
        this.startChatBtn.textContent = 'Start Chatting';
        this.startChatBtn.disabled = false;
        this.usernameInput.disabled = false;
    }

    showConnectingOverlay(message = 'Connecting to server...') {
        // Create or update connecting overlay content
        const loginBox = this.loginOverlay.querySelector('.login-box');
        let connectingDiv = loginBox.querySelector('.connecting-status');

        if (!connectingDiv) {
            connectingDiv = document.createElement('div');
            connectingDiv.className = 'connecting-status';
            connectingDiv.innerHTML = `
                <div class="connecting-spinner"></div>
                <p class="connecting-message">${message}</p>
                <p class="connecting-hint">Free servers may take up to 60 seconds to wake up</p>
            `;
            loginBox.appendChild(connectingDiv);
        } else {
            connectingDiv.querySelector('.connecting-message').textContent = message;
        }

        // Hide the login form inputs
        this.usernameInput.style.display = 'none';
        this.startChatBtn.style.display = 'none';
        loginBox.querySelector('h2').textContent = 'Connecting...';
        connectingDiv.style.display = 'block';

        this.loginOverlay.style.display = 'flex';
    }

    updateConnectingMessage(message) {
        const connectingMessage = this.loginOverlay.querySelector('.connecting-message');
        if (connectingMessage) {
            connectingMessage.textContent = message;
        }
    }

    hideConnectingOverlay() {
        const loginBox = this.loginOverlay.querySelector('.login-box');
        const connectingDiv = loginBox.querySelector('.connecting-status');

        if (connectingDiv) {
            connectingDiv.style.display = 'none';
        }

        // Restore login form
        this.usernameInput.style.display = '';
        this.startChatBtn.style.display = '';
        loginBox.querySelector('h2').textContent = 'Who is this?';
        this.resetLoginUI();
    }

    handleConnectionError() {
        this.hideConnectingOverlay();
        this.loginOverlay.style.display = 'flex';
        localStorage.removeItem('joi_username');
        this.username = null;
    }

    async waitForServer(httpUrl, maxAttempts = 12) {
        // Poll health endpoint every 5 seconds for up to 60 seconds
        for (let i = 0; i < maxAttempts; i++) {
            this.updateConnectingMessage(`Waiting for server... (${(i + 1) * 5}s)`);

            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const response = await fetch(`${httpUrl}/health`, {
                    method: 'GET',
                    mode: 'cors',
                });

                if (response.ok) {
                    console.log('Server is now awake!');
                    return true;
                }
            } catch (error) {
                console.log(`Health check attempt ${i + 1} failed`);
            }
        }

        console.log('Server failed to wake up after max attempts');
        return false;
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

    async connect() {
        let wsUrl;
        let httpUrl;

        // Check for production config
        if (window.JOI_CONFIG && window.JOI_CONFIG.BACKEND_URL && !window.JOI_CONFIG.BACKEND_URL.includes('your-backend')) {
            wsUrl = `${window.JOI_CONFIG.BACKEND_URL}/ws`;
            // Convert wss:// to https:// for health check
            httpUrl = window.JOI_CONFIG.BACKEND_URL.replace('wss://', 'https://').replace('ws://', 'http://');
        } else if (window.location.protocol === 'file:') {
            wsUrl = 'ws://localhost:8000/ws';
            httpUrl = 'http://localhost:8000';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            wsUrl = `ws://${window.location.host}/ws`;
            httpUrl = `http://${window.location.host}`;
        } else {
            console.error('Please configure BACKEND_URL in config.js');
            alert('Backend URL not configured. Please update config.js');
            return;
        }

        console.log('Waking up server:', httpUrl);
        this.updateConnectingMessage('Waking up server...');

        // First, wake up the server with an HTTP health check
        try {
            const healthResponse = await fetch(`${httpUrl}/health`, {
                method: 'GET',
                mode: 'cors',
            });

            if (healthResponse.ok) {
                console.log('Server is awake!');
                this.updateConnectingMessage('Server ready, connecting...');
            }
        } catch (error) {
            console.log('Health check failed, server may still be waking up:', error.message);
            this.updateConnectingMessage('Server is starting up...');

            // Wait and retry health check
            await this.waitForServer(httpUrl);
        }

        // Now connect via WebSocket
        console.log('Connecting WebSocket to:', wsUrl);
        this.updateConnectingMessage('Establishing connection...');

        try {
            this.ws = new WebSocket(wsUrl);
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.handleConnectionError();
            return;
        }

        // Set a connection timeout (60 seconds for Render cold start)
        this.connectionTimeout = setTimeout(() => {
            if (this.ws.readyState !== WebSocket.OPEN) {
                console.log('Connection timeout - server may be waking up');
                this.updateConnectingMessage('Server is waking up... Please wait');
            }
        }, 10000);

        this.ws.onopen = () => {
            clearTimeout(this.connectionTimeout);
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
            clearTimeout(this.connectionTimeout);
            console.log('WebSocket closed:', event.code, event.reason);
            this.status.textContent = 'offline';
            // Don't show overlay on disconnect if we have saved username
            // Just try to reconnect
            if (localStorage.getItem('joi_username')) {
                this.showConnectingOverlay('Reconnecting...');
                setTimeout(() => this.connect(), 3000);
            } else {
                this.handleConnectionError();
            }
        };

        this.ws.onerror = (error) => {
            clearTimeout(this.connectionTimeout);
            console.error('WebSocket error:', error);
            // Only handle error if we're not already connected
            if (this.ws.readyState !== WebSocket.OPEN) {
                this.handleConnectionError();
            }
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