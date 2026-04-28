import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Inbox, Database, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ADMIN_NAV = [
  { to: '/practitioner/admin/intake', label: 'Intake', icon: Inbox },
  { to: '/practitioner/admin/m365', label: 'M365 Hub', icon: Database },
];

const AdminLayout = () => {
  const { user, profile, loading: authLoading } = useAuth();
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
        <main className="flex-1 container max-w-2xl pt-24 pb-16">
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
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─── Administrator header (mirrors Dashboard) ─── */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 mx-auto sm:mx-0 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-sm sm:text-lg bg-primary/10 text-primary">
                  {profile?.display_name?.[0] || user?.email?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                  <Shield className="h-5 w-5 text-primary" />
                  Administrator
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {profile?.display_name || user?.email}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[11px] font-medium">
                    Admin
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sub-nav pills ─── */}
          <nav className="flex flex-wrap items-center gap-1.5 mb-6 pb-4 border-b border-border/60">
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

          {/* ─── Child page ─── */}
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminLayout;
