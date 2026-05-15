const Footer = () => {
  return (
    <footer className="border-t border-white/10 py-8 mt-auto text-center">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-gray-400 text-sm font-medium mb-4">
          © {new Date().getFullYear()} CRAM AI — built for the night-before warriors 🌙
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <a
            href="/privacy-policy"
            aria-label="View the CRAM AI Privacy Policy"
            className="hover:text-accent transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            aria-label="View the CRAM AI Terms of Service"
            className="hover:text-accent transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="mailto:support@cramai.ai"
            aria-label="Contact CRAM AI support"
            className="hover:text-accent transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
