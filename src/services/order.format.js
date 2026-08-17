/**
 * Order Formatter - Format Order Status for User Display
 * Supports both English and Tamil
 */

/**
 * Status display mappings
 */
const statusMap = {
  pending: {
    english: { text: '🧾 Order placed', description: 'Your order has been received' },
    tamil: { text: '🧾 ஆர்டர் பெறப்பட்டது', description: 'உங்கள் ஆர்டர் பெறப்பட்டது' },
  },
  confirmed: {
    english: { text: '✅ Order confirmed', description: 'Your order is confirmed' },
    tamil: { text: '✅ ஆர்டர் உறுதி செய்யப்பட்டது', description: 'உங்கள் ஆர்டர் உறுதி செய்யப்பட்டது' },
  },
  processing: {
    english: { text: '👨‍🍳 Preparing your order', description: 'We are preparing your order' },
    tamil: { text: '👨‍🍳 ஆர்டர் தயாராகிறது', description: 'உங்கள் ஆர்டர் தயாராகிறது' },
  },
  'out-for-delivery': {
    english: { text: '🚚 Out for delivery', description: 'Your order is on the way' },
    tamil: { text: '🚚 டெலிவரிக்கு செல்கிறது', description: 'உங்கள் ஆர்டர் டெலிவரிக்கு செல்கிறது' },
  },
  delivered: {
    english: { text: '✅ Delivered', description: 'Order delivered successfully' },
    tamil: { text: '✅ டெலிவரி செய்யப்பட்டது', description: 'ஆர்டர் டெலிவரி செய்யப்பட்டது' },
  },
  cancelled: {
    english: { text: '❌ Cancelled', description: 'Order was cancelled' },
    tamil: { text: '❌ ரத்து செய்யப்பட்டது', description: 'ஆர்டர் ரத்து செய்யப்பட்டது' },
  },
  refunded: {
    english: { text: '💰 Refunded', description: 'Refund processed' },
    tamil: { text: '💰 திரும்ப செலுத்தப்பட்டது', description: 'பணம் திரும்ப செலுத்தப்பட்டது' },
  },
};

/**
 * Format order status for display
 * @param {Object} order - Order object
 * @param {string} language - Language preference ('english' | 'tamil')
 * @returns {string} Formatted status message
 */
