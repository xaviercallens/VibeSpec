/**
 * Cloud Function: vibespec-scaler
 *
 * Triggered by Cloud Scheduler to scale GPU pods up/down
 * based on booking windows.
 *
 * Deploy:
 *   gcloud functions deploy vibespec-scaler \
 *     --gen2 --runtime=nodejs22 --trigger-http \
 *     --region=us-central1 --memory=256Mi
 */
import { Firestore } from '@google-cloud/firestore';
const firestore = new Firestore();
const COLLECTION = 'vibespec-bookings';
const TIER_CONFIGS = {
    minimal: {
        deployments: ['qwen-vl-7b', 'pipeline'],
        replicas: { 'qwen-vl-7b': 1, 'pipeline': 1 },
    },
    standard: {
        deployments: ['qwen-vl-72b', 'pipeline'],
        replicas: { 'qwen-vl-72b': 1, 'pipeline': 1 },
    },
    full: {
        deployments: ['qwen-vl-72b', 'deepseek', 'pipeline'],
        replicas: { 'qwen-vl-72b': 1, 'deepseek': 1, 'pipeline': 1 },
    },
};
/**
 * Main Cloud Function handler.
 */
export async function vibespecScaler(req, res) {
    const body = req.body;
    console.log(`[vibespec-scaler] Action: ${body.action}, Booking: ${body.bookingId}`);
    try {
        const bookingRef = firestore.collection(COLLECTION).doc(body.bookingId);
        const bookingSnap = await bookingRef.get();
        if (!bookingSnap.exists) {
            res.status(404).json({ error: `Booking ${body.bookingId} not found` });
            return;
        }
        const booking = bookingSnap.data();
        switch (body.action) {
            case 'scale-up':
                await scaleUp(booking, bookingRef);
                break;
            case 'scale-down':
                await scaleDown(booking, bookingRef);
                break;
            case 'check-preemption':
                await checkPreemption(booking, bookingRef);
                break;
        }
        res.status(200).json({ status: 'ok', action: body.action, bookingId: body.bookingId });
    }
    catch (error) {
        console.error(`[vibespec-scaler] Error:`, error);
        res.status(500).json({ error: error.message });
    }
}
async function scaleUp(booking, ref) {
    const tier = booking.tier;
    const config = TIER_CONFIGS[tier];
    console.log(`[scale-up] Starting ${config.deployments.join(', ')} for tier: ${tier}`);
    // Use kubectl via exec or K8s API client
    for (const deploy of config.deployments) {
        const replicas = config.replicas[deploy] || 1;
        console.log(`  kubectl -n vibespec scale deploy/${deploy} --replicas=${replicas}`);
        // In production: exec kubectl or use @kubernetes/client-node
    }
    await ref.update({
        status: 'active',
        scaledUpAt: new Date().toISOString(),
    });
}
async function scaleDown(booking, ref) {
    const tier = booking.tier;
    const config = TIER_CONFIGS[tier];
    console.log(`[scale-down] Stopping ${config.deployments.join(', ')}`);
    for (const deploy of config.deployments) {
        console.log(`  kubectl -n vibespec scale deploy/${deploy} --replicas=0`);
    }
    // Calculate actual cost
    const startMs = new Date(booking.scaledUpAt || booking.startTime).getTime();
    const endMs = Date.now();
    const hoursUsed = (endMs - startMs) / 3600000;
    const costPerHour = booking.vmType === 'spot'
        ? { minimal: 0.70, standard: 3.14, full: 9.66 }[booking.tier]
        : { minimal: 2.31, standard: 8.94, full: 23.62 }[booking.tier];
    const actualCost = Math.round(hoursUsed * (costPerHour || 0) * 100) / 100;
    await ref.update({
        status: 'completed',
        scaledDownAt: new Date().toISOString(),
        actualCost,
        hoursUsed: Math.round(hoursUsed * 100) / 100,
    });
    console.log(`[scale-down] Booking complete. Hours: ${hoursUsed.toFixed(2)}, Cost: $${actualCost}`);
}
async function checkPreemption(booking, ref) {
    // Check if pods are still running
    // If preempted, switch to on-demand
    console.log(`[check-preemption] Checking pod health for booking ${booking.id}`);
    // In production: kubectl get pods -n vibespec -l app=qwen-vl-7b
    // If no running pods → preemption occurred → redeploy without Spot nodeSelector
    await ref.update({ lastHealthCheck: new Date().toISOString() });
}
//# sourceMappingURL=vibespec-scaler.js.map