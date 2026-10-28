/**
 * Seed data for AI-CRM demonstration mode.
 * Realistic distributor & wholesale merchant catalog and accounts.
 */

export const seedUsers = [
  {
    id: "user-1",
    name: "Pranav Arora",
    email: "demo@aicrm.com",
    password: "demo123", // Demonstration only - not for production!
    role: "Wholesale & Retail Director",
    company: "Apex Wholesale & Retail Enterprises",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-15T09:00:00.000Z"
  }
];

export const seedProducts = [
  {
    id: "prod-1",
    name: "MacBook Pro 14\" M3 (512GB, Space Gray)",
    sku: "MBP14-M3-512",
    category: "Laptops & Computing",
    stock: 45,
    costPrice: 125000,
    absoluteLowerLimit: 132000,
    preferredMinPrice: 138000,
    targetPrice: 149900,
    description: "Apple M3 8-core CPU, 10-core GPU, 8GB Unified Memory, Liquid Retina XDR.",
    createdAt: "2026-02-01T10:00:00.000Z"
  },
  {
    id: "prod-2",
    name: "Samsung 65\" Neo QLED 4K Smart TV",
    sku: "SAM-QN65-QLED",
    category: "Consumer Electronics",
    stock: 28,
    costPrice: 57000,
    absoluteLowerLimit: 58000,
    preferredMinPrice: 60000,
    targetPrice: 65000,
    description: "Quantum Matrix Technology, Neo Quantum HDR, Dolby Atmos surround audio.",
    createdAt: "2026-02-05T11:30:00.000Z"
  },
  {
    id: "prod-3",
    name: "Sony Alpha A7 IV Mirrorless Camera Body",
    sku: "SNY-A7M4-BODY",
    category: "Photography & Video",
    stock: 18,
    costPrice: 168000,
    absoluteLowerLimit: 175000,
    preferredMinPrice: 182000,
    targetPrice: 198000,
    description: "33MP Full-Frame Exmor R CMOS sensor, 4K 60p 10-bit recording, Real-time Eye AF.",
    createdAt: "2026-02-10T14:15:00.000Z"
  },
  {
    id: "prod-4",
    name: "Daikin 1.5 Ton 5-Star Inverter AC",
    sku: "DKN-15T-INV5",
    category: "Commercial Appliances",
    stock: 60,
    costPrice: 34000,
    absoluteLowerLimit: 36000,
    preferredMinPrice: 38500,
    targetPrice: 42990,
    description: "Copper condenser, PM 2.5 filter, Dew clean technology, power chill operation.",
    createdAt: "2026-02-12T08:45:00.000Z"
  },
  {
    id: "prod-5",
    name: "iPad Air 11\" M2 WiFi (128GB, Starlight)",
    sku: "IPA-M2-128ST",
    category: "Tablets & Handhelds",
    stock: 35,
    costPrice: 48000,
    absoluteLowerLimit: 51000,
    preferredMinPrice: 54000,
    targetPrice: 59900,
    description: "M2 chip, Liquid Retina display with True Tone, Touch ID in top button.",
    createdAt: "2026-02-14T12:00:00.000Z"
  },
  {
    id: "prod-6",
    name: "JBL PartyBox Stage 320 Wireless Speaker",
    sku: "JBL-PB320-BLK",
    category: "Audio & HiFi",
    stock: 50,
    costPrice: 31000,
    absoluteLowerLimit: 33500,
    preferredMinPrice: 36000,
    targetPrice: 39999,
    description: "240W RMS output, multi-dimensional lightshow, dual mic and guitar inputs.",
    createdAt: "2026-02-18T16:20:00.000Z"
  }
];

