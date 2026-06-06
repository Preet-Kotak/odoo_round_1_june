require('dotenv').config();
const mongoose = require('mongoose');
const PurchaseOrder = require('./models/PurchaseOrder');
const Vendor = require('./models/Vendor');
const User = require('./models/User');
const { generatePONumber } = require('./utils/counterService');

const seedPurchaseOrders = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get existing users and vendors
    const users = await User.find();
    const vendors = await Vendor.find();

    console.log(`Found ${users.length} users and ${vendors.length} vendors\n`);

    if (vendors.length === 0) {
      console.log('⚠️  No vendors found. Please create vendors first.');
      process.exit(0);
    }

    if (users.length === 0) {
      console.log('⚠️  No users found. Please create users first.');
      process.exit(0);
    }

    // Find an admin or procurement officer
    const creator = users.find(u => ['admin', 'procurement_officer'].includes(u.role)) || users[0];
    console.log(`Using creator: ${creator.name} (${creator.role})\n`);

    // Sample PO data with different statuses
    const samplePOs = [
      {
        vendorIndex: 0,
        status: 'draft',
        lineItems: [
          { itemName: 'HP LaserJet Pro M404dn', description: 'Laser Printer', quantity: 5, unitPrice: 28500, totalPrice: 142500, receivedQuantity: 0 },
          { itemName: 'Canon imageCLASS MF445dw', description: 'Multi-function Printer', quantity: 3, unitPrice: 32000, totalPrice: 96000, receivedQuantity: 0 },
        ],
        deliveryAddress: { street: 'Tech Park, 5th Floor', city: 'Bangalore', state: 'Karnataka', country: 'India', postalCode: '560001' },
        expectedDelivery: new Date('2026-06-15'),
        specialInstructions: 'Deliver during business hours (9 AM - 6 PM)',
        taxRate: 18,
      },
      {
        vendorIndex: Math.min(1, vendors.length - 1),
        status: 'confirmed',
        lineItems: [
          { itemName: 'Dell Latitude 5420', description: '14" Business Laptop', quantity: 10, unitPrice: 75000, totalPrice: 750000, receivedQuantity: 0 },
          { itemName: 'Logitech MX Keys', description: 'Wireless Keyboard', quantity: 10, unitPrice: 9500, totalPrice: 95000, receivedQuantity: 0 },
          { itemName: 'Logitech MX Master 3', description: 'Wireless Mouse', quantity: 10, unitPrice: 8500, totalPrice: 85000, receivedQuantity: 0 },
        ],
        deliveryAddress: { street: 'Corporate Tower, 12th Floor', city: 'Mumbai', state: 'Maharashtra', country: 'India', postalCode: '400001' },
        expectedDelivery: new Date('2026-06-20'),
        specialInstructions: 'Contact IT Head before delivery',
        taxRate: 18,
      },
      {
        vendorIndex: Math.min(2, vendors.length - 1),
        status: 'sent',
        lineItems: [
          { itemName: 'Office Chairs - Ergonomic', description: 'Height adjustable with lumbar support', quantity: 25, unitPrice: 12000, totalPrice: 300000, receivedQuantity: 0 },
          { itemName: 'Standing Desks', description: 'Electric height adjustable', quantity: 15, unitPrice: 28000, totalPrice: 420000, receivedQuantity: 0 },
        ],
        deliveryAddress: { street: 'New Office Block B', city: 'Pune', state: 'Maharashtra', country: 'India', postalCode: '411001' },
        expectedDelivery: new Date('2026-06-25'),
        sentAt: new Date('2026-06-06'),
        specialInstructions: 'Installation required. Contact facility manager.',
        taxRate: 18,
      },
      {
        vendorIndex: 0,
        status: 'acknowledged',
        lineItems: [
          { itemName: 'Cat6 Network Cables - 305m Roll', description: 'High-speed ethernet cable', quantity: 10, unitPrice: 8500, totalPrice: 85000, receivedQuantity: 0 },
          { itemName: 'Network Switches - 24 Port', description: 'Gigabit managed switch', quantity: 5, unitPrice: 18000, totalPrice: 90000, receivedQuantity: 0 },
          { itemName: 'Patch Panels - 48 Port', description: 'Cat6 patch panel', quantity: 3, unitPrice: 4500, totalPrice: 13500, receivedQuantity: 0 },
        ],
        deliveryAddress: { street: 'Data Center, Sector 18', city: 'Gurgaon', state: 'Haryana', country: 'India', postalCode: '122001' },
        expectedDelivery: new Date('2026-06-18'),
        sentAt: new Date('2026-06-05'),
        acknowledgedAt: new Date('2026-06-06'),
        specialInstructions: 'Vendor to coordinate with network team',
        taxRate: 18,
      },
      {
        vendorIndex: Math.min(1, vendors.length - 1),
        status: 'completed',
        lineItems: [
          { itemName: 'Microsoft Office 365 E3 Licenses', description: '1 year subscription', quantity: 50, unitPrice: 1800, totalPrice: 90000, receivedQuantity: 50 },
          { itemName: 'Adobe Creative Cloud Teams', description: '1 year subscription', quantity: 10, unitPrice: 4500, totalPrice: 45000, receivedQuantity: 10 },
        ],
        deliveryAddress: { street: 'IT Department, 3rd Floor', city: 'Delhi', state: 'Delhi', country: 'India', postalCode: '110001' },
        expectedDelivery: new Date('2026-05-30'),
        sentAt: new Date('2026-05-20'),
        acknowledgedAt: new Date('2026-05-21'),
        specialInstructions: 'Digital delivery - license keys via email',
        taxRate: 18,
      },
      {
        vendorIndex: Math.min(2, vendors.length - 1),
        status: 'partially_delivered',
        lineItems: [
          { itemName: 'Server Rack - 42U', description: 'Floor standing server rack', quantity: 2, unitPrice: 35000, totalPrice: 70000, receivedQuantity: 1 },
          { itemName: 'UPS - 10KVA', description: 'Online UPS with battery backup', quantity: 2, unitPrice: 125000, totalPrice: 250000, receivedQuantity: 0 },
          { itemName: 'Cable Management Kit', description: 'Vertical and horizontal', quantity: 4, unitPrice: 3500, totalPrice: 14000, receivedQuantity: 4 },
        ],
        deliveryAddress: { street: 'Server Room, Ground Floor', city: 'Hyderabad', state: 'Telangana', country: 'India', postalCode: '500001' },
        expectedDelivery: new Date('2026-06-10'),
        sentAt: new Date('2026-05-28'),
        acknowledgedAt: new Date('2026-05-29'),
        specialInstructions: 'Partial delivery acceptable. Heavy equipment - crane required.',
        taxRate: 18,
      },
    ];

    console.log('🌱 Creating Purchase Orders...\n');

    const createdPOs = [];
    for (let i = 0; i < samplePOs.length; i++) {
      const sample = samplePOs[i];
      const vendor = vendors[sample.vendorIndex % vendors.length];

      // Calculate totals
      const subtotal = sample.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = (subtotal * sample.taxRate) / 100;
      const grandTotal = subtotal + taxAmount;

      // Generate PO number using counter service
      const poNumber = await generatePONumber();

      const poData = {
        poNumber,
        vendorId: vendor._id,
        lineItems: sample.lineItems,
        deliveryAddress: sample.deliveryAddress,
        billingAddress: sample.deliveryAddress, // Same as delivery for simplicity
        expectedDelivery: sample.expectedDelivery,
        specialInstructions: sample.specialInstructions,
        termsAndConditions: 'Standard payment terms apply. Goods once sold cannot be returned.',
        subtotal,
        discount: 0,
        taxRate: sample.taxRate,
        taxAmount,
        grandTotal,
        status: sample.status,
        sentAt: sample.sentAt,
        acknowledgedAt: sample.acknowledgedAt,
        createdBy: creator._id,
      };

      const po = await PurchaseOrder.create(poData);
      createdPOs.push(po);

      console.log(`✅ Created ${poNumber} - ${vendor.companyName} - ₹${grandTotal.toLocaleString('en-IN')} - ${sample.status}`);
    }

    console.log(`\n🎉 Successfully seeded ${createdPOs.length} Purchase Orders!`);
    console.log('\n📊 Status breakdown:');
    const statusCounts = {};
    createdPOs.forEach(po => {
      statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n💡 You can now view these POs on the frontend at /purchase-orders');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedPurchaseOrders();
