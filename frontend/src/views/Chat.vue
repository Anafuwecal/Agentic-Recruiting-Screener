<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="chat-header">
        <div class="header-content">
          <div class="orchestrator-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h2>Orchestrator Assistant</h2>
            <p class="status">
              <span class="status-dot"></span>
              Online and ready
            </p>
          </div>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div class="welcome-message" v-if="messages.length === 0">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3>Welcome to Orchestrator Chat</h3>
          <p>Ask me anything about your recruitment pipeline, candidates, or job settings.</p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['message', msg.sender.toLowerCase()]"
        >
          <div class="message-avatar" v-if="msg.sender === 'ORCHESTRATOR'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="message-header">
              <strong>{{ msg.sender === 'EMPLOYER' ? 'You' : 'Orchestrator' }}</strong>
              <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="message-text">
              {{ msg.message }}
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="message orchestrator">
          <div class="message-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="message-header">
              <strong>Orchestrator</strong>
            </div>
            <div class="message-text typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <div class="quick-actions-label">Quick Actions:</div>
        <div class="action-buttons">
          <button @click="quickMessage('How many candidates do we have?')" class="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
            Candidate Count
          </button>
          <button @click="quickMessage('List candidates awaiting review')" class="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Pending Reviews
          </button>
          <button @click="quickMessage('Show accepted candidates')" class="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Accepted
          </button>
          <button @click="quickMessage('Any new applications today?')" class="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            New Apps
          </button>
          <button @click="quickMessage('Help')" class="action-btn help">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Help
          </button>
        </div>
      </div>

      <div class="chat-input">
        <textarea 
          v-model="currentMessage"
          @keydown.enter.exact.prevent="sendMessage"
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          :disabled="isLoading"
          rows="1"
          ref="messageInput"
        ></textarea>
        <button @click="sendMessage" :disabled="!currentMessage.trim() || isLoading" class="send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { apiService, type ChatMessage } from '../services/api';
import { format } from 'date-fns';

const messages = ref<ChatMessage[]>([]);
const currentMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);

const formatTime = (timestamp: string) => {
  return format(new Date(timestamp), 'HH:mm');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const loadHistory = async () => {
  try {
    messages.value = await apiService.getChatHistory();
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
};

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isLoading.value) return;

  const userMessage = currentMessage.value.trim();
  currentMessage.value = '';

  messages.value.push({
    sender: 'EMPLOYER',
    message: userMessage,
    timestamp: new Date().toISOString(),
  });

  scrollToBottom();
  isLoading.value = true;

  try {
    const response = await apiService.sendMessage(userMessage);
    
    messages.value.push({
      sender: 'ORCHESTRATOR',
      message: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    messages.value.push({
      sender: 'ORCHESTRATOR',
      message: 'Sorry, I encountered an error processing your request. Please try again.',
      timestamp: new Date().toISOString(),
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

const quickMessage = (message: string) => {
  currentMessage.value = message;
  sendMessage();
};

onMounted(() => {
  loadHistory();
  if (messageInput.value) {
    messageInput.value.focus();
  }
});
</script>

<style scoped>
.chat-page {
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-container {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
  border: 1px solid var(--color-border);
}

.chat-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.orchestrator-avatar {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  opacity: 0.95;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4CAF50;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: var(--color-bg-secondary);
  scroll-behavior: smooth;
}

.welcome-message {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-light);
}

.welcome-message svg {
  margin-bottom: 1rem;
  opacity: 0.4;
}

.welcome-message h3 {
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.welcome-message p {
  font-size: 1rem;
  line-height: 1.6;
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.employer {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  min-width: 200px;
}

.message.employer .message-content {
  margin-left: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.message.employer .message-header strong {
  color: var(--color-primary);
}

.message.orchestrator .message-header strong {
  color: var(--color-success);
}

.timestamp {
  color: var(--color-text-light);
  font-size: 0.75rem;
}

.message-text {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.95rem;
}

.message.employer .message-text {
  background: var(--color-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.orchestrator .message-text {
  background: white;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 4px;
}

.message-text.typing {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
}

.message-text.typing span {
  width: 8px;
  height: 8px;
  background: var(--color-text-light);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.message-text.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.message-text.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.quick-actions {
  padding: 1rem 2rem;
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border);
}

.quick-actions-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  color: var(--color-text-secondary);
}

.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: white;
  transform: translateY(-1px);
}

.action-btn.help {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.action-btn.help:hover {
  background: var(--color-accent);
  color: white;
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: white;
  border-top: 2px solid var(--color-border);
}

.chat-input textarea {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: var(--transition);
  resize: none;
  max-height: 120px;
  min-height: 44px;
}

.chat-input textarea:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.send-btn {
  padding: 0.875rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.send-btn:disabled {
  background: var(--color-border);
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 140px);
  }
  
  .chat-header {
    padding: 1rem;
  }
  
  .chat-header h2 {
    font-size: 1.25rem;
  }
  
  .orchestrator-avatar {
    width: 40px;
    height: 40px;
  }
  
  .chat-messages {
    padding: 1.5rem 1rem;
  }
  
  .message-content {
    max-width: 85%;
    min-width: 150px;
  }
  
  .quick-actions {
    padding: 1rem;
  }
  
  .action-buttons {
    gap: 0.4rem;
  }
  
  .action-btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .chat-input {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .message-avatar {
    width: 32px;
    height: 32px;
  }
  
  .message-content {
    max-width: 80%;
  }
  
  .action-btn svg {
    display: none;
  }
}
</style>