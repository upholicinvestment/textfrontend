// OurTerms.tsx
import { Helmet } from 'react-helmet';

const OurTerms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>Terms & Conditions | UPHOLIC TECH PRIVATE LIMITED</title>
        <meta name="description" content="Terms and conditions for UPHOLIC TECH PRIVATE LIMITED" />
      </Helmet>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated on Aug 21st 2025</p>
        
        <div className="border-b border-gray-200 mb-6"></div>

        <div className="prose max-w-none">
          <p className="mb-4 text-gray-600">
            For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean UPHOLIC TECH PRIVATE LIMITED, whose registered/operational office is 1401 maple, mahavir kalpravrisha, ksarwadawali road Thane MAHARASHTRA 400615. "you", "your", "user", "visitor" shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
          </p>
          
          <p className="mb-6 text-gray-600">
            Your use of the website and/or purchase from us are governed by following Terms and Conditions:
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Content Changes</h2>
          <p className="mb-6 text-gray-600">
            The content of the pages of this website is subject to change without notice.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Accuracy of Information</h2>
          <p className="mb-4 text-gray-600">
            Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Use at Your Own Risk</h2>
          <p className="mb-6 text-gray-600">
            Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Intellectual Property</h2>
          <p className="mb-4 text-gray-600">
            Our website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
          </p>
          <p className="mb-6 text-gray-600">
            All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Unauthorized Use</h2>
          <p className="mb-6 text-gray-600">
            Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">External Links</h2>
          <p className="mb-6 text-gray-600">
            From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Linking to Our Website</h2>
          <p className="mb-6 text-gray-600">
            You may not create a link to our website from another website or document without UPHOLIC TECH PRIVATE LIMITED's prior written consent.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Governing Law</h2>
          <p className="mb-6 text-gray-600">
            Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Transaction Liability</h2>
          <p className="mb-6 text-gray-600">
            We shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Disclaimer</h2>
          <p className="mb-6 text-gray-600">
            The above content is created at UPHOLIC TECH PRIVATE LIMITED's sole discretion. Razorpay shall not be liable for any content provided here and shall not be responsible for any claims and liability that may arise due to merchant's non-adherence to it.
          </p>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: August 21, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurTerms;