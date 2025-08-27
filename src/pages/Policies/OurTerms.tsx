// OurTerms.tsx
import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';

const OurTerms = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    { id: 'content-changes', title: 'Content Changes', icon: '📝' },
    { id: 'accuracy', title: 'Accuracy of Information', icon: '✅' },
    { id: 'use-risk', title: 'Use at Your Own Risk', icon: '⚠️' },
    { id: 'ip', title: 'Intellectual Property', icon: '🔒' },
    { id: 'unauthorized', title: 'Unauthorized Use', icon: '🚫' },
    { id: 'links', title: 'External Links', icon: '🔗' },
    { id: 'linking', title: 'Linking to Our Website', icon: '📎' },
    { id: 'law', title: 'Governing Law', icon: '⚖️' },
    { id: 'liability', title: 'Transaction Liability', icon: '💳' },
    { id: 'disclaimer', title: 'Disclaimer', icon: '📄' }
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <Helmet>
        <title>Terms & Conditions | UPHOLIC TECH PRIVATE LIMITED</title>
        <meta name="description" content="Terms and conditions for UPHOLIC TECH PRIVATE LIMITED" />
      </Helmet>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating navigation for mobile */}
        <div className={`md:hidden fixed bottom-6 right-6 z-10 transition-all duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white rounded-full shadow-lg p-3">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-12 text-white overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-40 h-40 bg-blue-500 opacity-20 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-40 h-40 bg-indigo-500 opacity-20 rounded-full"></div>
            
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Terms & Conditions</h1>
              <div className="flex items-center mb-4">
                <div className="w-12 h-1 bg-blue-300 rounded-full mr-3"></div>
                <p className="text-blue-100 text-lg">Last updated on August 21st, 2025</p>
              </div>
              <p className="text-blue-100 opacity-90 max-w-3xl text-lg">
                Please read these terms carefully before using our website or purchasing our products.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar Navigation - for larger screens */}
            <div className="hidden lg:block lg:w-1/4 xl:w-1/5 bg-gray-50 p-6 border-r border-gray-200">
              <div className="sticky top-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">On this page</h3>
                <ul className="space-y-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a 
                        href={`#${section.id}`}
                        className="flex items-center py-3 px-4 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <span className="mr-3 text-lg">{section.icon}</span>
                        <span className="font-medium text-sm group-hover:translate-x-1 transition-transform">{section.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-800 uppercase mb-3">Company Info</h4>
                  <p className="text-sm text-blue-700">
                    UPHOLIC TECH PRIVATE LIMITED<br />
                    1401 maple, mahavir kalpravrisha<br />
                    ksarwadawali road Thane<br />
                    MAHARASHTRA 400615
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4 xl:w-4/5 p-6 md:p-8">
              <div className="max-w-6xl">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-0">
                      For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean UPHOLIC TECH PRIVATE LIMITED, whose registered/operational office is 1401 maple, mahavir kalpravrisha, ksarwadawali road Thane MAHARASHTRA 400615. "you", "your", "user", "visitor" shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8">
                  <p className="text-gray-700 mb-0 text-lg font-medium flex items-center">
                    <span className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                    </span>
                    Your use of the website and/or purchase from us are governed by following Terms and Conditions:
                  </p>
                </div>

                {/* Mobile accordion - for smaller screens */}
                <div className="lg:hidden mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pl-2">Sections</h3>
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div key={section.id} className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
                        <button 
                          className="w-full p-5 text-left font-medium text-gray-800 bg-white hover:bg-gray-50 flex justify-between items-center"
                          onClick={() => toggleSection(section.id)}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">{section.icon}</span>
                            <span>{section.title}</span>
                          </div>
                          <svg 
                            className={`w-5 h-5 transition-transform ${activeSection === section.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {activeSection === section.id && (
                          <div className="p-5 bg-gray-50 border-t border-gray-200">
                            {renderSectionContent(section.id)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop content */}
                <div className="hidden lg:block">
                  <Section 
                    id="content-changes" 
                    title="Content Changes" 
                    icon="📝"
                    content="The content of the pages of this website is subject to change without notice." 
                  />
                  
                  <Section 
                    id="accuracy" 
                    title="Accuracy of Information" 
                    icon="✅"
                    content="Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law." 
                  />
                  
                  <Section 
                    id="use-risk" 
                    title="Use at Your Own Risk" 
                    icon="⚠️"
                    content="Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements." 
                  />
                  
                  <Section 
                    id="ip" 
                    title="Intellectual Property" 
                    icon="🔒"
                    content={
                      <>
                        Our website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
                        <br /><br />
                        All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.
                      </>
                    } 
                  />
                  
                  <Section 
                    id="unauthorized" 
                    title="Unauthorized Use" 
                    icon="🚫"
                    content="Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense." 
                  />
                  
                  <Section 
                    id="links" 
                    title="External Links" 
                    icon="🔗"
                    content="From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information." 
                  />
                  
                  <Section 
                    id="linking" 
                    title="Linking to Our Website" 
                    icon="📎"
                    content="You may not create a link to our website from another website or document without UPHOLIC TECH PRIVATE LIMITED's prior written consent." 
                  />
                  
                  <Section 
                    id="law" 
                    title="Governing Law" 
                    icon="⚖️"
                    content="Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India." 
                  />
                  
                  <Section 
                    id="liability" 
                    title="Transaction Liability" 
                    icon="💳"
                    content="We shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time." 
                  />
                  
                  <Section 
                    id="disclaimer" 
                    title="Disclaimer" 
                    icon="📄"
                    content="The above content is created at UPHOLIC TECH PRIVATE LIMITED's sole discretion. Razorpay shall not be liable for any content provided here and shall not be responsible for any claims and liability that may arise due to merchant's non-adherence to it." 
                  />
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="bg-gray-100 p-3 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        Last updated: August 21, 2025
                      </p>
                    </div>
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Back to top
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section component for better organization
const Section = ({ id, title, icon, content }: { id: string, title: string, icon: string, content: React.ReactNode }) => {
  return (
    <div id={id} className="mb-12 scroll-mt-20 p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <span className="bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mr-4 text-lg">
          {icon}
        </span>
        {title}
      </h2>
      <div className="text-gray-600 leading-7 pl-14">
        {content}
      </div>
    </div>
  );
};

// Helper function to render section content for mobile accordion
const renderSectionContent = (id: string) => {
  switch(id) {
    case 'content-changes':
      return <p className="text-gray-600">The content of the pages of this website is subject to change without notice.</p>;
    case 'accuracy':
      return <p className="text-gray-600">Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</p>;
    case 'use-risk':
      return <p className="text-gray-600">Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.</p>;
    case 'ip':
      return (
        <>
          <p className="text-gray-600">Our website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</p>
          <p className="text-gray-600 mt-4">All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.</p>
        </>
      );
    case 'unauthorized':
      return <p className="text-gray-600">Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.</p>;
    case 'links':
      return <p className="text-gray-600">From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.</p>;
    case 'linking':
      return <p className="text-gray-600">You may not create a link to our website from another website or document without UPHOLIC TECH PRIVATE LIMITED's prior written consent.</p>;
    case 'law':
      return <p className="text-gray-600">Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.</p>;
    case 'liability':
      return <p className="text-gray-600">We shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.</p>;
    case 'disclaimer':
      return <p className="text-gray-600">The above content is created at UPHOLIC TECH PRIVATE LIMITED's sole discretion. Razorpay shall not be liable for any content provided here and shall not be responsible for any claims and liability that may arise due to merchant's non-adherence to it.</p>;
    default:
      return null;
  }
};

export default OurTerms;