export const seedCustomers = [
  {
    id: "cust-1",
    name: "Rajesh Kumar",
    company: "Kumar Electronics & Retail Chain",
    phone: "+91 98110 45231",
    email: "rajesh@kumarelectronics.in",
    budget: 350000,
    leadStatus: "Under Negotiation",
    preferences: "Bulk purchase discounts, 15-day credit terms, fast dispatch to Delhi NCR hub.",
    notes: "Key wholesale account. Currently negotiating 5 units of Samsung 65\" Neo QLED.",
    interestedProducts: ["Samsung 65\" Neo QLED 4K Smart TV", "MacBook Pro 14\" M3"],
    previousNegotiations: 4,
    createdAt: "2026-01-20T11:00:00.000Z"
  },
  {
    id: "cust-2",
    name: "Sunita Patel",
    company: "Metro Digital Mart Ahmedabad",
    phone: "+91 98250 88912",
    email: "spatel@metrodigital.com",
    budget: 850000,
    leadStatus: "Active Lead",
    preferences: "GST invoiced, requires warranty certificates in advance, prefers WhatsApp updates.",
    notes: "Looking for 10 units Daikin Inverter ACs for upcoming summer commercial project.",
    interestedProducts: ["Daikin 1.5 Ton 5-Star Inverter AC"],
    previousNegotiations: 2,
    createdAt: "2026-01-28T14:30:00.000Z"
  },
  {
    id: "cust-3",
    name: "Vikram Malhotra",
    company: "Malhotra Studio Supplies Bangalore",
    phone: "+91 98450 12764",
    email: "vikram@malhotrastudios.co",
    budget: 600000,
    leadStatus: "Qualified",
    preferences: "Official brand warranty, instant door delivery, bank transfer settlement.",
    notes: "Requires 3 Sony Alpha A7 IV cameras. Price sensitive, comparing with Mumbai grey market.",
    interestedProducts: ["Sony Alpha A7 IV Mirrorless Camera Body"],
    previousNegotiations: 1,
    createdAt: "2026-02-02T09:15:00.000Z"
  },
  {
    id: "cust-4",
    name: "Ananya Deshmukh",
    company: "CineVision Appliances Pune",
    phone: "+91 98900 66341",
    email: "ananya@cinevision.in",
    budget: 420000,
    leadStatus: "Closed Won",
    preferences: "Regular weekly bulk orders, expects priority dispatch.",
    notes: "Closed deal on 8 units iPad Air M2 at ₹53,500/unit with high customer satisfaction.",
    interestedProducts: ["iPad Air 11\" M2 WiFi", "JBL PartyBox Stage 320"],
    previousNegotiations: 6,
    createdAt: "2026-02-06T16:00:00.000Z"
  },
  {
    id: "cust-5",
    name: "Mohammad Farooq",
    company: "Farooq Traders Hyderabad",
    phone: "+91 97000 33890",
    email: "farooq@farooqtraders.com",
    budget: 200000,
    leadStatus: "Active Lead",
    preferences: "Cash on delivery or 50% advance, looking for party speaker stock.",
    notes: "Inquired about JBL PartyBox 320 wholesale prices for wedding season inventory.",
    interestedProducts: ["JBL PartyBox Stage 320 Wireless Speaker"],
    previousNegotiations: 0,
    createdAt: "2026-02-15T13:40:00.000Z"
  }
];

export const seedNegotiations = [
  {
    id: "neg-1",
    customerId: "cust-1",
    customerName: "Rajesh Kumar (Kumar Electronics)",
    productId: "prod-2",
    productName: "Samsung 65\" Neo QLED 4K Smart TV",
    quantity: 5,
    costPrice: 57000,
    targetPrice: 65000,
    preferredMinPrice: 60000,
    absoluteLowerLimit: 58000,
    initialOffer: 56000,
    currentOffer: 58500,
    status: "Counter Offered",
    recommendation: "COUNTER",
    grossProfit: 7500, // (58500 - 57000) * 5
    grossMargin: 2.56,
    reasoning: "Current offer of ₹58,500 is above absolute lower limit (₹58,000) but below preferred target (₹60,000). Counter with ₹59,800 to protect gross profit while closing 5 bulk units.",
    suggestedReply: "Namaste Rajesh ji, thank you for your commitment to 5 units. Since our factory landing cost is tight this quarter, we cannot do ₹58,500. However, as our priority wholesale partner, we can finalize immediately at ₹59,800 per unit with free hub transit insurance included. Let me know if we can lock this in today.",
    approved: false,
    rounds: [
      {
        roundNumber: 1,
        sender: "customer",
        offeredPrice: 56000,
        quantity: 5,
        note: "Customer offered ₹56,000 below cost price ₹57,000. System rejected.",
        timestamp: "2026-02-18T10:00:00.000Z"
      },
      {
        roundNumber: 2,
        sender: "salesperson",
        counterPrice: 61500,
        quantity: 5,
        note: "Salesperson countered at ₹61,500 highlighting warranty and stock readiness.",
        timestamp: "2026-02-18T11:15:00.000Z"
      },
      {
        roundNumber: 3,
        sender: "customer",
        offeredPrice: 58500,
        quantity: 5,
        note: "Customer revised offer to ₹58,500 claiming cash advance settlement.",
        timestamp: "2026-02-18T14:30:00.000Z"
      }
    ],
    createdAt: "2026-02-18T10:00:00.000Z"
  },
  {
    id: "neg-2",
    customerId: "cust-3",
    customerName: "Vikram Malhotra (Malhotra Studios)",
    productId: "prod-3",
    productName: "Sony Alpha A7 IV Mirrorless Camera Body",
    quantity: 3,
    costPrice: 168000,
    targetPrice: 198000,
    preferredMinPrice: 182000,
    absoluteLowerLimit: 175000,
    initialOffer: 172000,
    currentOffer: 184000,
    status: "Accepted",
    recommendation: "ACCEPT",
    grossProfit: 48000, // (184000 - 168000) * 3
    grossMargin: 8.7,
    reasoning: "Customer offer of ₹184,000 exceeds preferred minimum of ₹182,000 with healthy ₹48,000 total gross profit across 3 camera units.",
    suggestedReply: "Hi Vikram, your offer of ₹184,000 per body for 3 units is approved. We will reserve the serial numbers with official 2-year Sony India warranty and dispatch via BlueDart express today.",
    approved: true,
    rounds: [
      {
        roundNumber: 1,
        sender: "customer",
        offeredPrice: 172000,
        quantity: 3,
        note: "Initial lowball offer below absolute lower limit.",
        timestamp: "2026-02-17T09:00:00.000Z"
      },
      {
        roundNumber: 2,
        sender: "salesperson",
        counterPrice: 188000,
        quantity: 3,
        note: "Countered emphasizing genuine GST billing.",
        timestamp: "2026-02-17T12:00:00.000Z"
      },
      {
        roundNumber: 3,
        sender: "customer",
        offeredPrice: 184000,
        quantity: 3,
        note: "Customer agreed to ₹184,000.",
        timestamp: "2026-02-17T15:20:00.000Z"
      }
    ],
    createdAt: "2026-02-17T09:00:00.000Z"
  }
];

