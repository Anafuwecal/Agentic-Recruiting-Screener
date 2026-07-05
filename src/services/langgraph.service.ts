import { StateGraph, START, END } from "@langchain/langgraph";
import { CandidateScreeningState, GraphStateType, CandidateData } from "../graph/state.ts";
import { ConvexPersistenceService } from "./persistence.service.ts";
import { supervisorNode } from "../graph/nodes/supervisor.node.ts";
import { intakeNode } from "../graph/nodes/intake.node.ts";
import { verificationNode } from "../graph/nodes/verification.node.ts";
import { screenerNode } from "../graph/nodes/screener.node.ts";
import { decisionNode } from "../graph/nodes/decision.node.ts";
import { logisticsNode } from "../graph/nodes/logistics.node.ts";
import { watcherNode } from "../graph/nodes/watcher.node.ts";
import { mailerNode } from "../graph/nodes/mailer.node.ts";
import { ConvexService } from "./convex.service.js";

export class LangGraphService {
  private graphEngine;
  private persistenceService: ConvexPersistenceService;

  constructor() {
    this.persistenceService = new ConvexPersistenceService();
    this.graphEngine = this.initializeGraphStructure();
  }

  private initializeGraphStructure() {
    const workflow = new StateGraph(CandidateScreeningState)
      .addNode("supervisor_node", supervisorNode)
      .addNode("intake_node", intakeNode)
      .addNode("verification_node", verificationNode)
      .addNode("screener_node", screenerNode)
      .addNode("decision_node", decisionNode)
      .addNode("logistics_node", logisticsNode) 
      .addNode("watcher_node", watcherNode)
      .addNode("mailer_node", mailerNode)

      // 1. Entry Router: Fresh Run vs Resume Run
      .addConditionalEdges(
        START,
        (state: GraphStateType) => state.pipelineStatus === "SUBMISSION_RECEIVED" ? "resume_path" : "initial_path",
        {
          initial_path: "supervisor_node", 
          resume_path: "decision_node", // Route directly to Judge upon code submission!
        }
      )

      // 2. Top Funnel
      .addConditionalEdges("supervisor_node", (state) => state.pipelineStatus === "SUPERVISOR_FAILED_SCORECARD" ? "fail_path" : "continue_path", {
        fail_path: END,
        continue_path: "intake_node",
      })
      .addEdge("intake_node", "verification_node")
      .addEdge("verification_node", "screener_node")
      .addEdge("screener_node", END) 

      // 3. Evaluation & Logistics Funnel (Triggered on Resume)
      .addConditionalEdges(
        "decision_node",
        (state: GraphStateType) => state.pipelineStatus === "EVALUATION_PASSED" ? "pass_path" : "fail_path",
        {
          pass_path: "logistics_node", // Schedule interview
          fail_path: "watcher_node",   // Skip scheduling, go straight to final report
        }
      )
      
      .addEdge("logistics_node", "watcher_node")
      .addEdge("watcher_node", "mailer_node")
      .addEdge("mailer_node", END);

    return workflow.compile();
  }

  public async executeWorkflowPipeline(threadId: string, payload: any): Promise<void> {
    console.log(` Starting background Multi-Agent Processing for Thread: ${threadId}`);
    
    const initialContextState: Partial<GraphStateType> = {
      candidateInfo: payload,
      fluffReport: [],
      pipelineStatus: "INITIALIZED",
    };

    // Invoke graph to process the initial application phase
    const outputStateSummary = await this.graphEngine.invoke(initialContextState);

    // Save state to Convex after processing the initial nodes
    if (outputStateSummary.pipelineStatus === "AWAITING_ASSESSMENT") {
        await ConvexService.saveWorkflowState(threadId, payload.candidateId, outputStateSummary);
        console.log(`⏸ Workflow paused and persisted for thread: ${threadId}`);
    } else {
        await ConvexService.saveWorkflowState(threadId, payload.candidateId, outputStateSummary);
        console.log(` Engine Workflow Thread Completed/Terminated. Current Status: ${outputStateSummary.pipelineStatus}`);
    }
  }
  /**
   * The Resumption Trigger: Wakes up the graph engine from Convex storage
   */
  public async resumeWorkflowExecution(threadId: string, codebase: string): Promise<void> {
    console.log(`\n [RESUMPTION GATEWAY]: Waking up Graph Engine for Thread: ${threadId}`);

    // 1. Pull the sleeping state from Convex
    const savedDbState = await ConvexService.loadWorkflowState(threadId);
    if (!savedDbState || !savedDbState.graphState) {
        throw new Error("Thread state not found or expired in database.");
    }

    // 2. Isolate the graph state and inject the candidate's solution
    const resumedState = savedDbState.graphState;
    
    resumedState.assessment = { 
      ...resumedState.assessment,
      submittedCode: codebase 
    };
    
    // Status must match the START conditional edge perfectly
    resumedState.pipelineStatus = "SUBMISSION_RECEIVED"; 

    // 3. Invoke the graph with the resumed state. 
    // The Entry Router will see "SUBMISSION_RECEIVED" and route straight to decision_node!
    const outputStateSummary = await this.graphEngine.invoke(resumedState);
    
    // 4. Save the finalized state back to Convex
    await ConvexService.saveWorkflowState(threadId, savedDbState.candidateId, outputStateSummary);
    console.log(` Engine Workflow Resumed and processed. Current Status: ${outputStateSummary.pipelineStatus}`);
  }
}