import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';

interface NavbarProps {
  onOpenBooking?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Handle internal page navigation
    if (href.startsWith('/')) {
      navigate(href);
      setIsMobileMenuOpen(false);
      window.scrollTo(0, 0);
      return;
    }

    const targetId = href.replace('#', '');
    
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(targetId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'О нас', href: '#about' },
    { name: 'Меню', href: '#menu' },
    { name: 'Новости', href: '/news' },
    { name: 'Галерея', href: '#atmosphere' },
    { name: 'Система лояльности', href: '/loyalty' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-top ${
        isScrolled || location.pathname !== '/'
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-3 md:py-4' 
          : 'bg-transparent py-4 md:py-6'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <Link to="/" className="relative group">
          <img src={logo} alt="Medisson Logo" className="h-10 md:h-12 w-auto invert brightness-0 filter" style={{ filter: 'brightness(0) invert(1)' }} />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-white/80 hover:text-white transition-colors text-xs uppercase tracking-[0.2em] relative group cursor-pointer"
            >
              {item.name}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-px bg-amber-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <button 
            onClick={onOpenBooking}
            className="relative px-8 py-2 overflow-hidden group border border-white/20"
          >
            <span className="absolute inset-0 w-full h-full transition duration-300 group-hover:bg-white" />
            <span className="relative text-xs uppercase tracking-[0.2em] text-white transition duration-300 group-hover:text-black">
              Забронировать
            </span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-amber-500 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 overflow-hidden md:hidden max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="flex flex-col p-6 md:p-8 space-y-5 md:space-y-6 items-center safe-bottom">
              {navLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white/80 hover:text-amber-500 text-base md:text-lg uppercase tracking-widest transition-colors py-2 touch-target flex items-center justify-center"
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.name}
                </a>
              ))}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenBooking) onOpenBooking();
                }}
                className="border border-white/30 px-8 py-4 text-white w-full uppercase tracking-widest hover:bg-white hover:text-black transition-all touch-target text-base"
              >
                Забронировать
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
