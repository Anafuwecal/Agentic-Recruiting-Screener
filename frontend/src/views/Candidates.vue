<template>
  <div class="candidates-page">
    <div class="page-header">
      <h2>Candidate Management</h2>
      <div class="filters">
        <button 
          v-for="status in statusOptions" 
          :key="status.value"
          @click="selectedStatus = status.value"
          :class="['filter-btn', { active: selectedStatus === status.value }]"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <div class="candidates-grid" v-if="filteredCandidates.length">
      <div 
        v-for="candidate in filteredCandidates" 
        :key="candidate.$id"
        class="candidate-detail-card"
      >
        <div class="card-header">
          <div>
            <h3>{{ candidate.name }}</h3>
            <p class="email">{{ candidate.email }}</p>
          </div>
          <span class="status-badge" :class="candidate.status.toLowerCase()">
            {{ candidate.status.replace('_', ' ') }}
          </span>
        </div>

        <div class="score-section">
          <div class="total-score">
            <div class="score-circle" :class="getScoreClass(candidate.total_score)">
              {{ candidate.total_score }}
            </div>
            <span>Total Score</span>
          </div>
          <div class="score-breakdown">
            <div class="score-item">
              <span>Intake</span>
              <div class="score-bar">
                <div 
                  class="score-fill" 
                  :style="{ width: `${(candidate.intake_score / 30) * 100}%` }"
                ></div>
              </div>
              <span>{{ candidate.intake_score }}/30</span>
            </div>
            <div class="score-item">
              <span>Research</span>
              <div class="score-bar">
                <div 
                  class="score-fill" 
                  :style="{ width: `${(candidate.research_score / 30) * 100}%` }"
                ></div>
              </div>
              <span>{{ candidate.research_score }}/30</span>
            </div>
            <div class="score-item">
              <span>Screener</span>
              <div class="score-bar">
                <div 
                  class="score-fill" 
                  :style="{ width: `${(candidate.screener_score / 40) * 100}%` }"
                ></div>
              </div>
              <span>{{ candidate.screener_score }}/40</span>
            </div>
          </div>
        </div>

        <div class="candidate-info">
          <div class="info-row">
            <strong>Skills:</strong>
            <div class="skills-tags">
              <span v-for="skill in candidate.skills.slice(0, 5)" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
            </div>
          </div>
          <div class="info-row">
            <strong>Experience:</strong>
            <span>{{ candidate.experience_years }} years</span>
          </div>
          <div class="info-row">
            <strong>Stage:</strong>
            <span>{{ candidate.current_stage }}</span>
          </div>
          <div class="info-row">
            <strong>Applied:</strong>
            <span>{{ formatDate(candidate.application_date) }}</span>
          </div>
        </div>

        <div class="candidate-links" v-if="candidate.github_url || candidate.portfolio_url">
          <a v-if="candidate.github_url" :href="candidate.github_url" target="_blank" class="link-btn">
            GitHub
          </a>
          <a v-if="candidate.portfolio_url" :href="candidate.portfolio_url" target="_blank" class="link-btn">
            Portfolio
          </a>
        </div>

        <div v-if="candidate.interview_scheduled" class="interview-info">
          <h4>Interview Scheduled</h4>
          <p><strong>Time:</strong> {{ formatDate(candidate.interview_datetime!) }}</p>
          <a v-if="candidate.interview_meet_link" :href="candidate.interview_meet_link" target="_blank" class="meet-link">
            Join Google Meet
          </a>
        </div>

        <div v-if="candidate.rejection_reason" class="rejection-info">
          <h4>Rejection Reason</h4>
          <p>{{ candidate.rejection_reason }}</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No candidates found with status: {{ selectedStatus || 'All' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiService, type Candidate } from '../services/api';
import { format } from 'date-fns';

const candidates = ref<Candidate[]>([]);
const selectedStatus = ref<string>('');

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Human Review', value: 'HUMAN_REVIEW' },
];

const filteredCandidates = computed(() => {
  if (!selectedStatus.value) return candidates.value;
  return candidates.value.filter(c => c.status === selectedStatus.value);
});

const formatDate = (date: string) => {
  return format(new Date(date), 'PPpp');
};

const getScoreClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const loadCandidates = async () => {
  try {
    candidates.value = await apiService.getCandidates();
  } catch (error) {
    console.error('Failed to load candidates:', error);
  }
};

onMounted(() => {
  loadCandidates();
  setInterval(loadCandidates, 30000);
});
</script>

<style scoped>
.candidates-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h2 {
  color: #667eea;
}

.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.candidates-grid {
  display: grid;
  gap: 1.5rem;
}

.candidate-detail-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-left: 6px solid #667eea;
}

.candidate-detail-card.accepted { border-left-color: #10b981; }
.candidate-detail-card.rejected { border-left-color: #ef4444; }
.candidate-detail-card.human_review { border-left-color: #8b5cf6; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.card-header h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.card-header .email {
  color: #6b7280;
  font-size: 0.95rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.processing { background: #fef3c7; color: #92400e; }
.status-badge.accepted { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.status-badge.human_review { background: #ede9fe; color: #5b21b6; }

.score-section {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.total-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.score-circle.high { background: #10b981; }
.score-circle.medium { background: #f59e0b; }
.score-circle.low { background: #ef4444; }

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
}

.score-item {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  align-items: center;
  gap: 1rem;
}

.score-item span:first-child {
  font-weight: 600;
  color: #4b5563;
}

.score-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 6px;
  transition: width 0.3s;
}

.candidate-info {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.info-row strong {
  min-width: 100px;
  color: #374151;
}

.skills-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.skill-tag {
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.candidate-links {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.link-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.3s;
}

.link-btn:hover {
  background: #5568d3;
}

.interview-info,
.rejection-info {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
}

.interview-info {
  background: #d1fae5;
  border: 1px solid #10b981;
}

.interview-info h4 {
  color: #065f46;
  margin-bottom: 0.5rem;
}

.interview-info p {
  color: #047857;
  margin-bottom: 0.5rem;
}

.meet-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  margin-top: 0.5rem;
}

.rejection-info {
  background: #fee2e2;
  border: 1px solid #ef4444;
}

.rejection-info h4 {
  color: #991b1b;
  margin-bottom: 0.5rem;
}

.rejection-info p {
  color: #b91c1c;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #9ca3af;
  background: white;
  border-radius: 12px;
}
</style>