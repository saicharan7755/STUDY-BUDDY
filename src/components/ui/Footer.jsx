const Footer = () => {
  return (
    <footer className="border-t border-white/10 py-8 mt-auto text-center">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-gray-400 text-sm font-medium mb-4">
          CRAM AI — built for the night-before warriors 🌙
        </p>
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-accent transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-accent transition-colors">
            About
          </a>
          <a href="#" className="hover:text-accent transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
