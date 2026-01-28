import Profile from "../model/profile.model.js";
import Auth from "../model/auth.model.js";

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    // Find profile by authId from the authenticated user
    const profile = await Profile.findOne({ authId: req.user.id })
      .populate('authId', 'fullName email phoneNo role'); // Populate with basic auth info

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        id: profile._id,
        authId: profile.authId._id,
        fullName: profile.fullName || profile.authId.fullName, // Use auth data if not in profile
        email: profile.email || profile.authId.email,         // Use auth data if not in profile
        phoneNo: profile.phoneNo || profile.authId.phoneNo,   // Use auth data if not in profile
        phoneNo2: profile.phoneNo2,
        panNo: profile.panNo,
        adharNo: profile.adharNo,
        address: profile.address,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNo2,
      adharNo,
      panNo,
      address
    } = req.body;

    // Find the profile by authId
    let profile = await Profile.findOne({ authId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Update profile fields
    if (fullName !== undefined) profile.fullName = fullName;
    if (phoneNo2 !== undefined) profile.phoneNo2 = phoneNo2;
    if (adharNo !== undefined) profile.adharNo = adharNo;
    if (panNo !== undefined) profile.panNo = panNo;
    if (address !== undefined) profile.address = { ...profile.address, ...address };

    // Save the updated profile
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: profile._id,
        authId: profile.authId,
        fullName: profile.fullName,
        email: profile.email,
        phoneNo: profile.phoneNo,
        phoneNo2: profile.phoneNo2,
        panNo: profile.panNo,
        adharNo: profile.adharNo,
        address: profile.address,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};