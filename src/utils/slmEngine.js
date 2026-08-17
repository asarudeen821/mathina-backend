/**
 * Backend SLM Engine - Fallback for AI Chatbot
 * Provides intelligent responses when Ollama/Gemini is unavailable
 */

// ── KNOWLEDGE BASE ───────────────────────────────────────────
const KNOWLEDGE_BASE = [
  // ── GREETINGS ──────────────────────────────────────────────
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    response: `👋 Hello! Welcome to Mathina FreshHub! I'm your AI assistant. I can help you with:

🍗 Product recommendations
🍳 Cooking recipes & tips
📦 Order information
🚚 Delivery details
💰 Today's prices

What would you like to know?`,
  },

  // ── PRICES ─────────────────────────────────────────────────
  {
    patterns: ['price', 'cost', 'how much', 'rate', 'kg price', 'today price'],
    response: `💰 *Today's Chicken Prices at Mathina FreshHub*

| Cut | Price |
|-----|-------|
| 🔪 Cube Cut | ₹270/kg |
| 🐉 Dragon Cut | ₹290/kg |
| 🦋 Butterfly Cut | ₹320/kg |
| 🌶️ Chicken 65 Pieces | ₹300/kg |
| 🍟 Finger Cut | ₹280/kg |
| 🥢 Julienne Cut | ₹290/kg |
| 🍭 Lollipop | ₹310/kg |
| 🍲 Small Curry Cut | ₹240/kg |
| 🍛 Big Curry Cut | ₹240/kg |
| 🍗 Chicken Wings | ₹220/kg |
| 🥚 Fresh Eggs | ₹84/dozen |

✅ All prices include fresh cutting & packing
🚚 Free delivery on orders above ₹500`,
  },

  // ── DELIVERY ───────────────────────────────────────────────
  {
    patterns: ['delivery', 'shipping', 'how long', 'time to deliver', 'delivery time'],
    response: `🚚 *Delivery Information*

**Delivery Areas:** Cuddalore and surrounding areas

**Delivery Slots:**
• 🌅 Morning: 6 AM - 9 AM
• ☀️ Afternoon: 12 PM - 2 PM  
• 🌆 Evening: 5 PM - 8 PM

**Delivery Charges:**
• Free delivery on orders above ₹500
• ₹30 for orders below ₹500

**Same Day Delivery:**
✅ Order before 2 PM for same-day delivery
✅ Fresh chicken processed daily

**Contact:** 📞 +91 77080 32726`,
  },

  // ── PRODUCTS ───────────────────────────────────────────────
  {
    patterns: ['product', 'chicken', 'what do you sell', 'available', 'cuts'],
    response: `🍗 *Mathina FreshHub Products*

**Chicken Cuts Available:**
🔪 Cube Cut - For stir fry & noodles
🐉 Dragon Cut - Special drumstick pieces  
🦋 Butterfly Cut - Boneless breast for grilling
🌶️ Chicken 65 Pieces - Ready to fry
🍟 Finger Cut - Chicken strips
🥢 Julienne Cut - Ultra-thin strips
🍭 Lollipop - Party favorite
🍲 Curry Cut - Traditional pieces
🍛 Biryani Cut - Large bone-in pieces
🍗 Chicken Wings - For frying & BBQ

**Other Products:**
🥚 Fresh Farm Eggs
🧄 Ready-to-Cook Marinades
🍱 Biryani Kits

All products are:
✅ Fresh daily processing
✅ Halal certified  
✅ Organic & antibiotic-free
✅ Quality tested

Visit our Products page to see full range! 🛒`,
  },

  // ── RECIPES ────────────────────────────────────────────────
  {
    patterns: ['recipe', 'cook', 'how to make', 'how to cook', 'prepare'],
    response: `👨‍🍳 *I can help you cook!* 

**Popular Recipes:**
🍗 Chicken Biryani
🌯 Chicken Shawarma
🍢 Chicken Tikka
🐉 Dragon Chicken
🍭 Chicken Lollipop
🌶️ Chicken 65
🔥 Grilled Chicken
🥘 Chicken Curry

**Just ask me:**
• "How to make chicken biryani?"
• "Recipe for shawarma"
• "How to cook dragon chicken?"
• "Grilled chicken recipe"

**Cooking Methods I Know:**
🍳 Pan Fry (15-20 mins)
🔥 Deep Fry (10-15 mins)
🥘 Curry/Gravy (30-45 mins)
🔥 Grill (15-25 mins)
🍲 Stir Fry (10-15 mins)

*What would you like to cook today?* 🍽️`,
  },

  // ── BIRYANI ────────────────────────────────────────────────
  {
    patterns: ['biryani', 'pulao', 'how to make biryani'],
    response: `🍛 *Chicken Biryani Recipe*

**Ingredients:**
• 500g Big Curry Cut chicken
• 2 cups Basmati Rice
• 1 cup Yogurt
• 2 Onions (sliced)
• 2 Tomatoes
• 2 tbsp Ginger-Garlic paste
• Biryani Masala - 2 tbsp
• Mint & Coriander leaves
• Ghee & Oil

**Steps:**
1. Marinate chicken with yogurt & spices - 30 mins
2. Parboil rice until 70% done
3. Cook chicken until tender
4. Layer rice over chicken
5. Garnish with herbs & fried onions
6. Seal & cook on dum (low flame) - 20 mins
7. Serve with raita!

⏱️ Total time: 75 mins
💡 Use Big Curry Cut from Mathina FreshHub for best results!`,
  },

  // ── FRESHNESS ──────────────────────────────────────────────
  {
    patterns: ['fresh', 'quality', 'halal', 'organic', 'certified'],
    response: `✅ *Our Quality Promise*

**Freshness Guarantee:**
🔪 Chicken processed fresh every morning
❄️ Never frozen, always fresh
📦 Delivered within 24 hours

**Certifications:**
✅ Halal certified
✅ Organic farming
✅ Antibiotic-free
✅ Quality tested

**Farm Details:**
🐔 Direct from local farms
📍 Cuddalore, Tamil Nadu
🌿 Free-range chickens
💊 No hormones or antibiotics

*Your health is our priority!* 🙏`,
  },

  // ── CONTACT ────────────────────────────────────────────────
  {
    patterns: ['contact', 'phone', 'call', 'support', 'help', 'whatsapp'],
    response: `📞 *Contact Mathina FreshHub*

**Shop Owner:** Shajan A.J.

**Phone:** +91 77080 32726
**WhatsApp:** +91 80566 94908
**Email:** MathinaFreshHub@gmail.com

**Address:**
Erusappan Pallivasal Street
Cuddalore OT - 607003
Tamil Nadu

**Hours:**
🕐 Monday - Sunday: 6 AM - 10 PM
📦 Same-day delivery available

*We're here to help!* 😊`,
  },

  // ── SUBSCRIPTION ───────────────────────────────────────────
  {
    patterns: ['subscription', 'weekly', 'regular', 'monthly', 'plan'],
    response: `📅 *Subscription Plans*

**Benefits:**
✅ Regular fresh chicken delivery
✅ Choose your preferred cuts
✅ Pause or cancel anytime
✅ Priority delivery slots
✅ Special subscriber discounts

**Plans Available:**
• Weekly delivery
• Bi-weekly (every 2 weeks)
• Monthly delivery

**How it Works:**
1. Choose your cut preference
2. Select delivery frequency
3. We deliver fresh chicken on schedule
4. Pause/resume as needed

Visit Subscriptions page to get started! 🎯`,
  },

  // ── ORDER TRACKING ─────────────────────────────────────────
  {
    patterns: ['order', 'track', 'status', 'where is my order', 'my order'],
    response: `📦 *Track Your Order*

**To check your order status:**
1. Go to My Orders page
2. Click on your order
3. See real-time progress

**Order Stages:**
⏳ Pending - Order received
✅ Confirmed - Order confirmed
🔪 Processing - Being prepared
🚚 Out for Delivery - On the way
🎉 Delivered - Received!

**Need Help?**
📞 Call: +91 77080 32726
💬 WhatsApp: +91 80566 94908

*We'll keep you updated!* 📱`,
  },
];

