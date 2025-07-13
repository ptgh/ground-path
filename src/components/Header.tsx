
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
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
  
  // Debug logging for navigation tracking
  console.log('Header rendering - Current route:', location.pathname);

  // Determine if we should show auth based purely on current route
  const shouldShowAuth = location.pathname.includes('/practitioner/');
  
  console.log('Should show auth:', shouldShowAuth, 'for route:', location.pathname);

  const scrollToSection = (sectionId: string) => {
    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      console.log('Navigating to home page to access section:', sectionId);
      navigate('/');
      // Let the page load, then scroll
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
    console.log('Professional login clicked - navigating to /practitioner/auth');
    navigate('/practitioner/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="logo-animate cursor-pointer" onClick={() => {
            console.log('Logo clicked - navigating to home');
            navigate('/');
          }}>
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Services
            </button>
            <button 
              onClick={() => navigate('/resources')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Resources
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Contact
            </button>
          </nav>

          {/* Practitioner Menu */}
          <div className="hidden md:flex items-center gap-4">
            {shouldShowAuth ? (
              <AuthAwareSection />
            ) : (
              <>
                <Button 
                  onClick={() => scrollToSection('contact')}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Book a Session
                </Button>
                <button 
                  onClick={handleProfessionalLogin}
                  className="bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Professional Login
                </button>
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
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-left text-gray-300 hover:text-white transition-colors font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-left text-gray-300 hover:text-white transition-colors font-medium"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-left text-gray-300 hover:text-white transition-colors font-medium"
              >
                Services
              </button>
              <button 
                onClick={() => navigate('/resources')}
                className="text-left text-gray-300 hover:text-white transition-colors font-medium"
              >
                Resources
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-left text-gray-300 hover:text-white transition-colors font-medium"
              >
                Contact
              </button>
              {!shouldShowAuth && (
                <>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="text-left bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium w-fit"
                  >
                    Book a Session
                  </button>
                  <button 
                    onClick={handleProfessionalLogin}
                    className="text-left bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-fit"
                  >
                    Professional Login
                  </button>
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
