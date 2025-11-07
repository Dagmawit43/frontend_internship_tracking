import { ChevronDown } from 'lucide-react';
// styles are linked globally via index.html

export function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <img 
          src="https://images.unsplash.com/photo-1695066964145-245927509533?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHdvcmtpbmclMjBsYXB0b3BzJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NjE4MjY3Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Students collaborating"
        />
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content container">
        <div className="hero-inner">
          <h1 className="hero-title">
            Simplifying Internship Management for Students and Supervisors
          </h1>
          <p className="hero-subtitle">
            A centralized platform to monitor, evaluate, and streamline internship activities between universities and companies.
          </p>
          <button 
            className="hero-btn"
            onClick={() => scrollToSection('about')}
          >
            Learn More
            <ChevronDown />
          </button>
        </div>
      </div>
    </section>
  );
}
