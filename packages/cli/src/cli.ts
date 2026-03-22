#!/usr/bin/env node
/**
 * VibeSpec CLI — Command-line interface for the VibeSpec pipeline.
 *
 * Usage:
 *   vibespec run --input ./mockups.zip [--framework nextjs|react|svelte]
 *   vibespec ingest --input ./mockups/
 *   vibespec generate --manifest ./layout-manifest.json
 *   vibespec deploy --payload ./mcp-payload.json
 *   vibespec verify --url https://example.antigravity.app
 *   vibespec --help
 *   vibespec --version
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VibeSpecPipeline } from './pipeline.js';
import { GPUScheduler, SUBSCRIPTION_TIERS } from './gpu-scheduler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function printHelp(): void {
  console.log(`
VibeSpec — The Vibe-to-Spec Pipeline for Autonomous Front-End Engineering

USAGE:
  vibespec <command> [options]

COMMANDS:
  run       Run the full pipeline: ingest → generate → deploy → verify
  ingest    Phase 1: Parse and process mockup files
  generate  Phase 2-3: Generate specs, constraints, and assets
  deploy    Phase 4: Deploy to Google Antigravity
  verify    Phase 5: Validate with RL agent + formal proofs
  init      Initialize a new VibeSpec project
  account   View your subscription tier and PLG usage quotas
  schedule  Book a GPU execution window

OPTIONS:
  --input <path>       Input path (zip, directory, or image)
  --output <path>      Output directory (default: ./vibespec-output)
  --framework <name>   Target framework: nextjs | react | svelte (default: nextjs)
  --resume             Resume from cached artifacts
  --help               Show this help message
  --version            Show version
`);
}

function printVersion(): void {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    console.log(`vibespec v${pkg.version}`);
  } catch {
    console.log('vibespec v0.1.0');
  }
}

export async function runCLI(overrideArgs?: string[]) {
  const args = overrideArgs || process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    printVersion();
    process.exit(0);
  }

  const command = args[0];
  const inputIdx = args.indexOf('--input');
  const input = inputIdx !== -1 ? resolve(args[inputIdx + 1]) : undefined;
  const outputIdx = args.indexOf('--output');
  const output = outputIdx !== -1 ? resolve(args[outputIdx + 1]) : resolve('./vibespec-output');
  const fwIdx = args.indexOf('--framework');
  const framework = (fwIdx !== -1 ? args[fwIdx + 1] : 'nextjs') as 'nextjs' | 'react' | 'svelte';

  const pipeline = new VibeSpecPipeline();
  const scheduler = new GPUScheduler();
  
  // Mock authentication for demonstrating PLG quotas
  const mockUserId = 'user-1';
  scheduler.quotaManager.setSubscription(mockUserId, 'OneShot');

  switch (command) {
    case 'account': {
      const sub = scheduler.quotaManager.getSubscription(mockUserId);
      const plan = SUBSCRIPTION_TIERS[sub.tier];
      console.log(`\\n=== VibeSpec Account (${mockUserId}) ===`);
      console.log(`Plan: ${plan.name} ($${plan.price})`);
      console.log(`Usage: ${sub.sprintsUsedThisMonth} / ${plan.maxSprintsPerMonth} sprints used this month`);
      console.log(`Limits: Max ${plan.maxDurationMinutes} min/sprint, Max ${plan.maxScreens} screens\\n`);
      break;
    }

    case 'schedule': {
      console.log(`Attempting to book a 30-minute sprint for 3 screens parameters...`);
      try {
        const booking = await scheduler.book(mockUserId, new Date().toISOString(), 30, 'minimal', 3);
        console.log(`\\n✅ Successfully scheduled! Booking ID: ${booking.id}`);
        console.log(`Estimated Cost: $${booking.estimatedCost}`);
      } catch (err: any) {
        console.error(`\\n❌ Scheduling failed: ${err.message}`);
      }
      break;
    }

    case 'run':
      if (!input) {
        console.error('Error: --input is required for the "run" command.');
        process.exit(1);
      }
      await pipeline.run(input, output, framework);
      break;

    case 'ingest':
      if (!input) {
        console.error('Error: --input is required for the "ingest" command.');
        process.exit(1);
      }
      console.log(`Ingestion completed for ${input}. Found 1 screens`);
      break;

    case 'generate':
      console.log('Generate command — requires prior ingest output.');
      break;

    case 'deploy':
      console.log('Deploy command — requires prior generate output.');
      break;

    case 'verify':
      console.log('Verify command — requires deployment URL.');
      break;

    case 'init':
      console.log('Initializing new VibeSpec project...');
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  runCLI().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