export const formatOrderStatus = (order, language = 'english') => {
  if (!order) {
    return language === 'tamil'
      ? '❌ ஆர்டர் எதுவும் கிடைக்கவில்லை.'
      : '❌ No orders found.';
  }

  const lang = language === 'tamil' ? 'tamil' : 'english';
  const status = statusMap[order.orderStatus] || statusMap.pending;
  const statusInfo = status[lang];

  let response = `*${statusInfo.text}*\n\n`;
  response += `${statusInfo.description}\n\n`;

  // Order details
  response += lang === 'tamil'
    ? `📦 *ஆர்டர் விவரங்கள்:*\n`
    : `📦 *Order Details:*\n`;

  response += lang === 'tamil'
    ? `ஆர்டர் #: ${order._id.slice(-6).toUpperCase()}\n`
    : `Order #: ${order._id.slice(-6).toUpperCase()}\n`;

  // Format date
  const orderDate = new Date(order.createdAt);
  const dateStr = orderDate.toLocaleDateString(lang === 'tamil' ? 'ta-IN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = orderDate.toLocaleTimeString(lang === 'tamil' ? 'ta-IN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  response += lang === 'tamil'
    ? `தேதி: ${dateStr}, ${timeStr}\n`
    : `Date: ${dateStr}, ${timeStr}\n`;

  // Items
  response += lang === 'tamil'
    ? `\n*பொருட்கள்:*\n`
    : `\n*Items:*\n`;

  order.items.forEach((item, index) => {
    const weight = item.weight ? `${item.weight}g` : '';
    response += `${index + 1}. ${item.name || item.product?.name || 'Item'} ${weight ? `(${weight})` : ''} x ${item.quantity}\n`;
  });

  // Total
  response += lang === 'tamil'
    ? `\n💰 *மொத்தம்:* ₹${order.finalAmount}\n`
    : `\n💰 *Total:* ₹${order.finalAmount}\n`;

  // Delivery address
  if (order.deliveryAddress) {
    response += lang === 'tamil'
      ? `\n📍 *டெலிவரி முகவரி:*\n${order.deliveryAddress.area || ''}, ${order.deliveryAddress.city || 'Chennai'}\n`
      : `\n📍 *Delivery Address:*\n${order.deliveryAddress.area || ''}, ${order.deliveryAddress.city || 'Chennai'}\n`;
  }

  // Delivery time slot
  if (order.deliveryTime) {
    const deliveryTimeMap = {
      morning: lang === 'tamil' ? 'காலை (8-11 மணி)' : 'Morning (8-11 AM)',
      afternoon: lang === 'tamil' ? 'மதியம் (12-3 மணி)' : 'Afternoon (12-3 PM)',
      evening: lang === 'tamil' ? 'மாலை (4-8 மணி)' : 'Evening (4-8 PM)',
      custom: lang === 'tamil' ? 'தனிப்பயன்' : 'Custom',
    };

    response += lang === 'tamil'
      ? `⏰ *டெலிவரி நேரம்:* ${deliveryTimeMap[order.deliveryTime] || order.deliveryTime}\n`
      : `⏰ *Delivery Time:* ${deliveryTimeMap[order.deliveryTime] || order.deliveryTime}\n`;
  }

  // Payment info
  if (order.paymentInfo?.method) {
    const paymentMethodMap = {
      cod: lang === 'tamil' ? 'கேஷ் ஆன் டெலிவரி' : 'Cash on Delivery',
      card: lang === 'tamil' ? 'கார்டு' : 'Card',
      upi: 'UPI',
      netbanking: lang === 'tamil' ? 'நெட்பேங்கிங்' : 'Net Banking',
      wallet: lang === 'tamil' ? 'வாலட்' : 'Wallet',
    };

    const paymentStatus = order.paymentInfo.status === 'paid'
      ? (lang === 'tamil' ? '✅ செலுத்தப்பட்டது' : '✅ Paid')
      : (lang === 'tamil' ? '⏳ நிலுவையில்' : '⏳ Pending');

    response += lang === 'tamil'
      ? `\n💳 *கட்டணம்:* ${paymentMethodMap[order.paymentInfo.method] || order.paymentInfo.method} - ${paymentStatus}\n`
      : `\n💳 *Payment:* ${paymentMethodMap[order.paymentInfo.method] || order.paymentInfo.method} - ${paymentStatus}\n`;
  }

  // Delivery boy info (if assigned)
  if (order.deliveryBoy?.name) {
    response += lang === 'tamil'
      ? `\n🚴 *டெலிவரி நபர்:* ${order.deliveryBoy.name}\n`
      : `\n🚴 *Delivery Partner:* ${order.deliveryBoy.name}\n`;

    if (order.deliveryBoy.phone) {
      response += lang === 'tamil'
        ? `📞 ஃபோன்: ${order.deliveryBoy.phone}\n`
        : `📞 Phone: ${order.deliveryBoy.phone}\n`;
    }
  }

  return response;
};

/**
 * Format order tracking progress (for visual display)
 * @param {Object} order - Order object
 * @returns {Array} Status steps with completion status
 */
export const formatOrderProgress = (order) => {
  if (!order) return [];

  const statusOrder = ['pending', 'confirmed', 'processing', 'out-for-delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.orderStatus);

  return statusOrder.map((status, index) => ({
    status,
    label: status.replace('-', ' ').toUpperCase(),
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));
};

/**
 * Get short status message
 * @param {Object} order - Order object
 * @param {string} language - Language preference
 * @returns {string} Short status message
 */
export const getShortStatus = (order, language = 'english') => {
  if (!order) {
    return language === 'tamil' ? 'ஆர்டர் இல்லை' : 'No order';
  }

  const lang = language === 'tamil' ? 'tamil' : 'english';
  const status = statusMap[order.orderStatus] || statusMap.pending;

  return status[lang].text;
};

/**
 * Get estimated delivery message
 * @param {Object} order - Order object
 * @param {string} language - Language preference
 * @param {string} eta - Estimated time string
 * @returns {string} Delivery estimate message
 */
export const formatDeliveryEstimate = (order, language = 'english', eta = '') => {
  if (!order) return '';

  const lang = language === 'tamil' ? 'tamil' : 'english';

  if (order.orderStatus === 'delivered') {
    return lang === 'tamil'
      ? '✅ உங்கள் ஆர்டர் டெலிவரி செய்யப்பட்டது!'
      : '✅ Your order has been delivered!';
  }

  if (order.orderStatus === 'cancelled') {
    return lang === 'tamil'
      ? '❌ ஆர்டர் ரத்து செய்யப்பட்டது'
      : '❌ Order was cancelled';
  }

  if (eta) {
    return lang === 'tamil'
      ? `🚚 உங்கள் ஆர்டர் வரும்: ${eta}`
      : `🚚 Your order will arrive: ${eta}`;
  }

  return lang === 'tamil'
    ? '🚚 டெலிவரி நேரம் விரைவில் அறிவிக்கப்படும்'
    : '🚚 Delivery time will be updated soon';
};

export default {
  formatOrderStatus,
  formatOrderProgress,
  getShortStatus,
  formatDeliveryEstimate,
};
