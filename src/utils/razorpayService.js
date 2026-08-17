import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
  constructor() {
    this.instance = null;
    
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  /**
   * Create Razorpay Order
   * @param {number} amount - Amount in INR
   * @param {string} currency - Currency (default: INR)
   * @param {string} receipt - Receipt ID
   * @returns {Promise<object>} Razorpay order details
   */
  async createOrder(amount, currency = 'INR', receipt) {
    if (!this.instance) {
      throw new Error('Razorpay not configured. Please check your API keys.');
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: receipt || `order_${Date.now()}`,
        payment_capture: 1, // Auto-capture
      };

      const order = await this.instance.orders.create(options);
      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount / 100, // Convert back to rupees
          currency: order.currency,
          receipt: order.receipt,
        },
      };
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay Payment Signature
   * @param {object} params - Payment parameters
   * @param {string} params.razorpay_order_id
   * @param {string} params.razorpay_payment_id
   * @param {string} params.razorpay_signature
   * @returns {boolean} Verification result
   */
  verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!this.instance) {
      throw new Error('Razorpay not configured');
    }

    try {
      const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

      if (expectedSign === razorpay_signature) {
        return { success: true, message: 'Payment verified successfully' };
      } else {
        return { success: false, message: 'Payment verification failed' };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, message: 'Payment verification error' };
    }
  }

  /**
   * Fetch Order Details
   * @param {string} orderId - Razorpay Order ID
   * @returns {Promise<object>} Order details
   */
  async fetchOrder(orderId) {
    if (!this.instance) {
      throw new Error('Razorpay not configured');
    }

    try {
      const order = await this.instance.orders.fetch(orderId);
      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount / 100,
          currency: order.currency,
          status: order.status,
          receipts: order.receipt,
        },
      };
    } catch (error) {
      console.error('Fetch order error:', error);
      throw new Error('Failed to fetch order');
    }
  }

  /**
   * Capture Payment (for authorized payments)
   * @param {string} paymentId - Razorpay Payment ID
   * @param {number} amount - Amount to capture
   * @param {string} currency - Currency
   * @returns {Promise<object>} Capture result
   */
  async capturePayment(paymentId, amount, currency = 'INR') {
    if (!this.instance) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payment = await this.instance.payments.capture(
        paymentId,
        Math.round(amount * 100),
        currency
      );
      return {
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount / 100,
        },
      };
    } catch (error) {
      console.error('Capture payment error:', error);
      throw new Error('Failed to capture payment');
    }
  }

  /**
   * Refund Payment
   * @param {string} paymentId - Razorpay Payment ID
   * @param {number} amount - Amount to refund
   * @param {string} reason - Refund reason
   * @returns {Promise<object>} Refund result
   */
  async refundPayment(paymentId, amount, reason = 'Customer requested refund') {
    if (!this.instance) {
      throw new Error('Razorpay not configured');
    }

    try {
      const refund = await this.instance.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        reason,
      });
      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
          reason: refund.reason,
        },
      };
    } catch (error) {
      console.error('Refund payment error:', error);
      throw new Error('Failed to refund payment');
    }
  }

  /**
   * Fetch Payment Details
   * @param {string} paymentId - Razorpay Payment ID
   * @returns {Promise<object>} Payment details
   */
  async fetchPayment(paymentId) {
    if (!this.instance) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payment = await this.instance.payments.fetch(paymentId);
      return {
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount / 100,
          currency: payment.currency,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
        },
      };
    } catch (error) {
      console.error('Fetch payment error:', error);
      throw new Error('Failed to fetch payment');
    }
  }

  /**
   * Test Razorpay Connection
   * @returns {boolean} Connection status
   */
  async testConnection() {
    if (!this.instance) {
      return false;
    }

    try {
      // Try to fetch a non-existent order to test connection
      await this.instance.orders.fetch('fake_order_id');
      return true;
    } catch (error) {
      // If error is not authentication related, connection is good
      if (error.code !== 'BAD_REQUEST_ERROR') {
        return false;
      }
      return true; // Connection works, order just doesn't exist
    }
  }

  /**
   * Check if Razorpay is Configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(
      this.instance &&
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id' &&
      process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_secret'
    );
  }
}

// Export singleton instance
const razorpayService = new RazorpayService();
export default razorpayService;
