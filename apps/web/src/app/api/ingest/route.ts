import { NextResponse } from "next/server";

// POST /api/ingest
// Handles Google Stitch .zip uploads to Cloud Storage (Bucket A)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No mockup file provided" }, { status: 400 });
    }

    // MOCK: In production, we use @google-cloud/storage to stream directly to Bucket A
    console.log(`[API Ingest] Received file: ${file.name} (${file.size} bytes)`);
    console.log(`[API Ingest] Moving to GCS Bucket A (Ephemeral Ingestion)...`);
    
    // MOCK: Trigger Cloud Workflows via Google REST API
    console.log(`[API Ingest] Triggering Cloud Workflows for preprocessing...`);

    return NextResponse.json({ 
      success: true, 
      message: "File ingested and workflow triggered.",
      workflowId: `wf-ingest-${Date.now()}`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
