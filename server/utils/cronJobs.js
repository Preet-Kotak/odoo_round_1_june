const cron = require('node-cron');
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const { sendEmail } = require('./emailService');

const startCronJobs = () => {
  // Run every hour — send deadline reminders for RFQs expiring within 24 hours
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const rfqs = await RFQ.find({
        status: 'open',
        deadline: { $gte: now, $lte: in24h },
      }).populate('assignedVendors', 'companyName email');

      for (const rfq of rfqs) {
        for (const vendor of rfq.assignedVendors) {
          const hasQuoted = await Quotation.findOne({ rfqId: rfq._id, vendorId: vendor._id, status: { $ne: 'draft' } });
          if (!hasQuoted) {
            await sendEmail(
              vendor.email,
              `Reminder: RFQ ${rfq.rfqNumber} deadline in 24 hours`,
              `<p>Dear ${vendor.companyName},<br>This is a reminder that RFQ <strong>${rfq.rfqNumber} — ${rfq.title}</strong> deadline is in less than 24 hours.<br>Please submit your quotation as soon as possible.</p>`
            );
          }
        }
      }

      // Auto-close RFQs past deadline
      await RFQ.updateMany(
        { status: 'open', deadline: { $lt: now } },
        { status: 'closed' }
      );
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });

  console.log('Cron jobs started');
};

module.exports = { startCronJobs };
