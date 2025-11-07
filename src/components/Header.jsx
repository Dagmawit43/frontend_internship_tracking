import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import aastuLogo from '../assets/aastu logo.jpg';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate(); 

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="header">
      <nav className="header-nav container">
        <div className="header-content">
      
          <div className="header-logo">
            <div className="header-logo-icon">
              <img src={aastuLogo} alt="AASTU logo" className="header-logo-img" />
            </div>
            <div className="header-logo-text">
              <div>AASTU Internship</div>
              <div>Tracking System</div>
            </div>
          </div>


          <div className="header-desktop-nav">
            <Link to="/" className="header-nav-link">Home</Link>
            <Link to="/about" className="header-nav-link">About</Link>
            <button onClick={() => scrollToSection('features')} className="header-nav-link">Features</button>
            <button onClick={() => scrollToSection('contact')} className="header-nav-link">Contact</button>
            <button className="header-btn header-btn-outline" onClick={() => navigate('/login')}>Login</button>
            <button className="header-btn header-btn-primary" onClick={() => alert('Get Started functionality would go here')}>Get Started</button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="header-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="header-mobile-nav">
            <Link to="/" className="header-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/about" className="header-nav-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <button onClick={() => scrollToSection('features')} className="header-nav-link">Features</button>
            <button onClick={() => scrollToSection('contact')} className="header-nav-link">Contact</button>
            <button
              className="header-btn header-btn-outline"
              onClick={() => {
                navigate('/login'); // ✅ Updated to use navigate here too
                setMobileMenuOpen(false);
              }}
            >
              Login
            </button>
            <button
              className="header-btn header-btn-primary"
              onClick={() => {
                alert('Get Started functionality would go here');
                setMobileMenuOpen(false);
              }}
            >
              Get Started
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
