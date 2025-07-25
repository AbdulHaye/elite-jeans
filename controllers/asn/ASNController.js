const WorkOrder = require("../../models/workorder/WorkOrderModel");
const ASN = require("../../models/asn/ASNModel");
const Arrangement = require("../../models/arrangement/ArrangementModel");
const ItemDetail = require("../../models/itemdetail/ItemDetailModel");
const mongoose = require("mongoose");
const DesignComments = require("../../models/designcomment/DesignCommentModel");
const FitComments = require("../../models/fitcomment/FitCommentModel");

exports.getNextASNAndArrangementNumber = async (_req, res) => {
  try {
    // Fetch Latest ASN
    const lastASN = await ASN.aggregate([
      {
        $match: { asnNumber: /^ASN-\d+$/ },
      },
      {
        $project: {
          numericId: {
            $toInt: {
              $arrayElemAt: [{ $split: ["$asnNumber", "-"] }, 1],
            },
          },
        },
      },
      { $sort: { numericId: -1 } },
      { $limit: 1 },
    ]).exec();

    let nextASN = "ASN-1";
    if (lastASN.length > 0) {
      nextASN = `ASN-${lastASN[0].numericId + 1}`;
    }

    // Fetch Latest Arrangement
    const lastArrangement = await Arrangement.aggregate([
      {
        $match: { arrangementNumber: /^ARR-\d+$/ },
      },
      {
        $project: {
          numericId: {
            $toInt: {
              $arrayElemAt: [{ $split: ["$arrangementNumber", "-"] }, 1],
            },
          },
        },
      },
      { $sort: { numericId: -1 } },
      { $limit: 1 },
    ]).exec();

    let nextArrangement = "ARR-1";
    if (lastArrangement.length > 0) {
      nextArrangement = `ARR-${lastArrangement[0].numericId + 1}`;
    }

    res.status(200).json({
      nextASN,
      nextArrangement,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching next ASN and Arrangement numbers",
      error: error.message,
    });
  }
};

exports.createASN = async (req, res) => {
  try {
    const {
      asnNumber,
      loadingDate,
      vesselETD,
      vendor,
      portShippingForm,
      comments,
      selectedItemDetails, // This should be an array of objects with _id and quantity
    } = req.body;

    // Validate required fields
    if (
      !loadingDate ||
      !asnNumber ||
      !vesselETD ||
      !vendor ||
      !portShippingForm ||
      !selectedItemDetails ||
      selectedItemDetails.length === 0
    ) {
      return res.status(400).json({
        message:
          "All required fields must be provided, and selectedItemDetails must have at least one item",
      });
    }

    // Extract item IDs for validation
    const itemIds = selectedItemDetails.map(item => item._id);

    // Verify all item details exist and check their current status
    const items = await ItemDetail.find({ _id: { $in: itemIds } });
    if (items.length !== itemIds.length) {
      return res.status(400).json({
        message: "One or more selected items not found",
      });
    }

    // Check if any items are already in another ASN
    const existingASNs = await ASN.find({
      "selectedItemDetails._id": { $in: itemIds },
    });

    if (existingASNs.length > 0) {
      const usedItems = existingASNs.flatMap((asn) =>
        asn.selectedItemDetails.filter((item) =>
          itemIds.includes(item._id.toString())
        )
      );
      return res.status(400).json({
        message: `Some items are already used in other ASNs`,
        usedItems,
      });
    }

    // Verify all items are in "open" status before creating ASN
    const nonOpenItems = items.filter((item) => item.status !== "open");
    if (nonOpenItems.length > 0) {
      return res.status(400).json({
        message: `Some items are not in 'open' status`,
        invalidItems: nonOpenItems.map((item) => ({
          _id: item._id,
          currentStatus: item.status,
        })),
      });
    }

    // Validate quantities
    for (const selectedItem of selectedItemDetails) {
      const item = items.find(i => i._id.toString() === selectedItem._id);
      if (!item) continue;
      
      if (selectedItem.quantity > item.quantity) {
        return res.status(400).json({
          message: `Quantity for item ${item._id} exceeds available quantity`,
          invalidItem: item._id
        });
      }
    }

    // Create a single ASN with all selected items and their quantities
    const newASN = new ASN({
      asnNumber,
      loadingDate,
      vesselETD,
      vendor,
      portShippingForm,
      comments,
      selectedItemDetails, // Store with quantities
      status: "Ready to Ship",
      createdDate: new Date(),
    });

    // Update all selected items' status and quantities
    const bulkOps = selectedItemDetails.map((selectedItem) => {
      const item = items.find(i => i._id.toString() === selectedItem._id);
      if (!item) return null;

      // Calculate new available quantity
      const newAvailableQty = (item.available_quantity === null ? item.quantity : item.available_quantity) - selectedItem.quantity;

      return {
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              status: "Ready to Ship",
              shippingStatus: "Ready to Ship",
              available_quantity: newAvailableQty,
            },
          },
        },
      };
    }).filter(op => op !== null);

    await ItemDetail.bulkWrite(bulkOps);

    // Save the ASN
    const savedASN = await newASN.save();

    res.status(201).json({
      message: "ASN created successfully",
      data: savedASN,
    });
  } catch (error) {
    console.error("ASN Creation Error:", error);
    res.status(500).json({
      message: "Error creating ASN",
      error: error.message,
    });
  }
};

