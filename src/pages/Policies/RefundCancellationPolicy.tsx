const RefundCancellationPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cancellation & Refund Policy</h1>
          <p className="text-gray-500">Last updated on Aug 21st 2025</p>
          <div className="w-20 h-1 bg-indigo-600 mx-auto mt-4"></div>
        </div>

        <div className="prose prose-indigo max-w-none">
          <div className="mb-10">
            <p className="text-gray-600 mb-6">
              UPHOLIC TECH PRIVATE LIMITED believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
            </p>
            
            <ul className="text-gray-600 list-disc pl-5 mb-4 space-y-3">
              <li>Cancellations will be considered only if the request is made within 1-2 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.</li>
              
              <li>UPHOLIC TECH PRIVATE LIMITED does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.</li>
              
              <li>In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 1-2 days of receipt of the products.</li>
              
              <li>In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 1-2 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.</li>
              
              <li>In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.</li>
              
              <li>In case of any Refunds approved by the UPHOLIC TECH PRIVATE LIMITED, it'll take 1-2 days for the refund to be processed to the end customer.</li>
            </ul>
            
            <div className="bg-gray-100 p-4 rounded-md mt-6">
              <p className="text-gray-600 text-sm italic">
                Disclaimer: The above content is created at UPHOLIC TECH PRIVATE LIMITED's sole discretion. 
                Razorpay shall not be liable for any content provided here and shall not be responsible for 
                any claims and liability that may arise due to merchant's non-adherence to it.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-center">
            For any questions regarding this policy, please contact us at{' '}
            <a href="mailto:upholictech@upholic.in" className="text-indigo-600 hover:underline">
              upholictech@upholic.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundCancellationPolicy;