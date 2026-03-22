import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GPUScheduler, QuotaManager, SUBSCRIPTION_TIERS } from '../src/gpu-scheduler.js';

describe('QuotaManager', () => {
  let quotaManager: QuotaManager;

  beforeEach(() => {
    quotaManager = new QuotaManager();
  });

  it('defaults to Glasshouse tier', () => {
    const sub = quotaManager.getSubscription('user-1');
    expect(sub.tier).toBe('Glasshouse');
  });

  it('prevents Glasshouse from booking', () => {
    expect(() => quotaManager.canBook('user-1', 10, 1)).toThrow(/Glasshouse tier is read-only/);
  });

  it('allows OneShot with valid limits', () => {
    quotaManager.setSubscription('user-1', 'OneShot');
    expect(quotaManager.canBook('user-1', 30, 3)).toBe(true);
  });

  it('prevents OneShot from exceeding screen limits', () => {
    quotaManager.setSubscription('user-1', 'OneShot');
    expect(() => quotaManager.canBook('user-1', 30, 4)).toThrow(/allows a maximum of 3 screens/);
  });

  it('prevents OneShot from exceeding duration', () => {
    quotaManager.setSubscription('user-1', 'OneShot');
    expect(() => quotaManager.canBook('user-1', 45, 1)).toThrow(/allows a maximum duration of 30 minutes/);
  });

  it('increments usage and blocks after quota is exhausted', () => {
    quotaManager.setSubscription('user-1', 'OneShot');
    quotaManager.incrementUsage('user-1');
    expect(() => quotaManager.canBook('user-1', 15, 1)).toThrow(/Monthly quota exhausted/);
  });
});

describe('GPUScheduler', () => {
  let scheduler: GPUScheduler;

  beforeEach(() => {
    scheduler = new GPUScheduler();
    scheduler.quotaManager.setSubscription('test-user', 'AgilePro');
  });

  it('books a valid session and estimates costs for spot instances', async () => {
    const startTime = new Date().toISOString();
    const result = await scheduler.book('test-user', startTime, 60, 'standard', 1);

    expect(result.id).toMatch(/^bk-\d+-[a-z0-9]+$/);
    expect(result.tier).toBe('standard');
    expect(result.estimatedCost).toBeGreaterThan(0);
    expect(result.vmType).toContain('spot');
  });

  it('rejects overlapping bookings', async () => {
    const startTime = new Date().toISOString();
    await scheduler.book('test-user', startTime, 60, 'minimal', 1);
    
    await expect(scheduler.book('test-user', startTime, 60, 'minimal', 1)).rejects.toThrow(/Conflict/);
  });

  it('scales up and logs the target replica count', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const booking = await scheduler.book('test-user', new Date().toISOString(), 60, 'minimal', 1);
    await scheduler.scaleUp(booking.id);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Scaling up qwen-vl-7b'));
    consoleSpy.mockRestore();
  });

  it('scales down properly', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const booking = await scheduler.book('test-user', new Date().toISOString(), 60, 'minimal', 1);
    await scheduler.scaleDown(booking);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Scaling down qwen-vl-7b'));
    consoleSpy.mockRestore();
  });

  it('handles spot preemptions by falling back to on-demand', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const booking = await scheduler.book('test-user', new Date().toISOString(), 60, 'minimal', 1);
    await scheduler.scaleUp(booking.id);
    await scheduler.handlePreemption(booking.id);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Falling back to On-Demand'));
    
    consoleSpy.mockRestore();
  });
});
