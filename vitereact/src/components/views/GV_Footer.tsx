import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_Footer: React.FC = () => {
  const currentLanguage = useAppStore(state => state.currentLanguage || 'ar');
  const currentCurrency = useAppStore(state => state.currentCurrency || 'LYD');
  
  const changeLanguage = useAppStore(state => state.setLanguage);

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
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
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
                    <svg className="h-4 w-6" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="30" height="20" fill="#CE1126"/>
                      <rect y="6.66663" width="30" height="6.66667" fill="black"/>
                      <rect y="13.3334" width="30" height="6.66667" fill="#007A3D"/>
                    </svg>
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