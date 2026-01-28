import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    trim: true
  },
  panNo: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please enter a valid PAN number"]
  },
  adharNo: {
    type: String,
    match: [/^\d{12}$/, "Please enter a valid 12-digit Aadhaar number"]
  },
  phoneNo: {
    type: String,
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
  },
  phoneNo2: {
    type: String,
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  address: {
    addressLine: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
    }
  }
}, {
  timestamps: true
});

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;