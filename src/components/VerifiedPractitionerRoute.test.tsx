import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifiedPractitionerRoute from '@/components/VerifiedPractitionerRoute';
import { useAuth } from '@/hooks/useAuth';

type AuthMock = ReturnType<typeof useAuth>;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('VerifiedPractitionerRoute', () => {
  it('shows a spinner while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      profileLoading: false,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.queryByText('Verified content')).toBeNull();
    const svg = document.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('shows a spinner while profileLoading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      loading: false,
      profileLoading: true,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.queryByText('Verified content')).toBeNull();
  });

  it('redirects when no user is present', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.queryByText('Verified content')).toBeNull();
  });

  it('shows a spinner when user is present but profile has not loaded yet', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      loading: false,
      profileLoading: false,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.queryByText('Verified content')).toBeNull();
  });

  it('redirects an unverified practitioner to /practitioner/verify', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', user_metadata: { user_type: 'practitioner' } },
      profile: { user_type: 'practitioner', verification_status: 'unverified' },
      loading: false,
      profileLoading: false,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.queryByText('Verified content')).toBeNull();
  });

  it('renders children for a verified practitioner', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { user_type: 'practitioner', verification_status: 'verified' },
      loading: false,
      profileLoading: false,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.getByText('Verified content')).toBeTruthy();
  });

  it('renders children for a non-practitioner user (client)', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { user_type: 'client' },
      loading: false,
      profileLoading: false,
    } as unknown as AuthMock);

    renderWithRouter(
      <VerifiedPractitionerRoute><div>Verified content</div></VerifiedPractitionerRoute>
    );

    expect(screen.getByText('Verified content')).toBeTruthy();
  });
});
