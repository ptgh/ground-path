import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Inbox, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ADMIN_NAV = [
  { to: '/practitioner/admin/intake', label: 'Intake', icon: Inbox },
  { to: '/practitioner/admin/m365', label: 'M365 Hub', icon: Database },
];

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorised, setAuthorised] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/practitioner/auth'); return; }
    (async () => {
      const { data } = await supabase.rpc('is_m365_authorised', { _user_id: user.id });
      setAuthorised(!!data);
    })();
  }, [user, authLoading, navigate]);

  if (authLoading || authorised === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorised) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container max-w-2xl py-16">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />Access denied
              </CardTitle>
              <CardDescription>
                The Admin area requires admin role and an allow-listed email.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Contact the administrator to add your email to the M365 allow-list, then return to this page.
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="border-b border-border/60 bg-muted/30">
        <div className="container max-w-6xl py-4 space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin</h2>
            <p className="text-xs text-muted-foreground">
              Practice-wide tools and configuration. Visible only to allow-listed admins.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-1.5">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AdminLayout;
