import { StateGraph, START, END } from "@langchain/langgraph";
import { CandidateScreeningState, GraphStateType, CandidateData } from "../graph/state.ts";
import { ConvexPersistenceService } from "./persistence.service.ts";
import { supervisorNode } from "../graph/nodes/supervisor.node.ts";
import { intakeNode } from "../graph/nodes/intake.node.ts";
import { verificationNode } from "../graph/nodes/verification.node.ts";

export class LangGraphService {
  private graphEngine;
  private persistenceService: ConvexPersistenceService;

  constructor() {
    this.persistenceService = new ConvexPersistenceService();
    this.graphEngine = this.initializeGraphStructure();
  }

  private initializeGraphStructure() {
    const workflow = new StateGraph(CandidateScreeningState);

    //Define Stub Nodes for the pipeline sequence
    workflow.addNode("supervisor_node", supervisorNode);
    workflow.addNode("intake_node", intakeNode);
    workflow.addNode("verification_node", verificationNode);

    //Establish Execution Flows
    workflow.addEdge(START, "supervisor_node");

    // Implement Conditional Routing Edge based on Scorecard Validation
    workflow.addConditionalEdges(
      "supervisor_node",
      (state: GraphStateType) => {
        if (state.pipelineStatus === "SUPERVISOR_FAILED_SCORECARD") {
          return "fail_path";
        }
        return "continue_path";
      },
      {
        fail_path: END,               // Immediately halt execution on scorecard failure
        continue_path: "intake_node", // Move forward to data parsing if criteria are met
      }
    );

    workflow.addEdge("intake_node", "verification_node");
    workflow.addEdge("verification_node", END);

    return workflow.compile();
  }

  /**
   * Asynchronously spins up the executing graph loop from background request processing pools
   */
  public async executeWorkflowPipeline(threadId: string, candidatePayload: CandidateData): Promise<void> {
    console.log(` Starting background Multi-Agent Processing for Thread: ${threadId}`);

    const initialContextState: Partial<GraphStateType> = {
      candidateInfo: candidatePayload,
      fluffReport: [],
      pipelineStatus: "INITIALIZED",
    };

    await this.persistenceService.saveGraphState(threadId, initialContextState);

    // Invoke execution across the active LLM Agent matrix nodes
    const outputStateSummary = await this.graphEngine.invoke(initialContextState);

    await this.persistenceService.saveGraphState(threadId, outputStateSummary);
    console.log(` Engine Workflow Thread Finished. Current Status Flag: ${outputStateSummary.pipelineStatus}`);
  }
}