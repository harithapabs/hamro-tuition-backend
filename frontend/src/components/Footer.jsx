import { Link } from 'react-router-dom';
import { FaBookOpen, FaFacebook, FaYoutube, FaInstagram, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaBookOpen className="text-blue-400 text-2xl" />
              <span className="text-xl font-bold text-white">Hamro Tuition</span>
            </div>
            <p className="text-sm leading-relaxed">
              Nepal's premier online learning platform. Learn from the best educators across the country.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                <FaFacebook />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors">
                <FaYoutube />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors">
                <FaInstagram />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/courses" className="hover:text-blue-400 transition-colors">Courses</Link></li>
              <li><Link to="/courses?category=Class8" className="hover:text-blue-400 transition-colors">Class 8</Link></li>
              <li><Link to="/courses?category=Plus2" className="hover:text-blue-400 transition-colors">+2 Level</Link></li>
              <li><Link to="/courses?category=Bachelor" className="hover:text-blue-400 transition-colors">Bachelor Level</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Refund Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-1 text-blue-400 flex-shrink-0" />
                <span>Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-blue-400 flex-shrink-0" />
                <span>+977-9843684295</span>
              </li>
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-blue-400 flex-shrink-0" />
                <span>info@hamrotuition.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Hamro Tuition. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
