/**
 * VibeSpec GPU Scheduler — Scale-to-Zero Calendar Service
 *
 * End-users book time windows via API. The scheduler:
 * 1. Spins up Spot GPU pods 5 minutes before the window
 * 2. Keeps them alive during the booked window
 * 3. Scales to zero when the window ends
 * 4. Falls back to On-Demand if Spot preempted mid-session
 *
 * GCP integrations:
 * - Cloud Scheduler (cron triggers)
 * - Cloud Functions (scale up/down)
 * - GKE Autopilot (Spot pods)
 * - Firestore (booking state)
 */

export interface BookingWindow {
  id: string;
  userId: string;
  /** ISO 8601 start time */
  startTime: string;
  /** ISO 8601 end time */
  endTime: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Current state */
  status: 'pending' | 'warming' | 'active' | 'cooldown' | 'completed' | 'cancelled';
  /** GPU tier requested */
  tier: 'minimal' | 'standard' | 'full';
  /** Estimated cost for this window */
  estimatedCost: number;
  /** Actual cost (filled after completion) */
  actualCost?: number;
  /** Whether using Spot or On-Demand */
  vmType: 'spot' | 'on-demand';
  /** Pods that were started */
  pods: string[];
  createdAt: string;
}

/** Calendar day with availability slots. */
export interface CalendarDay {
  date: string;             // YYYY-MM-DD
  slots: TimeSlot[];
  totalBookedMinutes: number;
  estimatedCost: number;
}

export interface TimeSlot {
  startHour: number;        // 0-23
  endHour: number;
  available: boolean;
  booking?: BookingWindow;
}

/** GPU tier definitions with cost. */
export const GPU_TIERS = {
  minimal: {
    label: 'Minimal (7B VLM)',
    gpu: '1× L4 24GB',
    spotCostPerHour: 0.70,
    onDemandCostPerHour: 2.31,
    warmupMinutes: 3,
    pods: ['qwen-vl-7b', 'pipeline'],
  },
  standard: {
    label: 'Standard (72B VLM)',
    gpu: '4× L4 24GB',
    spotCostPerHour: 3.14,
    onDemandCostPerHour: 8.94,
    warmupMinutes: 5,
    pods: ['qwen-vl-72b', 'pipeline'],
  },
  full: {
    label: 'Full (VLM + DeepSeek)',
    gpu: '4× L4 + 2× A100',
    spotCostPerHour: 9.66,
    onDemandCostPerHour: 23.62,
    warmupMinutes: 8,
    pods: ['qwen-vl-72b', 'deepseek', 'pipeline'],
  },
} as const;

export class GPUScheduler {
  private bookings = new Map<string, BookingWindow>();

  /**
   * Book a GPU window.
   *
   * @param userId     Who's booking
   * @param startTime  When the window starts (ISO 8601)
   * @param durationMinutes  How long to keep GPUs alive
   * @param tier       GPU tier (minimal, standard, full)
   * @returns BookingWindow with estimated cost
   */
  async book(
    userId: string,
    startTime: string,
    durationMinutes: number,
    tier: keyof typeof GPU_TIERS = 'minimal'
  ): Promise<BookingWindow> {
    const tierConfig = GPU_TIERS[tier];
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    // Check for conflicts
    for (const existing of this.bookings.values()) {
      if (existing.status === 'cancelled' || existing.status === 'completed') continue;
      const eStart = new Date(existing.startTime);
      const eEnd = new Date(existing.endTime);
      if (start < eEnd && end > eStart && existing.tier === tier) {
        throw new Error(`Conflict with booking ${existing.id}: ${existing.startTime} - ${existing.endTime}`);
      }
    }

    // Prefer Spot, estimate cost with Spot pricing
    const hours = durationMinutes / 60;
    const estimatedCost = hours * tierConfig.spotCostPerHour;

    const booking: BookingWindow = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes,
      status: 'pending',
      tier,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      vmType: 'spot',
      pods: tierConfig.pods.slice(),
      createdAt: new Date().toISOString(),
    };

    this.bookings.set(booking.id, booking);

    // Schedule the warmup (5 min before start)
    await this.scheduleWarmup(booking);

