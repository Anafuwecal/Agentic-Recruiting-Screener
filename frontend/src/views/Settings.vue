<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <h2>Job Configuration</h2>
        <p class="subtitle">Manage job postings and system settings</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Current Active Job -->
      <div class="settings-card current-job" v-if="activeJob">
        <div class="card-header">
          <div class="header-icon active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h3>Current Active Job</h3>
        </div>
        <div class="job-display">
          <div class="job-info">
            <div class="info-item">
              <strong>Title:</strong>
              <span>{{ activeJob.title }}</span>
            </div>
            <div class="info-item">
              <strong>Created:</strong>
              <span>{{ formatDate(activeJob.created_date) }}</span>
            </div>
            <div class="info-item">
              <strong>Required Skills:</strong>
              <div class="skills-preview">
                <span v-for="skill in activeJob.required_skills.slice(0, 3)" :key="skill" class="skill-badge">
                  {{ skill }}
                </span>
                <span v-if="activeJob.required_skills.length > 3" class="skill-badge more">
                  +{{ activeJob.required_skills.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Job Form -->
      <div class="settings-card job-form">
        <div class="card-header">
          <div class="header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <h3>{{ editMode ? 'Edit Job Posting' : 'Create New Job' }}</h3>
        </div>
        
        <form @submit.prevent="saveJob" class="form-content">
          <div class="form-group">
            <label for="title">
              Job Title
              <span class="required">*</span>
            </label>
            <input 
              id="title"
              v-model="formData.title" 
              type="text" 
              placeholder="e.g., Senior Full Stack Engineer"
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Job Description</label>
            <textarea 
              id="description"
              v-model="formData.description" 
              rows="4"
              placeholder="Brief description of the role and responsibilities..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="experience">
                Minimum Experience (years)
                <span class="required">*</span>
              </label>
              <input 
                id="experience"
                v-model.number="formData.minimum_experience_years" 
                type="number" 
                min="0"
                max="20"
                required
              />
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="formData.portfolio_required" 
                  type="checkbox"
                />
                <span class="checkbox-custom"></span>
                Portfolio/GitHub Required
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="required-skills">
              Required Skills
              <span class="required">*</span>
            </label>
            <div class="input-with-hint">
              <input 
                id="required-skills"
                v-model="requiredSkillsInput" 
                type="text" 
                placeholder="TypeScript, Node.js, React, AI/LLM"
                @blur="updateSkills('required')"
              />
              <span class="hint">Separate skills with commas</span>
            </div>
            <div class="tags" v-if="formData.required_skills.length">
              <span 
                v-for="(skill, index) in formData.required_skills" 
                :key="skill"
                class="tag"
              >
                {{ skill }}
                <button type="button" @click="removeSkill('required', index)" class="tag-remove">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="nice-to-have">Nice-to-Have Skills</label>
            <div class="input-with-hint">
              <input 
                id="nice-to-have"
                v-model="niceToHaveInput" 
                type="text" 
                placeholder="VoltAgent, LangGraph, Python, Docker"
                @blur="updateSkills('nice')"
              />
              <span class="hint">Optional skills that are a plus</span>
            </div>
            <div class="tags" v-if="formData.nice_to_have.length">
              <span 
                v-for="(skill, index) in formData.nice_to_have" 
                :key="skill"
                class="tag secondary"
              >
                {{ skill }}
                <button type="button" @click="removeSkill('nice', index)" class="tag-remove">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving || !isFormValid">
              <svg v-if="!isSaving" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              {{ isSaving ? 'Saving...' : (editMode ? 'Update Job' : 'Create Job') }}
            </button>
            <button type="button" @click="resetForm" class="btn-secondary" v-if="editMode">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Webhook Configuration -->
      <div class="settings-card webhook-config">
        <div class="card-header">
          <div class="header-icon webhook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h3>Email Webhook Configuration</h3>
        </div>
        
        <div class="webhook-content">
          <p class="webhook-description">
            Configure your email service to forward job applications to this webhook endpoint:
          </p>
          
          <div class="webhook-url-container">
            <div class="webhook-url">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              </svg>
              <code>{{ webhookUrl }}</code>
            </div>
            <button @click="copyWebhook" class="btn-copy" :class="{ copied }">
              <svg v-if="!copied" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <div class="webhook-instructions">
            <h4>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              Setup Instructions
            </h4>
            <ol>
              <li>
                <strong>Step 1:</strong> Create an account with an email webhook service (e.g., Deliverhook, Mailgun, SendGrid)
              </li>
              <li>
                <strong>Step 2:</strong> Configure email forwarding from your job application email address
              </li>
              <li>
                <strong>Step 3:</strong> Set the webhook URL above as the destination endpoint
              </li>
              <li>
                <strong>Step 4:</strong> Test by sending a sample application email
              </li>
              <li>
                <strong>Step 5:</strong> Monitor incoming applications in the Dashboard
              </li>
            </ol>
          </div>

          <div class="webhook-test">
            <h4>Test Webhook</h4>
            <p>Send a POST request to test the endpoint:</p>
            <div class="code-block">
              <code>
curl -X POST {{ webhookUrl }} \<br>
  -H "Content-Type: application/json" \<br>
  -d '{<br>
    "from": "test@example.com",<br>
    "subject": "Application for {{ activeJob?.title || 'Position' }}",<br>
    "text": "Your application text here..."<br>
  }'
              </code>
            </div>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="settings-card system-info">
        <div class="card-header">
          <div class="header-icon info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <h3>System Information</h3>
        </div>
        
        <div class="system-content">
          <div class="system-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <div>
              <strong>Server Status</strong>
              <span class="status-online">Online</span>
            </div>
          </div>
          <div class="system-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            <div>
              <strong>AI Provider</strong>
              <span>Groq (LLaMA 3.3)</span>
            </div>
          </div>
          <div class="system-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <strong>Database</strong>
              <span>Appwrite Cloud</span>
            </div>
          </div>
          <div class="system-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <div>
              <strong>Email Service</strong>
              <span>Gmail SMTP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiService, type Job } from '../services/api';
