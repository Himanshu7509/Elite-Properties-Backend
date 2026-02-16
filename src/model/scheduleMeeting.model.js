import mongoose from "mongoose";

const scheduleMeetingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  date: {
    type: Date,
    required: [true, "Date is required"]
  },
  place: {
    type: String,
    required: [true, "Place is required"],
    trim: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PropertyPost",
    required: false
  },
  meetingStatus: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ScheduleMeeting = mongoose.model("ScheduleMeeting", scheduleMeetingSchema);

export default ScheduleMeeting;