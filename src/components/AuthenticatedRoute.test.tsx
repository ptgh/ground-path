import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AuthenticatedRoute', () => {
  it('shows a loading spinner while auth or profile is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      profileLoading: false,
    } as any);

    renderWithRouter(
      <AuthenticatedRoute><div>Authenticated content</div></AuthenticatedRoute>
    );

    expect(screen.queryByText('Authenticated content')).toBeNull();
    const svg = document.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('shows a loading spinner while profile is loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      profileLoading: true,
    } as any);

    renderWithRouter(
      <AuthenticatedRoute><div>Authenticated content</div></AuthenticatedRoute>
    );

    expect(screen.queryByText('Authenticated content')).toBeNull();
  });

  it('redirects to /practitioner/auth when no user is present', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      profileLoading: false,
    } as any);

    renderWithRouter(
      <AuthenticatedRoute><div>Authenticated content</div></AuthenticatedRoute>
    );

    expect(screen.queryByText('Authenticated content')).toBeNull();
  });

  it('renders children when the user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      loading: false,
      profileLoading: false,
    } as any);

    renderWithRouter(
      <AuthenticatedRoute><div>Authenticated content</div></AuthenticatedRoute>
    );

    expect(screen.getByText('Authenticated content')).toBeTruthy();
  });
});
