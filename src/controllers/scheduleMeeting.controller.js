import ScheduleMeeting from "../model/scheduleMeeting.model.js";
import PropertyPost from "../model/propertyPost.model.js";

// @desc    Schedule a meeting
// @route   POST /api/schedule-meeting
// @access  Public
export const scheduleMeeting = async (req, res) => {
  try {
    const {
      name,
      email,
      date,
      place,
      propertyId
    } = req.body;

    // Validate required fields
    if (!name || !email || !date || !place) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, email, date, place"
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

    // Validate date (must be future date)
    const meetingDate = new Date(date);
    const currentDate = new Date();
    if (meetingDate <= currentDate) {
      return res.status(400).json({
        success: false,
        message: "Meeting date must be in the future"
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

    // Check for existing meetings at the same date and place
    const existingMeeting = await ScheduleMeeting.findOne({
      date: {
        $gte: new Date(meetingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(meetingDate.setHours(23, 59, 59, 999))
      },
      place: place,
      meetingStatus: 'scheduled'
    });

    if (existingMeeting) {
      return res.status(400).json({
        success: false,
        message: "A meeting is already scheduled at this place on the selected date"
      });
    }

    // Create new meeting schedule
    const meeting = await ScheduleMeeting.create({
      name,
      email,
      date: new Date(date),
      place,
      propertyId: propertyId || null
    });

    res.status(201).json({
      success: true,
      message: "Meeting scheduled successfully",
      meeting
    });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get all scheduled meetings (admin only)
// @route   GET /api/schedule-meeting
// @access  Private/Admin
export const getAllScheduledMeetings = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    let filter = {};

    // Filter by status
    if (status) {
      filter.meetingStatus = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all scheduled meetings with property info
    const meetings = await ScheduleMeeting.find(filter)
      .populate('propertyId', 'propertyType propertyCategory city price')
      .sort({ date: 1 }) // Sort by date ascending
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await ScheduleMeeting.countDocuments(filter);

    res.status(200).json({
      success: true,
      meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalMeetings: total,
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all scheduled meetings error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Get scheduled meeting by ID (admin only)
// @route   GET /api/schedule-meeting/:id
// @access  Private/Admin
export const getScheduledMeetingById = async (req, res) => {
  try {
    const meeting = await ScheduleMeeting.findById(req.params.id)
      .populate('propertyId', 'propertyType propertyCategory city price');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Scheduled meeting not found"
      });
    }

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Get scheduled meeting by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Update meeting status (admin only)
// @route   PUT /api/schedule-meeting/:id/status
// @access  Private/Admin
export const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate status value
    const validStatuses = ['scheduled', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: scheduled, completed, cancelled"
      });
    }

    const meeting = await ScheduleMeeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Scheduled meeting not found"
      });
    }

    // Update meeting status
    meeting.meetingStatus = status;
    await meeting.save();

    res.status(200).json({
      success: true,
      message: "Meeting status updated successfully",
      meeting
    });
  } catch (error) {
    console.error('Update meeting status error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// @desc    Delete scheduled meeting (admin only)
// @route   DELETE /api/schedule-meeting/:id
// @access  Private/Admin
export const deleteScheduledMeeting = async (req, res) => {
  try {
    const meeting = await ScheduleMeeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Scheduled meeting not found"
      });
    }

    await ScheduleMeeting.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Scheduled meeting deleted successfully"
    });
  } catch (error) {
    console.error('Delete scheduled meeting error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};