// ── PATTERN MATCHING ─────────────────────────────────────────
const matchPattern = (message, patterns) => {
  const msg = message.toLowerCase();
  return patterns.some(pattern => msg.includes(pattern));
};

// ── MAIN PROCESS FUNCTION ────────────────────────────────────
export const processMessage = (message) => {
  if (!message || message.trim() === '') {
    return "👋 Hello! How can I help you today? Ask me about products, recipes, delivery, or prices!";
  }

  // Check knowledge base
  for (const entry of KNOWLEDGE_BASE) {
    if (matchPattern(message, entry.patterns)) {
      return entry.response;
    }
  }

  // Fuzzy matching - check partial word matches
  const words = message.toLowerCase().split(' ').filter(w => w.length > 3);
  for (const word of words) {
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.patterns.some(p => p.includes(word) || word.includes(p.split(' ')[0]))) {
        return entry.response;
      }
    }
  }

  // Default fallback
  return `🤔 I'm not sure about that, but I can help with:

**Ask me about:**
💰 Today's chicken prices
🍳 Cooking recipes
🚚 Delivery information
🍗 Product details
📦 Order status
📞 Contact information

*Try asking something specific like:*
• "What are today's prices?"
• "How to make chicken biryani?"
• "Tell me about delivery"
• "What chicken cuts do you have?"`;
};

// ── QUICK SUGGESTIONS ────────────────────────────────────────
export const QUICK_SUGGESTIONS = [
  { label: '💰 Today Prices', query: 'What are today chicken prices?' },
  { label: '🍳 Recipes', query: 'What recipes can you suggest?' },
  { label: '🚚 Delivery Info', query: 'Tell me about delivery' },
  { label: '🍗 Products', query: 'What products do you have?' },
  { label: '📞 Contact', query: 'How to contact you?' },
  { label: '📅 Subscriptions', query: 'Tell me about subscription plans' },
];
