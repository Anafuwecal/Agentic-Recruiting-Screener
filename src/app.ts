import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { IncomingApplicationSchema } from "./schemas/webhook.schema.ts";
import { JwtService } from "./services/jwt.service.ts";
import { LangGraphService } from "./services/langgraph.service.ts";
import { globalErrorHandler } from "./middlewares/error.middleware.ts";
import { requireCandidateAuth, AuthenticatedRequest } from "./middlewares/auth.middleware.ts";
import multer from "multer";
import { ExtractionService } from "./services/extraction.service.ts";
import morgan from "morgan";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const jwtService = new JwtService();
const langGraphService = new LangGraphService();

// Setup Multer to store files temporarily in a /uploads folder
const upload = multer({ dest: "uploads/" });

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", engine: "ACTIVE" });
});

// Primary Webhook Entrypoint 
app.post(
  "/webhooks/incoming-application",
  upload.single("resume"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //Parse payload through Zod validation guard
      const { name, email, jobId, githubUrl } = req.body;
      const resumeFile = req.file;

      if (!resumeFile) throw new Error("Resume file (PDF/DOCX) is required.");

      // Parse the physical file
      const cvText = await ExtractionService.extractTextFromFile(resumeFile.path, resumeFile.mimetype);

      // (Optional) Scrape GitHub immediately if provided
      let scrapedGithub = "";
      if (githubUrl) {
        scrapedGithub = await ExtractionService.scrapeUrl(githubUrl);
      }

      const candidatePayload = {
        name,
        email,
        jobId, // Pass the Job ID, the Supervisor will fetch the requirements from Convex
        subject: `Application for Job ID: ${jobId}`,
        emailBody: "Application submitted via portal",
        cvText: cvText + `\n\nGitHub Data: ${scrapedGithub}`,
        githubUrl
      };

      //Dynamically provision structural backend tracking identifiers
      const candidateId = `cand_${crypto.randomBytes(4).toString("hex")}`;
      const threadId = `thread_${crypto.randomBytes(8).toString("hex")}`;

      //Generate tracking JWT token 
      const trackingToken = jwtService.generateCandidateToken({
        candidateId,
        threadId,
      });

      //Fire-and-Forget Asynchronous Orchestration Loop Call
      // FIXED: Pass the candidatePayload we just created, not the old validatedPayload
      langGraphService.executeWorkflowPipeline(threadId, candidatePayload as any).catch((asyncGraphError) => {
        console.error(" Fatal Async State Machine Subsystem Execution Error:", asyncGraphError);
      });

      //Instantly return 202 Accepted status payload containing the secure tracking key token
      res.status(202).json({
        success: true,
        message: "Application accepted. Background verification and screening systems initialized.",
        threadId,
        trackingToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/submissions/submit-assessment",
  requireCandidateAuth, // Secures route via JWT
  upload.single("codebase"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zipFile = req.file;
      const threadId = req.candidate?.threadId;

      if (!zipFile) throw new Error("Assessment zip file is required.");
      if (!threadId) throw new Error("Thread ID is missing from secure token.");

      // Extract all code from the Zip folder
      const combinedCode = ExtractionService.extractCodeFromZip(zipFile.path);

      langGraphService.resumeWorkflowExecution(threadId, combinedCode).catch(console.error);

      res.status(202).json({
        success: true,
        message: "Assessment received successfully. We are reviewing your submission.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Register Global Error Handling Boundary Middleware Last
app.use(globalErrorHandler);

const PORT = process.env.PORT || 9484;
app.listen(PORT, () => {
  console.log(` AI Recruiting Screener Engine Gateway live on port ${PORT}`);
});

export default app;