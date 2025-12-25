import React from 'react';
import { Instagram, Send, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import logo from '../../assets/images/logo.svg';

const TikTokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const Footer: React.FC = () => {
  const { contact } = useData();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { name: 'Главная', path: '/' },
    { name: 'Новости', path: '/news' },
    { name: 'Меню', path: '/#menu' },
    { name: 'Локации', path: '/#locations' },
  ];

  return (
    <footer className="bg-black text-white py-8 md:py-12 border-t border-white/5 relative overflow-hidden safe-bottom">
      {/* Subtle Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[500px] h-[150px] md:h-[200px] bg-amber-500/5 rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        
        {/* Logo */}
        <Link to="/" onClick={scrollToTop} className="mb-8 group">
          <img 
            src={logo} 
            alt="Medisson Logo" 
            className="h-8 w-auto invert brightness-0 filter group-hover:opacity-80 transition-opacity" 
            style={{ filter: 'brightness(0) invert(1)' }} 
          />
        </Link>

        {/* Navigation */}
        <nav className="flex flex-wrap justify-center gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4 mb-8 md:mb-10">
          {navLinks.map((item) => (
            <Link 
              key={item.name}
              to={item.path} 
              className="text-xs md:text-sm font-medium text-white/60 hover:text-amber-500 transition-colors uppercase tracking-wider touch-target flex items-center"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Social Icons */}
        <div className="flex items-center gap-5 md:gap-6 mb-8 md:mb-10">
          <a
            href={contact?.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-amber-500 hover:scale-110 transition-all duration-300 touch-target flex items-center justify-center"
            aria-label="Instagram"
          >
            <Instagram size={22} className="md:w-5 md:h-5" />
          </a>
          <a
            href={contact?.socials.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-amber-500 hover:scale-110 transition-all duration-300"
            aria-label="Telegram"
          >
            <Send size={20} />
          </a>
          <a
            href={contact?.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-amber-500 hover:scale-110 transition-all duration-300"
            aria-label="YouTube"
          >
            <Youtube size={22} />
          </a>
          <a
            href={contact?.socials.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-amber-500 hover:scale-110 transition-all duration-300"
            aria-label="TikTok"
          >
            <TikTokIcon size={20} />
          </a>
        </div>

        {/* Bottom Info */}
        <div className="flex flex-col items-center gap-3 md:gap-4 text-[10px] md:text-xs text-white/30">
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors touch-target flex items-center">
              Политика конфиденциальности
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="border border-white/10 px-2 py-0.5 rounded">18+</span>
          </div>
          <p>© 2025 Medisson Lounge. Все права защищены.</p>
          <Link to="/admin/login" className="text-white/10 hover:text-white/30 transition-colors mt-3 md:mt-4 touch-target flex items-center">
            админ
          </Link>
        </div>

      </div>
    </footer>
  );
};