export const seedConversations = [
  {
    id: "conv-1",
    customerId: "cust-1",
    customerName: "Rajesh Kumar",
    customerPhone: "+91 98110 45231",
    unreadCount: 1,
    lastMessage: "Can we do ₹58,500 if I wire the 50% advance right now?",
    lastMessageTimestamp: "2026-02-18T14:30:00.000Z",
    messages: [
      {
        id: "msg-101",
        sender: "customer",
        text: "Namaste Pranav bhai, we need 5 pieces of Samsung 65 Neo QLED for our Chandni Chowk showroom.",
        timestamp: "2026-02-18T09:45:00.000Z",
        status: "read"
      },
      {
        id: "msg-102",
        sender: "salesperson",
        text: "Namaste Rajesh ji! Good morning. Yes, we have brand new sealed stock available in our central warehouse. Our standard wholesale rate is ₹65,000/pc with GST.",
        timestamp: "2026-02-18T09:50:00.000Z",
        status: "read"
      },
      {
        id: "msg-103",
        sender: "customer",
        text: "Arre ₹65,000 is too high. Nehru Place distributor is quoting ₹56,000. Give me ₹56,000 and I will close 5 units.",
        timestamp: "2026-02-18T10:00:00.000Z",
        status: "read"
      },
      {
        id: "msg-104",
        sender: "salesperson",
        text: "Rajesh ji, Nehru Place units are often parallel imports without official company on-site replacement. Ours is 100% authorized distributor stock. The best wholesale concession I can extend is ₹61,500.",
        timestamp: "2026-02-18T11:15:00.000Z",
        status: "read"
      },
      {
        id: "msg-105",
        sender: "customer",
        text: "Can we do ₹58,500 if I wire the 50% advance right now?",
        timestamp: "2026-02-18T14:30:00.000Z",
        status: "delivered"
      }
    ]
  },
  {
    id: "conv-2",
    customerId: "cust-2",
    customerName: "Sunita Patel",
    customerPhone: "+91 98250 88912",
    unreadCount: 0,
    lastMessage: "Thank you, reviewing the catalogue. Will revert by Thursday.",
    lastMessageTimestamp: "2026-02-17T17:10:00.000Z",
    messages: [
      {
        id: "msg-201",
        sender: "customer",
        text: "Hello, do you have 10 units of Daikin 1.5 Ton 5-Star in ready stock?",
        timestamp: "2026-02-17T15:00:00.000Z",
        status: "read"
      },
      {
        id: "msg-202",
        sender: "salesperson",
        text: "Hello Sunita ji, yes! We have 60 units available in our Bhiwandi depot. Target wholesale price is ₹42,990/unit.",
        timestamp: "2026-02-17T15:20:00.000Z",
        status: "read"
      },
      {
        id: "msg-203",
        sender: "customer",
        text: "Thank you, reviewing the catalogue. Will revert by Thursday.",
        timestamp: "2026-02-17T17:10:00.000Z",
        status: "read"
      }
    ]
  }
];

export const seedReminders = [
  {
    id: "rem-1",
    customerId: "cust-1",
    customerName: "Rajesh Kumar",
    title: "Follow up on Samsung TV 5-unit counter-offer",
    dueDate: "2026-02-19T11:00:00.000Z",
    priority: "High",
    status: "pending",
    notes: "If offer of ₹59,800 is not accepted, check if he can take 8 units at ₹59,000."
  },
  {
    id: "rem-2",
    customerId: "cust-2",
    customerName: "Sunita Patel",
    title: "Check AC project requisition decision",
    dueDate: "2026-02-20T15:30:00.000Z",
    priority: "Medium",
    status: "pending",
    notes: "Sunita mentioned reverting by Thursday regarding 10 Daikin units."
  },
  {
    id: "rem-3",
    customerId: "cust-5",
    customerName: "Mohammad Farooq",
    title: "Send JBL PartyBox wholesale rate card",
    dueDate: "2026-02-19T14:00:00.000Z",
    priority: "Low",
    status: "pending",
    notes: "Share PDF brochure and tiered quantity pricing for wedding season."
  }
];
