const PointOfMeasure = require("../../models/pom/PomModel");

// Create a new Point of Measure
exports.createPointOfMeasure = async (req, res) => {
  try {
    const { code, description, tolerance } = req.body;

    if (!code || !description || !tolerance) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingPOM = await PointOfMeasure.findOne({ code });
    if (existingPOM) {
      return res.status(400).json({ message: "Code already exists." });
    }

    const newPOM = new PointOfMeasure({ code, description, tolerance });
    const savedPOM = await newPOM.save();

    res.status(201).json(savedPOM);
  } catch (error) {
    res.status(500).json({
      message: "Error creating Point of Measure.",
      error: error.message,
    });
  }
};

// Get all Points of Measure
exports.getAllPointsOfMeasure = async (_req, res) => {
  try {
    const pointsOfMeasure = await PointOfMeasure.find();
    res.status(200).json(pointsOfMeasure);
  } catch (error) {
    res.status(500).json({
      message:
        "Error fetching Points of Measur                                                                                                                                                                            e.",
      error: error.message,
    });
  }
};

// Add this new paginated list function to your controller
exports.getPaginatedPointsOfMeasure = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // Create search query
    const searchQuery = search
      ? {
          $or: [
            { code: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tolerance: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalItems = await PointOfMeasure.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalItems / limit);

    const pointsOfMeasure = await PointOfMeasure.find(searchQuery)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: pointsOfMeasure,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching paginated Points of Measure.",
      error: error.message,
    });
  }
};
// Get all Points of Measure with pagination
exports.getAllPointsOfMeasurePagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const totalRecords = await PointOfMeasure.countDocuments();
    const totalPages = Math.ceil(totalRecords / limit);

    const pointsOfMeasure = await PointOfMeasure.find().skip(skip).limit(limit);

    res.status(200).json({
      message: "Points of Measure retrieved successfully",
      data: pointsOfMeasure,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching Points of Measure:", error);
    res.status(500).json({
      message: "Error fetching Points of Measure.",
      error: error.message,
    });
  }
};

// Get a Point of Measure by ID
exports.getPointOfMeasureById = async (req, res) => {
  try {
    const { id } = req.params;

    const pointOfMeasure = await PointOfMeasure.findById(id);
    if (!pointOfMeasure) {
      return res.status(404).json({ message: "Point of Measure not found." });
    }

    res.status(200).json(pointOfMeasure);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Point of Measure.",
      error: error.message,
    });
  }
};

// Update a Point of Measure
exports.updatePointOfMeasure = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, tolerance } = req.body;

    const updatedPOM = await PointOfMeasure.findByIdAndUpdate(
      id,
      { code, description, tolerance },
      { new: true, runValidators: true }
    );

    if (!updatedPOM) {
      return res.status(404).json({ message: "Point of Measure not found." });
    }

    res.status(200).json(updatedPOM);
  } catch (error) {
    res.status(500).json({
      message: "Error updating Point of Measure.",
      error: error.message,
    });
  }
};

exports.getPaginatedPointsOfMeasure = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tolerance: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count and paginated data in parallel
    const [total, items] = await Promise.all([
      PointOfMeasure.countDocuments(searchQuery),
      PointOfMeasure.find(searchQuery)
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching paginated POM:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Points of Measure",
      error: error.message,
    });
  }
};

// Delete a Point of Measure
exports.deletePointOfMeasure = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPOM = await PointOfMeasure.findByIdAndDelete(id);
    if (!deletedPOM) {
      return res.status(404).json({ message: "Point of Measure not found." });
    }

    res.status(200).json({
      message: "Point of Measure deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Point of Measure.",
      error: error.message,
    });
  }
};

exports.filterPointOfMeasures = async (req, res) => {
  try {
    const { code, description, tolerance } = req.query;

    const filter = {};
    if (code) filter.code = { $regex: code, $options: "i" };
    if (description)
      filter.description = { $regex: description, $options: "i" };
    if (tolerance) filter.tolerance = { $regex: tolerance, $options: "i" };

    const filteredRecords = await PointOfMeasure.find(filter);

    res.status(200).json(filteredRecords);
  } catch (error) {
    res.status(500).json({
      message: "Error filtering Point of Measures.",
      error: error.message,
    });
  }
};
