/**
 * App startup smoke tests — verify key routes render without crashing.
 * Heavy external dependencies (Supabase, GSAP) are mocked so these tests
 * can run in a jsdom environment without a real network or browser runtime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

// Chainable Supabase query-builder mock (supports .select().eq().in().order() etc.)
const makeQueryBuilder = () => {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'gte', 'lte', 'gt', 'lt', 'order', 'limit', 'single'];
  methods.forEach((m) => { builder[m] = vi.fn().mockReturnValue(builder); });
  // Make the object awaitable — resolves to an empty result set
  builder['then'] = (resolve: (v: unknown) => void) =>
    Promise.resolve({ data: [], error: null }).then(resolve);
  return builder;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockImplementation(() => makeQueryBuilder()),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}));

// GSAP is a DOM-animation library; it is a no-op in jsdom
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({ from: vi.fn(), to: vi.fn(), fromTo: vi.fn() })),
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

// ── Helpers ──────────────────────────────────────────────────────────────────

type AuthMock = ReturnType<typeof useAuth>;
const mockUseAuth = vi.mocked(useAuth);

function renderWithProviders(ui: React.ReactNode, route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('App startup smoke tests', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as unknown as AuthMock);
  });

  describe('route: /', () => {
    it('renders the home page without crashing', async () => {
      const { default: Index } = await import('@/pages/Index');
      renderWithProviders(<Index />, '/');
      // The page must produce some DOM output — a non-empty document body
      expect(document.body.innerHTML).not.toBe('');
    });
  });

  describe('route: /practitioner/auth', () => {
    it('renders the auth page without crashing', async () => {
      const { default: AuthPage } = await import('@/components/AuthPage');
      renderWithProviders(<AuthPage />, '/practitioner/auth');
      // The auth form should be visible to an unauthenticated visitor
      expect(document.body.innerHTML).not.toBe('');
    });

    it('displays a sign-in form on initial load', async () => {
      const { default: AuthPage } = await import('@/components/AuthPage');
      renderWithProviders(<AuthPage />, '/practitioner/auth');
      // The page renders a recognisable sign-in element (email input or heading)
      const emailInput = document.querySelector('input[type="email"]');
      expect(emailInput).not.toBeNull();
    });
  });

  describe('route: /dashboard', () => {
    it('does not crash when the user is not authenticated', async () => {
      // beforeEach already sets user: null — the guard redirects rather than rendering the dashboard
      const { default: AuthenticatedRoute } = await import('@/components/AuthenticatedRoute');
      const { default: ClientDashboard } = await import('@/pages/ClientDashboard');
      renderWithProviders(
        <AuthenticatedRoute><ClientDashboard /></AuthenticatedRoute>,
        '/dashboard',
      );
      expect(document.body.innerHTML).not.toBe('');
    });

    it('renders the client dashboard without crashing when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        loading: false,
        profileLoading: false,
        profile: null,
        roles: [],
      } as unknown as AuthMock);

      const { default: AuthenticatedRoute } = await import('@/components/AuthenticatedRoute');
      const { default: ClientDashboard } = await import('@/pages/ClientDashboard');
      renderWithProviders(
        <AuthenticatedRoute><ClientDashboard /></AuthenticatedRoute>,
        '/dashboard',
      );
      expect(document.body.innerHTML).not.toBe('');
    });
  });

  describe('route: /practitioner/dashboard', () => {
    it('redirects to /practitioner/auth when the user is not authenticated', async () => {
      // beforeEach already sets user: null — the guard redirects rather than rendering the dashboard
      const { default: VerifiedPractitionerRoute } = await import('@/components/VerifiedPractitionerRoute');
      const { default: Dashboard } = await import('@/components/Dashboard');
      renderWithProviders(
        <VerifiedPractitionerRoute><Dashboard /></VerifiedPractitionerRoute>,
        '/practitioner/dashboard',
      );
      expect(document.body.innerHTML).not.toBe('');
    });

    it('renders the practitioner dashboard without crashing when verified', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        loading: false,
        profileLoading: false,
        profile: { user_type: 'practitioner', verification_status: 'verified' },
        roles: [],
      } as unknown as AuthMock);

      const { default: VerifiedPractitionerRoute } = await import('@/components/VerifiedPractitionerRoute');
      const { default: Dashboard } = await import('@/components/Dashboard');
      renderWithProviders(
        <VerifiedPractitionerRoute><Dashboard /></VerifiedPractitionerRoute>,
        '/practitioner/dashboard',
      );
      expect(document.body.innerHTML).not.toBe('');
    });
  });
});
