import { VoltAgent } from "@voltagent/core";
import { honoServer } from "@voltagent/server-hono";
import { intakeAgent } from "./agents/intakeAgent";
import { researcherAgent } from "./agents/researcherAgent";
import { screenerAgent } from "./agents/screenerAgent";
import { judgeAgent } from "./agents/judgeAgent";
import { coordinatorAgent } from "./agents/coordinatorAgent";
import { orchestratorAgent, processApplication } from "./agents/orchestratorAgent";
import { screeningWorkflow } from "./workflows/screeningWorkflow";
import express from "express";
import multer from "multer";
import { parseFile } from "./utils/fileParser";
import dotenv from "dotenv";

dotenv.config();

// Initialize VoltAgent
new VoltAgent({
  agents: {
    orchestrator: orchestratorAgent,
    intake: intakeAgent,
    researcher: researcherAgent,
    screener: screenerAgent,
    judge: judgeAgent,
    coordinator: coordinatorAgent,
  },
  workflows: {
    screening: screeningWorkflow,
  },
  server: honoServer({
    port: 8080,
  }),
});

// Separate Express server for CloudMailin webhook
const app = express();
app.use(express.json({ limit: "10mb" }));

const upload = multer({ dest: "uploads/" });

// CloudMailin webhook
app.post("/webhook/email", async (req, res) => {
  try {
    console.log("📧 CloudMailin webhook received");

    res.status(200).json({ success: true });

    const plain = req.body.plain || "";
    const attachments = req.body.attachments || [];

    let attachmentText = "";
    for (const att of attachments) {
      if (att.content && att.file_name) {
        const buffer = Buffer.from(att.content, "base64");
        const filePath = `uploads/${att.file_name}`;
        require("fs").writeFileSync(filePath, buffer);

        if (att.file_name.endsWith(".pdf") || att.file_name.endsWith(".docx")) {
          attachmentText += await parseFile(filePath, att.content_type);
        }
      }
    }

    // Trigger orchestrator
    processApplication(plain, attachmentText).catch(console.error);
  } catch (error: any) {
    console.error("Webhook error:", error.message);
  }
});

app.listen(3000, () => {
  console.log(" CloudMailin webhook server: http://localhost:3000");
  console.log(" VoltAgent API server: http://localhost:8080");
});