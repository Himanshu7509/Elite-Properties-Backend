import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PropertyPost",
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;