import { 
    Users, 
    FileText, 
    MessageSquare, 
    BarChart3, 
    Shield, 
    Bell 
  } from 'lucide-react';
  // styles are linked globally via index.html
  
  const features = [
    {
      icon: Users,
      title: 'Role-Based Login',
      description: 'Dedicated access for students, advisors, supervisors, and companies with customized dashboards.',
    },
    {
      icon: FileText,
      title: 'Report Submission & Tracking',
      description: 'Easy submission and real-time tracking of internship reports and documentation.',
    },
    {
      icon: MessageSquare,
      title: 'Evaluation & Feedback',
      description: 'Comprehensive evaluation tools for supervisors to provide constructive feedback to students.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Visual performance metrics and insights for tracking student progress and outcomes.',
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Industry-standard security protocols to protect sensitive student and company data.',
    },
    {
      icon: Bell,
      title: 'Automated Notifications',
      description: 'Smart alerts and reminders for deadlines, submissions, and important updates.',
    },
  ];
  
  export function Features() {
    return (
      <section id="features" className="features">
        <div className="container">
          <div className="features-header">
            <h2 className="features-title">Key Features</h2>
            <p className="features-subtitle">
              Powerful tools designed to streamline the entire internship management process
            </p>
          </div>
  
          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
  