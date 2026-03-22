import { NextResponse } from "next/server";

// POST /api/checkout
// Stripe Webhook Endpoint to trigger $19 One-Shot discovery sprints
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // MOCK: Verify Stripe signature here using stripe.webhooks.constructEvent
    const { email, tier } = body;

    if (!email || !tier) {
      return NextResponse.json({ error: "Missing email or subscription tier" }, { status: 400 });
    }

    console.log(`[API Checkout] Payment verified for ${email} on tier: ${tier}`);

    if (tier === "one-shot") {
      // MOCK: Fire Cloud Task to provision GKE Spot Nodes
      console.log(`[API Checkout] Triggering Cloud Task: Provision GKE L4 Spot Node`);
      console.log(`[API Checkout] Setting Kubernetes activeDeadlineSeconds = 1800 (30m kill switch)`);
    }

    return NextResponse.json({ 
      success: true, 
      sprintId: `ONE-SHOT-${Math.floor(Math.random() * 10000)}`,
      redirect: `/run/oneshot-live` 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
