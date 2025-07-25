const Arrangement = require("../../models/arrangement/ArrangementModel");
const ASN = require("../../models/asn/ASNModel");
const ItemDetail = require("../../models/itemdetail/ItemDetailModel");
const WorkOrder = require("../../models/workorder/WorkOrderModel");


exports.createArrangement = async (req, res) => {
  try {
    const { selectedASN, shippingStatus, arrivalDate, shipDate } = req.body;
    const newArrangement = new Arrangement(req.body);
    await newArrangement.save();

    // Validate we have the required dates
    if (!arrivalDate || !shipDate) {
      return res.status(400).json({
        message: "Both arrivalDate and shipDate are required in the request body.",
      });
    }

    // Find the selected ASNs with their selectedItemDetails and workOrder references
    const asns = await ASN.find({ _id: { $in: selectedASN } })
      .select("selectedItemDetails status arrivalDate shipDate")
      .populate({
        path: 'selectedItemDetails',
        select: 'workOrder_Id status'
      });

    // Get all unique workOrder IDs from the selectedItemDetails
    const workOrderIds = [];
    const itemDetailIds = [];
    
    asns.forEach(asn => {
      asn.selectedItemDetails.forEach(item => {
        itemDetailIds.push(item._id);
        if (item.workOrder_Id && item.workOrder_Id._id) {
          workOrderIds.push(item.workOrder_Id._id);
        }
      });
    });

    if (["In Transit", "Received", "/Arranged/Not Yet Shipped"].includes(shippingStatus)) {
      // Update ItemDetails status
      if (itemDetailIds.length > 0) {
        await ItemDetail.updateMany(
          { _id: { $in: itemDetailIds } },
          { $set: { shippingStatus: shippingStatus,
                    status: shippingStatus
           } }
        );
      }

      // Update WorkOrders shippingStatus
      if (workOrderIds.length > 0) {
        const uniqueWorkOrderIds = [...new Set(workOrderIds)]; // Remove duplicates
        
        const updateResult = await WorkOrder.updateMany(
          { _id: { $in: uniqueWorkOrderIds } },
          { $set: { shippingStatus: [shippingStatus],
                      status: [shippingStatus]
           } }
        );
        
        console.log(`Updated ${updateResult.modifiedCount} WorkOrder documents`);
      } else {
        console.log("No WorkOrders found to update");
      }

      // Update ASN with all fields
      const updateResult = await ASN.updateMany(
        { _id: { $in: selectedASN } },
        { 
          $set: { 
            status: shippingStatus,
            shippingStatus: shippingStatus,
            arrivalDate: new Date(arrivalDate),
            shipDate: new Date(shipDate),
            lastUpdated: new Date()
          } 
        }
      );

      console.log(`Updated ${updateResult.modifiedCount} ASN documents`);
    }

    res.status(201).json({
      message: `Arrangement created successfully. ASN updated to '${shippingStatus}' with ship date ${shipDate} and arrival date ${arrivalDate}. WorkOrder shippingStatus also updated.`,
      data: newArrangement,
    });
  } catch (error) {
    console.error("Error creating arrangement:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

exports.getFilteredArrangements = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { shippingStatus, search } = req.query;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const workOrders = await WorkOrder.find({ vendor: vendorId }).select("_id");
    if (!workOrders.length) {
      return res
        .status(404)
        .json({ message: "No work orders found for this vendor." });
    }

    const workOrderIds = workOrders.map((wo) => wo._id);
    const itemDetails = await ItemDetail.find({
      workOrder_Id: { $in: workOrderIds },
    }).select("_id");
    if (!itemDetails.length) {
      return res
        .status(404)
        .json({ message: "No item details found for this vendor." });
    }

    const itemDetailIds = itemDetails.map((item) => item._id);
    const asns = await ASN.find({
      selectedItemDetails: { $in: itemDetailIds },
    }).select("_id");
    if (!asns.length) {
      return res
        .status(404)
        .json({ message: "No ASNs found for this vendor." });
    }

    const asnIds = asns.map((asn) => asn._id);
    let filter = { selectedASN: { $in: asnIds } };

    // ✅ Apply shippingStatus filter
    if (shippingStatus) {
      const statusArray = shippingStatus
        .split(",")
        .map((status) => status.trim());
      filter.shippingStatus = { $in: statusArray };
    }

    // ✅ Fix search logic (Handles both numbers and strings)
    if (search) {
      const searchConditions = [];
      const searchRegex = new RegExp(search, "i");

      if (!isNaN(search)) {
        searchConditions.push({ arrangementNumber: Number(search) });
      }

      searchConditions.push(
        { shippingStatus: searchRegex },
        { "selectedASN.asnNumber": searchRegex },
        { bookingNumber: searchRegex }
      );

      filter.$or = searchConditions;
    }

    console.log("Final Query Filter:", JSON.stringify(filter, null, 2));

    let arrangements = await Arrangement.find(filter).populate({
      path: "selectedASN",
      populate: [
        { path: "vendor", model: "Vendor" },
        {
          path: "selectedItemDetails",
          model: "ItemDetail",
          populate: {
            path: "workOrder_Id",
            model: "workOrder",
            populate: { path: "vendor", model: "Vendor" },
          },
        },
      ],
    });

    if (!arrangements.length) {
      return res.status(404).json({
        message: "No arrangements found with the given criteria.",
      });
    }

    res.status(200).json({
      message: "Arrangements fetched successfully.",
      data: arrangements,
    });
  } catch (error) {
    console.error("Error fetching arrangements:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

exports.getArrangementsByAsn = async (req, res) => {
  try {
    const { asnId } = req.params;
    const { shippingStatus, search } = req.query;

    if (!asnId) {
      return res.status(400).json({ message: "ASN ID is required." });
    }

    let filter = { selectedASN: asnId };

    // Apply shippingStatus filter if provided
    if (shippingStatus) {
      const statusArray = shippingStatus
        .split(",")
        .map((status) => status.trim());
      filter.shippingStatus = { $in: statusArray };
    }

    // Apply search filter if provided
    if (search) {
      const searchConditions = [];
      const searchRegex = new RegExp(search, "i");

      if (!isNaN(search)) {
        searchConditions.push({ arrangementNumber: Number(search) });
      }

      searchConditions.push(
        { shippingStatus: searchRegex },
        { bookingNumber: searchRegex }
      );

      filter.$or = searchConditions;
    }

    console.log("Final Query Filter:", JSON.stringify(filter, null, 2));

    const arrangements = await Arrangement.find(filter).populate({
      path: "selectedASN",
      populate: [
        { path: "vendor", model: "Vendor" },
        {
          path: "selectedItemDetails",
          model: "ItemDetail",
          populate: {
            path: "workOrder_Id",
            model: "WorkOrder",
            populate: { path: "vendor", model: "Vendor" },
          },
        },
      ],
    });

    if (!arrangements.length) {
      return res.status(404).json({
        message: "No arrangements found for this ASN.",
      });
    }

    res.status(200).json({
      message: "Arrangements fetched successfully.",
      data: arrangements,
    });
  } catch (error) {
    console.error("Error fetching arrangements by ASN:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

exports.getAllArrangements = async (_req, res) => {
  try {
    const arrangements = await Arrangement.find().populate({
      path: "selectedASN",
      populate: {
        path: "selectedItemDetails",
        model: "ItemDetail",
      },
    });
    res.status(200).json(arrangements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArrangementById = async (req, res) => {
  try {
    const arrangement = await Arrangement.findById(req.params.id).populate({
      path: "selectedASN",
      populate: {
        path: "selectedItemDetails",
        model: "ItemDetail",
      },
    });
    if (!arrangement) {
      return res.status(404).json({ message: "Arrangement not found" });
    }
    res.status(200).json(arrangement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateArrangement = async (req, res) => {
  try {
    const { 
      shippingStatus, // Only using shippingStatus from payload
      selectedASN, 
      shipDate, 
      arrivalDate, 
      destination,
      arrangementNumber
    } = req.body;
    
    const arrangementId = req.params.id;

    // Get the current arrangement to compare ASNs
    const currentArrangement = await Arrangement.findById(arrangementId);
    const previousASNs = currentArrangement.selectedASN || [];
    const newASNs = selectedASN || [];

    // Find ASNs that were removed (unchecked)
    const removedASNs = previousASNs.filter(asn => !newASNs.includes(asn.toString()));

    // Update removed ASNs and their items back to "Ready to Ship"
    if (removedASNs.length > 0) {
      await ASN.updateMany(
        { _id: { $in: removedASNs } },
        { 
          $set: { 
            status: "Ready to Ship", // Set status to Ready to Ship
            shippingStatus: "Ready to Ship", // Also set shippingStatus
            shipDate: null,
            arrivalDate: null,
            lastUpdated: new Date()
          }
        }
      );

      // Update related ItemDetails for removed ASNs
      const asns = await ASN.find({ _id: { $in: removedASNs } }).select("selectedItemDetails");
      const itemDetailIds = asns.flatMap(asn => asn.selectedItemDetails);
      
      if (itemDetailIds.length > 0) {
        await ItemDetail.updateMany(
          { _id: { $in: itemDetailIds } },
          { 
            $set: { 
              status: "Ready to Ship", // Set status
              shippingStatus: "Ready to Ship" // Set shippingStatus
            } 
          }
        );
      }
    }

    // Proceed with the original update using shippingStatus for all status fields
    const updateData = {
      status: shippingStatus, // Set status to shippingStatus value
      shippingStatus: shippingStatus, // Also set shippingStatus
      selectedASN: newASNs,
      shipDate: new Date(shipDate),
      arrivalDate: new Date(arrivalDate),
      destination,
      arrangementNumber,
      lastUpdated: new Date()
    };

    const updatedArrangement = await Arrangement.findByIdAndUpdate(
      arrangementId,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: "selectedASN",
      populate: {
        path: "selectedItemDetails",
        model: "ItemDetail",
      },
    });

    if (!updatedArrangement) {
      return res.status(404).json({
        message: "Arrangement not found"
      });
    }

    // Update remaining ASNs using shippingStatus
    if (shippingStatus && ["In Transit", "Received", "Arranged/Not Yet Shipped"].includes(shippingStatus)) {
      await ASN.updateMany(
        { _id: { $in: newASNs } },
        { 
          $set: { 
            status: shippingStatus, // Set status to shippingStatus
            shippingStatus, // Also set shippingStatus
            shipDate: new Date(shipDate),
            arrivalDate: new Date(arrivalDate),
            lastUpdated: new Date()
          }
        }
      );

      // Update related ItemDetails
      const asns = await ASN.find({ _id: { $in: newASNs } }).select("selectedItemDetails");
      const itemDetailIds = asns.flatMap(asn => asn.selectedItemDetails);
      
      if (itemDetailIds.length > 0) {
        await ItemDetail.updateMany(
          { _id: { $in: itemDetailIds } },
          { 
            $set: { 
              status: shippingStatus, // Set status to shippingStatus
              shippingStatus: shippingStatus // Also set shippingStatus
            } 
          }
        );
      }
    }

    res.status(200).json({
      message: "Arrangement updated successfully",
      data: updatedArrangement
    });
  } catch (error) {
    console.error("Error updating arrangement:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.deleteArrangement = async (req, res) => {
  try {
    const deletedArrangement = await Arrangement.findByIdAndDelete(
      req.params.id
    );

    if (!deletedArrangement) {
      return res.status(404).json({ message: "Arrangement not found" });
    }

    res.status(200).json({ message: "Arrangement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArrangementsByVendorId = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const workOrders = await WorkOrder.find({ vendor: vendorId }).select("_id");

    if (!workOrders.length) {
      return res
        .status(404)
        .json({ message: "No work orders found for this vendor." });
    }

    const workOrderIds = workOrders.map((wo) => wo._id);
    const itemDetails = await ItemDetail.find({
      workOrder_Id: { $in: workOrderIds },
    }).select("_id");

    if (!itemDetails.length) {
      return res
        .status(404)
        .json({ message: "No item details found for this vendor." });
    }

    const itemDetailIds = itemDetails.map((item) => item._id);

    const asns = await ASN.find({
      selectedItemDetails: { $in: itemDetailIds },
    }).select("_id");

    if (!asns.length) {
      return res
        .status(404)
        .json({ message: "No ASNs found for this vendor." });
    }

    const asnIds = asns.map((asn) => asn._id);
    const arrangements = await Arrangement.find({
      selectedASN: { $in: asnIds },
    }).populate({
      path: "selectedASN",
      populate: [
        {
          path: "vendor",
          model: "Vendor",
        },
        {
          path: "selectedItemDetails",
          model: "ItemDetail",
          populate: {
            path: "workOrder_Id",
            model: "WorkOrder",
            populate: {
              path: "vendor",
              model: "Vendor",
            },
          },
        },
      ],
    });

    if (!arrangements.length) {
      return res
        .status(404)
        .json({ message: "No arrangements found for this vendor." });
    }

    res.status(200).json({
      message: "Arrangements fetched successfully.",
      data: arrangements,
    });
  } catch (error) {
    console.error("Error fetching arrangements:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

