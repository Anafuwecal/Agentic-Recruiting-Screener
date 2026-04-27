<template>
  <div class="candidates-page">
    <div class="page-header">
      <div>
        <h2>Candidate Management</h2>
        <p class="subtitle">Review and manage all applicants</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search candidates..."
          />
        </div>
        <button @click="loadCandidates" class="refresh-btn" :disabled="loading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: loading }">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="filters">
      <button 
        v-for="status in statusOptions" 
        :key="status.value"
        @click="selectedStatus = status.value"
        :class="['filter-btn', { active: selectedStatus === status.value }]"
      >
        <span class="filter-dot" :class="status.value.toLowerCase()"></span>
        {{ status.label }}
        <span class="filter-count" v-if="getStatusCount(status.value)">
          {{ getStatusCount(status.value) }}
        </span>
      </button>
    </div>

    <div class="candidates-grid" v-if="filteredCandidates.length">
      <div 
        v-for="candidate in filteredCandidates" 
        :key="candidate.$id"
        class="candidate-detail-card"
      >
        <div class="card-header">
          <div class="candidate-avatar">
            {{ getInitials(candidate.name) }}
          </div>
          <div class="candidate-title">
            <h3>{{ candidate.name }}</h3>
            <p class="email">{{ candidate.email }}</p>
            <p class="phone" v-if="candidate.phone">{{ candidate.phone }}</p>
          </div>
          <span class="status-badge" :class="candidate.status.toLowerCase()">
            {{ formatStatus(candidate.status) }}
          </span>
        </div>

        <div class="score-section">
          <div class="total-score">
            <div class="score-circle" :class="getScoreClass(candidate.total_score)">
              <span class="score-value">{{ candidate.total_score }}</span>
              <span class="score-max">/100</span>
            </div>
            <span class="score-label">Total Score</span>
          </div>
          <div class="score-breakdown">
            <div class="score-item">
              <div class="score-item-header">
                <span class="score-item-label">Intake</span>
                <span class="score-item-value">{{ candidate.intake_score }}/30</span>
              </div>
              <div class="score-bar">
                <div 
                  class="score-fill" 
                  :style="{ width: `${(candidate.intake_score / 30) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="score-item">
              <div class="score-item-header">
                <span class="score-item-label">Research</span>
                <span class="score-item-value">{{ candidate.research_score }}/30</span>
              </div>
              <div class="score-bar">
                <div 
                  class="score-fill" 
                  :style="{ width: `${(candidate.research_score / 30) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="score-item">
              <div class="score-item-header">
                <span class="score-item-label">Screener</span>
                <span class="score-item-value">{{ candidate.screener_score }}/40</span>
              </div>
              <div class="score-bar">
                <div 
                  class="score-fill" 
                  :style="{ width: `${(candidate.screener_score / 40) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="candidate-info">
          <div class="info-section">
            <div class="info-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div>
                <strong>Experience:</strong>
                <span>{{ candidate.experience_years }} years</span>
              </div>
            </div>
            <div class="info-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div>
                <strong>Stage:</strong>
                <span>{{ candidate.current_stage }}</span>
              </div>
            </div>
            <div class="info-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div>
                <strong>Applied:</strong>
                <span>{{ formatDate(candidate.application_date) }}</span>
              </div>
            </div>
          </div>

          <div class="info-section" v-if="candidate.skills.length">
            <div class="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Skills
            </div>
            <div class="skills-tags">
              <span v-for="skill in candidate.skills.slice(0, 8)" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
              <span v-if="candidate.skills.length > 8" class="skill-tag more">
                +{{ candidate.skills.length - 8 }} more
              </span>
            </div>
          </div>
        </div>

        <div class="candidate-links" v-if="candidate.github_url || candidate.portfolio_url || candidate.linkedin_url">
          <a v-if="candidate.github_url" :href="candidate.github_url" target="_blank" class="link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <a v-if="candidate.portfolio_url" :href="candidate.portfolio_url" target="_blank" class="link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Portfolio
          </a>
          <a v-if="candidate.linkedin_url" :href="candidate.linkedin_url" target="_blank" class="link-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </a>
        </div>

        <div v-if="candidate.interview_scheduled" class="interview-info">
          <div class="info-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h4>Interview Scheduled</h4>
          </div>
          <p class="interview-time">{{ formatDate(candidate.interview_datetime!) }}</p>
          <a v-if="candidate.interview_meet_link" :href="candidate.interview_meet_link" target="_blank" class="meet-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Join Google Meet
          </a>
        </div>

        <div v-if="candidate.rejection_reason" class="rejection-info">
          <div class="info-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h4>Rejection Reason</h4>
          </div>
          <p>{{ candidate.rejection_reason }}</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <h4>No Candidates Found</h4>
      <p v-if="selectedStatus">No candidates with status: {{ formatStatus(selectedStatus) }}</p>
      <p v-else-if="searchQuery">No candidates match your search</p>
      <p v-else>Waiting for applications...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { apiService, type Candidate } from '../services/api';
import { format } from 'date-fns';

