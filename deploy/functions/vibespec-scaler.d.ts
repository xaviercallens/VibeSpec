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
/**
 * Main Cloud Function handler.
 */
export declare function vibespecScaler(req: any, res: any): Promise<void>;
//# sourceMappingURL=vibespec-scaler.d.ts.map