exports.updateASN = async (req, res) => {
  try {
    console.log('Starting ASN update process...');
    const { id } = req.params;
    const {
      asnNumber,
      loadingDate,
      vesselETD,
      vendor,
      portShippingForm,
      comments,
      selectedItemDetails,
    } = req.body;

    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('ASN ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ASN ID provided');
      return res.status(400).json({ message: "Invalid ASN ID" });
    }

    const existingASN = await ASN.findById(id);
    if (!existingASN) {
      console.log('ASN not found in database');
      return res.status(404).json({ message: "ASN not found" });
    }

    console.log('Existing ASN:', JSON.stringify(existingASN, null, 2));

    // Extract item IDs for validation
    const itemIds = selectedItemDetails.map(item => item._id);
    console.log('Selected item IDs:', itemIds);

    // Ensure all selected items exist
    const items = await ItemDetail.find({ _id: { $in: itemIds } });
    console.log('Found items:', items.map(i => i._id.toString()));

    if (items.length !== itemIds.length) {
      const missingItems = itemIds.filter(id => 
        !items.some(item => item._id.toString() === id)
      );
      console.log('Missing items:', missingItems);
      return res.status(400).json({
        message: "One or more selected items not found",
        missingItems
      });
    }

    // Create maps for existing and new quantities
    const existingItemsMap = new Map();
    existingASN.selectedItemDetails.forEach(item => {
      existingItemsMap.set(item._id.toString(), item.quantity);
    });
    console.log('Existing items map:', [...existingItemsMap.entries()]);

    const newQuantitiesMap = new Map();
    selectedItemDetails.forEach(item => {
      newQuantitiesMap.set(item._id.toString(), item.quantity);
    });
    console.log('New quantities map:', [...newQuantitiesMap.entries()]);

    // Find new items being added
    const newItems = selectedItemDetails.filter(
      (item) => !existingItemsMap.has(item._id.toString())
    );
    console.log('New items to add:', newItems);

    // Check if new items are already in another ASN
    if (newItems.length > 0) {
      const newItemIds = newItems.map(item => item._id);
      const existingASNs = await ASN.find({
        "selectedItemDetails._id": { $in: newItemIds },
        _id: { $ne: id },
      });

      if (existingASNs.length > 0) {
        const usedItems = existingASNs.flatMap((asn) =>
          asn.selectedItemDetails.filter((item) =>
            newItemIds.includes(item._id.toString())
          )
        );
        console.log('Items already in other ASNs:', usedItems);
        return res.status(400).json({
          message: "Some items are already used in other ASNs",
          usedItems,
        });
      }
    }

    // Validate quantities
    const quantityErrors = [];
    for (const selectedItem of selectedItemDetails) {
      const item = items.find(i => i._id.toString() === selectedItem._id.toString());
      if (!item) continue;
      
      const existingQuantity = existingItemsMap.get(selectedItem._id.toString()) || 0;
      const newQuantity = selectedItem.quantity;
      const quantityDifference = newQuantity - existingQuantity;
      
      console.log(`Processing item ${selectedItem._id}:`);
      console.log(`- Existing quantity in ASN: ${existingQuantity}`);
      console.log(`- New quantity: ${newQuantity}`);
      console.log(`- Quantity difference: ${quantityDifference}`);
      console.log(`- Current available quantity: ${item.available_quantity}`);

      if (quantityDifference > 0) {
        const availableQty = item.available_quantity === null ? item.quantity : item.available_quantity;
        if (quantityDifference > availableQty) {
          console.log(`Quantity error for item ${selectedItem._id}: Requested ${quantityDifference} but only ${availableQty} available`);
          quantityErrors.push({
            itemId: selectedItem._id,
            requested: quantityDifference,
            available: availableQty
          });
        }
      }
    }

    if (quantityErrors.length > 0) {
      console.log('Quantity validation errors:', quantityErrors);
      return res.status(400).json({
        message: "Quantity validation failed",
        errors: quantityErrors
      });
    }

    // Prepare bulk operations
    const bulkOps = [];
    console.log('Preparing bulk operations...');

    // Process removed items
    const removedItems = existingASN.selectedItemDetails.filter(
      existingItem => !newQuantitiesMap.has(existingItem._id.toString())
    );
    console.log('Items to remove:', removedItems);

    removedItems.forEach(removedItem => {
      bulkOps.push({
        updateOne: {
          filter: { _id: removedItem._id },
          update: {
            $set: {
              status: "open",
              shippingStatus: "open",
            },
            $inc: {
              available_quantity: removedItem.quantity
            }
          }
        }
      });
      console.log(`Prepared restore operation for item ${removedItem._id}: +${removedItem.quantity}`);
    });

    // Process updated and new items
    selectedItemDetails.forEach(selectedItem => {
      const existingQuantity = existingItemsMap.get(selectedItem._id.toString()) || 0;
      const newQuantity = selectedItem.quantity;
      const quantityDifference = newQuantity - existingQuantity;

      if (quantityDifference !== 0 || existingQuantity === 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: selectedItem._id },
            update: {
              $set: {
                status: "Ready to Ship",
                shippingStatus: "Ready to Ship",
              },
              $inc: {
                available_quantity: -quantityDifference
              }
            }
          }
        });
        console.log(`Prepared update operation for item ${selectedItem._id}: ${quantityDifference > 0 ? '-' : '+'}${Math.abs(quantityDifference)}`);
      }
    });

    console.log('Total bulk operations:', bulkOps.length);
    console.log('Bulk operations details:', JSON.stringify(bulkOps, null, 2));

    // Execute bulk operations
    if (bulkOps.length > 0) {
      console.log('Executing bulk write...');
      const bulkResult = await ItemDetail.bulkWrite(bulkOps);
      console.log('Bulk write result:', bulkResult);
    } else {
      console.log('No bulk operations to execute');
    }

    // Update the ASN document
    console.log('Updating ASN document...');
    const updatedASN = await ASN.findByIdAndUpdate(
      id,
      {
        asnNumber,
        loadingDate,
        vesselETD,
        vendor,
        portShippingForm,
        comments,
        selectedItemDetails,
        status: "Ready to Ship",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    console.log('ASN update successful:', JSON.stringify(updatedASN, null, 2));
    res.status(200).json({
      message: "ASN updated successfully",
      data: updatedASN,
    });

  } catch (error) {
    console.error('Error in updateASN:', error);
    res.status(500).json({
      message: "Error updating ASN",
      error: error.message,
      stack: error.stack
    });
  }
};

