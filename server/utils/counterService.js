const mongoose = require('mongoose');

// Counter schema for atomic sequence generation
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

const getNextSequence = async (name) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const generateVendorId = async () => {
  const seq = await getNextSequence('vendor');
  return `VND-${String(seq).padStart(4, '0')}`;
};

const generateRFQNumber = async () => {
  const seq = await getNextSequence('rfq');
  const year = new Date().getFullYear();
  return `RFQ-${year}-${String(seq).padStart(4, '0')}`;
};

const generatePONumber = async () => {
  const seq = await getNextSequence('po');
  const year = new Date().getFullYear();
  return `PO-${year}-${String(seq).padStart(4, '0')}`;
};

const generateInvoiceNumber = async () => {
  const seq = await getNextSequence('invoice');
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(4, '0')}`;
};

module.exports = {
  generateVendorId,
  generateRFQNumber,
  generatePONumber,
  generateInvoiceNumber,
};
