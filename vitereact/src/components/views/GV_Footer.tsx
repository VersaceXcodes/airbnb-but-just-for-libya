import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_Footer: React.FC = () => {
  const currentLanguage = useAppStore(state => state.locale || 'ar');
  const changeLanguage = useAppStore(state => state.changeLanguage);

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

  return (
    <>
      <footer className="bg-gray-900 text-gray-300 mt-auto" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" lang="ar">ليبيا ستاي</h3>
              <p className="text-sm">
                {currentLanguage === 'ar' 
                  ? 'منصة حجز أماكن الإقامة في ليبيا، مكرسة لربط المسافرين بمضيفي المواقع المحلية لتجربة تراثية حقيقية.'
                  : 'LibyaStay connects travelers with local hosts for authentic Libyan accommodation experiences.'}
              </p>
              <div className="text-sm">
                <p className="font-semibold text-white">Contact Us</p>
                <p>123 Tripoli Street</p>
                <p>Tripoli, Libya</p>
                <p>+218 91 234 5678</p>
                <p>support@libyastay.com</p>
              </div>
            </div>

            {/* Legal & Support Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                {currentLanguage === 'ar' ? 'الروابط القانونية والدعم' : 'Legal & Support'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    {currentLanguage === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    {currentLanguage === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="hover:text-white transition-colors">
                    {currentLanguage === 'ar' ? 'مركز المساعدة' : 'Help Center'}
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="hover:text-white transition-colors">
                    {currentLanguage === 'ar' ? 'إرشادات السلامة' : 'Safety Guidelines'}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    {currentLanguage === 'ar' ? 'الإبلاغ عن إساءة' : 'Report Abuse'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                {currentLanguage === 'ar' ? 'تابعنا' : 'Follow Us'}
              </h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
              <div className="text-sm mt-4">
                <p className="font-semibold text-white">{currentLanguage === 'ar' ? 'الشراكات' : 'Partnerships'}</p>
                <p>{currentLanguage === 'ar' ? 'في تعاون مع المؤسسات المحلية' : 'In partnership with local institutions'}</p>
              </div>
            </div>

            {/* Localization Elements */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                {currentLanguage === 'ar' ? 'الإعدادات' : 'Settings'}
              </h3>
              <div className="space-y-3">
                {/* Language Selector */}
                <div>
                  <label htmlFor="language-select" className="block text-sm font-medium text-gray-400 mb-1">
                    {currentLanguage === 'ar' ? 'اللغة' : 'Language'}
                  </label>
                  <select
                    id="language-select"
                    value={currentLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Currency Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {currentLanguage === 'ar' ? 'العملة' : 'Currency'}
                  </label>
                  <div className="flex items-center">
                    <span className="mr-2">LYD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright and Legal Text */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} LibyaStay. {currentLanguage === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <div className="mt-2 flex justify-center space-x-6">
              <span>{currentLanguage === 'ar' ? 'منصة Libyan Market' : 'Libyan Market Platform'}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;