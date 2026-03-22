import { describe, it, expect } from 'vitest';
import { VariationGrouper } from '../src/variation-grouper.js';

describe('VariationGrouper', () => {
  const grouper = new VariationGrouper();

  it('groups variants under a root screen', () => {
    const files = [
      { filename: 'product.png', path: 'product.png' },
      { filename: 'product-hover.png', path: 'product-hover.png' },
      { filename: 'product_dropdown.png', path: 'product_dropdown.png' },
      { filename: 'login.jpg', path: 'login.jpg' },
      { filename: 'login-error.jpg', path: 'login-error.jpg' }
    ] as any[];

    const groups = grouper.group(files);
    
    expect(groups).toHaveLength(2);
    
    const productGroup = groups.find(g => g.id === 'product');
    expect(productGroup).toBeDefined();
    expect(productGroup?.root.filename).toBe('product.png');
    expect(productGroup?.variants).toHaveLength(2);
    expect(productGroup?.variants.map(v => v.filename)).toEqual(['product-hover.png', 'product_dropdown.png']);

    const loginGroup = groups.find(g => g.id === 'login');
    expect(loginGroup).toBeDefined();
    expect(loginGroup?.variants).toHaveLength(1);
    expect(loginGroup?.variants[0].filename).toBe('login-error.jpg');
  });

  it('promotes the first variant to root if no explicit root exists', () => {
    const files = [
      { filename: 'dashboard-hover.png', path: 'dashboard-hover.png' },
      { filename: 'dashboard-active.png', path: 'dashboard-active.png' }
    ] as any[];

    const groups = grouper.group(files);
    
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('dashboard');
    expect(groups[0].root.filename).toBe('dashboard-hover.png');
    expect(groups[0].variants).toHaveLength(1);
    expect(groups[0].variants[0].filename).toBe('dashboard-active.png');
  });

  it('handles numeric suffixes', () => {
    const files = [
      { filename: 'step-1.png', path: 'step-1.png' },
      { filename: 'step-2.png', path: 'step-2.png' },
      { filename: 'step_3.png', path: 'step_3.png' }
    ] as any[];

    const groups = grouper.group(files);
    
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('step');
    expect(groups[0].root.filename).toBe('step-1.png');
    expect(groups[0].variants).toHaveLength(2);
  });
});
