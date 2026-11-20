import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App, { API_BASE_URL } from '../App.jsx';

describe('Phase 1 smoke test', () => {
  test('App mounts cleanly on login route without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error');
    render(<App />);
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('API base URL points at the hosted Render API with no trailing slash', () => {
    expect(API_BASE_URL).toBe('https://task-api-yhl4.onrender.com/api/v1');
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });
});
