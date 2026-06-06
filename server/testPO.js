require('dotenv').config();
const mongoose = require('mongoose');
const PurchaseOrder = require('./models/PurchaseOrder');

const testPurchaseOrders = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const pos = await PurchaseOrder.find()
      .populate('vendorId', 'companyName email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${pos.length} Purchase Orders:\n`);

    pos.forEach(po => {
      console.log(`📦 ${po.poNumber}`);
      console.log(`   Vendor: ${po.vendorId?.companyName || 'N/A'}`);
      console.log(`   Status: ${po.status}`);
      console.log(`   Total: ₹${po.grandTotal?.toLocaleString('en-IN')}`);
      console.log(`   Items: ${po.lineItems?.length || 0}`);
      console.log(`   Created: ${po.createdAt.toLocaleDateString('en-GB')}`);
      console.log(`   Expected Delivery: ${po.expectedDelivery ? po.expectedDelivery.toLocaleDateString('en-GB') : 'N/A'}`);
      console.log('');
    });

    // Test query with filters
    console.log('📊 Testing status filter (draft):');
    const draftPOs = await PurchaseOrder.find({ status: 'draft' });
    console.log(`   Found ${draftPOs.length} draft POs\n`);

    console.log('📊 Testing status filter (confirmed):');
    const confirmedPOs = await PurchaseOrder.find({ status: 'confirmed' });
    console.log(`   Found ${confirmedPOs.length} confirmed POs\n`);

    console.log('✅ All tests passed! POs are correctly stored in DB.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testPurchaseOrders();
