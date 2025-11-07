// styles are linked globally via index.html

function Footer() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <h3>AASTU Internship Tracking System</h3>
            <p>
              Bridging the gap between academic learning and industrial experience.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <button 
                onClick={() => scrollToSection('home')}
                className="footer-link"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="footer-link"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="footer-link"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="footer-link"
              >
                Contact
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="footer-section">
            <h4>Developed By</h4>
            <p>
              Software Engineering Students<br />
              Addis Ababa Science and Technology University
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          <p>
            © 2025 AASTU Internship Tracking System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;