    return booking;
  }

  /**
   * Cancel a booking. Scales down immediately if already warming/active.
   */
  async cancel(bookingId: string): Promise<void> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    if (booking.status === 'warming' || booking.status === 'active') {
      await this.scaleDown(booking);
    }

    booking.status = 'cancelled';
  }

  /**
   * Get the weekly calendar with availability and cost projections.
   */
  getCalendar(startDate: string, days: number = 7): CalendarDay[] {
    const calendar: CalendarDay[] = [];
    const start = new Date(startDate);

    for (let d = 0; d < days; d++) {
      const date = new Date(start.getTime() + d * 86400000);
      const dateStr = date.toISOString().split('T')[0];

      const slots: TimeSlot[] = [];
      let totalBooked = 0;
      let dayCost = 0;

      for (let h = 0; h < 24; h++) {
        const slotStart = new Date(date);
        slotStart.setHours(h, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(h + 1, 0, 0, 0);

        // Check if any booking overlaps this slot
        let slotBooking: BookingWindow | undefined;
        for (const b of this.bookings.values()) {
          if (b.status === 'cancelled' || b.status === 'completed') continue;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          if (slotStart < bEnd && slotEnd > bStart) {
            slotBooking = b;
            totalBooked += 60;
            dayCost += GPU_TIERS[b.tier].spotCostPerHour;
            break;
          }
        }

        slots.push({
          startHour: h,
          endHour: h + 1,
          available: !slotBooking,
          booking: slotBooking,
        });
      }

      calendar.push({
        date: dateStr,
        slots,
        totalBookedMinutes: totalBooked,
        estimatedCost: Math.round(dayCost * 100) / 100,
      });
    }

    return calendar;
  }

  /**
   * List all bookings for a user.
   */
  listBookings(userId?: string): BookingWindow[] {
    const all = Array.from(this.bookings.values());
    if (userId) return all.filter((b) => b.userId === userId);
    return all;
  }

  /**
   * Schedule GPU warmup before the booking window starts.
   * In production: creates Cloud Scheduler cron job.
   */
  private async scheduleWarmup(booking: BookingWindow): Promise<void> {
    const tierConfig = GPU_TIERS[booking.tier];
    const warmupTime = new Date(
      new Date(booking.startTime).getTime() - tierConfig.warmupMinutes * 60 * 1000
    );

    // Production: Cloud Scheduler HTTP trigger
    // gcloud scheduler jobs create http "warmup-${booking.id}" \
    //   --schedule="${cronExpression}" \
    //   --uri="https://REGION-PROJECT.cloudfunctions.net/vibespec-scaler" \
    //   --http-method=POST \
    //   --body='{"action":"scale-up","bookingId":"${booking.id}"}'

    console.log(
      `[Scheduler] Warmup for ${booking.id} scheduled at ${warmupTime.toISOString()} ` +
      `(${tierConfig.warmupMinutes}min before ${booking.startTime})`
    );
  }

  /**
   * Scale up GPU pods for a booking.
   * In production: kubectl scale or GKE API.
   */
  async scaleUp(bookingId: string): Promise<void> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    booking.status = 'warming';

    const tierConfig = GPU_TIERS[booking.tier];
    for (const pod of tierConfig.pods) {
      console.log(`[Scheduler] Scaling up ${pod} (${tierConfig.gpu}, Spot)`);
      // Production:
      // kubectl -n vibespec scale deploy/${pod} --replicas=1
    }

    // Wait for readiness, then mark active
    booking.status = 'active';
    console.log(`[Scheduler] Booking ${bookingId} is ACTIVE`);
  }

  /**
   * Scale down GPU pods after booking ends.
   */
  async scaleDown(booking: BookingWindow): Promise<void> {
    booking.status = 'cooldown';

    const tierConfig = GPU_TIERS[booking.tier];
    for (const pod of tierConfig.pods) {
      console.log(`[Scheduler] Scaling down ${pod}`);
      // Production:
      // kubectl -n vibespec scale deploy/${pod} --replicas=0
    }

    // Calculate actual cost
    const startMs = new Date(booking.startTime).getTime();
    const endMs = Math.min(Date.now(), new Date(booking.endTime).getTime());
    const hoursUsed = Math.max(0, (endMs - startMs) / 3600000);
    booking.actualCost = Math.round(hoursUsed * tierConfig.spotCostPerHour * 100) / 100;
    booking.status = 'completed';

    console.log(`[Scheduler] Booking ${booking.id} completed. Cost: $${booking.actualCost}`);
  }

  /**
   * Handle Spot preemption: fall back to On-Demand.
   * Called by GKE preemption webhook.
   */
  async handlePreemption(bookingId: string): Promise<void> {
    const booking = this.bookings.get(bookingId);
    if (!booking || booking.status !== 'active') return;

    console.log(`[Scheduler] Spot preempted for ${bookingId}! Falling back to On-Demand.`);
    booking.vmType = 'on-demand';

    // Re-scale with on-demand node selector
    const tierConfig = GPU_TIERS[booking.tier];
    for (const pod of tierConfig.pods) {
      console.log(`[Scheduler] Re-deploying ${pod} on On-Demand (removing Spot toleration)`);
      // kubectl patch deploy/${pod} -n vibespec --type=json \
      //   -p='[{"op":"remove","path":"/spec/template/spec/nodeSelector/cloud.google.com~1gke-spot"}]'
    }
  }
}
