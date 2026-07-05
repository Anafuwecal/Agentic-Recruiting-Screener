import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
// Import the generated type-safe API references
import { api } from "../../convex/_generated/api.js"; 

dotenv.config();

// Initialize the Convex HTTP client for Node.js
const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) console.warn("⚠️ CONVEX_URL is missing. Database persistence will fail.");

const convex = new ConvexHttpClient(convexUrl || "");

export class ConvexService {
  /**
   * Persists the current state of the LangGraph workflow to Convex.
   */
  public static async saveWorkflowState(threadId: string, candidateId: string, graphState: any): Promise<void> {
    try {
      // Use the strongly-typed api reference instead of a string
      await convex.mutation(api.workflowThreads.updateState, {
        threadId,
        candidateId,
        graphState,
        updatedAt: Date.now(),
      });
      console.log(`💾 [CONVEX]: State persisted for thread ${threadId}`);
    } catch (error) {
      console.error(`❌ [CONVEX]: Failed to save state for ${threadId}`, error);
    }
  }

  /**
   * Retrieves the paused state when a candidate submits their assessment.
   */
  public static async loadWorkflowState(threadId: string): Promise<any> {
    try {
      // Use the strongly-typed api reference instead of a string
      const state = await convex.query(api.workflowThreads.getState, { threadId });
      return state;
    } catch (error) {
      console.error(`❌ [CONVEX]: Failed to load state for ${threadId}`, error);
      return null;
    }
  }
}