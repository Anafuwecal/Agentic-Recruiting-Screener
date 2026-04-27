<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h2>Recruitment Dashboard</h2>
        <p class="subtitle">Monitor and manage your hiring pipeline</p>
      </div>
      <button @click="loadData" class="refresh-btn" :disabled="loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: loading }">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>
    
    <div class="stats-grid" v-if="stats">
      <div class="stat-card total">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total Applications</div>
        </div>
      </div>
      
      <div class="stat-card processing">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.processing }}</div>
          <div class="stat-label">Processing</div>
        </div>
      </div>
      
      <div class="stat-card accepted">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.accepted }}</div>
          <div class="stat-label">Accepted</div>
        </div>
      </div>
      
      <div class="stat-card rejected">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.rejected }}</div>
          <div class="stat-label">Rejected</div>
        </div>
      </div>
      
      <div class="stat-card review">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.human_review }}</div>
          <div class="stat-label">Awaiting Review</div>
        </div>
      </div>
      
      <div class="stat-card interviewed">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.interviewed }}</div>
          <div class="stat-label">Interviewed</div>
        </div>
      </div>
    </div>

    <div class="recent-section">
      <div class="section-header">
        <h3>Recent Applications</h3>
        <router-link to="/candidates" class="view-all-link">
          View All
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>
      </div>
      
      <div class="candidate-list" v-if="recentCandidates.length">
        <div 
          v-for="candidate in recentCandidates" 
          :key="candidate.$id"
          class="candidate-card"
          :class="candidate.status.toLowerCase()"
        >
          <div class="candidate-header">
            <div class="candidate-info">
              <h4>{{ candidate.name }}</h4>
              <p class="email">{{ candidate.email }}</p>
            </div>
            <span class="status-badge" :class="candidate.status.toLowerCase()">
              {{ formatStatus(candidate.status) }}
            </span>
          </div>
          
          <div class="candidate-details">
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span><strong>Score:</strong> {{ candidate.total_score }}/100</span>
            </div>
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span><strong>Stage:</strong> {{ candidate.current_stage }}</span>
            </div>
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span><strong>Applied:</strong> {{ formatDate(candidate.application_date) }}</span>
            </div>
          </div>

          <div class="score-bar-container">
            <div class="score-bar">
              <div 
                class="score-fill" 
                :class="getScoreClass(candidate.total_score)"
                :style="{ width: `${candidate.total_score}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h4>No Applications Yet</h4>
        <p>Waiting for candidates to apply...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { apiService, type Candidate } from '../services/api';
import { format } from 'date-fns';

const stats = ref<any>(null);
const recentCandidates = ref<Candidate[]>([]);
const loading = ref(false);
let refreshInterval: any = null;

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, HH:mm');
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ');
};

const getScoreClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const loadData = async () => {
  loading.value = true;
  try {
    stats.value = await apiService.getStats();
    const candidates = await apiService.getCandidates();
    recentCandidates.value = candidates.slice(0, 10);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
  refreshInterval = setInterval(loadData, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.dashboard {
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

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
  font-size: 0.9rem;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: var(--color-bg-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.total .stat-icon { background: #F5E6D3; color: var(--color-primary); }
.stat-card.processing .stat-icon { background: #FFE4B5; color: var(--color-warning); }
.stat-card.accepted .stat-icon { background: #E8F5E9; color: var(--color-success); }
.stat-card.rejected .stat-icon { background: #FFEBEE; color: var(--color-danger); }
.stat-card.review .stat-icon { background: #E8EAF6; color: var(--color-info); }
.stat-card.interviewed .stat-icon { background: #E0F2F1; color: #00796B; }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.recent-section {
  background: var(--color-bg-primary);
  padding: 2rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border-light);
}

.section-header h3 {
  font-size: 1.5rem;
  color: var(--color-text-primary);
  font-weight: 600;
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--transition);
}

.view-all-link:hover {
  color: var(--color-primary-dark);
  gap: 0.5rem;
}

.candidate-list {
  display: grid;
  gap: 1rem;
}

.candidate-card {
  background: var(--color-bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
  transition: var(--transition);
}

.candidate-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.candidate-card.accepted { border-left-color: var(--color-success); }
.candidate-card.rejected { border-left-color: var(--color-danger); }
.candidate-card.human_review { border-left-color: var(--color-info); }
.candidate-card.processing { border-left-color: var(--color-warning); }

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.candidate-info h4 {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.email {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-badge.processing { background: #FFE4B5; color: #8B6914; }
.status-badge.accepted { background: #E8F5E9; color: #2E7D32; }
.status-badge.rejected { background: #FFEBEE; color: #C62828; }
.status-badge.human_review { background: #E8EAF6; color: #3F51B5; }

.candidate-details {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.detail-item svg {
  color: var(--color-primary-light);
}

.score-bar-container {
  margin-top: 1rem;
}

.score-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.score-fill.high { background: linear-gradient(90deg, var(--color-success), #8BC34A); }
.score-fill.medium { background: linear-gradient(90deg, var(--color-warning), #FFB74D); }
.score-fill.low { background: linear-gradient(90deg, var(--color-danger), #D84315); }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-light);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state h4 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}

.empty-state p {
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header h2 {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-number {
    font-size: 1.75rem;
  }
  
  .recent-section {
    padding: 1.5rem;
  }
  
  .candidate-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .empty-state {
    padding: 3rem 1rem;
  }
}
</style>