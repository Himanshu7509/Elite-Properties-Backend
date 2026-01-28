import mongoose from "mongoose";

const propertyTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Property type name is required"],
    unique: true,
    trim: true,
    enum: ['owner', 'lease']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PropertyType = mongoose.model("PropertyType", propertyTypeSchema);

export default PropertyType;