import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { IncomingApplicationSchema } from "./schemas/webhook.schema.ts";
import { JwtService } from "./services/jwt.service.ts";
import { LangGraphService } from "./services/langgraph.service.ts";
import { globalErrorHandler } from "./middlewares/error.middleware.ts";
import { requireCandidateAuth, AuthenticatedRequest } from "./middlewares/auth.middleware.ts";
import morgan from "morgan";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const jwtService = new JwtService();
const langGraphService = new LangGraphService();


app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", engine: "ACTIVE" });
});

// Primary Webhook Entrypoint 
app.post(
  "/webhooks/incoming-application",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //Parse payload through Zod validation guard
      const validatedPayload = IncomingApplicationSchema.parse(req.body);

      //Dynamically provision structural backend tracking identifiers
      const candidateId = `cand_${crypto.randomBytes(4).toString("hex")}`;
      const threadId = `thread_${crypto.randomBytes(8).toString("hex")}`;

      //Generate tracking JWT token 
      const trackingToken = jwtService.generateCandidateToken({
        candidateId,
        threadId,
      });

      //Fire-and-Forget Asynchronous Orchestration Loop Call
      // Do NOT use "await" here. This lets the graph run in the background
      // while we return an immediate response back to the client.
      langGraphService.executeWorkflowPipeline(threadId, {
        name: validatedPayload.senderName,
        email: validatedPayload.senderEmail,
        subject: validatedPayload.subject,
        emailBody: validatedPayload.emailBody,
        cvText: validatedPayload.cvText,
        githubUrl: validatedPayload.githubUrl,
        portfolioUrl: validatedPayload.portfolioUrl,
      }).catch((asyncGraphError) => {
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { codeSubmission } = req.body;
      const threadId = req.candidate?.threadId;

      if (!codeSubmission || !threadId) {
        res.status(400).json({ success: false, message: "Missing code submission data." });
        return;
      }

      // Fire-and-forget background resumption
      langGraphService.resumeWorkflowExecution(threadId, codeSubmission).catch((error) => {
        console.error(" Fatal Resumption Error:", error);
      });

      res.status(202).json({
        success: true,
        message: "Code assessment received successfully. The evaluation agents are reviewing your submission.",
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