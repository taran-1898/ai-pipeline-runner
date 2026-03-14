import { PipelineService } from "./pipelineService";
import { PlannerAgent } from "../agents/PlannerAgent";

/**
 * PipelinePlanningService glues together the PlannerAgent and persistence.
 *
 * It takes a raw user task, asks the planner for a pipeline definition,
 * and then persists that as a concrete Pipeline + PipelineSteps.
 */
export class PipelinePlanningService {
  constructor(
    private readonly pipelineService: PipelineService,
    private readonly plannerAgent: PlannerAgent
  ) {}

  async planAndCreate(task: string) {
    const definition = await this.plannerAgent.plan(task);
    return this.pipelineService.createPipeline(definition);
  }
}

