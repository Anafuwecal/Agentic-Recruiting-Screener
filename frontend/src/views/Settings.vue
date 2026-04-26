<template>
  <div class="settings-page">
    <h2>Job Configuration</h2>

    <div class="settings-container">
      <div class="current-job" v-if="activeJob">
        <h3>Current Active Job</h3>
        <div class="job-display">
          <p><strong>Title:</strong> {{ activeJob.title }}</p>
          <p><strong>Created:</strong> {{ formatDate(activeJob.created_date) }}</p>
        </div>
      </div>

      <div class="job-form">
        <h3>{{ editMode ? 'Edit Job' : 'Create New Job' }}</h3>
        
        <div class="form-group">
          <label>Job Title</label>
          <input 
            v-model="formData.title" 
            type="text" 
            placeholder="e.g., Senior Full Stack Engineer"
          />
        </div>

        <div class="form-group">
          <label>Job Description (Optional)</label>
          <textarea 
            v-model="formData.description" 
            rows="4"
            placeholder="Brief description of the role..."
          ></textarea>
        </div>

        <div class="form-group">
          <label>Required Skills (comma-separated)</label>
          <input 
            v-model="requiredSkillsInput" 
            type="text" 
            placeholder="TypeScript, Node.js, React, AI/LLM"
          />
          <div class="tags" v-if="formData.required_skills.length">
            <span 
              v-for="skill in formData.required_skills" 
              :key="skill"
              class="tag"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Nice-to-Have Skills (comma-separated)</label>
          <input 
            v-model="niceToHaveInput" 
            type="text" 
            placeholder="VoltAgent, LangGraph, Python, Docker"
          />
          <div class="tags" v-if="formData.nice_to_have.length">
            <span 
              v-for="skill in formData.nice_to_have" 
              :key="skill"
              class="tag secondary"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Minimum Experience (years)</label>
          <input 
            v-model.number="formData.minimum_experience_years" 
            type="number" 
            min="0"
          />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input 
              v-model="formData.portfolio_required" 
              type="checkbox"
            />
            Portfolio Required
          </label>
        </div>

        <div class="form-actions">
          <button @click="saveJob" class="btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : (editMode ? 'Update Job' : 'Create Job') }}
          </button>
          <button @click="resetForm" class="btn-secondary" v-if="editMode">
            Cancel
          </button>
        </div>
      </div>

      <div class="webhook-config">
        <h3>Webhook Configuration</h3>
        <div class="webhook-info">
          <p>Configure your email service to send job applications to:</p>
          <div class="webhook-url">
            <code>{{ webhookUrl }}</code>
            <button @click="copyWebhook" class="btn-copy">
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <div class="webhook-instructions">
            <h4>Setup Instructions:</h4>
            <ol>
              <li>Create a Deliverhook account or similar email webhook service</li>
              <li>Configure forwarding from your job application email to the webhook above</li>
              <li>Test by sending an application email</li>
              <li>Monitor the dashboard for incoming applications</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
  const baseUrl = window.location.origin.replace('5173', '3141');
  return `${baseUrl}/webhook/email`;
});

watch(requiredSkillsInput, (val) => {
  formData.value.required_skills = val.split(',').map(s => s.trim()).filter(Boolean);
});

watch(niceToHaveInput, (val) => {
  formData.value.nice_to_have = val.split(',').map(s => s.trim()).filter(Boolean);
});

const formatDate = (date: string) => {
  return format(new Date(date), 'PPP');
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
      requiredSkillsInput.value = job.required_skills.join(', ');
      niceToHaveInput.value = job.nice_to_have.join(', ');
    }
  } catch (error) {
    console.error('Failed to load active job:', error);
  }
};

const saveJob = async () => {
  if (!formData.value.title.trim()) {
    alert('Please provide a job title');
    return;
  }

  if (formData.value.required_skills.length === 0) {
    alert('Please provide at least one required skill');
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
  }
};

onMounted(() => {
  loadActiveJob();
});
</script>

<style scoped>
.settings-page {
  max-width: 1000px;
}

.settings-page h2 {
  margin-bottom: 2rem;
  color: #667eea;
}

.settings-container {
  display: grid;
  gap: 2rem;
}

.current-job,
.job-form,
.webhook-config {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.current-job h3,
.job-form h3,
.webhook-config h3 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.75rem;
}

.job-display p {
  margin-bottom: 0.75rem;
  color: #4b5563;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  padding: 0.4rem 0.8rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tag.secondary {
  background: #dbeafe;
  color: #1e40af;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-right: 0.75rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #4b5563;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.webhook-info p {
  margin-bottom: 1rem;
  color: #4b5563;
}

.webhook-url {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.webhook-url code {
  flex: 1;
  padding: 1rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #1f2937;
}

.btn-copy {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-copy:hover {
  background: #5568d3;
}

.webhook-instructions {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.webhook-instructions h4 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.webhook-instructions ol {
  margin-left: 1.5rem;
  color: #4b5563;
  line-height: 1.8;
}

.webhook-instructions li {
  margin-bottom: 0.5rem;
}
</style>