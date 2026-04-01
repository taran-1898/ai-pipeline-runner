# System Testing Guide: AI Pipeline Runner

This guide walk you through testing the entire distributed AI pipeline system on your local machine using the Postman collection provided in [ai_pipeline_runner_postman.json](file:///Users/apple/Desktop/ai-pipeline-runner/ai_pipeline_runner_postman.json).

## Prerequisites

1. **Environment Setup**: Ensure your `.env` file is fully populated (see [README](file:///Users/apple/Desktop/ai-pipeline-runner/README.md) or [.env.example](file:///Users/apple/Desktop/ai-pipeline-runner/.env.example)).
2. **Postgres & Redis**: Make sure both services are running.
3. **Start the API Server**:
   ```bash
   npm run dev
   ```
4. **Start the Workers**:
   - Start the core pipeline worker:
     ```bash
     npm run worker
     ```
   - (Optional) Start the orchestration worker if you want to test async interaction processing:
     ```bash
     npx tsx src/workers/orchestrationWorker.ts
     ```

---

## Step 1: Import the Collection
1. Open Postman.
2. Click **Import** and select the [ai_pipeline_runner_postman.json](file:///Users/apple/Desktop/ai-pipeline-runner/ai_pipeline_runner_postman.json) file.
3. Ensure the `base_url` collection variable is set to `http://localhost:3000`.

---

## Step 2: Testing Remote Node Registration
To test the distributed worker logic, you can register a mock node.

1. **Register Node**: Use the `Nodes > Register Node` request.
   - **Body**:
     ```json
     {
         "id": "gpu-node-1",
         "name": "Local GPU Rig",
         "capabilities": ["gpu", "render"]
     }
     ```
2. **Verify**: Use `Nodes > Get Active Nodes` to see your node in the registry.

---

## Step 3: Orchestration & AI Planning
Test the automated pipeline generation.

1. **Plan Pipeline**: Use `Pipelines > Plan Pipeline`.
   - **Input**: `"Build a simple Node.js API with a health check and a database connection."`
   - **Expected**: A JSON response containing the generated `Pipeline` object with several steps (planner, coder, validator).
2. **Save ID**: Copy the `id` of the created pipeline for the next step.

---

## Step 4: Execution & Runs
Now, let's execute the pipeline we just planned.

1. **Start Run**: Use `Runs > Start Pipeline Run`.
   - Replace `:id` in the URL with your pipeline ID.
   - **Body**: `{"input": {}}`
2. **Check Status**: Use `Runs > Get Run Status`.
   - Follow the `status` (PENDING -> PROCESSING -> COMPLETED).
   - Once completed, use `Runs > Get Run Artifacts` to see the generated outputs.

---

## Step 5: Testing the "Antigravity" Cursor Tool
This is the ultimate test of the local hydration and AI fallback logic.

1. **Interaction (Text)**: Use `Orchestration > Interaction (Text)`.
   - **Input**:
     ```json
     {
         "text": "Use antigravity to scaffold a new Next.js project called 'my-awesome-app' in my Desktop/ai-projects folder.",
         "sessionId": "test-session"
     }
     ```
2. **Behavior**: 
   - If you have `cursor` installed, it might try to open it.
   - Since this is run via the worker, check your `~/Desktop/ai-projects` folder.
   - You should see a `my-awesome-app` directory with `.cursor_instructions.md` and `.cursorrules`.

---

## Step 6: Voice Entry Point
Test the multipart file upload.

1. **Voice Interaction**: Use `Orchestration > Voice Interaction (Multipart)`.
   - Select an `.mp3` or `.wav` file for the `audio` key in the form-data body.
   - **Expected**: The server will upload the audio to R2, transcribe it via Whisper, and start the orchestration process.

---

## Example Test Inputs

| Scenario | Input Text | Expected Result |
| :--- | :--- | :--- |
| **New Project** | "Create a python script to scrape news from HackerNews" | New folder `python-scraper` created with instructions. |
| **Simple Search** | "Research the latest trends in Agentic AI using Perplexity" | Orchestration routes to Perplexity tool and returns summary. |
| **Complex Pipeline** | "Plan and run a pipeline to generate a PRD and a mock API for a car rental system" | Multi-step pipeline created and executed. |
| **Voice Command** | (Audio recording of you saying "Summarize my day") | Audio persisted to R2, transcribed, and processed. |
