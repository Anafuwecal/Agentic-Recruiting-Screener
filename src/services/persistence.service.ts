import { GraphStateType } from "../graph/state.js";

// Structural database payload representation
export interface ConvexStateSnapshot {
  threadId: string;
  stateBlob: string; // Serialized string representation of GraphStateType
  updatedAt: number;
}

export class ConvexPersistenceService {
  // Mock internal in-memory db driver array representing Convex operations for Pod 2 testing
  private mockConvexStorage: Map<string, string> = new Map();

  /**
   * Persists the current state snapshot block directly to Convex
   */
  public async saveGraphState(threadId: string, state: Partial<GraphStateType>): Promise<void> {
    const existingStateRaw = this.mockConvexStorage.get(threadId);
    let absoluteState: Record<string, any> = {};

    if (existingStateRaw) {
      absoluteState = JSON.parse(existingStateRaw);
    }

    // Merge incoming delta updates safely into current snapshot block
    const updatedState = { ...absoluteState, ...state };
    
    this.mockConvexStorage.set(threadId, JSON.stringify(updatedState));
    console.log(`Successfully snapshotted State Graph to thread ID: ${threadId}`);
  }

  /**
   * Loads the absolute historical state tracking thread snapshot out of Convex
   */
  public async loadGraphState(threadId: string): Promise<GraphStateType | null> {
    const serializedState = this.mockConvexStorage.get(threadId);
    if (!serializedState) {
      return null;
    }
    return JSON.parse(serializedState) as GraphStateType;
  }
}