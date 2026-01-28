import mongoose from "mongoose";

const propertyPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },
  propertyType: {
    type: String,
    required: [true, "Property type is required"],
    enum: ['owner', 'lease'],
    trim: true
  },
  // Owner/Lease specific fields
  priceTag: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    min: [0, "Price must be positive"]
  },
  propertyDetails: {
    type: String,
    trim: true
  },
  propertyPics: [{
    type: String,
    trim: true
  }],
  propertyVideos: [{
    type: String,
    trim: true
  }],
  contactInfo: {
    type: String,
    trim: true
  },
  isFurnished: {
    type: Boolean,
    default: false
  },
  hasParking: {
    type: Boolean,
    default: false
  },
  
  // Property Post specific fields
  propertyCategory: {
    type: String,
    enum: ['rental', 'sale', 'commercial_sale', 'pg', 'hostel', 'flatmates', 'land', 'plot'],
    trim: true
  },
  bhk: {
    type: Number,
    min: [0, "BHK must be positive"]
  },
  floor: {
    type: Number,
    min: [0, "Floor must be positive"]
  },
  propertyAge: {
    type: Number,
    min: [0, "Property age must be positive"]
  },
  facing: {
    type: String,
    enum: ['east', 'west', 'north', 'south', 'north-east', 'north-west', 'south-east', 'south-west'],
    trim: true
  },
  buildArea: {
    type: Number,
    min: [0, "Build area must be positive"]
  },
  carpetArea: {
    type: Number,
    min: [0, "Carpet area must be positive"]
  },
  locality: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
  },
  landmark: {
    type: String,
    trim: true
  },
  amenities: [{
    type: String,
    trim: true
  }],
  nearbyPlaces: [{
    type: String,
    trim: true
  }],
  propertyStatus: {
    type: String,
    enum: ['available', 'sold', 'rented', 'under_construction'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PropertyPost = mongoose.model("PropertyPost", propertyPostSchema);

export default PropertyPost;