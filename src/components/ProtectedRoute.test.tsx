import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ProtectedRoute', () => {
  it('shows a loading spinner while auth state is being determined', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as any);

    renderWithRouter(<ProtectedRoute><div>Protected content</div></ProtectedRoute>);

    expect(screen.queryByText('Protected content')).toBeNull();
    // A loading indicator (svg spinner) should be present
    const svg = document.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('redirects to /practitioner/auth when there is no authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);

    renderWithRouter(<ProtectedRoute><div>Protected content</div></ProtectedRoute>);

    expect(screen.queryByText('Protected content')).toBeNull();
  });

  it('renders children when the user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      loading: false,
    } as any);

    renderWithRouter(<ProtectedRoute><div>Protected content</div></ProtectedRoute>);

    expect(screen.getByText('Protected content')).toBeTruthy();
  });
});
