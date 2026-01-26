import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_80151a13-9706-49c2-8de6-38da4bc2b104/artifacts/j7knm7to_tatvgya%20logo.png";

const Footer = () => {
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Articles', path: '/explore' },
    { name: 'About Us', path: '/about' },
    { name: 'Our Vision', path: '/vision' },
    { name: 'Contact', path: '/contact' },
  ];

  const subjects = [
    { name: 'Science', path: '/explore?subject=science' },
    { name: 'Technology', path: '/explore?subject=technology' },
    { name: 'Arts', path: '/explore?subject=arts' },
    { name: 'Commerce', path: '/explore?subject=commerce' },
    { name: 'Humanities', path: '/explore?subject=humanities' },
    { name: 'Law', path: '/explore?subject=law' },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="footer py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/">
              <img src={LOGO_URL} alt="TATVGYA" className="h-12" />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Unlocking Wisdom, Connecting Minds. A platform where educators share diverse knowledge and students discover quality learning.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  data-testid={`social-${social.label.toLowerCase()}`}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#FFB800] hover:text-black transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/60 hover:text-[#FFB800] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subjects */}
          <div>
            <h4 className="text-white font-semibold mb-6">Explore Subjects</h4>
            <ul className="space-y-3">
              {subjects.map((subject) => (
                <li key={subject.path}>
                  <Link
                    to={subject.path}
                    className="text-white/60 hover:text-[#FFB800] transition-colors text-sm"
                  >
                    {subject.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-[#FFB800] mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">
                  123 Education Lane, Knowledge Park<br />
                  New Delhi, India - 110001
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-[#FFB800] flex-shrink-0" />
                <a href="mailto:contact@tatvgya.com" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                  contact@tatvgya.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-[#FFB800] flex-shrink-0" />
                <a href="tel:+911234567890" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                  +91 123 456 7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} TATVGYA. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
