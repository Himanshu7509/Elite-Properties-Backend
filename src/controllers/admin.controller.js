import Auth from "../model/auth.model.js";
import Profile from "../model/profile.model.js";
import PropertyPost from "../model/propertyPost.model.js";
import s3 from "../config/s3.js";
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

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

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await Auth.find({ role: 'client' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await Auth.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get user's profile
    const profile = await Profile.findOne({ authId: user._id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await Auth.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get all user's property posts
    const propertyPosts = await PropertyPost.find({ userId: user._id });
    
    // Delete all media files from S3 for each property post
    for (const property of propertyPosts) {
      // Delete property pictures
      if (property.propertyPics && property.propertyPics.length > 0) {
        for (const picUrl of property.propertyPics) {
          await deleteMediaFromS3(picUrl);
        }
      }
      
      // Delete property videos
      if (property.propertyVideos && property.propertyVideos.length > 0) {
        for (const videoUrl of property.propertyVideos) {
          await deleteMediaFromS3(videoUrl);
        }
      }
    }

    // Delete user's profile
    await Profile.findOneAndDelete({ authId: user._id });
    
    // Delete all user's property posts
    await PropertyPost.deleteMany({ userId: user._id });
    
    // Delete the user
    await Auth.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User and all associated data deleted successfully"
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get property post by ID (admin only)
// @route   GET /api/admin/properties/:id
// @access  Private/Admin
export const getPropertyById = async (req, res) => {
  try {
    const propertyPost = await PropertyPost.findById(req.params.id)
      .populate('userId', 'fullName email phoneNo role');

    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: "Property post not found"
      });
    }

    res.status(200).json({
      success: true,
      propertyPost
    });
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get all property posts (admin only)
// @route   GET /api/admin/properties
// @access  Private/Admin
export const getAllProperties = async (req, res) => {
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
      isActive,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    let filter = {};

    if (propertyType) filter.propertyType = propertyType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (bhk) filter.bhk = parseInt(bhk);
    if (isFurnished !== undefined) filter.isFurnished = isFurnished === 'true';
    if (hasParking !== undefined) filter.hasParking = hasParking === 'true';
    if (facing) filter.facing = facing;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
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
    console.error('Get all properties error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete property post (admin only)
// @route   DELETE /api/admin/properties/:id
// @access  Private/Admin
export const deleteProperty = async (req, res) => {
  try {
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: "Property post not found"
      });
    }

    // Delete all media files from S3
    // Delete property pictures
    if (propertyPost.propertyPics && propertyPost.propertyPics.length > 0) {
      for (const picUrl of propertyPost.propertyPics) {
        await deleteMediaFromS3(picUrl);
      }
    }
    
    // Delete property videos
    if (propertyPost.propertyVideos && propertyPost.propertyVideos.length > 0) {
      for (const videoUrl of propertyPost.propertyVideos) {
        await deleteMediaFromS3(videoUrl);
      }
    }

    // Delete the property post
    await PropertyPost.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Property post and all associated media deleted successfully"
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Update property status (admin only)
// @route   PUT /api/admin/properties/:id/status
// @access  Private/Admin
export const updatePropertyStatus = async (req, res) => {
  try {
    const { propertyStatus } = req.body;
    
    if (!propertyStatus) {
      return res.status(400).json({
        success: false,
        message: "Property status is required"
      });
    }

    const propertyPost = await PropertyPost.findByIdAndUpdate(
      req.params.id,
      { propertyStatus },
      { new: true }
    ).populate('userId', 'fullName email phoneNo');

    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: "Property post not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Property status updated successfully",
      propertyPost
    });
  } catch (error) {
    console.error('Update property status error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Create property post (admin only)
// @route   POST /api/admin/properties
// @access  Private/Admin
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
      nearbyPlaces,
      propertyStatus,
      isActive
    } = req.body;

    // Validate required fields
    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required"
      });
    }

    // Create new property post with admin as the user
    const propertyPost = await PropertyPost.create({
      userId: req.user.id, // Use authenticated admin's ID
      propertyType: propertyType || 'owner',
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
      nearbyPlaces: nearbyPlaces || [],
      propertyStatus: propertyStatus || 'available',
      isActive: isActive !== undefined ? isActive : true
    });

    // Populate user info in response
    await propertyPost.populate('userId', 'fullName email phoneNo');

    res.status(201).json({
      success: true,
      message: "Property post created successfully by admin",
      propertyPost
    });
  } catch (error) {
    console.error('Admin create property post error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Upload property pictures (admin only)
// @route   POST /api/admin/properties/upload/pictures/:id
// @access  Private/Admin
export const uploadPropertyPictures = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Check if property post exists (no ownership check for admin)
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: 'Property post not found'
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
    console.error('Admin upload property pictures error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Upload property videos (admin only)
// @route   POST /api/admin/properties/upload/videos/:id
// @access  Private/Admin
export const uploadPropertyVideos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Check if property post exists (no ownership check for admin)
    const propertyPost = await PropertyPost.findById(req.params.id);
    
    if (!propertyPost) {
      return res.status(404).json({
        success: false,
        message: 'Property post not found'
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
    console.error('Admin upload property videos error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete property picture (admin only)
// @route   DELETE /api/admin/properties/pictures/:id
// @access  Private/Admin
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
    console.error('Admin delete property picture error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete property video (admin only)
// @route   DELETE /api/admin/properties/videos/:id
// @access  Private/Admin
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
    console.error('Admin delete property video error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await Auth.countDocuments({ role: 'client' });
    const totalProperties = await PropertyPost.countDocuments();
    const activeProperties = await PropertyPost.countDocuments({ isActive: true });
    const inactiveProperties = await PropertyPost.countDocuments({ isActive: false });
    
    const propertiesByCategory = await PropertyPost.aggregate([
      { $group: { _id: "$propertyCategory", count: { $sum: 1 } } }
    ]);
    
    const propertiesByCity = await PropertyPost.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const usersByCity = await Profile.aggregate([
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        activeProperties,
        inactiveProperties,
        propertiesByCategory,
        propertiesByCity,
        usersByCity
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};