import fs from 'fs-extra';
import path from 'path';

type AuditEntry = {
  timestamp: string;
  candidate_name: string;
  candidate_email: string;
  stage: string;
  score?: number;
  decision?: string;
  reasoning: string;
  job_id?: string;
};

const LOG_FILE = path.join(process.cwd(), 'audit_log.json');

export async function auditLog(entry: AuditEntry) {
  let logs: AuditEntry[] = [];
  
  if (await fs.pathExists(LOG_FILE)) {
    logs = await fs.readJson(LOG_FILE);
  }
  
  logs.push({ 
    ...entry, 
    timestamp: new Date().toISOString() 
  });
  
  await fs.writeJson(LOG_FILE, logs, { spaces: 2 });
  console.log(`Audit logged: ${entry.stage} - ${entry.candidate_name}`);
}