const candidates = ref<Candidate[]>([]);
const selectedStatus = ref<string>('');
const searchQuery = ref<string>('');
const loading = ref(false);
let refreshInterval: any = null;

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Human Review', value: 'HUMAN_REVIEW' },
];

const filteredCandidates = computed(() => {
  let result = candidates.value;
  
  if (selectedStatus.value) {
    result = result.filter(c => c.status === selectedStatus.value);
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.skills.some(s => s.toLowerCase().includes(query))
    );
  }
  
  return result;
});

const getStatusCount = (status: string) => {
  if (!status) return candidates.value.length;
  return candidates.value.filter(c => c.status === status).length;
};

const formatDate = (date: string) => {
  return format(new Date(date), 'PPpp');
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ');
};

const getScoreClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const loadCandidates = async () => {
  loading.value = true;
  try {
    candidates.value = await apiService.getCandidates();
  } catch (error) {
    console.error('Failed to load candidates:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCandidates();
  refreshInterval = setInterval(loadCandidates, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.candidates-page {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  color: var(--color-text-light);
}

.search-box input {
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--color-bg-primary);
  transition: var(--transition);
  width: 250px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

.refresh-btn {
  padding: 0.75rem;
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

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border: 2px solid var(--color-border);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.filter-btn:hover {
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.filter-dot.processing { background: var(--color-warning); }
.filter-dot.accepted { background: var(--color-success); }
.filter-dot.rejected { background: var(--color-danger); }
.filter-dot.human_review { background: var(--color-info); }

.filter-count {
  padding: 0.15rem 0.5rem;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
}

.filter-btn.active .filter-count {
  background: rgba(255,255,255,0.25);
}

.candidates-grid {
  display: grid;
  gap: 1.5rem;
}

.candidate-detail-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: var(--transition);
}

.candidate-detail-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border-light);
}

.candidate-avatar {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.candidate-title {
  flex: 1;
}

.candidate-title h3 {
  font-size: 1.4rem;
  color: var(--color-text-primary);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.email {
  color: var(--color-text-light);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.phone {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.5rem 1.1rem;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-badge.processing { background: #FFE4B5; color: #8B6914; }
.status-badge.accepted { background: #E8F5E9; color: #2E7D32; }
.status-badge.rejected { background: #FFEBEE; color: #C62828; }
.status-badge.human_review { background: #E8EAF6; color: #3F51B5; }

.score-section {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2.5rem;
  margin-bottom: 1.5rem;
  padding: 1.75rem;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.total-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  position: relative;
}

.score-value {
  font-size: 2.25rem;
  line-height: 1;
}

.score-max {
  font-size: 1rem;
  opacity: 0.8;
}

.score-circle.high { background: linear-gradient(135deg, var(--color-success), #8BC34A); }
.score-circle.medium { background: linear-gradient(135deg, var(--color-warning), #FFB74D); }
.score-circle.low { background: linear-gradient(135deg, var(--color-danger), #D84315); }

.score-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  justify-content: center;
}

.score-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.score-item-label {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.score-item-value {
  font-weight: 700;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.score-bar {
  height: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 6px;
  transition: width 0.6s ease;
}

.candidate-info {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-section {
  display: grid;
  gap: 1rem;
}

.info-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.75rem;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.info-row svg {
  color: var(--color-primary-light);
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.info-row div {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.95rem;
}

.info-row strong {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.info-row span {
  color: var(--color-text-primary);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.section-title svg {
  color: var(--color-primary-light);
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  padding: 0.4rem 0.9rem;
  background: #F5E6D3;
  color: var(--color-primary-dark);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

.skill-tag.more {
  background: var(--color-bg-tertiary);
  color: var(--color-text-light);
  border: 1px dashed var(--color-border);
}

.candidate-links {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.link-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--transition);
}

.link-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.interview-info,
.rejection-info {
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 2px solid;
}

.interview-info {
  background: #F1F8E9;
  border-color: var(--color-success);
}

.rejection-info {
  background: #FFF3E0;
  border-color: var(--color-danger);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.info-header h4 {
  font-size: 1rem;
  font-weight: 600;
}

.interview-info .info-header {
  color: var(--color-success);
}

.rejection-info .info-header {
  color: var(--color-danger);
}

.interview-time {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.meet-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: var(--color-success);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--transition);
}

.meet-link:hover {
  background: #558B2F;
  transform: translateY(-1px);
}

.rejection-info p {
  color: var(--color-text-primary);
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}

.empty-state svg {
  margin-bottom: 1.5rem;
  opacity: 0.3;
  color: var(--color-text-light);
}

.empty-state h4 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-text-light);
}

/* Responsive */
@media (max-width: 1024px) {
  .score-section {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .total-score {
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filters {
    padding: 1rem;
  }
  
  .candidate-detail-card {
    padding: 1.5rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .candidate-avatar {
    width: 50px;
    height: 50px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .filters {
    gap: 0.5rem;
  }
  
  .filter-btn {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }
  
  .score-circle {
    width: 80px;
    height: 80px;
  }
  
  .score-value {
    font-size: 1.75rem;
  }
  
  .candidate-links {
    flex-direction: column;
  }
  
  .link-btn {
    justify-content: center;
  }
}
</style>