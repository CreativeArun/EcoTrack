// ============================================
// EcoTrack Chatbot Integration
// ============================================

class EcoTrackChatbot {
    constructor() {
        this.chatWindow = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.quickActionsContainer = null;
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];
        this.apiEndpoint = 'http://localhost:3001/chat';
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupChatbot());
        } else {
            this.setupChatbot();
        }
    }

    setupChatbot() {
        // Get DOM elements
        this.chatWindow = document.getElementById('chatbot-window');
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.inputField = document.getElementById('chatbot-input');
        this.sendButton = document.getElementById('chatbot-send');
        this.quickActionsContainer = document.getElementById('quick-actions');
        
        // Bind event listeners
        this.bindEvents();
        
        // Show welcome message
        this.showWelcomeMessage();
        
        // Update quick actions based on active tab
        this.updateQuickActions();
    }

    bindEvents() {
        // Toggle chat window
        const toggleButton = document.getElementById('chatbot-toggle');
        toggleButton?.addEventListener('click', () => this.toggleChat());
        
        // Close chat window
        const closeButton = document.getElementById('chatbot-close');
        closeButton?.addEventListener('click', () => this.closeChat());
        
        // Send message on button click
        this.sendButton?.addEventListener('click', () => this.handleSendMessage());
        
        // Send message on Enter key
        this.inputField?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Listen for tab changes to update quick actions
        const tabs = document.querySelectorAll('#tabs button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setTimeout(() => this.updateQuickActions(), 100);
            });
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.chatWindow?.classList.add('active');
        this.isOpen = true;
        this.inputField?.focus();
        
        // Remove notification badge if exists
        const badge = document.querySelector('.chatbot-badge');
        if (badge) badge.style.display = 'none';
    }

    closeChat() {
        this.chatWindow?.classList.remove('active');
        this.isOpen = false;
    }

    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="welcome-message">
                <h4>👋 Welcome to EcoBot!</h4>
                <p>I'm here to help you with waste management queries. Ask me anything!</p>
            </div>
        `;
        this.messagesContainer.innerHTML = welcomeHTML;
    }

    updateQuickActions() {
        if (!this.quickActionsContainer) return;
        
        // Determine which tab is active
        const activeTab = document.querySelector('#tabs button.active');
        const tabType = activeTab?.getAttribute('data-tab') || 'admin';
        
        let suggestions = [];
        
        switch(tabType) {
            case 'admin':
                suggestions = [
                    'Show latest route deviations',
                    'Environmental impact summary',
                    'Generate weekly report'
                ];
                break;
            case 'worker':
                suggestions = [
                    "What's my next task?",
                    'How do I mark task complete?',
                    'Show my route map'
                ];
                break;
            case 'citizen':
                suggestions = [
                    'How do I report an issue?',
                    'Check my Green Points',
                    'What rewards can I redeem?'
                ];
                break;
        }
        
        // Render quick action buttons
        this.quickActionsContainer.innerHTML = suggestions.map(suggestion => 
            `<button class="quick-action-btn" onclick="ecoBot.sendQuickAction('${suggestion}')">${suggestion}</button>`
        ).join('');
    }

    sendQuickAction(message) {
        this.inputField.value = message;
        this.handleSendMessage();
    }

    async handleSendMessage() {
        const message = this.inputField?.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Clear input
        this.inputField.value = '';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to API
            const response = await this.sendToAPI(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(response, 'bot');
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addErrorMessage('Sorry, I encountered an error. Please try again.');
        }
    }

    async sendToAPI(message) {
        this.isTyping = true;
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            this.conversationHistory.push({ user: message, bot: data.reply });
            
            return data.reply || "I'm sorry, I couldn't generate a response.";
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        } finally {
            this.isTyping = false;
        }
    }

    addMessage(text, type = 'bot') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        const avatar = type === 'bot' ? '🌱' : '👤';
        const time = this.getCurrentTime();
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div>
                <div class="message-content">${this.escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addErrorMessage(text) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = text;
        
        this.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">🌱</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chatbot when script loads
let ecoBot;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ecoBot = new EcoTrackChatbot();
    });
} else {
    ecoBot = new EcoTrackChatbot();
}
