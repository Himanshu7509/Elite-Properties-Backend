import Contact from "../model/contact.model.js";
import PropertyPost from "../model/propertyPost.model.js";

// @desc    Create new contact inquiry
// @route   POST /api/contact
// @access  Public
export const createContact = async (req, res) => {
  try {
    const {
      fullName,
      contactNumber,
      email,
      description,
      propertyId
    } = req.body;

    // Validate required fields
    if (!fullName || !contactNumber || !email || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: fullName, contactNumber, email, description"
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number"
      });
    }

    // Check if property exists (if propertyId is provided)
    if (propertyId) {
      const property = await PropertyPost.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found"
        });
      }
    }

    // Create new contact inquiry
    const contact = await Contact.create({
      fullName,
      contactNumber,
      email,
      description,
      propertyId: propertyId || null
    });

    res.status(201).json({
      success: true,
      message: "Contact inquiry submitted successfully",
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get all contact inquiries (admin only)
// @route   GET /api/contact
// @access  Private/Admin
export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all contacts with property info
    const contacts = await Contact.find()
      .populate('propertyId', 'propertyType propertyCategory city price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalContacts: total,
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get contact inquiry by ID (admin only)
// @route   GET /api/contact/:id
// @access  Private/Admin
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('propertyId', 'propertyType propertyCategory city price');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found"
      });
    }

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete contact inquiry (admin only)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found"
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Contact inquiry deleted successfully"
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};