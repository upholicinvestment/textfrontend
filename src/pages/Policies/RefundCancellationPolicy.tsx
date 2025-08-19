
const RefundCancellationPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Refund Policy</h1>
          <div className="w-20 h-1 bg-indigo-600 mx-auto"></div>
        </div>

        <div className="prose prose-indigo max-w-none">
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Returns</h2>
            <p className="text-gray-600 mb-4">
              Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately we can't offer you a refund or exchange.
            </p>
            <p className="text-gray-600 mb-4">
              To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
            </p>
            <p className="text-gray-600 mb-4">
              Several types of goods are exempt from being returned. Perishable goods such as food, flowers, newspapers or magazines cannot be returned. We also do not accept products that are intimate or sanitary goods, hazardous materials, or flammable liquids or gases.
            </p>
            <p className="text-gray-600 mb-4">
              Additional non-returnable items:
            </p>
            <ul className="text-gray-600 list-disc pl-5 mb-4">
              <li>Gift cards</li>
              <li>Downloadable software products</li>
              <li>Some health and personal care items</li>
            </ul>
            <p className="text-gray-600 mb-4">
              To complete your return, we require a receipt or proof of purchase.
            </p>
            <p className="text-gray-600">
              Please do not send your purchase back to the manufacturer.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              There are certain situations where only partial refunds are granted:
            </h2>
            <ul className="text-gray-600 list-disc pl-5 mb-4">
              <li>Book with obvious signs of use</li>
              <li>CD, DVD, VHS tape, software, video game, cassette tape, or vinyl record that has been opened.</li>
              <li>Any item not in its original condition, is damaged or missing parts for reasons not due to our error.</li>
              <li>Any item that is returned more than 30 days after delivery</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Refunds (if applicable)</h2>
            <p className="text-gray-600 mb-4">
              Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
            </p>
            <p className="text-gray-600">
              If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Late or missing refunds (if applicable)</h2>
            <p className="text-gray-600 mb-4">
              If you haven't received a refund yet, first check your bank account again.
            </p>
            <p className="text-gray-600 mb-4">
              Then contact your credit card company, it may take some time before your refund is officially posted.
            </p>
            <p className="text-gray-600 mb-4">
              Next contact your bank. There is often some processing time before a refund is posted.
            </p>
            <p className="text-gray-600">
              If you've done all of this and you still have not received your refund yet, please contact us at{' '}
              <a href="mailto:upholictech@upholic.in" className="text-indigo-600 hover:underline">
                upholictech@upholic.in
              </a>.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sale items (if applicable)</h2>
            <p className="text-gray-600">
              Only regular priced items may be refunded, unfortunately sale items cannot be refunded.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Exchanges (if applicable)</h2>
            <p className="text-gray-600 mb-4">
              We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at{' '}
              <a href="mailto:upholictech@upholic.in" className="text-indigo-600 hover:underline">
                upholictech@upholic.in
              </a>{' '}
              and send your item to: 622 Manglam Electronic Market, Jaipur, Rajasthan, India 302001.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gifts</h2>
            <p className="text-gray-600 mb-4">
              If the item was marked as a gift when purchased and shipped directly to you, you'll receive a gift credit for the value of your return. Once the returned item is received, a gift certificate will be mailed to you.
            </p>
            <p className="text-gray-600">
              If the item wasn't marked as a gift when purchased, or the gift giver had the order shipped to themselves to give to you later, we will send a refund to the gift giver and he will find out about your return.
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping</h2>
            <p className="text-gray-600 mb-4">
              To return your product, you should mail your product to: 622 Manglam Electronic Market, Jaipur, Rajasthan, India 302001.
            </p>
            <p className="text-gray-600 mb-4">
              You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
            </p>
            <p className="text-gray-600 mb-4">
              Depending on where you live, the time it may take for your exchanged product to reach you, may vary.
            </p>
            <p className="text-gray-600">
              If you are shipping an item over $75, you should consider using a trackable shipping service or purchasing shipping insurance. We don't guarantee that we will receive your returned item.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RefundCancellationPolicy;