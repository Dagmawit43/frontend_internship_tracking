import Footer from './Footer';
import { Header } from './Header';

export function About() {
  return (
    <div className="About">
      <Header />
      <main style={{ minHeight: '60vh', padding: '2rem' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>About Us</h1>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#666' }}>
            Welcome to the AASTU Internship Tracking System. This platform is designed to 
            bridge the gap between academic learning and industrial experience.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default About;



