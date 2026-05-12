import '../../styles/demo.css';

export const metadata = {
  title: 'Interactive Demo Hub | EduVantage',
  description: 'Experience EduVantage School Management System in action with our live role-based demos.',
};

export default function DemoLayout({ children }) {
  return (
    <div className="demo-root-wrapper">
      {children}
    </div>
  );
}
