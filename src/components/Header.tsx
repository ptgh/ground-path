
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="logo-animate">
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
              onClick={() => scrollToSection('contact')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Contact
            </button>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button 
              onClick={() => scrollToSection('contact')}
              className="bg-sage-600 text-white px-6 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium"
            >
              Book a Session
            </button>
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
                onClick={() => scrollToSection('contact')}
                className="text-left text-gray-300 hover:text-white transition-colors font-medium"
              >
                Contact
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-left bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium w-fit"
              >
                Book a Session
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