import { format } from 'date-fns';

const activeJob = ref<Job | null>(null);
const editMode = ref(false);
const isSaving = ref(false);
const copied = ref(false);

const formData = ref({
  title: '',
  description: '',
  required_skills: [] as string[],
  nice_to_have: [] as string[],
  minimum_experience_years: 2,
  portfolio_required: true,
  is_active: true,
});

const requiredSkillsInput = ref('');
const niceToHaveInput = ref('');

const webhookUrl = computed(() => {
  const port = window.location.port === '5173' ? '3141' : window.location.port;
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:${port}/webhook/email`;
});

const isFormValid = computed(() => {
  return formData.value.title.trim() && formData.value.required_skills.length > 0;
});

const formatDate = (date: string) => {
  return format(new Date(date), 'PPP');
};

const updateSkills = (type: 'required' | 'nice') => {
  if (type === 'required') {
    const skills = requiredSkillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    formData.value.required_skills = [...new Set([...formData.value.required_skills, ...skills])];
    requiredSkillsInput.value = '';
  } else {
    const skills = niceToHaveInput.value.split(',').map(s => s.trim()).filter(Boolean);
    formData.value.nice_to_have = [...new Set([...formData.value.nice_to_have, ...skills])];
    niceToHaveInput.value = '';
  }
};

const removeSkill = (type: 'required' | 'nice', index: number) => {
  if (type === 'required') {
    formData.value.required_skills.splice(index, 1);
  } else {
    formData.value.nice_to_have.splice(index, 1);
  }
};

const loadActiveJob = async () => {
  try {
    const job = await apiService.getActiveJob();
    if (job) {
      activeJob.value = job;
      editMode.value = true;
      formData.value = {
        title: job.title,
        description: job.description || '',
        required_skills: [...job.required_skills],
        nice_to_have: [...job.nice_to_have],
        minimum_experience_years: job.minimum_experience_years,
        portfolio_required: job.portfolio_required,
        is_active: true,
      };
    }
  } catch (error) {
    console.error('Failed to load active job:', error);
  }
};

const saveJob = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields');
    return;
  }

  isSaving.value = true;

  try {
    if (editMode.value && activeJob.value) {
      await apiService.updateJob(activeJob.value.$id, formData.value);
      alert('Job updated successfully!');
    } else {
      await apiService.createJob(formData.value);
      alert('Job created successfully!');
    }
    await loadActiveJob();
  } catch (error) {
    console.error('Failed to save job:', error);
    alert('Failed to save job. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  loadActiveJob();
};

const copyWebhook = async () => {
  try {
    await navigator.clipboard.writeText(webhookUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    alert('Failed to copy to clipboard');
  }
};

onMounted(() => {
  loadActiveJob();
});
</script>

<style scoped>
.settings-page {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  font-size: 2rem;
  color: var(--color-text-primary);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.settings-grid {
  display: grid;
  gap: 2rem;
}

.settings-card {
  background: var(--color-bg-primary);
  padding: 2rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border-light);
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.header-icon.active {
  background: #E8F5E9;
  color: var(--color-success);
}

.header-icon.webhook {
  background: #E0F2F1;
  color: #00796B;
}

.header-icon.info {
  background: #E3F2FD;
  color: #1976D2;
}

.card-header h3 {
  font-size: 1.35rem;
  color: var(--color-text-primary);
  font-weight: 700;
}

/* Job Display */
.job-display {
  background: var(--color-bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
}

.job-info {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.info-item strong {
  min-width: 140px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.info-item span {
  color: var(--color-text-primary);
}

.skills-preview {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.skill-badge {
  padding: 0.35rem 0.75rem;
  background: #F5E6D3;
  color: var(--color-primary-dark);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

.skill-badge.more {
  background: var(--color-bg-tertiary);
  color: var(--color-text-light);
}

/* Form */
.form-content {
  display: grid;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.required {
  color: var(--color-danger);
  margin-left: 0.25rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: inherit;
  transition: var(--transition);
  background: var(--color-bg-secondary);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.input-with-hint {
  position: relative;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

.checkbox-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.875rem 1.25rem;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  transition: var(--transition);
}

.checkbox-label:hover {
  border-color: var(--color-primary-light);
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  position: relative;
  transition: var(--transition);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  background: #F5E6D3;
  color: var(--color-primary-dark);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

.tag.secondary {
  background: #E8EAF6;
  color: #3F51B5;
}

.tag-remove {
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: inherit;
  opacity: 0.6;
  transition: var(--transition);
}

.tag-remove:hover {
  opacity: 1;
  transform: scale(1.2);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--color-border-light);
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  background: var(--color-border);
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 2px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary-light);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Webhook */
.webhook-content {
  display: grid;
  gap: 1.5rem;
}

.webhook-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.webhook-url-container {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.webhook-url {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
}

.webhook-url svg {
  color: var(--color-primary-light);
  flex-shrink: 0;
}

.webhook-url code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  word-break: break-all;
}

.btn-copy {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-copy:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-copy.copied {
  background: var(--color-success);
}

.webhook-instructions {
  background: var(--color-bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.webhook-instructions h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.webhook-instructions h4 svg {
  color: var(--color-primary);
}

.webhook-instructions ol {
  margin-left: 1.5rem;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.webhook-instructions li {
  margin-bottom: 0.75rem;
}

.webhook-instructions strong {
  color: var(--color-text-primary);
}

.webhook-test {
  background: var(--color-bg-tertiary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
}

.webhook-test h4 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.webhook-test p {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.code-block {
  background: var(--color-bg-dark);
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  overflow-x: auto;
}

.code-block code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #A89080;
  line-height: 1.6;
}

/* System Info */
.system-content {
  display: grid;
  gap: 1rem;
}

.system-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.system-item svg {
  color: var(--color-primary-light);
  flex-shrink: 0;
}

.system-item div {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.system-item strong {
  color: var(--color-text-secondary);
  font-weight: 600;
  min-width: 120px;
}

.system-item span {
  color: var(--color-text-primary);
}

.status-online {
  padding: 0.25rem 0.75rem;
  background: #E8F5E9;
  color: var(--color-success);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .settings-card {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .webhook-url-container {
    flex-direction: column;
  }
  
  .btn-copy {
    width: 100%;
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 1.5rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .info-item strong {
    min-width: unset;
  }
  
  .system-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .system-item div {
    width: 100%;
  }
}
</style>