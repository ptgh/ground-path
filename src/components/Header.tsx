
import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, User, LogOut, FileText, BookOpen, LayoutDashboard, Newspaper, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import Logo from './Logo';
import { scrollToSectionWithOffset } from '@/lib/utils';

// Auth-aware component that only loads auth when needed
const AuthAwareSection = () => {
  const { user, profile, roles, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRoleBadge = () => {
    const isAdmin = roles.some(r => r.role === 'admin');
    const isPractitioner = profile?.user_type === 'practitioner' || roles.some(r => r.role === 'social_worker' || r.role === 'mental_health_professional');
    
    if (isAdmin) return { label: 'Admin', className: 'bg-emerald-800 text-emerald-50', short: 'Admin' };
    if (isPractitioner) return { label: 'Practitioner', className: 'bg-emerald-600/20 text-emerald-700', short: 'Practitioner' };
    return { label: 'Client', className: 'bg-emerald-100 text-emerald-600', short: '' };
  };

  const roleBadge = getRoleBadge();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                {profile?.display_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem className="font-normal">
            <div className="flex flex-col space-y-1.5">
              <p className="text-sm font-medium leading-none">
                {profile?.display_name || user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const dashPath = profile?.user_type === 'practitioner' ? '/practitioner/dashboard' : '/dashboard';
            navigate(dashPath);
          }}>
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
};

// Flip Calendar Login Button
const FlipLoginButton = ({ onClick }: { onClick: () => void }) => {
  const [showSignUp, setShowSignUp] = useState(false);
  const frontRef = useRef<HTMLSpanElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const flipInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    flipInterval.current = setInterval(() => {
      setShowSignUp(prev => !prev);
    }, 5000);
    return () => { if (flipInterval.current) clearInterval(flipInterval.current); };
  }, []);

  useEffect(() => {
    if (!frontRef.current || !backRef.current) return;
    if (showSignUp) {
      gsap.to(frontRef.current, { rotateX: -90, opacity: 0, duration: 0.3, ease: 'power2.in' });
      gsap.fromTo(backRef.current, { rotateX: 90, opacity: 0 }, { rotateX: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.15 });
    } else {
      gsap.to(backRef.current, { rotateX: 90, opacity: 0, duration: 0.3, ease: 'power2.in' });
      gsap.fromTo(frontRef.current, { rotateX: -90, opacity: 0 }, { rotateX: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.15 });
    }
  }, [showSignUp]);

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className="relative border border-gray-400 text-white hover:text-white hover:border-white hover:bg-white/10 px-5 py-2 rounded-lg font-medium text-sm h-10 overflow-hidden"
      style={{ perspective: '400px', minWidth: '80px' }}
    >
      <span
        ref={frontRef}
        className="block"
        style={{ transformOrigin: 'center bottom', backfaceVisibility: 'hidden' }}
      >
        Sign In
      </span>
      <span
        ref={backRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformOrigin: 'center top', backfaceVisibility: 'hidden', opacity: 0 }}
      >
        Sign Up
      </span>
    </button>
  );
};

// Unread badge component for nav items
const NavUnreadBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? '99+' : count}
    </span>
  );
};
// Mobile auth indicator - shows avatar + role in header bar
const MobileAuthIndicator = () => {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();

  const isAdmin = roles.some(r => r.role === 'admin');
  const isPractitioner = profile?.user_type === 'practitioner' || roles.some(r => r.role === 'social_worker' || r.role === 'mental_health_professional');

  const roleLabel = isAdmin ? 'Admin' : isPractitioner ? 'Practitioner' : '';

  return (
    <button
      onClick={() => {
        const dashPath = profile?.user_type === 'practitioner' ? '/practitioner/dashboard' : '/dashboard';
        navigate(dashPath);
      }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
    >
      <Avatar className="h-7 w-7">
        <AvatarImage src={profile?.avatar_url} />
        <AvatarFallback className="bg-emerald-600 text-white text-[10px] font-semibold">
          {profile?.display_name?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>
      {roleLabel && (
        <span className="text-[10px] font-medium text-emerald-400">{roleLabel}</span>
      )}
    </button>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const unreadCount = useUnreadMessages();

  const shouldShowAuth = location.pathname.includes('/practitioner/');
  const isPractitionerRoute = shouldShowAuth;
  const isLoggedIn = !!user;

  const scrollToSection = useCallback((sectionId: string) => {
    const doScroll = () => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }

      return scrollToSectionWithOffset(sectionId, 96);
    };

    if (location.pathname !== '/') {
      navigate('/');
      const tryScroll = (attempts = 0) => {
        if (doScroll()) {
          return;
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };
      setTimeout(() => tryScroll(), 200);
    } else {
      doScroll();
    }
    setIsMenuOpen(false);
  }, [location.pathname, navigate]);

  const handleProfessionalLogin = () => {
    navigate('/practitioner/auth');
  };

  const practitionerNavItems = [
    { label: 'Dashboard', path: '/practitioner/dashboard', icon: LayoutDashboard },
    { label: 'Messages', path: '/practitioner/messages', icon: MessageSquare, showBadge: true },
    { label: 'Forms', path: '/practitioner/forms', icon: FileText },
    { label: 'Resources', path: '/resources', icon: BookOpen },
  ];

  const publicNavItems = [
    { label: 'Home', action: () => scrollToSection('home') },
    { label: 'About', action: () => scrollToSection('about') },
    { label: 'Services', action: () => scrollToSection('services') },
    { label: 'Client Resources', action: () => navigate('/resources') },
    { label: 'Newsletter', action: () => scrollToSection('newsletter') },
    { label: 'Contact', action: () => scrollToSection('contact') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="logo-animate cursor-pointer" onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/');
            }
          }}>
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {isPractitionerRoute ? (
              <>
                {practitionerNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-white bg-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {item.showBadge && <NavUnreadBadge count={unreadCount} />}
                    </button>
                  );
                })}
                {/* Separator + public links */}
                <div className="w-px h-5 bg-gray-700 mx-2" />
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium px-3 py-2"
                >
                  View Site
                </button>
              </>
            ) : (
              <>
                {publicNavItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5 text-sm"
                  >
                    {item.label}
                  </button>
                ))}
                {/* Nav items for logged-in users on public pages */}
                {isLoggedIn && (
                  <>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="relative text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5 text-sm flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/messages')}
                      className="relative text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5 text-sm flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Messages
                      <NavUnreadBadge count={unreadCount} />
                    </button>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <AuthAwareSection />
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => scrollToSection('booking')}
                  className="border-primary/40 text-primary-foreground bg-primary hover:bg-primary/90 px-5 py-2 rounded-lg font-medium text-sm"
                >
                  Book a Session
                </Button>
                <FlipLoginButton onClick={handleProfessionalLogin} />
              </>
            )}
          </div>

          {/* Mobile: user indicator + menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && <MobileAuthIndicator />}
            <button
              className="p-2 text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-1 px-2">
              {isPractitionerRoute ? (
                <>
                  {practitionerNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.label}
                        onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                        className={`relative flex items-center gap-2 text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-white bg-white/10'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.showBadge && unreadCount > 0 && (
                          <Badge className="ml-auto bg-primary text-primary-foreground text-[10px] h-5 min-w-[20px]">
                            {unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-gray-700 my-2" />
                  <button
                    onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                    className="text-left text-gray-400 hover:text-white transition-colors text-sm font-medium px-3 py-2.5"
                  >
                    View Site
                  </button>
                </>
              ) : (
                <>
                  {publicNavItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setIsMenuOpen(false); }}
                      className="text-left text-gray-300 hover:text-white transition-colors font-medium px-3 py-2.5 rounded-md hover:bg-white/5 text-sm"
                    >
                      {item.label}
                    </button>
                  ))}
                  {isLoggedIn && (
                    <>
                      <button
                        onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}
                        className="flex items-center gap-2 text-left text-gray-300 hover:text-white transition-colors font-medium px-3 py-2.5 rounded-md hover:bg-white/5 text-sm"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { navigate('/messages'); setIsMenuOpen(false); }}
                        className="relative flex items-center gap-2 text-left text-gray-300 hover:text-white transition-colors font-medium px-3 py-2.5 rounded-md hover:bg-white/5 text-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Messages
                        {unreadCount > 0 && (
                          <Badge className="ml-auto bg-primary text-primary-foreground text-[10px] h-5 min-w-[20px]">
                            {unreadCount}
                          </Badge>
                        )}
                      </button>
                    </>
                  )}
                  <div className="border-t border-gray-700 my-2" />
                  <Button
                    onClick={() => { scrollToSection('booking'); setIsMenuOpen(false); }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full mb-2"
                  >
                    Book a Session
                  </Button>
                  {isLoggedIn ? (
                    <AuthAwareSection />
                  ) : (
                    <Button
                      onClick={() => { handleProfessionalLogin(); setIsMenuOpen(false); }}
                      className="bg-gray-700 text-white hover:bg-gray-600 border border-gray-500 w-full"
                    >
                      Login
                    </Button>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
