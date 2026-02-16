import PropertyPost from "../model/propertyPost.model.js";
import Auth from "../model/auth.model.js";
import s3 from "../config/s3.js";
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure multer with memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});

// Upload image/video to AWS S3
const uploadToS3 = async (file, folder) => {
  const fileKey = `elite-properties/${folder}/${uuidv4()}-${Date.now()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const uploaded = await s3.upload(params).promise();
  return uploaded.Location; // Return public URL
};

// Helper function to delete media from S3
const deleteMediaFromS3 = async (mediaUrl) => {
  if (!mediaUrl) return;
  
  try {
    // Extract key from URL
    const urlParts = mediaUrl.split('/');
    const key = urlParts.slice(3).join('/'); // Remove https://bucket-name.s3.region.amazonaws.com/
    
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }).promise();
  } catch (error) {
    console.error('Error deleting media from S3:', error);
  }
};

// @desc    Create new property post
// @route   POST /api/property/posts
// @access  Private
export const createPropertyPost = async (req, res) => {
  try {
    const {
      propertyType,
      priceTag,
      price,
      propertyDetails,
      propertyPics,
      propertyVideos,
      contactInfo,
      isFurnished,
      hasParking,
      propertyCategory,
      bhk,
      floor,
      propertyAge,
      facing,
      buildArea,
      carpetArea,
      locality,
      city,
      state,
      pincode,
      landmark,
      amenities,
      nearbyPlaces
    } = req.body;

    // Create new property post
    const propertyPost = await PropertyPost.create({
      userId: req.user.id,
      propertyType,
      priceTag,
      price,
      propertyDetails,
      propertyPics: propertyPics || [],
      propertyVideos: propertyVideos || [],
      contactInfo,
      isFurnished: isFurnished || false,
      hasParking: hasParking || false,
      propertyCategory,
      bhk,
      floor,
      propertyAge,
      facing,
      buildArea,
      carpetArea,
      locality,
      city,
      state,
      pincode,
      landmark,
      amenities: amenities || [],
      nearbyPlaces: nearbyPlaces || []
    });

    res.status(201).json({
      success: true,
      message: "Property post created successfully",
      propertyPost
    });
  } catch (error) {
    console.error('Create property post error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get all property posts
// @route   GET /api/property/posts
// @access  Public
export const getAllPropertyPosts = async (req, res) => {
  try {
    const {
      propertyType,
      propertyCategory,
      city,
      state,
      bhk,
      minPrice,
      maxPrice,
      isFurnished,
      hasParking,
      facing,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    let filter = { isActive: true };

    if (propertyType) filter.propertyType = propertyType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;
    if (city) filter.city = new RegExp(city, 'i'); // Case insensitive search
    if (state) filter.state = new RegExp(state, 'i');
    if (bhk) filter.bhk = parseInt(bhk);
    if (isFurnished !== undefined) filter.isFurnished = isFurnished === 'true';
    if (hasParking !== undefined) filter.hasParking = hasParking === 'true';
    if (facing) filter.facing = facing;
    
    // Price range filtering
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get property posts with user info
    const propertyPosts = await PropertyPost.find(filter)
      .populate('userId', 'fullName email phoneNo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await PropertyPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      propertyPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProperties: total,
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all property posts error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get property post by ID
// @route   GET /api/property/posts/:id
// @access  Public
export const getPropertyPostById = async (req, res) => {
  try {
    const propertyPost = await PropertyPost.findById(req.params.id)
      .populate('userId', 'fullName email phoneNo');

    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: "Property post not found"
      });
    }

    if (!propertyPost.isActive) {
      return res.status(404).json({
        success: false,
        message: "Property post is not active"
      });
    }

    res.status(200).json({
      success: true,
      propertyPost
    });
  } catch (error) {
    console.error('Get property post by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get property posts by user
// @route   GET /api/property/posts/user/my-posts
// @access  Private
export const getMyPropertyPosts = async (req, res) => {
  try {
    const propertyPosts = await PropertyPost.find({ userId: req.user.id })
      .populate('userId', 'fullName email phoneNo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      propertyPosts
    });
  } catch (error) {
    console.error('Get my property posts error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Update property post
// @route   PUT /api/property/posts/:id
// @access  Private
export const updatePropertyPost = async (req, res) => {
  try {
    let propertyPost = await PropertyPost.findById(req.params.id);

    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: "Property post not found"
      });
    }

    // Check if user owns this property post
    if (propertyPost.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this property post"
      });
    }

    // Update property post
    const updatedPropertyPost = await PropertyPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Property post updated successfully",
      propertyPost: updatedPropertyPost
    });
  } catch (error) {
    console.error('Update property post error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete property post
// @route   DELETE /api/property/posts/:id
// @access  Private
export const deletePropertyPost = async (req, res) => {
  try {
    const propertyPost = await PropertyPost.findById(req.params.id);

    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: "Property post not found"
      });
    }

    // Check if user owns this property post
    if (propertyPost.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this property post"
      });
    }

    // Soft delete by setting isActive to false
    await PropertyPost.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: "Property post deleted successfully"
    });
  } catch (error) {
    console.error('Delete property post error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Upload property pictures
// @route   POST /api/property/upload/pictures/:id
// @access  Private
export const uploadPropertyPictures = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Check if property post exists and belongs to user
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: 'Property post not found'
      });
    }

    if (propertyPost.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload pictures for this property'
      });
    }

    // Upload all pictures to S3
    const pictureUrls = [];
    for (const file of req.files) {
      const url = await uploadToS3(file, 'property-pictures');
      pictureUrls.push(url);
    }

    // Update property post with new picture URLs
    propertyPost.propertyPics = [...(propertyPost.propertyPics || []), ...pictureUrls];
    await propertyPost.save();

    res.status(200).json({
      success: true,
      message: `${req.files.length} picture(s) uploaded successfully`,
      pictures: pictureUrls
    });
  } catch (error) {
    console.error('Upload property pictures error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Upload property videos
// @route   POST /api/property/upload/videos/:id
// @access  Private
export const uploadPropertyVideos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Check if property post exists and belongs to user
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: 'Property post not found'
      });
    }

    if (propertyPost.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload videos for this property'
      });
    }

    // Upload all videos to S3
    const videoUrls = [];
    for (const file of req.files) {
      const url = await uploadToS3(file, 'property-videos');
      videoUrls.push(url);
    }

    // Update property post with new video URLs
    propertyPost.propertyVideos = [...(propertyPost.propertyVideos || []), ...videoUrls];
    await propertyPost.save();

    res.status(200).json({
      success: true,
      message: `${req.files.length} video(s) uploaded successfully`,
      videos: videoUrls
    });
  } catch (error) {
    console.error('Upload property videos error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete property picture
// @route   DELETE /api/property/pictures/:id
// @access  Private
export const deletePropertyPicture = async (req, res) => {
  try {
    const { pictureUrl } = req.body;
    
    if (!pictureUrl) {
      return res.status(400).json({
        success: false,
        message: 'Picture URL is required'
      });
    }

    // Find property post
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: 'Property post not found'
      });
    }

    if (propertyPost.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete pictures from this property'
      });
    }

    // Remove picture URL from array
    propertyPost.propertyPics = propertyPost.propertyPics.filter(url => url !== pictureUrl);
    await propertyPost.save();

    // Delete from S3
    await deleteMediaFromS3(pictureUrl);

    res.status(200).json({
      success: true,
      message: 'Picture deleted successfully'
    });
  } catch (error) {
    console.error('Delete property picture error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Filter properties by location, price range, and property type
// @route   GET /api/property/filter
// @access  Public
export const filterProperties = async (req, res) => {
  try {
    const {
      location,
      minPrice,
      maxPrice,
      propertyType,
      propertyCategory,
      city,
      state,
      bhk,
      isFurnished,
      hasParking,
      facing,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    let filter = { isActive: true };

    // Location-based filtering (search in city, state, locality)
    if (location) {
      const locationRegex = new RegExp(location, 'i');
      filter.$or = [
        { city: locationRegex },
        { state: locationRegex },
        { locality: locationRegex }
      ];
    }

    // City filtering
    if (city) filter.city = new RegExp(city, 'i');
    
    // State filtering
    if (state) filter.state = new RegExp(state, 'i');

    // Property type filtering
    if (propertyType) filter.propertyType = propertyType;
    
    // Property category filtering
    if (propertyCategory) filter.propertyCategory = propertyCategory;

    // BHK filtering
    if (bhk) filter.bhk = parseInt(bhk);

    // Furnished filtering
    if (isFurnished !== undefined) filter.isFurnished = isFurnished === 'true';

    // Parking filtering
    if (hasParking !== undefined) filter.hasParking = hasParking === 'true';

    // Facing filtering
    if (facing) filter.facing = facing;
    
    // Price range filtering
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get filtered property posts with user info
    const propertyPosts = await PropertyPost.find(filter)
      .populate('userId', 'fullName email phoneNo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await PropertyPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Properties filtered successfully",
      propertyPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProperties: total,
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Filter properties error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get property statistics
// @route   GET /api/property/stats
// @access  Public
export const getPropertyStats = async (req, res) => {
  try {
    const totalProperties = await PropertyPost.countDocuments({ isActive: true });
    const activeProperties = await PropertyPost.countDocuments({ 
      isActive: true, 
      propertyStatus: 'available' 
    });
    const soldProperties = await PropertyPost.countDocuments({ 
      isActive: true, 
      propertyStatus: 'sold' 
    });
    const rentedProperties = await PropertyPost.countDocuments({ 
      isActive: true, 
      propertyStatus: 'rented' 
    });

    // Get properties by category
    const propertiesByCategory = await PropertyPost.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$propertyCategory", count: { $sum: 1 } } }
    ]);

    // Get properties by city
    const propertiesByCity = await PropertyPost.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProperties,
        activeProperties,
        soldProperties,
        rentedProperties,
        propertiesByCategory,
        propertiesByCity
      }
    });
  } catch (error) {
    console.error('Get property stats error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete property video
// @route   DELETE /api/property/videos/:id
// @access  Private
export const deletePropertyVideo = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required'
      });
    }

    // Find property post
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: 'Property post not found'
      });
    }

    if (propertyPost.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete videos from this property'
      });
    }

    // Remove video URL from array
    propertyPost.propertyVideos = propertyPost.propertyVideos.filter(url => url !== videoUrl);
    await propertyPost.save();

    // Delete from S3
    await deleteMediaFromS3(videoUrl);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete property video error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};