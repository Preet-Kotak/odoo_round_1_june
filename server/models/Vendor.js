const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    vendorId: { type: String, unique: true },
    companyName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['IT', 'Manufacturing', 'Services', 'Logistics', 'Other'],
      required: true,
    },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    website: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    gstNumber: { type: String, required: true },
    panNumber: { type: String },
    paymentTerms: {
      type: String,
      enum: ['Net15', 'Net30', 'Net60'],
      default: 'Net30',
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
    rating: { type: Number, min: 1, max: 5, default: null },
    linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

vendorSchema.index({ status: 1 });
vendorSchema.index({ category: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
