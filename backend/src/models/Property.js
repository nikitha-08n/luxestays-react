import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    index: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required'],
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
    },
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    index: true,
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative'],
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative'],
  },
  area: {
    type: Number,
    required: [true, 'Area in sq ft is required'],
    min: [0, 'Area cannot be negative'],
  },
  propertyType: {
    type: String,
    enum: ['APARTMENT', 'HOUSE', 'CONDO', 'VILLA'],
    required: [true, 'Property type is required'],
    index: true,
  },
  furnishing: {
    type: String,
    enum: ['FURNISHED', 'SEMI-FURNISHED', 'UNFURNISHED'],
    required: [true, 'Furnishing status is required'],
  },
  amenities: {
    type: [String],
    default: [],
  },
  images: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  upiId: {
    type: String,
    default: '',
    trim: true,
  },
  bankAccountNumber: {
    type: String,
    default: '',
    trim: true,
  },
  bankIfscCode: {
    type: String,
    default: '',
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Set GeoJSON 2dsphere index for location radius queries
propertySchema.index({ location: '2dsphere' });

// Full text search index
propertySchema.index({ title: 'text', description: 'text', city: 'text', address: 'text' });

export const Property = mongoose.model('Property', propertySchema);
export default Property;
