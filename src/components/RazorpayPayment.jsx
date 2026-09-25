import { useState } from 'react'
import {
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../api/payment'

export default function RazorpayPayment({
  amount,
  customerName,
  customerEmail,
  customerMobile,
  address,
  couponCode = null,
  onSuccess
}) {

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  async function handlePayment() {

    try {

      setProcessing(true)
      setError('')

      /*
       * Step 1
       * Ask backend to create the Razorpay order.
       */
      const order = await createRazorpayOrder({ address, couponCode })

      if (!order?.orderId) {
        throw new Error(
          'Unable to create Razorpay order'
        )
      }

      /*
       * Step 2
       * Open Razorpay Checkout.
       */
      const options = {

        key: order.keyId,

        amount: order.amount,

        currency: order.currency,

        name: 'Thulirkum Ver',

        description: 'Book Purchase',

        order_id: order.orderId,

        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerMobile || ''
        },

        theme: {
          color: '#087f5b'
        },

        handler: async function (response) {

          try {

            /*
             * Step 3
             * Send Razorpay response to backend.
             */
            const result =
              await verifyRazorpayPayment({

                razorpayOrderId:
                  response.razorpay_order_id,

                razorpayPaymentId:
                  response.razorpay_payment_id,

                razorpaySignature:
                  response.razorpay_signature
              })

            if (!result.success) {
              throw new Error(
                'Payment verification failed'
              )
            }

            /*
             * Payment is now verified.
             */
            onSuccess?.({
              paymentId:
                response.razorpay_payment_id,

              orderId:
                response.razorpay_order_id
            })

          } catch (verificationError) {

            setError(
              verificationError.message ||
              'Payment verification failed'
            )

          } finally {

            setProcessing(false)
          }
        },

        modal: {
          ondismiss: function () {
            setProcessing(false)
          }
        }
      }

      if (!window.Razorpay) {
        throw new Error(
          'Razorpay Checkout failed to load'
        )
      }

      const razorpay =
        new window.Razorpay(options)

      razorpay.on(
        'payment.failed',
        function (response) {

          console.error(
            'Razorpay payment failed:',
            response.error
          )

          setError(
            response.error?.description ||
            'Payment failed'
          )

          setProcessing(false)
        }
      )

      razorpay.open()

    } catch (err) {

      console.error(err)

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to start payment'
      )

      setProcessing(false)
    }
  }

  return (
    <div className="razorpay-payment">

      {error && (
        <div className="payment-error">
          {error}
        </div>
      )}

      <button
        type="button"
        className="tv-btn-primary payment-button"
        onClick={handlePayment}
        disabled={processing}
      >
        {processing
          ? 'Opening secure payment...'
          : `Pay ₹${Number(amount).toFixed(2)}`
        }
      </button>

    </div>
  )
}