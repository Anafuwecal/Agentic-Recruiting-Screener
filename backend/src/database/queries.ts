import { pool, generateId } from './connection.js';

// Job Requirements
export async function getActiveJobRequirement() {
  const result = await pool.query(
    'SELECT * FROM job_requirements WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
  );
  return result.rows[0] || null;
}

export async function createJobRequirement(data: any) {
  const id = generateId('job');
  await pool.query(
    `INSERT INTO job_requirements 
     (id, title, required_skills, nice_to_have, minimum_experience_years, 
      portfolio_required, github_required, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [
      id,
      data.title,
      data.requiredSkills || [],
      data.niceToHave || [],
      data.minimumExperienceYears,
      data.portfolioRequired,
      data.githubRequired,
      data.isActive !== undefined ? data.isActive : true,
    ]
  );
  return { id, ...data };
}

export async function updateJobRequirement(id: string, data: any) {
  const result = await pool.query(
    `UPDATE job_requirements 
     SET title = $2, required_skills = $3, nice_to_have = $4, 
         minimum_experience_years = $5, portfolio_required = $6, 
         github_required = $7, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.title,
      data.requiredSkills,
      data.niceToHave,
      data.minimumExperienceYears,
      data.portfolioRequired,
      data.githubRequired,
    ]
  );
  return result.rows[0];
}

export async function deactivateAllJobRequirements() {
  await pool.query('UPDATE job_requirements SET is_active = false');
}

// Candidates
export async function findCandidateByEmail(email: string) {
  const result = await pool.query(
    'SELECT * FROM candidates WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function createCandidate(data: any) {
  const id = generateId('cand');
  const result = await pool.query(
    `INSERT INTO candidates 
     (id, name, email, phone, github_url, github_username, portfolio_url, 
      linkedin_url, skills, experience_years, education, previous_roles, 
      raw_email_text, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
     RETURNING *`,
    [
      id,
      data.name,
      data.email,
      data.phone || null,
      data.githubUrl || null,
      data.githubUsername || null,
      data.portfolioUrl || null,
      data.linkedinUrl || null,
      data.skills || [],
      data.experienceYears || 0,
      data.education || null,
      data.previousRoles || [],
      data.rawEmailText,
    ]
  );
  return result.rows[0];
}

export async function updateCandidate(id: string, data: any) {
  const result = await pool.query(
    `UPDATE candidates 
     SET name = $2, phone = $3, github_url = $4, github_username = $5,
         portfolio_url = $6, linkedin_url = $7, skills = $8, 
         experience_years = $9, education = $10, previous_roles = $11,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.name,
      data.phone,
      data.githubUrl,
      data.githubUsername,
      data.portfolioUrl,
      data.linkedinUrl,
      data.skills,
      data.experienceYears,
      data.education,
      data.previousRoles,
    ]
  );
  return result.rows[0];
}

export async function createOrUpdateCandidate(data: any) {
  const existing = await findCandidateByEmail(data.email);
  if (existing) {
    return updateCandidate(existing.id, data);
  }
  return createCandidate(data);
}

export async function getAllCandidates() {
  const result = await pool.query(`
    SELECT c.*, 
           json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL) as applications,
           json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) as scores
    FROM candidates c
    LEFT JOIN applications a ON c.id = a.candidate_id
    LEFT JOIN scores s ON c.id = s.candidate_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  
  return result.rows.map(row => ({
    ...row,
    applications: row.applications || [],
    scores: row.scores || [],
  }));
}

export async function getCandidateById(id: string) {
  const result = await pool.query(`
    SELECT c.*, 
           json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL) as applications,
           json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) as scores,
           json_agg(DISTINCT al.*) FILTER (WHERE al.id IS NOT NULL) as audit_logs
    FROM candidates c
    LEFT JOIN applications a ON c.id = a.candidate_id
    LEFT JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN audit_logs al ON c.id = al.candidate_id
    WHERE c.id = $1
    GROUP BY c.id
  `, [id]);
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    ...row,
    applications: row.applications || [],
    scores: row.scores || [],
    audit_logs: row.audit_logs || [],
  };
}

