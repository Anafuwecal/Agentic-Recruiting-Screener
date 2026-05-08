import express from 'express';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

const router = express.Router();
const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

// Basic auth middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${process.env.ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

router.use(authMiddleware);

// Get all applicants
router.get('/applicants', async (req, res) => {
  const applicants = await convex.query(api.applicants.list);
  res.json(applicants);
});

// Get applicant details
router.get('/applicants/:id', async (req, res) => {
  const applicant = await convex.query(api.applicants.getById, { 
    id: req.params.id as any 
  });
  const logs = await convex.query(api.auditLogs.getByApplicant, {
    id: req.params.id as any
  });
  res.json({ applicant, logs });
});

// Get statistics
router.get('/stats', async (req, res) => {
  const applicants = await convex.query(api.applicants.list);
  
  const stats = {
    total: applicants.length,
    pending: applicants.filter(a => a.status === 'PENDING').length,
    accepted: applicants.filter(a => a.status === 'ACCEPTED').length,
    rejected: applicants.filter(a => a.status === 'REJECTED').length,
    humanReview: applicants.filter(a => a.status === 'HUMAN_REVIEW').length,
    avgScore: applicants.reduce((sum, a) => sum + a.totalScore, 0) / applicants.length,
  };

  res.json(stats);
});

export default router;