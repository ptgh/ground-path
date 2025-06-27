
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 40 40">
                <path
                  d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                  fill="none"
                  stroke="#7B9B85"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-lg font-light tracking-wide">ground path</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Professional social work and mental health support, grounded in care and evidence-based practice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="inline-block bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium">About</a></li>
              <li><a href="#services" className="inline-block bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium">Services & Rates</a></li>
              <li><a href="#contact" className="inline-block bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium">Contact</a></li>
              <li><a href="https://www.mable.com.au" target="_blank" rel="noopener noreferrer" className="inline-block bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium">Mable Profile</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-medium mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>enquiries@groundpath.com.au</p>
              <p>Perth, Western Australia</p>
              <p>London, UK (on request)</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            © 2024 Ground Path. All rights reserved.
          </div>
          <div className="text-sm text-gray-400 mt-4 md:mt-0">
            <span>Paul</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
