const RefundCancellationPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-6 md:px-10">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold mb-3">Cancellation & Refund Policy</h1>
            <p className="text-indigo-100 opacity-90">Last updated on Aug 21st 2025</p>
          </div>
          <div className="flex justify-center">
            <div className="w-24 h-1 bg-indigo-300 rounded-full"></div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-10">
          <div className="prose prose-indigo max-w-none">
            <div className="mb-2">
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                UPHOLIC TECH PRIVATE LIMITED believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700">
                      1
                    </div>
                  </div>
                  <p className="text-gray-700">
                    Cancellations will be considered only if the request is made within 1-2 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700">
                      2
                    </div>
                  </div>
                  <p className="text-gray-700">
                    UPHOLIC TECH PRIVATE LIMITED does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700">
                      3
                    </div>
                  </div>
                  <p className="text-gray-700">
                    In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 1-2 days of receipt of the products.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700">
                      4
                    </div>
                  </div>
                  <p className="text-gray-700">
                    In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 1-2 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700">
                      5
                    </div>
                  </div>
                  <p className="text-gray-700">
                    In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700">
                      6
                    </div>
                  </div>
                  <p className="text-gray-700">
                    In case of any Refunds approved by the UPHOLIC TECH PRIVATE LIMITED, it'll take 1-2 days for the refund to be processed to the end customer.
                  </p>
                </div>
              </div>
              
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-5 rounded-r-lg mt-10">
                <p className="text-gray-700 text-sm italic">
                  Disclaimer: The above content is created at UPHOLIC TECH PRIVATE LIMITED's sole discretion. 
                  Razorpay shall not be liable for any content provided here and shall not be responsible for 
                  any claims and liability that may arise due to merchant's non-adherence to it.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col items-center">
              <p className="text-gray-600 text-center mb-4">
                For any questions regarding this policy, please contact us at
              </p>
              <a 
                href="mailto:upholictech@upholic.in" 
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                upholictech@upholic.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundCancellationPolicy;