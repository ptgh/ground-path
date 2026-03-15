
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, FileText, BookOpen, LayoutDashboard, Newspaper } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

// Auth-aware component that only loads auth when needed
const AuthAwareSection = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.display_name || user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/practitioner/dashboard')}>
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const shouldShowAuth = location.pathname.includes('/practitioner/');
  const isPractitionerRoute = shouldShowAuth;

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleProfessionalLogin = () => {
    navigate('/practitioner/auth');
  };

  const practitionerNavItems = [
    { label: 'Dashboard', path: '/practitioner/dashboard', icon: LayoutDashboard },
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
          <div className="logo-animate cursor-pointer" onClick={() => navigate(isPractitionerRoute ? '/practitioner/dashboard' : '/')}>
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-white bg-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
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
              publicNavItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="text-gray-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-md hover:bg-white/5 text-sm"
                >
                  {item.label}
                </button>
              ))
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {shouldShowAuth ? (
              <AuthAwareSection />
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => scrollToSection('contact')}
                  className="border-primary/40 text-primary-foreground bg-primary hover:bg-primary/90 px-5 py-2 rounded-lg font-medium text-sm"
                >
                  Book a Session
                </Button>
                <Button
                  variant="outline"
                  onClick={handleProfessionalLogin}
                  className="border-gray-400 text-white hover:text-white hover:border-white hover:bg-white/10 px-5 py-2 rounded-lg font-medium text-sm"
                >
                  Login
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
                        className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-white bg-white/10'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
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
                  <div className="border-t border-gray-700 my-2" />
                  <Button
                    onClick={() => { scrollToSection('contact'); setIsMenuOpen(false); }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full mb-2"
                  >
                    Book a Session
                  </Button>
                   <Button
                    onClick={() => { handleProfessionalLogin(); setIsMenuOpen(false); }}
                    className="bg-gray-700 text-white hover:bg-gray-600 border border-gray-500 w-full"
                  >
                    Professional Login
                  </Button>
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
