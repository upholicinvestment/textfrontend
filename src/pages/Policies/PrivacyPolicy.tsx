import Footer from "../../components/layout/Footer/Footer";
import Navbar from "../../components/layout/Navbar/Navbar";

const PrivacyPolicy = () => {
  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Policy Contents
            </h2>
            <nav className="space-y-2">
              <a href="#introduction" className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Introduction</a>
              <a href="#information-collection" className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Information Collection</a>
              <a href="#information-usage" className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Information Usage</a>
              <a href="#cookies" className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Cookies Policy</a>
              <a href="#privacy-controls" className="block py-2 px-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Privacy Controls</a>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Document Info</h3>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Last updated: Aug 21, 2025
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Version: 2.1
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 md:p-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-indigo-100 max-w-2xl mx-auto">How UPHOLIC TECH PRIVATE LIMITED collects, uses, and protects your personal information</p>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 lg:p-10">
              {/* Introduction */}
              <section id="introduction" className="mb-12 scroll-mt-20">
                <div className="flex items-start mb-6">
                  <div className="bg-indigo-100 p-3 rounded-2xl mr-4 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
                    <div className="space-y-4 text-gray-600">
                      <p>This privacy policy sets out how UPHOLIC TECH PRIVATE LIMITED uses and protects any information that you give UPHOLIC TECH PRIVATE LIMITED when you visit their website and/or agree to purchase from them.</p>
                      <p>UPHOLIC TECH PRIVATE LIMITED is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, and then you can be assured that it will only be used in accordance with this privacy statement.</p>
                      <p>UPHOLIC TECH PRIVATE LIMITED may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you adhere to these changes.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Information Collection */}
              <section id="information-collection" className="mb-12 scroll-mt-20">
                <div className="flex items-start mb-6">
                  <div className="bg-indigo-100 p-3 rounded-2xl mr-4 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Information We Collect</h2>
                    <p className="text-gray-600 mb-4">We may collect the following information:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Name and contact details</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Demographic information</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Preferences and interests</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">Other information for surveys/offers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Information Usage */}
              <section id="information-usage" className="mb-12 scroll-mt-20">
                <div className="flex items-start mb-6">
                  <div className="bg-indigo-100 p-3 rounded-2xl mr-4 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">How We Use Your Information</h2>
                    <p className="text-gray-600 mb-4">
                      We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:
                    </p>
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <span className="text-white text-sm font-bold">1</span>
                          </div>
                          <span className="text-gray-600">Internal record keeping</span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <span className="text-white text-sm font-bold">2</span>
                          </div>
                          <span className="text-gray-600">Improving our products and services</span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <span className="text-white text-sm font-bold">3</span>
                          </div>
                          <span className="text-gray-600">Sending promotional emails about new products or special offers</span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <span className="text-white text-sm font-bold">4</span>
                          </div>
                          <span className="text-gray-600">Contacting you for market research purposes</span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <span className="text-white text-sm font-bold">5</span>
                          </div>
                          <span className="text-gray-600">Customizing the website according to your interests</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-gray-600">
                      We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure we have put in suitable measures.
                    </p>
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies" className="mb-12 scroll-mt-20">
                <div className="flex items-start mb-6">
                  <div className="bg-indigo-100 p-3 rounded-2xl mr-4 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">How We Use Cookies</h2>
                    <div className="space-y-4 text-gray-600">
                      <p>A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual. The web application can tailor its operations to your needs, likes and dislikes by gathering and remembering information about your preferences.</p>
                      <p>We use traffic log cookies to identify which pages are being used. This helps us analyze data about webpage traffic and improve our website in order to tailor it to customer needs. We only use this information for statistical analysis purposes and then the data is removed from the system.</p>
                      <p>Overall, cookies help us provide you with a better website, by enabling us to monitor which pages you find useful and which you do not. A cookie in no way gives us access to your computer or any information about you, other than the data you choose to share with us.</p>
                      <p>You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Privacy Controls */}
              <section id="privacy-controls" className="mb-12 scroll-mt-20">
                <div className="flex items-start mb-6">
                  <div className="bg-indigo-100 p-3 rounded-2xl mr-4 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Controlling Your Personal Information</h2>
                    <p className="text-gray-600 mb-4">
                      You may choose to restrict the collection or use of your personal information in the following ways:
                    </p>
                    <div className="bg-gray-50 rounded-xl p-5 mb-4">
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-600">Whenever you are asked to fill in a form on the website, look for the box that you can click to indicate that you do not want the information to be used by anybody for direct marketing purposes</span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-600">If you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time by writing to or emailing us</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-gray-600 mb-4">
                      We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so. We may use your personal information to send you promotional information about third parties which we think you may find interesting if you tell us that you wish this to happen.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
                      <p className="text-gray-600">
                        If you believe that any information we are holding on you is incorrect or incomplete, please write to 1401 maple, mahavir kalpravrisha, ksarwadawali road Thane MAHARASHTRA 400615 or contact us as soon as possible. We will promptly correct any information found to be incorrect.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Disclaimer */}
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-5 rounded-lg mt-8">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-600 text-sm italic">
                    Disclaimer: The above content is created at UPHOLIC TECH PRIVATE LIMITED's sole discretion. 
                    Razorpay shall not be liable for any content provided here and shall not be responsible for 
                    any claims and liability that may arise due to merchant's non-adherence to it.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-gray-50 p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Have Questions About Our Privacy Policy?</h3>
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">We're here to help you understand our practices and address any concerns you might have.</p>
              <a href="mailto:upholictech@upholic.in" className="inline-flex items-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Contact Us at upholictech@upholic.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default PrivacyPolicy;