// ----------------------------------------------------------------------------------------------------------------------------------

exports.getAllASNs = async (_req, res) => {
  try {
    // First get all ASNs with populated data
    const asns = await ASN.find()
      .populate("vendor")
      .populate({
        path: "selectedItemDetails",
        populate: [
          {
            path: "class_Id",
            model: "Class",
          },
          {
            path: "client_Id",
            model: "Client",
          },
          {
            path: "color_Id",
            model: "Color",
          },
          {
            path: "workOrder_Id",
            model: "WorkOrder",
            populate: [
              {
                path: "vendor",
                model: "Vendor",
              },
              {
                path: "itemType",
                model: "ItemType",
              },
            ],
          },
          // {
          //   path: "size_break",
          //   model: "SizeBreak"
          // },
          // {
          //   path: "size_scale",
          //   model: "SizeScale",
          //   options: {
          //     transform: (doc) => {
          //       if (!doc) return null;
          //       return doc;
          //     }
          //   }
          // },
        ],
      })
      .lean()
      .exec();

    // Debug: Check the first ASN's structure
    console.log("First ASN structure:", JSON.stringify(asns[0], null, 2));

    // Get all valid work order IDs from the ASNs
    const workOrderIds = asns
      .flatMap((asn) =>
        (asn.selectedItemDetails || [])
          .filter((item) => item?.workOrder_Id?._id)
          .map((item) => item.workOrder_Id._id)
      )
      .filter((id) => {
        // Only keep valid MongoDB ObjectIds
        const isValid = mongoose.Types.ObjectId.isValid(id);
        if (!isValid) {
          console.warn(`Invalid workOrder_Id found: ${id}`);
        }
        return isValid;
      });

    console.log("Valid Work Order IDs:", workOrderIds);

    if (workOrderIds.length === 0) {
      console.log("No valid work order IDs found in ASNs");
      return res.status(200).json({
        message: "ASNs retrieved successfully (no work orders found)",
        data: asns.map((asn) => ({
          ...asn,
          designStatusDate: null,
          latestDesignApprovalStatus: null,
          latestDesignApprovalDate: null,
          designComments: null,
          fitStatusDate: null,
          latestFitApprovalStatus: null,
          latestFitApprovalDate: null,
          fitComments: null,
        })),
      });
    }

    // Bulk fetch all design and fit comments for these work orders
    const [allDesignComments, allFitComments] = await Promise.all([
      DesignComments.find({ workOrder_Id: { $in: workOrderIds } })
        .sort({ updatedAt: -1 })
        .lean(),
      FitComments.find({ workOrder_Id: { $in: workOrderIds } })
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    console.log(
      `Found ${allDesignComments.length} design comments and ${allFitComments.length} fit comments`
    );

    // Create maps for quick lookup of comments by workOrderId
    const latestDesignComments = {};
    const latestFitComments = {};

    allDesignComments.forEach((comment) => {
      const workOrderId = comment.workOrder_Id?.toString();
      if (workOrderId && !latestDesignComments[workOrderId]) {
        latestDesignComments[workOrderId] = comment;
      }
    });

    allFitComments.forEach((comment) => {
      const workOrderId = comment.workOrder_Id?.toString();
      if (workOrderId && !latestFitComments[workOrderId]) {
        latestFitComments[workOrderId] = comment;
      }
    });

    // Process each ASN with comments
    const asnsWithComments = asns.map((asn) => {
      const asnCopy = { ...asn };

      // Initialize comment fields
      asnCopy.designStatusDate = null;
      asnCopy.latestDesignApprovalStatus = null;
      asnCopy.latestDesignApprovalDate = null;
      asnCopy.designComments = null;
      asnCopy.fitStatusDate = null;
      asnCopy.latestFitApprovalStatus = null;
      asnCopy.latestFitApprovalDate = null;
      asnCopy.fitComments = null;

      // Process each selected item in the ASN
      if (asnCopy.selectedItemDetails) {
        asnCopy.selectedItemDetails.forEach((item) => {
          if (item?.workOrder_Id?._id) {
            const workOrderId = item.workOrder_Id._id.toString();

            // Process design comments
            const designComment = latestDesignComments[workOrderId];
            if (designComment) {
              const designStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
              let latestDesignApprovalStatus = null;
              let latestDesignApprovalDate = null;

              designStages.forEach((stage) => {
                if (designComment[stage]?.approval_status) {
                  const stageDate = new Date(designComment[stage].date);
                  if (
                    !latestDesignApprovalDate ||
                    stageDate > latestDesignApprovalDate
                  ) {
                    latestDesignApprovalStatus =
                      designComment[stage].approval_status;
                    latestDesignApprovalDate = stageDate;
                  }
                }
              });

              asnCopy.designStatusDate = designComment.updatedAt;
              asnCopy.latestDesignApprovalStatus = latestDesignApprovalStatus;
              asnCopy.latestDesignApprovalDate = latestDesignApprovalDate;
              asnCopy.designComments = designComment.comments || null;
            }

            // Process fit comments
            const fitComment = latestFitComments[workOrderId];
            if (fitComment) {
              const fitStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
              let latestFitApprovalStatus = null;
              let latestFitApprovalDate = null;

              fitStages.forEach((stage) => {
                if (fitComment[stage]?.approval_status) {
                  const stageDate = new Date(fitComment[stage].date);
                  if (
                    !latestFitApprovalDate ||
                    stageDate > latestFitApprovalDate
                  ) {
                    latestFitApprovalStatus = fitComment[stage].approval_status;
                    latestFitApprovalDate = stageDate;
                  }
                }
              });

              // Fallback to root level approval_status
              if (fitComment.approval_status) {
                const commentDate = new Date(fitComment.updatedAt);
                if (
                  !latestFitApprovalDate ||
                  commentDate > latestFitApprovalDate
                ) {
                  latestFitApprovalStatus = fitComment.approval_status;
                  latestFitApprovalDate = commentDate;
                }
              }

              asnCopy.fitStatusDate = fitComment.updatedAt;
              asnCopy.latestFitApprovalStatus = latestFitApprovalStatus;
              asnCopy.latestFitApprovalDate = latestFitApprovalDate;
              asnCopy.fitComments = fitComment.comments || null;
            }
          }
        });
      }

      return asnCopy;
    });

    res.status(200).json({
      message: "ASNs retrieved successfully with design and fit comments",
      data: asnsWithComments,
    });
  } catch (error) {
    console.error("Error retrieving ASNs:", error);
    res.status(500).json({
      message: "Error retrieving ASNs",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------------------------------------------------------------------------

exports.getASNById = async (req, res) => {
  try {
    const asn = await ASN.findById(req.params.id)
      .populate("selectedItemDetails")
      .populate("vendor")
      .exec();

    if (!asn) {
      return res.status(404).json({ message: "ASN not found" });
    }

    res.status(200).json({ data: asn });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving ASN",
      error: error.message,
    });
  }
};

// -----------------------------------------------------------------------------------------------------------------------------------------

// exports.updateASN = async (req, res) => {
//   try {
//     const { status, selectedItemDetails } = req.body;
//     const existingASN = await ASN.findById(req.params.id);

//     if (!existingASN) {
//       return res.status(404).json({ message: "ASN not found" });
//     }
//     const updatedASN = await ASN.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
//     if (
//       status &&
//       ["Shipped", "Delivered"].includes(status) &&
//       selectedItemDetails
//     ) {
//       await ItemDetail.updateMany(
//         { _id: { $in: selectedItemDetails } },
//         { $set: { status } }
//       );
//     }

//     res.status(200).json({
//       message: `ASN updated successfully.${["Shipped", "Delivered"].includes(status) ? ` ItemDetails updated to '${status}'.` : ""}`,
//       data: updatedASN,
//     });
//   } catch (error) {
//     console.error("Error updating ASN:", error);
//     res.status(500).json({
//       message: "Error updating ASN",
//       error: error.message,
//     });
//   }
// };

// exports.getItemDetailsByVendorForShipping = async (req, res) => {
//     try {
//       const { vendorId } = req.params;

//       if (!vendorId) {
//         return res.status(400).json({ message: "Vendor ID is required." });
//       }

//       const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
//       const workOrders = await WorkOrder.find({ vendor: vendorObjectId }).select('_id');

//       if (!workOrders.length) {
//         return res.status(404).json({ message: "No work orders found for this vendor." });
//       }

//       const workOrderIds = workOrders.map((wo) => wo._id);
//       const itemDetails = await ItemDetail.find({
//         workOrder_Id: { $in: workOrderIds },
//         status: "Open",
//       })
//         .populate({
//           path: 'workOrder_Id',
//           populate: {
//             path: 'pictures',
//             model: 'Picture',
//             select: 'imageName imageTitle category imageUrl active',
//           },
//         })
//         .populate('client_Id')
//         .populate('color_Id')
//         .populate({
//           path: 'work_order_quotes.vendor',
//           model: 'Vendor',
//           select: 'name email picture',
//         });

//       if (!itemDetails.length) {
//         return res.status(404).json({ message: "No item details found for this vendor." });
//       }

//       res.status(200).json({
//         message: "Item details fetched successfully.",
//         data: itemDetails,
//       });

//     } catch (err) {
//       console.error("Error fetching item details:", err);
//       res.status(500).json({
//         message: "Server error.",
//         error: err.message || "An error occurred while processing the request.",
//       });
//     }
// };

// exports.getItemDetailsByVendorForShipping = async (req, res) => {
//   try {
//     let { vendorId } = req.params;

//     if (req.user.role === "vendoruser") {
//       vendorId = req.user.vendor;
//     }

//     if (!vendorId) {
//       return res.status(400).json({ message: "Vendor ID is required." });
//     }

//     const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
//     const workOrders = await WorkOrder.find({ vendor: vendorObjectId }).select('_id');

//     if (!workOrders.length) {
//       return res.status(404).json({ message: "No work orders found for this vendor." });
//     }

//     const workOrderIds = workOrders.map((wo) => wo._id);
//     const itemDetails = await ItemDetail.find({
//       workOrder_Id: { $in: workOrderIds },
//       status: "Open",
//     })
//       .populate({
//         path: 'workOrder_Id',
//         populate: {
//           path: 'pictures',
//           model: 'Picture',
//           select: 'imageName imageTitle category imageUrl active',
//         },
//       })
//       .populate('client_Id')
//       .populate('color_Id')
//       .populate({
//         path: 'work_order_quotes.vendor',
//         model: 'Vendor',
//         select: 'name email picture',
//       });

//     if (!itemDetails.length) {
//       return res.status(404).json({ message: "No item details found for this vendor." });
//     }

//     res.status(200).json({
//       message: "Item details fetched successfully.",
//       data: itemDetails,
//     });

//   } catch (err) {
//     console.error("Error fetching item details:", err);
//     res.status(500).json({
//       message: "Server error.",
//       error: err.message || "An error occurred while processing the request.",
//     });
//   }
// };

//................open status

// exports.getItemDetailsByVendorForShipping = async (req, res) => {
//   try {
//     const { vendorId } = req.params;
//     console.log("Received vendorId:", vendorId);

//     if (!vendorId) {
//       console.log("Missing vendor ID.");
//       return res.status(400).json({ message: "Vendor ID is required." });
//     }

//     const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
//     console.log("Converted vendorObjectId:", vendorObjectId);

//     // Find all work orders for this vendor
//     const workOrders = await WorkOrder.find({ vendor: vendorObjectId }).select(
//       "_id"
//     );
//     console.log("Fetched workOrders:", workOrders);

//     if (!workOrders.length) {
//       console.log("No work orders found for this vendor.");
//       return res
//         .status(404)
//         .json({ message: "No work orders found for this vendor." });
//     }

//     const workOrderIds = workOrders.map((wo) => wo._id);
//     console.log("Extracted workOrderIds:", workOrderIds);

//     // Fetch item details and populate vendor inside workOrder_Id
//     const itemDetails = await ItemDetail.find({
//       workOrder_Id: { $in: workOrderIds },
//       status: { $regex: /^open$/i },
//     })
//       .populate({
//         path: "workOrder_Id",
//         populate: [
//           {
//             path: "pictures",
//             model: "Picture",
//             select: "imageName imageTitle category imageUrl active",
//           },
//           {
//             path: "vendor",
//             model: "Vendor",
//             select: "name email picture",
//           },
//         ],
//       })
//       .populate("client_Id")
//       .populate("color_Id")
//       .populate({
//         path: "work_order_quotes.vendor",
//         model: "Vendor",
//         select: "name email picture",
//       });

//     console.log("Fetched itemDetails:", itemDetails);

//     if (!itemDetails.length) {
//       console.log("No item details found for this vendor.");
//       return res
//         .status(404)
//         .json({ message: "No item details found for this vendor." });
//     }

//     // Get all unique style numbers for the item details
//     const styleNumbers = [
//       ...new Set(itemDetails.map((item) => item.stylenumber)),
//     ];

//     // Bulk fetch all design and fit comments for these work orders
//     const [allDesignComments, allFitComments] = await Promise.all([
//       DesignComments.find({
//         workOrder_Id: { $in: workOrderIds },
//       }).sort({ updatedAt: -1 }),
//       FitComments.find({
//         workOrder_Id: { $in: workOrderIds },
//       }).sort({ updatedAt: -1 }),
//     ]);

//     // Create maps for quick lookup of comments by workOrderId and styleNumber
//     const designCommentsMap = {};
//     const fitCommentsMap = {};

//     // Process design comments
//     allDesignComments.forEach((comment) => {
//       const key = `${comment.workOrder_Id}_${comment.stylenumber || ""}`;
//       if (
//         !designCommentsMap[key] ||
//         comment.updatedAt > designCommentsMap[key].updatedAt
//       ) {
//         designCommentsMap[key] = comment;
//       }
//     });

//     // Process fit comments
//     allFitComments.forEach((comment) => {
//       const key = `${comment.workOrder_Id}_${comment.stylenumber || ""}`;
//       if (
//         !fitCommentsMap[key] ||
//         comment.updatedAt > fitCommentsMap[key].updatedAt
//       ) {
//         fitCommentsMap[key] = comment;
//       }
//     });

//     // Process each item detail with comments
//     const itemDetailsWithStatus = await Promise.all(
//       itemDetails.map(async (itemDetail) => {
//         const itemDetailObj = itemDetail.toObject();
//         const workOrderId = itemDetail.workOrder_Id._id;
//         const styleNumber = itemDetail.stylenumber;

//         // Create keys for lookup
//         const specificKey = `${workOrderId}_${styleNumber}`;
//         const generalKey = `${workOrderId}_`;

//         // Process design comments
//         const designComment =
//           designCommentsMap[specificKey] || designCommentsMap[generalKey];
//         if (designComment) {
//           const designStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
//           let latestDesignApprovalStatus = null;
//           let latestDesignApprovalDate = null;

//           designStages.forEach((stage) => {
//             if (
//               designComment[stage]?.approval_status &&
//               (!latestDesignApprovalDate ||
//                 designComment[stage].date > latestDesignApprovalDate)
//             ) {
//               latestDesignApprovalStatus = designComment[stage].approval_status;
//               latestDesignApprovalDate = designComment[stage].date;
//             }
//           });

//           itemDetailObj.designStatusDate = designComment.updatedAt;
//           itemDetailObj.latestDesignApprovalStatus = latestDesignApprovalStatus;
//           itemDetailObj.latestDesignApprovalDate = latestDesignApprovalDate;
//           itemDetailObj.designComments = designComment.comments || null;
//         } else {
//           itemDetailObj.designStatusDate = null;
//           itemDetailObj.latestDesignApprovalStatus = null;
//           itemDetailObj.latestDesignApprovalDate = null;
//           itemDetailObj.designComments = null;
//         }

//         // Process fit comments
//         const fitComment =
//           fitCommentsMap[specificKey] || fitCommentsMap[generalKey];
//         if (fitComment) {
//           const fitStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
//           let latestFitApprovalStatus = null;
//           let latestFitApprovalDate = null;

//           fitStages.forEach((stage) => {
//             if (
//               fitComment[stage]?.approval_status &&
//               (!latestFitApprovalDate ||
//                 fitComment[stage].date > latestFitApprovalDate)
//             ) {
//               latestFitApprovalStatus = fitComment[stage].approval_status;
//               latestFitApprovalDate = fitComment[stage].date;
//             }
//           });

//           // Check root level approval_status if it exists
//           if (
//             fitComment.approval_status &&
//             (!latestFitApprovalDate ||
//               fitComment.updatedAt > latestFitApprovalDate)
//           ) {
//             latestFitApprovalStatus = fitComment.approval_status;
//             latestFitApprovalDate = fitComment.updatedAt;
//           }

//           itemDetailObj.fitStatusDate = fitComment.updatedAt;
//           itemDetailObj.latestFitApprovalStatus = latestFitApprovalStatus;
//           itemDetailObj.latestFitApprovalDate = latestFitApprovalDate;
//           itemDetailObj.fitComments = fitComment.comments || null;
//         } else {
//           itemDetailObj.fitStatusDate = null;
//           itemDetailObj.latestFitApprovalStatus = null;
//           itemDetailObj.latestFitApprovalDate = null;
//           itemDetailObj.fitComments = null;
//         }

//         return itemDetailObj;
//       })
//     );

//     console.log("Sending response with item details...");
//     res.status(200).json({
//       message: "Item details fetched successfully.",
//       data: itemDetailsWithStatus,
//     });
//   } catch (err) {
//     console.error("Error fetching item details:", err);
//     res.status(500).json({
//       message: "Server error.",
//       error: err.message || "An error occurred while processing the request.",
//     });
//   }
// };

//.............fetch data with all status

// exports.getItemDetailsByVendorForShipping = async (req, res) => {
//   try {
//     const { vendorId } = req.params;
//     console.log("Received vendorId:", vendorId);

//     if (!vendorId) {
//       console.log("Missing vendor ID.");
//       return res.status(400).json({ message: "Vendor ID is required." });
//     }

//     const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
//     console.log("Converted vendorObjectId:", vendorObjectId);

//     // Find all work orders for this vendor
//     const workOrders = await WorkOrder.find({ vendor: vendorObjectId }).select(
//       "_id"
//     );
//     console.log("Fetched workOrders:", workOrders);

//     if (!workOrders.length) {
//       console.log("No work orders found for this vendor.");
//       return res
//         .status(404)
//         .json({ message: "No work orders found for this vendor." });
//     }

//     const workOrderIds = workOrders.map((wo) => wo._id);
//     console.log("Extracted workOrderIds:", workOrderIds);

//     // Fetch item details (removed the status filter)
//     const itemDetails = await ItemDetail.find({
//       workOrder_Id: { $in: workOrderIds },
//     })
//       .populate({
//         path: "workOrder_Id",
//         populate: [
//           {
//             path: "pictures",
//             model: "Picture",
//             select: "imageName imageTitle category imageUrl active",
//           },
//           {
//             path: "vendor",
//             model: "Vendor",
//             select: "name email picture",
//           },
//         ],
//       })
//       .populate("client_Id")
//       .populate("color_Id")
//       .populate({
//         path: "work_order_quotes.vendor",
//         model: "Vendor",
//         select: "name email picture",
//       });

//     console.log("Fetched itemDetails:", itemDetails);

//     if (!itemDetails.length) {
//       console.log("No item details found for this vendor.");
//       return res
//         .status(404)
//         .json({ message: "No item details found for this vendor." });
//     }

//     // Get all unique style numbers for the item details
//     const styleNumbers = [
//       ...new Set(itemDetails.map((item) => item.stylenumber)),
//     ];

//     // Bulk fetch all design and fit comments for these work orders
//     const [allDesignComments, allFitComments] = await Promise.all([
//       DesignComments.find({
//         workOrder_Id: { $in: workOrderIds },
//       }).sort({ updatedAt: -1 }),
//       FitComments.find({
//         workOrder_Id: { $in: workOrderIds },
//       }).sort({ updatedAt: -1 }),
//     ]);

//     // Create maps for quick lookup of comments by workOrderId and styleNumber
//     const designCommentsMap = {};
//     const fitCommentsMap = {};

//     // Process design comments
//     allDesignComments.forEach((comment) => {
//       const key = `${comment.workOrder_Id}_${comment.stylenumber || ""}`;
//       if (
//         !designCommentsMap[key] ||
//         comment.updatedAt > designCommentsMap[key].updatedAt
//       ) {
//         designCommentsMap[key] = comment;
//       }
//     });

//     // Process fit comments
//     allFitComments.forEach((comment) => {
//       const key = `${comment.workOrder_Id}_${comment.stylenumber || ""}`;
//       if (
//         !fitCommentsMap[key] ||
//         comment.updatedAt > fitCommentsMap[key].updatedAt
//       ) {
//         fitCommentsMap[key] = comment;
//       }
//     });

//     // Process each item detail with comments
//     const itemDetailsWithStatus = await Promise.all(
//       itemDetails.map(async (itemDetail) => {
//         const itemDetailObj = itemDetail.toObject();
//         const workOrderId = itemDetail.workOrder_Id._id;
//         const styleNumber = itemDetail.stylenumber;

//         // Create keys for lookup
//         const specificKey = `${workOrderId}_${styleNumber}`;
//         const generalKey = `${workOrderId}_`;

//         // Process design comments
//         const designComment =
//           designCommentsMap[specificKey] || designCommentsMap[generalKey];
//         if (designComment) {
//           const designStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
//           let latestDesignApprovalStatus = null;
//           let latestDesignApprovalDate = null;

//           designStages.forEach((stage) => {
//             if (
//               designComment[stage]?.approval_status &&
//               (!latestDesignApprovalDate ||
//                 designComment[stage].date > latestDesignApprovalDate)
//             ) {
//               latestDesignApprovalStatus = designComment[stage].approval_status;
//               latestDesignApprovalDate = designComment[stage].date;
//             }
//           });

//           itemDetailObj.designStatusDate = designComment.updatedAt;
//           itemDetailObj.latestDesignApprovalStatus = latestDesignApprovalStatus;
//           itemDetailObj.latestDesignApprovalDate = latestDesignApprovalDate;
//           itemDetailObj.designComments = designComment.comments || null;
//         } else {
//           itemDetailObj.designStatusDate = null;
//           itemDetailObj.latestDesignApprovalStatus = null;
//           itemDetailObj.latestDesignApprovalDate = null;
//           itemDetailObj.designComments = null;
//         }

//         // Process fit comments
//         const fitComment =
//           fitCommentsMap[specificKey] || fitCommentsMap[generalKey];
//         if (fitComment) {
//           const fitStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
//           let latestFitApprovalStatus = null;
//           let latestFitApprovalDate = null;

//           fitStages.forEach((stage) => {
//             if (
//               fitComment[stage]?.approval_status &&
//               (!latestFitApprovalDate ||
//                 fitComment[stage].date > latestFitApprovalDate)
//             ) {
//               latestFitApprovalStatus = fitComment[stage].approval_status;
//               latestFitApprovalDate = fitComment[stage].date;
//             }
//           });

//           // Check root level approval_status if it exists
//           if (
//             fitComment.approval_status &&
//             (!latestFitApprovalDate ||
//               fitComment.updatedAt > latestFitApprovalDate)
//           ) {
//             latestFitApprovalStatus = fitComment.approval_status;
//             latestFitApprovalDate = fitComment.updatedAt;
//           }

//           itemDetailObj.fitStatusDate = fitComment.updatedAt;
//           itemDetailObj.latestFitApprovalStatus = latestFitApprovalStatus;
//           itemDetailObj.latestFitApprovalDate = latestFitApprovalDate;
//           itemDetailObj.fitComments = fitComment.comments || null;
//         } else {
//           itemDetailObj.fitStatusDate = null;
//           itemDetailObj.latestFitApprovalStatus = null;
//           itemDetailObj.latestFitApprovalDate = null;
//           itemDetailObj.fitComments = null;
//         }

//         return itemDetailObj;
//       })
//     );

//     console.log("Sending response with item details...");
//     res.status(200).json({
//       message: "Item details fetched successfully.",
//       data: itemDetailsWithStatus,
//     });
//   } catch (err) {
//     console.error("Error fetching item details:", err);
//     res.status(500).json({
//       message: "Server error.",
//       error: err.message || "An error occurred while processing the request.",
//     });
//   }
// };





//.............for shipping status updated one 

exports.getItemDetailsByVendorForShipping = async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log("Received vendorId:", vendorId);

    if (!vendorId) {
      console.log("Missing vendor ID.");
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    console.log("Converted vendorObjectId:", vendorObjectId);

    // Find all work orders for this vendor
    const workOrders = await WorkOrder.find({ vendor: vendorObjectId }).select(
      "_id"
    );
    console.log("Fetched workOrders:", workOrders);

    if (!workOrders.length) {
      console.log("No work orders found for this vendor.");
      return res
        .status(404)
        .json({ message: "No work orders found for this vendor." });
    }

    const workOrderIds = workOrders.map((wo) => wo._id);
    console.log("Extracted workOrderIds:", workOrderIds);

    // Fetch item details (removed the status filter)
    const itemDetails = await ItemDetail.find({
      workOrder_Id: { $in: workOrderIds },
    })
      .populate({
        path: "workOrder_Id",
        populate: [
          {
            path: "pictures",
            model: "Picture",
            select: "imageName imageTitle category imageUrl active",
          },
          {
            path: "vendor",
            model: "Vendor",
            select: "name email picture",
          },
        ],
      })
      .populate("client_Id")
      .populate("color_Id")
      .populate({
        path: "work_order_quotes.vendor",
        model: "Vendor",
        select: "name email picture",
      });

    console.log("Fetched itemDetails:", itemDetails);

    if (!itemDetails.length) {
      console.log("No item details found for this vendor.");
      return res
        .status(404)
        .json({ message: "No item details found for this vendor." });
    }

    // Get all unique style numbers for the item details
    const styleNumbers = [
      ...new Set(itemDetails.map((item) => item.stylenumber)),
    ];

    // Bulk fetch all design and fit comments for these work orders
    const [allDesignComments, allFitComments] = await Promise.all([
      DesignComments.find({
        workOrder_Id: { $in: workOrderIds },
      }).sort({ updatedAt: -1 }),
      FitComments.find({
        workOrder_Id: { $in: workOrderIds },
      }).sort({ updatedAt: -1 }),
    ]);

    // Create maps for quick lookup of comments by workOrderId and styleNumber
    const designCommentsMap = {};
    const fitCommentsMap = {};

    // Process design comments
    allDesignComments.forEach((comment) => {
      const key = `${comment.workOrder_Id}_${comment.stylenumber || ""}`;
      if (
        !designCommentsMap[key] ||
        comment.updatedAt > designCommentsMap[key].updatedAt
      ) {
        designCommentsMap[key] = comment;
      }
    });

    // Process fit comments
    allFitComments.forEach((comment) => {
      const key = `${comment.workOrder_Id}_${comment.stylenumber || ""}`;
      if (
        !fitCommentsMap[key] ||
        comment.updatedAt > fitCommentsMap[key].updatedAt
      ) {
        fitCommentsMap[key] = comment;
      }
    });

    // Process each item detail with comments
    const itemDetailsWithStatus = await Promise.all(
      itemDetails.map(async (itemDetail) => {
        const itemDetailObj = itemDetail.toObject();
        const workOrderId = itemDetail.workOrder_Id._id;
        const styleNumber = itemDetail.stylenumber;

        // Create keys for lookup
        const specificKey = `${workOrderId}_${styleNumber}`;
        const generalKey = `${workOrderId}_`;

        // Process design comments
        const designComment =
          designCommentsMap[specificKey] || designCommentsMap[generalKey];
        if (designComment) {
          const designStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
          let latestDesignApprovalStatus = null;
          let latestDesignApprovalDate = null;

          designStages.forEach((stage) => {
            if (
              designComment[stage]?.approval_status &&
              (!latestDesignApprovalDate ||
                designComment[stage].date > latestDesignApprovalDate)
            ) {
              latestDesignApprovalStatus = designComment[stage].approval_status;
              latestDesignApprovalDate = designComment[stage].date;
            }
          });

          itemDetailObj.designStatusDate = designComment.updatedAt;
          itemDetailObj.latestDesignApprovalStatus = latestDesignApprovalStatus;
          itemDetailObj.latestDesignApprovalDate = latestDesignApprovalDate;
          itemDetailObj.designComments = designComment.comments || null;
        } else {
          itemDetailObj.designStatusDate = null;
          itemDetailObj.latestDesignApprovalStatus = null;
          itemDetailObj.latestDesignApprovalDate = null;
          itemDetailObj.designComments = null;
        }

        // Process fit comments
        const fitComment =
          fitCommentsMap[specificKey] || fitCommentsMap[generalKey];
        if (fitComment) {
          const fitStages = ["PP1", "PP2", "PP3", "Shipping", "Other"];
          let latestFitApprovalStatus = null;
          let latestFitApprovalDate = null;

          fitStages.forEach((stage) => {
            if (
              fitComment[stage]?.approval_status &&
              (!latestFitApprovalDate ||
                fitComment[stage].date > latestFitApprovalDate)
            ) {
              latestFitApprovalStatus = fitComment[stage].approval_status;
              latestFitApprovalDate = fitComment[stage].date;
            }
          });

          // Check root level approval_status if it exists
          if (
            fitComment.approval_status &&
            (!latestFitApprovalDate ||
              fitComment.updatedAt > latestFitApprovalDate)
          ) {
            latestFitApprovalStatus = fitComment.approval_status;
            latestFitApprovalDate = fitComment.updatedAt;
          }

          itemDetailObj.fitStatusDate = fitComment.updatedAt;
          itemDetailObj.latestFitApprovalStatus = latestFitApprovalStatus;
          itemDetailObj.latestFitApprovalDate = latestFitApprovalDate;
          itemDetailObj.fitComments = fitComment.comments || null;
        } else {
          itemDetailObj.fitStatusDate = null;
          itemDetailObj.latestFitApprovalStatus = null;
          itemDetailObj.latestFitApprovalDate = null;
          itemDetailObj.fitComments = null;
        }

        // NEW: Get ASN and Arrangement data for shipping status
        // Find ASN that contains this item detail
        const asn = await ASN.findOne({ 
          selectedItemDetails: itemDetail._id 
        });
        
        if (asn) {
          itemDetailObj.asn = {
            _id: asn._id,
            asnNumber: asn.asnNumber,
            status: asn.status,
            loadingDate: asn.loadingDate,
            vesselETD: asn.vesselETD,
            arrivalDate: asn.arrivalDate,
            shipDate: asn.shipDate,
            portShippingForm: asn.portShippingForm,
            comments: asn.comments,
            selectedItemDetails: asn.selectedItemDetails,
          };
          
          // Find arrangement that references this ASN
          const arrangement = await Arrangement.findOne({
            selectedASN: asn._id
          });
          
          if (arrangement) {
            itemDetailObj.arrangement = {
              _id: arrangement._id,
              arrangementNumber: arrangement.arrangementNumber,
              shipDate: arrangement.shipDate,
              arrivalDate: arrangement.arrivalDate,
              destination: arrangement.destination,
              shippingStatus: arrangement.shippingStatus,
              bookingNumber: arrangement.bookingNumber,
              createdAt: arrangement.createdAt
            };
            // Use the arrangement's shippingStatus as the primary status
            itemDetailObj.shippingStatus = arrangement.shippingStatus;
          } else {
            itemDetailObj.arrangement = null;
            // Fall back to ASN status if no arrangement exists
            itemDetailObj.shippingStatus = asn.status;
          }
        } else {
          itemDetailObj.arrangement = null;
          itemDetailObj.asn = null;
          // Fall back to the item's shippingStatus if no ASN exists
          itemDetailObj.shippingStatus = itemDetail.shippingStatus || itemDetail.status;
        }

        return itemDetailObj;
      })
    );

    console.log("Sending response with item details...");
    res.status(200).json({
      message: "Item details fetched successfully.",
      data: itemDetailsWithStatus,
    });
  } catch (err) {
    console.error("Error fetching item details:", err);
    res.status(500).json({
      message: "Server error.",
      error: err.message || "An error occurred while processing the request.",
    });
  }
};