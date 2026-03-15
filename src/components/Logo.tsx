
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Logo = () => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;

    // Hover animation
    const handleMouseEnter = () => {
      gsap.to(logo.querySelector('.spiral-path'), {
        rotation: 15,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(logo.querySelector('.spiral-path'), {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    logo.addEventListener('mouseenter', handleMouseEnter);
    logo.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      logo.removeEventListener('mouseenter', handleMouseEnter);
      logo.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={logoRef} className="flex items-center space-x-3 cursor-pointer">
      {/* SVG Logo */}
      <svg width="40" height="40" viewBox="0 0 40 40" className="spiral-path">
        <path
          d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
          fill="none"
          stroke="#7B9B85"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Wordmark */}
      <div className="text-white font-light tracking-widest">
        <span className="text-xl">groundpath</span>
      </div>
    </div>
  );
};

export default Logo;
