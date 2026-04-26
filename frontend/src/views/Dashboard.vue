<template>
  <div class="dashboard">
    <h2>Recruitment Dashboard</h2>
    
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">Total Applications</div>
      </div>
      
      <div class="stat-card processing">
        <div class="stat-number">{{ stats.processing }}</div>
        <div class="stat-label">Processing</div>
      </div>
      
      <div class="stat-card accepted">
        <div class="stat-number">{{ stats.accepted }}</div>
        <div class="stat-label">Accepted</div>
      </div>
      
      <div class="stat-card rejected">
        <div class="stat-number">{{ stats.rejected }}</div>
        <div class="stat-label">Rejected</div>
      </div>
      
      <div class="stat-card review">
        <div class="stat-number">{{ stats.human_review }}</div>
        <div class="stat-label">Awaiting Review</div>
      </div>
      
      <div class="stat-card interviewed">
        <div class="stat-number">{{ stats.interviewed }}</div>
        <div class="stat-label">Interviewed</div>
      </div>
    </div>

    <div class="recent-section">
      <h3>Recent Applications</h3>
      <div class="candidate-list" v-if="recentCandidates.length">
        <div 
          v-for="candidate in recentCandidates" 
          :key="candidate.$id"
          class="candidate-card"
          :class="candidate.status.toLowerCase()"
        >
          <div class="candidate-header">
            <h4>{{ candidate.name }}</h4>
            <span class="status-badge" :class="candidate.status.toLowerCase()">
              {{ candidate.status }}
            </span>
          </div>
          <div class="candidate-details">
            <p><strong>Email:</strong> {{ candidate.email }}</p>
            <p><strong>Score:</strong> {{ candidate.total_score }}/100</p>
            <p><strong>Stage:</strong> {{ candidate.current_stage }}</p>
            <p><strong>Applied:</strong> {{ formatDate(candidate.application_date) }}</p>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No applications yet. Waiting for candidates...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiService, type Candidate } from '../services/api';
import { format } from 'date-fns';

const stats = ref<any>(null);
const recentCandidates = ref<Candidate[]>([]);

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

const loadData = async () => {
  try {
    stats.value = await apiService.getStats();
    const candidates = await apiService.getCandidates();
    recentCandidates.value = candidates.slice(0, 10);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
};

onMounted(() => {
  loadData();
  // Refresh every 30 seconds
  setInterval(loadData, 30000);
});
</script>

<style scoped>
.dashboard h2 {
  margin-bottom: 2rem;
  color: #667eea;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  border-left: 4px solid #667eea;
}

.stat-card.processing { border-left-color: #f59e0b; }
.stat-card.accepted { border-left-color: #10b981; }
.stat-card.rejected { border-left-color: #ef4444; }
.stat-card.review { border-left-color: #8b5cf6; }
.stat-card.interviewed { border-left-color: #06b6d4; }

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.recent-section h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.candidate-list {
  display: grid;
  gap: 1rem;
}

.candidate-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #667eea;
}

.candidate-card.accepted { border-left-color: #10b981; }
.candidate-card.rejected { border-left-color: #ef4444; }
.candidate-card.human_review { border-left-color: #8b5cf6; }

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.candidate-header h4 {
  font-size: 1.2rem;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.processing { background: #fef3c7; color: #92400e; }
.status-badge.accepted { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.status-badge.human_review { background: #ede9fe; color: #5b21b6; }

.candidate-details p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}
</style>