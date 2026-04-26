<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="chat-header">
        <h2>Chat with Orchestrator</h2>
        <p>Ask about candidates, schedule interviews, or manage applications</p>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['message', msg.sender.toLowerCase()]"
        >
          <div class="message-header">
            <strong>{{ msg.sender === 'EMPLOYER' ? 'You' : 'Orchestrator' }}</strong>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-content">
            {{ msg.message }}
          </div>
        </div>

        <div v-if="isLoading" class="message orchestrator">
          <div class="message-header">
            <strong>Orchestrator</strong>
          </div>
          <div class="message-content typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input 
          v-model="currentMessage"
          @keyup.enter="sendMessage"
          placeholder="Type your message... (e.g., 'How many candidates?', 'List accepted candidates')"
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="!currentMessage.trim() || isLoading">
          Send
        </button>
      </div>

      <div class="quick-actions">
        <h4>Quick Actions:</h4>
        <div class="action-buttons">
          <button @click="quickMessage('How many candidates do we have?')">
            Candidate Count
          </button>
          <button @click="quickMessage('List candidates awaiting review')">
            Pending Reviews
          </button>
          <button @click="quickMessage('Show accepted candidates')">
            Accepted Candidates
          </button>
          <button @click="quickMessage('Any new applications today?')">
            New Applications
          </button>
          <button @click="quickMessage('Help')">
            Help
          </button>
        </div>
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

  const userMessage = currentMessage.value;
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
});
</script>

<style scoped>
.chat-page {
  max-width: 900px;
  margin: 0 auto;
}

.chat-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.chat-header h2 {
  margin-bottom: 0.5rem;
}

.chat-header p {
  opacity: 0.9;
  font-size: 0.9rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f9fafb;
}

.message {
  margin-bottom: 1.5rem;
  max-width: 80%;
}

.message.employer {
  margin-left: auto;
}

.message.orchestrator {
  margin-right: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.message.employer .message-header strong {
  color: #667eea;
}

.message.orchestrator .message-header strong {
  color: #10b981;
}

.timestamp {
  color: #9ca3af;
  font-size: 0.75rem;
}

.message-content {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.message.employer .message-content {
  background: #667eea;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.orchestrator .message-content {
  background: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.message-content.typing {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
}

.message-content.typing span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.message-content.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.message-content.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input {
  display: flex;
  padding: 1.5rem;
  background: white;
  border-top: 2px solid #e5e7eb;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.chat-input input:focus {
  border-color: #667eea;
}

.chat-input button {
  margin-left: 1rem;
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.chat-input button:hover:not(:disabled) {
  background: #5568d3;
}

.chat-input button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.quick-actions {
  padding: 1.5rem;
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.quick-actions h4 {
  margin-bottom: 1rem;
  color: #4b5563;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.action-buttons button:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f4ff;
}
</style>