import { RunStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { pipelineQueue } from "../config/queue";

export class RunService {
  async startRun(pipelineId: string, input: unknown) {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const run = await prisma.run.create({
      data: {
        pipelineId,
        input: input as any,
        status: RunStatus.PENDING,
      },
    });

    await pipelineQueue.add("pipeline-run", { runId: run.id } as PipelineRunJobData);

    return run;
  }

  async getRunById(runId: string) {
    return prisma.run.findUnique({
      where: { id: runId },
      include: {
        steps: {
          include: { step: true },
          orderBy: { step: { stepOrder: "asc" } },
        },
        pipeline: true,
      },
    });
  }
}