// Applications
export async function createApplication(candidateId: string, data: any) {
  const id = generateId('app');
  const result = await pool.query(
    `INSERT INTO applications 
     (id, candidate_id, cover_letter_summary, has_portfolio, 
      cover_letter_is_generic, status, total_score, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      id,
      candidateId,
      data.coverLetterSummary || null,
      data.hasPortfolio || false,
      data.coverLetterIsGeneric !== undefined ? data.coverLetterIsGeneric : true,
      data.status || 'PROCESSING',
      data.totalScore || 0,
    ]
  );
  return result.rows[0];
}

export async function updateApplicationStatus(applicationId: string, status: string, data: any = {}) {
  const fields = ['status = $2', 'updated_at = NOW()'];
  const values: any[] = [applicationId, status];
  let paramIndex = 3;

  if (data.finalDecision) {
    fields.push(`final_decision = $${paramIndex++}`);
    values.push(data.finalDecision);
  }
  if (data.rejectionReason) {
    fields.push(`rejection_reason = $${paramIndex++}`);
    values.push(data.rejectionReason);
  }
  if (data.totalScore !== undefined) {
    fields.push(`total_score = $${paramIndex++}`);
    values.push(data.totalScore);
  }
  if (data.scheduledAt) {
    fields.push(`scheduled_at = $${paramIndex++}`);
    values.push(data.scheduledAt);
  }
  if (data.meetLink) {
    fields.push(`meet_link = $${paramIndex++}`);
    values.push(data.meetLink);
  }
  if (data.eventLink) {
    fields.push(`event_link = $${paramIndex++}`);
    values.push(data.eventLink);
  }

  const result = await pool.query(
    `UPDATE applications SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0];
}

// Scores
export async function recordScore(
  candidateId: string,
  stage: string,
  score: number,
  maxScore: number,
  breakdown: any,
  reasoning?: string
) {
  const id = generateId('score');
  const result = await pool.query(
    `INSERT INTO scores (id, candidate_id, stage, score, max_score, breakdown, reasoning, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [id, candidateId, stage, score, maxScore, JSON.stringify(breakdown), reasoning || null]
  );
  return result.rows[0];
}

// Audit Logs
export async function logAudit(
  candidateId: string | null,
  stage: string,
  action: string,
  reasoning: string,
  decision?: string,
  metadata?: any
) {
  const id = generateId('audit');
  await pool.query(
    `INSERT INTO audit_logs (id, candidate_id, stage, action, decision, reasoning, metadata, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      id,
      candidateId || null,
      stage,
      action,
      decision || null,
      reasoning,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

// Chat Messages
export async function saveChatMessage(role: string, content: string, metadata?: any) {
  const id = generateId('msg');
  await pool.query(
    `INSERT INTO chat_messages (id, role, content, metadata, timestamp)
     VALUES ($1, $2, $3, $4, NOW())`,
    [id, role, content, metadata ? JSON.stringify(metadata) : null]
  );
}

export async function getChatHistory(limit: number = 100) {
  const result = await pool.query(
    'SELECT * FROM chat_messages ORDER BY timestamp ASC LIMIT $1',
    [limit]
  );
  return result.rows;
}

// Webhook Config
export async function getActiveWebhookConfig() {
  const result = await pool.query(
    'SELECT * FROM webhook_configs WHERE is_active = true LIMIT 1'
  );
  return result.rows[0] || null;
}

export async function createOrUpdateWebhookConfig(data: any) {
  await pool.query('UPDATE webhook_configs SET is_active = false');
  
  const id = generateId('webhook');
  const result = await pool.query(
    `INSERT INTO webhook_configs (id, endpoint, secret, is_active, updated_at)
     VALUES ($1, $2, $3, true, NOW())
     RETURNING *`,
    [id, data.endpoint, data.secret || null]
  );
  return result.rows[0];
}