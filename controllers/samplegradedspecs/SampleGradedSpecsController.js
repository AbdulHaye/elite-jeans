const mongoose = require("mongoose");
const SampleGradedSpecs = require("../../models/samplegradedspecs/SampleGradedSpecsModel.js");
const CopiedSampleGradedSpecs = require("../../models/copiedsamplegradedspecs/CopiedSampleGradedSpecsModel.js");
const SampleRequest = require("../../models/samplerequest/SampleRequestModel.js");
const SpecTemPoms = require("../../models/specstemplatepom/SpecsTemplatePomModel.js");
const CopiedSpecTemPoms = require("../../models/copiedspecstemplatepom/CopiedSpecsTemplatePomModel.js");
const WorkOrder = require('./../../models/workorder/WorkOrderModel.js'); 

exports.createSampleGradedSpecs = async (req, res) => {
  try {
    const {
      techpack_Id,
      item_type_Id,
      size_range,
      spec_template_Id, // Required for fetching POMs
      workOrder_Id,
      style_nummber,
      fabric_content,
      customer_or_brand,
      size,
      garment_specs_details,
      DesignDate,
      IntialDate,
      FirstPPdate,
      Rev1date,
      SecondPPdate,
      Rev2date,
      ThirdPPdate,
      Finaldate,
      Shipdate,
    } = req.body;

    const newSampleGradedSpecs = new SampleGradedSpecs({
      techpack_Id,
      item_type_Id,
      size_range,
      spec_template_Id,
      workOrder_Id,
      style_nummber,
      fabric_content,
      customer_or_brand,
      size,
      garment_specs_details,
      DesignDate,
      IntialDate,
      FirstPPdate,
      Rev1date,
      SecondPPdate,
      Rev2date,
      ThirdPPdate,
      Finaldate,
      Shipdate,
    });

    const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
    const sampleGradedSpecsId = savedSampleGradedSpecs._id; // Get the new ID

    // Step 2: Automatically Fetch POMs from SpecTemPoms
    const poms = await SpecTemPoms.find({
      specTemplateId: spec_template_Id,
    });

    if (poms.length > 0) {
      // Step 3: Copy POMs and Assign `sampleGradedSpecsId`
      const copiedData = poms.map((pom) => ({
        ...pom.toObject(),
        sampleGradedSpecsId: sampleGradedSpecsId, // Assign newly created sample spec ID
        _id: undefined, // Remove _id so MongoDB generates a new one
      }));

      await CopiedSpecTemPoms.insertMany(copiedData);
    }

    res.status(201).json({
      message:
        "Sample Graded Specs created successfully and associated POMs copied.",
      data: savedSampleGradedSpecs,
    });
  } catch (error) {
    console.error("Error creating Sample Graded Specs:", error);
    res.status(500).json({
      message: "Error creating Sample Graded Specs",
      error: error.message,
    });
  }
};

// exports.copySampleGradedSpecsFromPreviousSamplespec = async (req, res) => {
//   try {
//     const { styleNumber, workOrder_Id, sourceSampleSpecId } = req.body;

//     // Validate input
//     if (!styleNumber || !workOrder_Id || !sourceSampleSpecId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Style number, work order ID, and source sample spec ID are required",
//       });
//     }

//     // Find source sample spec
//     const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
//       .populate("spec_template_Id")
//       .populate("workOrder_Id");

//     if (!sourceSpec) {
//       return res.status(404).json({
//         success: false,
//         message: "Source sample specs not found",
//       });
//     }

//     // Check for existing style in same work order
//     const existingSpec = await SampleGradedSpecs.findOne({
//       workOrder_Id: workOrder_Id,
//       style_number: styleNumber.toUpperCase(),
//     });

//     if (existingSpec) {
//       return res.status(400).json({
//         success: false,
//         message: "Sample specs already exist for this style in the work order",
//       });
//     }

//     // Create a new SampleGradedSpecs object
//     const newSampleGradedSpecs = new SampleGradedSpecs({
//       ...sourceSpec.toObject(),
//       _id: undefined,
//       style_number: styleNumber.toUpperCase(),
//       workOrder_Id,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       poms: [], // reset
//     });

//     // Save the new spec
//     const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
//     const sampleGradedSpecsId = savedSampleGradedSpecs._id;

//     // Step 1: Try copying POMs from the original CopiedSpecTemPoms
//     const sourcePOMs = await CopiedSpecTemPoms.find({
//       sampleGradedSpecsId: sourceSampleSpecId,
//     });

//     let newPOMs = [];

//     if (sourcePOMs.length > 0) {
//       newPOMs = await CopiedSpecTemPoms.insertMany(
//         sourcePOMs.map((pom) => {
//           const { _id, ...rest } = pom.toObject();
//           return {
//             ...rest,
//             sampleGradedSpecsId,
//             design: rest.Final,
//             Final: '',
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//         })
//       );
//     } else {
//       // Step 2: If no copied POMs, fetch from SpecTemPoms (template)
//       const spec_template_Id =
//         sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;

//       const templatePOMs = await SpecTemPoms.find({
//         specTemplateId: spec_template_Id,
//       });

//       if (templatePOMs.length > 0) {
//         newPOMs = await CopiedSpecTemPoms.insertMany(
//           templatePOMs.map((pom) => {
//             const { _id, ...rest } = pom.toObject();
//             return {
//               ...rest,
//               sampleGradedSpecsId,
//               createdAt: new Date(),
//               updatedAt: new Date(),
//             };
//           })
//         );
//       }
//     }

//     // Update new spec with new POM references
//     if (newPOMs.length > 0) {
//       savedSampleGradedSpecs.poms = newPOMs.map((p) => p._id);
//       await savedSampleGradedSpecs.save();
//     }

//     // Populate and return final result
//     const result = await SampleGradedSpecs.findById(savedSampleGradedSpecs._id)
//       .populate("spec_template_Id")
//       .populate("workOrder_Id")
//       .populate({
//         path: "poms",
//         model: "CopiedSpecTemPoms",
//       });

//     res.status(201).json({
//       success: true,
//       message: "Sample specs copied successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error copying sample specs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error copying sample specs",
//       error: error.message,
//     });
//   }
// };





//generate sample specs final values apply in deisgn after  copy


// exports.copySampleGradedSpecsFromPreviousSamplespec = async (req, res) => {
//   try {
//     const { styleNumber, workOrder_Id, sourceSampleSpecId, size } = req.body;

//     // Validate input
//     if (!styleNumber || !workOrder_Id || !sourceSampleSpecId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Style number, work order ID, and source sample spec ID are required",
//       });
//     }

//     // Find source sample spec
//     const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
//       .populate("spec_template_Id")
//       .populate("workOrder_Id");

//     if (!sourceSpec) {
//       return res.status(404).json({
//         success: false,
//         message: "Source sample specs not found",
//       });
//     }

//     // Check for existing style in same work order
//     const existingSpec = await SampleGradedSpecs.findOne({
//       workOrder_Id: workOrder_Id,
//       style_number: styleNumber.toUpperCase(),
//     });

//     if (existingSpec) {
//       return res.status(400).json({
//         success: false,
//         message: "Sample specs already exist for this style in the work order",
//       });
//     }

//     // Create a new SampleGradedSpecs object with payload size
//     const newSampleGradedSpecs = new SampleGradedSpecs({
//       ...sourceSpec.toObject(),
//       _id: undefined,
//       style_number: styleNumber.toUpperCase(),
//       workOrder_Id,
//       size: size || sourceSpec.size, // Use payload size if provided, otherwise fallback to source size
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       poms: [], // reset
//     });

//     // Save the new spec
//     const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
//     const sampleGradedSpecsId = savedSampleGradedSpecs._id;

//     // Step 1: Try copying POMs from the original CopiedSpecTemPoms
//     const sourcePOMs = await CopiedSpecTemPoms.find({
//       sampleGradedSpecsId: sourceSampleSpecId,
//     });

//     let newPOMs = [];

//     if (sourcePOMs.length > 0) {
//       newPOMs = await CopiedSpecTemPoms.insertMany(
//         sourcePOMs.map((pom) => {
//           const { _id, ...rest } = pom.toObject();
//           return {
//             ...rest,
//             sampleGradedSpecsId,
//             design: rest.Final,
//             Final: '',
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//         })
//       );
//     } else {
//       // Step 2: If no copied POMs, fetch from SpecTemPoms (template)
//       const spec_template_Id =
//         sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;

//       const templatePOMs = await SpecTemPoms.find({
//         specTemplateId: spec_template_Id,
//       });

//       if (templatePOMs.length > 0) {
//         newPOMs = await CopiedSpecTemPoms.insertMany(
//           templatePOMs.map((pom) => {
//             const { _id, ...rest } = pom.toObject();
//             return {
//               ...rest,
//               sampleGradedSpecsId,
//               createdAt: new Date(),
//               updatedAt: new Date(),
//             };
//           })
//         );
//       }
//     }

//     // Update new spec with new POM references
//     if (newPOMs.length > 0) {
//       savedSampleGradedSpecs.poms = newPOMs.map((p) => p._id);
//       await savedSampleGradedSpecs.save();
//     }

//     // Populate and return final result
//     const result = await SampleGradedSpecs.findById(savedSampleGradedSpecs._id)
//       .populate("spec_template_Id")
//       .populate("workOrder_Id")
//       .populate({
//         path: "poms",
//         model: "CopiedSpecTemPoms",
//       });

//     res.status(201).json({
//       success: true,
//       message: "Sample specs copied successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error copying sample specs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error copying sample specs",
//       error: error.message,
//     });
//   }
// };


// exports.copySampleGradedSpecsFromPreviousSamplespec = async (req, res) => {
//   try {
//     const { styleNumber, workOrder_Id, sourceSampleSpecId, size } = req.body;

//     // Validate input
//     if (!styleNumber || !workOrder_Id || !sourceSampleSpecId) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     // Get source spec and validate
//     const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
//       .populate("spec_template_Id")
//       .populate("workOrder_Id");

//     if (!sourceSpec) {
//       return res.status(404).json({ success: false, message: "Source not found" });
//     }

//     // Check for existing specs
//     const existingSpec = await SampleGradedSpecs.findOne({
//       workOrder_Id,
//       style_number: styleNumber.toUpperCase(),
//     });
//     if (existingSpec) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Specs already exist for this style" 
//       });
//     }

//     // Get all copied POMs for this work order
//     const copiedSamples = await CopiedSampleGradedSpecs.find({ workOrder_Id })
//       .populate({
//         path: "copiedPOMs",
//         model: "CopiedSpecTemPoms",
//         options: { sort: { _id: 1 } } // Ensure consistent ordering
//       });

//     // Create array of all copied POMs in order
//     const orderedCopiedPOMs = copiedSamples.flatMap(sample => 
//       sample.copiedPOMs?.sort((a, b) => a._id.toString().localeCompare(b._id.toString())) || []);

//     // Create new sample specs
//     const newSampleGradedSpecs = new SampleGradedSpecs({
//       ...sourceSpec.toObject(),
//       _id: undefined,
//       style_number: styleNumber.toUpperCase(),
//       workOrder_Id,
//       size: size || sourceSpec.size,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       poms: [],
//     });

//     const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
//     const sampleGradedSpecsId = savedSampleGradedSpecs._id;

//     // Get source POMs or fallback to template POMs (sorted by _id)
//     let sourcePOMs = await CopiedSpecTemPoms.find({ 
//       sampleGradedSpecsId: sourceSampleSpecId 
//     }).sort({ _id: 1 });

//     if (sourcePOMs.length === 0) {
//       const templateId = sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;
//       sourcePOMs = await SpecTemPoms.find({ 
//         specTemplateId: templateId 
//       }).sort({ _id: 1 });
//     }

//     // Create new POMs with matched size values (one-to-one matching)
//     const newPOMs = await CopiedSpecTemPoms.insertMany(
//       sourcePOMs.map((pom, index) => {
//         const pomData = pom.toObject();
        
//         // Get corresponding copied POM by position
//         const matchingPom = orderedCopiedPOMs[index];
        
//         let designValue = pomData.Final || '';
        
//         // If we have a matching POM and the size exists in it
//         if (matchingPom && size && matchingPom[size] !== undefined) {
//           designValue = matchingPom[size];
//         }

//         return {
//           ...pomData,
//           _id: undefined,
//           sampleGradedSpecsId,
//           design: designValue,
//           Final: '',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         };
//       })
//     );

//     // Update with new POM references
//     savedSampleGradedSpecs.poms = newPOMs.map(p => p._id);
//     await savedSampleGradedSpecs.save();

//     // Return populated result
//     const result = await SampleGradedSpecs.findById(sampleGradedSpecsId)
//       .populate("spec_template_Id")
//       .populate("workOrder_Id")
//       .populate({
//         path: "poms",
//         model: "CopiedSpecTemPoms",
//       });

//     res.status(201).json({
//       success: true,
//       message: "Sample specs copied successfully",
//       data: result,
//     });

//   } catch (error) {
//     console.error("Error copying sample specs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error copying sample specs",
//       error: error.message,
//     });
//   }
// };


exports.copySampleGradedSpecsFromPreviousSamplespec = async (req, res) => {
  try {
    const { styleNumber, workOrder_Id, sourceSampleSpecId, size } = req.body;

    // Validate input
    if (!styleNumber || !workOrder_Id || !sourceSampleSpecId) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Get source spec and validate
    const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
      .populate("spec_template_Id")
      .populate("workOrder_Id");

    if (!sourceSpec) {
      return res.status(404).json({ success: false, message: "Source not found" });
    }

    // Check for existing specs
    const existingSpec = await SampleGradedSpecs.findOne({
      workOrder_Id,
      style_number: styleNumber.toUpperCase(),
    });
    if (existingSpec) {
      return res.status(400).json({ 
        success: false, 
        message: "Specs already exist for this style" 
      });
    }

    // Get the work order from the source sample spec
    const sourceWorkOrderId = sourceSpec.workOrder_Id?._id || sourceSpec.workOrder_Id;

    // Get all copied POMs for the source work order
    const copiedSamples = await CopiedSampleGradedSpecs.find({ workOrder_Id: sourceWorkOrderId })
      .populate({
        path: "copiedPOMs",
        model: "CopiedSpecTemPoms",
        options: { sort: { _id: 1 } } // Ensure consistent ordering
      });

    // Create array of all copied POMs in order
    const orderedCopiedPOMs = copiedSamples.flatMap(sample => 
      sample.copiedPOMs?.sort((a, b) => a._id.toString().localeCompare(b._id.toString())) || []);

    // Create new sample specs
    const newSampleGradedSpecs = new SampleGradedSpecs({
      ...sourceSpec.toObject(),
      _id: undefined,
      style_number: styleNumber.toUpperCase(),
      workOrder_Id, // Using the new workOrder_Id from request
      size: size || sourceSpec.size,
      createdAt: new Date(),
      updatedAt: new Date(),
      poms: [],
    });

    const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
    const sampleGradedSpecsId = savedSampleGradedSpecs._id;

    // Get source POMs or fallback to template POMs (sorted by _id)
    let sourcePOMs = await CopiedSpecTemPoms.find({ 
      sampleGradedSpecsId: sourceSampleSpecId 
    }).sort({ _id: 1 });

    if (sourcePOMs.length === 0) {
      const templateId = sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;
      sourcePOMs = await SpecTemPoms.find({ 
        specTemplateId: templateId 
      }).sort({ _id: 1 });
    }

    // Create new POMs with matched size values from source work order
    const newPOMs = await CopiedSpecTemPoms.insertMany(
      sourcePOMs.map((pom, index) => {
        const pomData = pom.toObject();
        
        // Get corresponding copied POM by position from source work order
        const matchingPom = orderedCopiedPOMs[index];
        
        let designValue = '';
        
        // If we have a matching POM and the size exists in it
        if (matchingPom && size && matchingPom[size] !== undefined) {
          designValue = matchingPom[size];
        }

        return {
          ...pomData,
          _id: undefined,
          sampleGradedSpecsId,
          design: designValue,
          Initial: "",
          FirstPP: "",  // Added this field
          SecondPP: "", // Added this field
          ThirdPP: "",  // Added this field
          Rev1: "",
          Rev2: "",
          Final: "",
          Ship: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
    );

    // Update with new POM references
    savedSampleGradedSpecs.poms = newPOMs.map(p => p._id);
    await savedSampleGradedSpecs.save();

    // Return populated result
    const result = await SampleGradedSpecs.findById(sampleGradedSpecsId)
      .populate("spec_template_Id")
      .populate("workOrder_Id")
      .populate({
        path: "poms",
        model: "CopiedSpecTemPoms",
      });

    res.status(201).json({
      success: true,
      message: "Sample specs copied successfully",
      data: result,
    });

  } catch (error) {
    console.error("Error copying sample specs:", error);
    res.status(500).json({
      success: false,
      message: "Error copying sample specs",
      error: error.message,
    });
  }
};





exports.getPomsHeaderscopysize = async (req, res) => {
  try {
    const { sampleGradedSpecsId } = req.params;

    if (!sampleGradedSpecsId) {
      return res.status(400).json({
        success: false,
        message: "Sample graded specs ID is required",
      });
    }

    // Find the first POM for the given sampleGradedSpecsId
    const firstPom = await CopiedSpecTemPoms.findOne({ sampleGradedSpecsId });

    if (!firstPom) {
      return res.status(404).json({
        success: false,
        message: "No POM found for the given sample specs ID",
      });
    }

    // Get headers from the first POM
    const pomObject = firstPom.toObject();
    const headers = [];
    
    const excludedFields = [
      'Final', 'FirstPP', 'Initial', 'Rev1', 'Rev2', 
      'SecondPP', 'Ship', 'ThirdPP', 
      '_id', '__v', 'createdAt', 'updatedAt', 
      'sampleGradedSpecsId', 'specTemplateId',
      'code', 'description', 'tolerance', 'design'
    ];

    for (const key in pomObject) {
      if (!excludedFields.includes(key)) {
        headers.push(key);
      }
    }

    // Custom sorting function for mixed numeric and string values
    headers.sort((a, b) => {
      // Try to convert to numbers first
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      
      // If both are numbers, compare numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      // If one is number and other is string, numbers come first
      else if (!isNaN(numA)) {
        return -1;
      }
      else if (!isNaN(numB)) {
        return 1;
      }
      // Both are strings, compare alphabetically
      else {
        return a.localeCompare(b);
      }
    });

    res.status(200).json({
      success: true,
      message: "POM headers retrieved successfully",
      data: headers
    });

  } catch (error) {
    console.error("Error getting POM headers:", error);
    res.status(500).json({
      success: false,
      message: "Error getting POM headers",
      error: error.message,
    });
  }
};


//  techpack copy sample specs
// exports.copySampleGradedSpecsFromPreviousTechpack = async (req, res) => {
//   try {
//     const { styleNumber, techpack_Id, sourceSampleSpecId, size } = req.body;

//     // Validate input
//     if (!styleNumber || !techpack_Id || !sourceSampleSpecId) {
//       return res.status(400).json({
//         success: false,
//         message: "Style number, techpack ID, and source sample spec ID are required",
//       });
//     }

//     // Find source sample spec
//     const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
//       .populate("spec_template_Id")
//       .populate("techpack_Id");

//     if (!sourceSpec) {
//       return res.status(404).json({
//         success: false,
//         message: "Source sample specs not found",
//       });
//     }

//     // Check for existing style in same techpack
//     const existingSpec = await SampleGradedSpecs.findOne({
//       techpack_Id: techpack_Id,
//       style_number: styleNumber.toUpperCase(),
//     });

//     if (existingSpec) {
//       return res.status(400).json({
//         success: false,
//         message: "Sample specs already exist for this style in the techpack",
//       });
//     }

//     // Create a new SampleGradedSpecs object with payload size
//     const newSampleGradedSpecs = new SampleGradedSpecs({
//       ...sourceSpec.toObject(),
//       _id: undefined,
//       style_number: styleNumber.toUpperCase(),
//       techpack_Id,
//       size: size || sourceSpec.size, // Use payload size if provided, otherwise fallback to source size
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       poms: [], // reset
//     });

//     // Save the new spec
//     const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
//     const sampleGradedSpecsId = savedSampleGradedSpecs._id;

//     // Step 1: Try copying POMs from the original CopiedSpecTemPoms
//     const sourcePOMs = await CopiedSpecTemPoms.find({
//       sampleGradedSpecsId: sourceSampleSpecId,
//     });

//     let newPOMs = [];

//     if (sourcePOMs.length > 0) {
//       newPOMs = await CopiedSpecTemPoms.insertMany(
//         sourcePOMs.map((pom) => {
//           const { _id, ...rest } = pom.toObject();
//           return {
//             ...rest,
//             sampleGradedSpecsId,
//             design: rest.Final,
//             Final: '',
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//         })
//       );
//     } else {
//       // Step 2: If no copied POMs, fetch from SpecTemPoms (template)
//       const spec_template_Id =
//         sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;

//       const templatePOMs = await SpecTemPoms.find({
//         specTemplateId: spec_template_Id,
//       });

//       if (templatePOMs.length > 0) {
//         newPOMs = await CopiedSpecTemPoms.insertMany(
//           templatePOMs.map((pom) => {
//             const { _id, ...rest } = pom.toObject();
//             return {
//               ...rest,
//               sampleGradedSpecsId,
//               createdAt: new Date(),
//               updatedAt: new Date(),
//             };
//           })
//         );
//       }
//     }

//     // Update new spec with new POM references
//     if (newPOMs.length > 0) {
//       savedSampleGradedSpecs.poms = newPOMs.map((p) => p._id);
//       await savedSampleGradedSpecs.save();
//     }

//     // Populate and return final result
//     const result = await SampleGradedSpecs.findById(savedSampleGradedSpecs._id)
//       .populate("spec_template_Id")
//       .populate("techpack_Id")
//       .populate({
//         path: "poms",
//         model: "CopiedSpecTemPoms",
//       });

//     res.status(201).json({
//       success: true,
//       message: "Sample specs copied successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error copying sample specs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error copying sample specs",
//       error: error.message,
//     });
//   }
// };


// exports.copySampleGradedSpecsFromPreviousTechpack = async (req, res) => {
//   try {
//     const { styleNumber, techpack_Id, sourceSampleSpecId, size } = req.body;

//     // Validate input
//     if (!styleNumber || !techpack_Id || !sourceSampleSpecId) {
//       return res.status(400).json({
//         success: false,
//         message: "Style number, techpack ID, and source sample spec ID are required",
//       });
//     }

//     // Find source sample spec
//     const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
//       .populate("spec_template_Id")
//       .populate("techpack_Id");

//     if (!sourceSpec) {
//       return res.status(404).json({
//         success: false,
//         message: "Source sample specs not found",
//       });
//     }

//     // Check for existing style in same techpack
//     const existingSpec = await SampleGradedSpecs.findOne({
//       techpack_Id: techpack_Id,
//       style_number: styleNumber.toUpperCase(),
//     });

//     if (existingSpec) {
//       return res.status(400).json({
//         success: false,
//         message: "Sample specs already exist for this style in the techpack",
//       });
//     }

//     // Get all copied POMs for this techpack (similar to work order version)
//     const copiedSamples = await CopiedSampleGradedSpecs.find({ techpack_Id })
//       .populate({
//         path: "copiedPOMs",
//         model: "CopiedSpecTemPoms",
//         options: { sort: { _id: 1 } } // Ensure consistent ordering
//       });

//     // Create array of all copied POMs in order
//     const orderedCopiedPOMs = copiedSamples.flatMap(sample => 
//       sample.copiedPOMs?.sort((a, b) => a._id.toString().localeCompare(b._id.toString())) || []);

//     // Create new sample specs
//     const newSampleGradedSpecs = new SampleGradedSpecs({
//       ...sourceSpec.toObject(),
//       _id: undefined,
//       style_number: styleNumber.toUpperCase(),
//       techpack_Id,
//       size: size || sourceSpec.size,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       poms: [],
//     });

//     const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
//     const sampleGradedSpecsId = savedSampleGradedSpecs._id;

//     // Get source POMs or fallback to template POMs (sorted by _id)
//     let sourcePOMs = await CopiedSpecTemPoms.find({ 
//       sampleGradedSpecsId: sourceSampleSpecId 
//     }).sort({ _id: 1 });

//     if (sourcePOMs.length === 0) {
//       const templateId = sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;
//       sourcePOMs = await SpecTemPoms.find({ 
//         specTemplateId: templateId 
//       }).sort({ _id: 1 });
//     }

//     // Create new POMs with matched size values (one-to-one matching)
//     const newPOMs = await CopiedSpecTemPoms.insertMany(
//       sourcePOMs.map((pom, index) => {
//         const pomData = pom.toObject();
        
//         // Get corresponding copied POM by position
//         const matchingPom = orderedCopiedPOMs[index];
        
//         let designValue = pomData.Final || '';
        
//         // If we have a matching POM and the size exists in it
//         if (matchingPom && size && matchingPom[size] !== undefined) {
//           designValue = matchingPom[size];
//         }

//         return {
//           ...pomData,
//           _id: undefined,
//           sampleGradedSpecsId,
//           design: designValue,
//           Final: '',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         };
//       })
//     );

//     // Update with new POM references
//     savedSampleGradedSpecs.poms = newPOMs.map(p => p._id);
//     await savedSampleGradedSpecs.save();

//     // Return populated result
//     const result = await SampleGradedSpecs.findById(sampleGradedSpecsId)
//       .populate("spec_template_Id")
//       .populate("techpack_Id")
//       .populate({
//         path: "poms",
//         model: "CopiedSpecTemPoms",
//       });

//     res.status(201).json({
//       success: true,
//       message: "Sample specs copied successfully",
//       data: result,
//     });

//   } catch (error) {
//     console.error("Error copying sample specs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error copying sample specs",
//       error: error.message,
//     });
//   }
// };


exports.copySampleGradedSpecsFromPreviousTechpack = async (req, res) => {
  try {
    const { styleNumber, techpack_Id, sourceSampleSpecId, size } = req.body;

    // Validate input
    if (!styleNumber || !techpack_Id || !sourceSampleSpecId) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Get source spec and validate
    const sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
      .populate("spec_template_Id")
      .populate("techpack_Id");

    if (!sourceSpec) {
      return res.status(404).json({ success: false, message: "Source not found" });
    }

    // Check for existing specs
    const existingSpec = await SampleGradedSpecs.findOne({
      techpack_Id,
      style_number: styleNumber.toUpperCase(),
    });
    if (existingSpec) {
      return res.status(400).json({ 
        success: false, 
        message: "Specs already exist for this style" 
      });
    }

    // Get the techpack from the source sample spec
    const sourceTechpackId = sourceSpec.techpack_Id?._id || sourceSpec.techpack_Id;

    // Get all copied POMs for the source techpack
    const copiedSamples = await CopiedSampleGradedSpecs.find({ techpack_Id: sourceTechpackId })
      .populate({
        path: "copiedPOMs",
        model: "CopiedSpecTemPoms",
        options: { sort: { _id: 1 } } // Ensure consistent ordering
      });

    // Create array of all copied POMs in order
    const orderedCopiedPOMs = copiedSamples.flatMap(sample => 
      sample.copiedPOMs?.sort((a, b) => a._id.toString().localeCompare(b._id.toString())) || []);

    // Create new sample specs
    const newSampleGradedSpecs = new SampleGradedSpecs({
      ...sourceSpec.toObject(),
      _id: undefined,
      style_number: styleNumber.toUpperCase(),
      techpack_Id, // Using the new techpack_Id from request
      size: size || sourceSpec.size,
      createdAt: new Date(),
      updatedAt: new Date(),
      poms: [],
    });

    const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
    const sampleGradedSpecsId = savedSampleGradedSpecs._id;

    // Get source POMs or fallback to template POMs (sorted by _id)
    let sourcePOMs = await CopiedSpecTemPoms.find({ 
      sampleGradedSpecsId: sourceSampleSpecId 
    }).sort({ _id: 1 });

    if (sourcePOMs.length === 0) {
      const templateId = sourceSpec.spec_template_Id?._id || sourceSpec.spec_template_Id;
      sourcePOMs = await SpecTemPoms.find({ 
        specTemplateId: templateId 
      }).sort({ _id: 1 });
    }

    // Create new POMs with matched size values from source techpack
    const newPOMs = await CopiedSpecTemPoms.insertMany(
      sourcePOMs.map((pom, index) => {
        const pomData = pom.toObject();
        
        // Get corresponding copied POM by position from source techpack
        const matchingPom = orderedCopiedPOMs[index];
        
        let designValue = '';
        
        // If we have a matching POM and the size exists in it
        if (matchingPom && size && matchingPom[size] !== undefined) {
          designValue = matchingPom[size];
        }

        return {
          ...pomData,
          _id: undefined,
          sampleGradedSpecsId,
          design: designValue,
          Initial: "",
          FirstPP: "",
          SecondPP: "",
          ThirdPP: "",
          Rev1: "",
          Rev2: "",
          Final: "",
          Ship: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
    );

    // Update with new POM references
    savedSampleGradedSpecs.poms = newPOMs.map(p => p._id);
    await savedSampleGradedSpecs.save();

    // Return populated result
    const result = await SampleGradedSpecs.findById(sampleGradedSpecsId)
      .populate("spec_template_Id")
      .populate("techpack_Id")
      .populate({
        path: "poms",
        model: "CopiedSpecTemPoms",
      });

    res.status(201).json({
      success: true,
      message: "Sample specs copied successfully",
      data: result,
    });

  } catch (error) {
    console.error("Error copying sample specs:", error);
    res.status(500).json({
      success: false,
      message: "Error copying sample specs",
      error: error.message,
    });
  }
};


// Helper function to get similar style numbers (used in your error response)
exports.findSimilarStyleNumbers = async (searchTerm) => {
  const allStyles = await SampleGradedSpecs.distinct("style_number");
  const normalizedSearch = searchTerm.toUpperCase();

  const similar = allStyles.filter(
    (style) =>
      style.toUpperCase().includes(normalizedSearch) ||
      normalizedSearch.includes(style.toUpperCase())
  );

  return {
    normalizedSearch,
    availableStyleNumbers: allStyles,
    similarStyleNumbers: similar,
  };
};

//all sample graded specs in this controller function
// controllers/sampleGradedSpecsController.js
exports.getAllSampleGradedSpecss = async (_req, res) => {
  try {
    const samples = await SampleGradedSpecs.find({})
      .select("-__v -updatedAt") // Exclude meta fields
      .populate("spec_template_Id") // Expand spec template
      .populate("workOrder_Id") // Expand work order
      .populate("item_type_Id") // Expand item type if needed
      .lean();

    // Verify the populated data
    if (samples.length > 0) {
      console.log("First sample with populated refs:", samples[0]);
    }

    res.status(200).json({
      message:
        "Sample Graded Specs retrieved successfully with populated references.",
      data: samples,
    });
  } catch (error) {
    console.error("Error fetching sample graded specs:", error);
    res.status(500).json({
      message: "Error fetching sample graded specs",
      error: error.message,
    });
  }
};


// controllers/sampleSpecsController.js

exports.getSampleSpecsUsedForGrading = async (req, res) => {
  try {
    // Step 1: Get all CopiedSampleGradedSpecs to find which sample specs were used
    const allGradedSpecs = await CopiedSampleGradedSpecs.find({})
      .select('originalSampleGradedId') // This should reference the SampleGradedSpecs
      .lean();

    if (allGradedSpecs.length === 0) {
      return res.status(200).json({
        message: "No sample specs have been used for grading yet",
        data: []
      });
    }

    // Step 2: Get the corresponding SampleGradedSpecs to find the original sampleSpecsId
    const sampleGradedSpecsIds = allGradedSpecs.map(g => g.originalSampleGradedId);
    
    const sampleGradedSpecs = await SampleGradedSpecs.find({
      _id: { $in: sampleGradedSpecsIds }
    }).select('sampleSpecsId').lean();

    // Extract unique sample specs IDs
    const usedSampleSpecsIds = [...new Set(
      sampleGradedSpecs.map(s => s.sampleSpecsId)
    )];

    // Step 3: Get the actual SampleSpecs data
    const usedSampleSpecs = await SampleSpecs.find({
      _id: { $in: usedSampleSpecsIds }
    })
      .select('-__v -updatedAt')
      .populate('spec_template_Id')
      .populate('workOrder_Id')
      .populate('item_type_Id')
      .lean();

    // Step 4: Add additional information about the graded specs created from each
    const result = usedSampleSpecs.map(sample => {
      // Find all graded specs created from this sample
      const gradedFromThisSample = sampleGradedSpecs
        .filter(g => g.sampleSpecsId.toString() === sample._id.toString())
        .map(g => g._id);
      
      // Find all copied graded specs created from those
      const copiedGradedSpecs = allGradedSpecs
        .filter(g => gradedFromThisSample.includes(g.originalSampleGradedId.toString()));

      return {
        ...sample,
        gradedSpecsCount: copiedGradedSpecs.length,
        firstGradedDate: copiedGradedSpecs.length > 0 
          ? copiedGradedSpecs[0].createdAt 
          : null
      };
    });

    res.status(200).json({
      message: "Sample specs used for grading retrieved successfully",
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error("Error fetching sample specs used for grading:", error);
    res.status(500).json({
      message: "Error fetching sample specs used for grading",
      error: error.message
    });
  }
};
//POST API to copy an existing Sample Spec
exports.copySampleGradedSpecs = async (req, res) => {
  try {
    const { sampleGradedSpecsId } = req.body;

    if (!sampleGradedSpecsId) {
      return res
        .status(400)
        .json({ message: "sampleGradedSpecsId is required" });
    }

    const originalSpec = await SampleGradedSpecs.findById(sampleGradedSpecsId);
    if (!originalSpec) {
      return res
        .status(404)
        .json({ message: "Original SampleGradedSpec not found" });
    }

    // Destructure to exclude _id and timestamps
    const {
      techpack_Id,
      workOrder_Id,
      item_type_Id,
      size_range,
      spec_template_Id,
      style_number,
      fabric_content,
      customer_or_brand,
      size,
      garment_specs_details,
      DesignDate,
      IntialDate,
      FirstPPdate,
      Rev1date,
      SecondPPdate,
      Rev2date,
      ThirdPPdate,
      Finaldate,
      Shipdate,
    } = originalSpec.toObject();

    const newSample = new SampleGradedSpecs({
      techpack_Id,
      workOrder_Id,
      item_type_Id,
      size_range,
      spec_template_Id,
      style_number,
      fabric_content,
      customer_or_brand,
      size,
      garment_specs_details,
      DesignDate,
      IntialDate,
      FirstPPdate,
      Rev1date,
      SecondPPdate,
      Rev2date,
      ThirdPPdate,
      Finaldate,
      Shipdate,
    });

    const savedSample = await newSample.save();

    // Copy associated POMs
    const poms = await SpecTemPoms.find({
      specTemplateId: spec_template_Id,
    });

    if (poms.length > 0) {
      const copiedPOMs = poms.map((pom) => ({
        ...pom.toObject(),
        sampleGradedSpecsId: savedSample._id,
        _id: undefined,
      }));

      await CopiedSpecTemPoms.insertMany(copiedPOMs);
    }

    res.status(201).json({
      message: "Sample Graded Spec copied successfully.",
      data: savedSample,
    });
  } catch (error) {
    console.error("Error copying sample graded spec:", error);
    res.status(500).json({
      message: "Error copying sample graded spec",
      error: error.message,
    });
  }
};

exports.createTechpackBasedSampleSpec = async (req, res) => {
  try {
    const { techpack_Id, spec_template_Id, styleId, sourceSampleSpecId } =
      req.body;

    // Validate input
    if (!techpack_Id || !spec_template_Id || !styleId) {
      return res.status(400).json({
        success: false,
        message: "techpack_Id, spec_template_Id, and styleId are required",
      });
    }

    // Check if this combination already exists
    const existingSpec = await SampleGradedSpecs.findOne({
      techpack_Id,
      spec_template_Id,
      style_number: styleId,
      $or: [{ workOrder_Id: { $exists: false } }, { workOrder_Id: null }],
    });

    if (existingSpec) {
      return res.status(400).json({
        success: false,
        message:
          "Sample specs with this techpack, template and style already exist",
      });
    }

    // If sourceSampleSpecId is provided, copy from existing sample spec
    let sourceSpec = null;
    if (sourceSampleSpecId) {
      sourceSpec = await SampleGradedSpecs.findById(sourceSampleSpecId)
        .populate("spec_template_Id")
        .populate("techpack_Id");

      if (!sourceSpec) {
        return res.status(404).json({
          success: false,
          message: "Source sample specs not found",
        });
      }
    }

    // Create new SampleGradedSpecs object
    const newSampleGradedSpecs = new SampleGradedSpecs({
      ...(sourceSpec ? sourceSpec.toObject() : {}),
      _id: undefined,
      techpack_Id,
      spec_template_Id,
      style_number: styleId,
      createdAt: new Date(),
      updatedAt: new Date(),
      poms: [], // reset POMs
    });

    // Save the new spec
    const savedSampleGradedSpecs = await newSampleGradedSpecs.save();
    const sampleGradedSpecsId = savedSampleGradedSpecs._id;

    let newPOMs = [];

    if (sourceSpec && sourceSampleSpecId) {
      // Step 1: Try copying POMs from the original CopiedSpecTemPoms
      const sourcePOMs = await CopiedSpecTemPoms.find({
        sampleGradedSpecsId: sourceSampleSpecId,
      });

      if (sourcePOMs.length > 0) {
        newPOMs = await CopiedSpecTemPoms.insertMany(
          sourcePOMs.map((pom) => {
            const { _id, ...rest } = pom.toObject();
            return {
              ...rest,
              sampleGradedSpecsId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          })
        );
      }
    }

    // Step 2: If no copied POMs (either no source or no POMs in source), fetch from SpecTemPoms (template)
    if (newPOMs.length === 0) {
      const templatePOMs = await SpecTemPoms.find({
        specTemplateId: spec_template_Id,
      });

      if (templatePOMs.length > 0) {
        newPOMs = await CopiedSpecTemPoms.insertMany(
          templatePOMs.map((pom) => {
            const { _id, ...rest } = pom.toObject();
            return {
              ...rest,
              sampleGradedSpecsId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          })
        );
      }
    }

    // Update new spec with new POM references
    if (newPOMs.length > 0) {
      savedSampleGradedSpecs.poms = newPOMs.map((p) => p._id);
      await savedSampleGradedSpecs.save();
    }

    // Populate and return final result
    const result = await SampleGradedSpecs.findById(savedSampleGradedSpecs._id)
      .populate("spec_template_Id")
      .populate("techpack_Id")
      .populate({
        path: "poms",
        model: "CopiedSpecTemPoms",
      });

    res.status(201).json({
      success: true,
      message: "Techpack-based sample specs created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating techpack-based sample specs:", error);
    res.status(500).json({
      success: false,
      message: "Error creating techpack-based sample specs",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
  }
};

const ItemDetail = require("../../models/itemdetail/ItemDetailModel.js");

exports.getAllSampleGradedSpecs = async (req, res) => {
  try {
    const { workOrder_Id } = req.body;

    if (!workOrder_Id) {
      return res.status(400).json({ message: "workOrder_Id is required" });
    }

    console.log(
      ` Searching for Sample Graded Specs with workOrder_Id: ${workOrder_Id}`
    );
    const sampleGradedSpecsList = await SampleGradedSpecs.find({
      workOrder_Id,
    })
      .populate("item_type_Id", "name")
      .populate({
        path: "spec_template_Id",
        select: "_id Name name Size_Range Point_of_Measure",
      })
      .populate({
        path: "workOrder_Id",
        select: "-__v",
        populate: [
          { path: "vendor", select: "name" },
          { path: "category", select: "name" },
          { path: "itemType", select: "name" },
          { path: "subCategory", select: "name" },
          { path: "trim_id", select: "name" },
          { path: "pictures", select: "url" },
          { path: "buttonImages.image", select: "url" },
          { path: "rivetImages.image", select: "url" },
          { path: "trimImages.image", select: "url" },
        ],
      })
      .lean();

    if (!sampleGradedSpecsList.length) {
      return res.status(404).json({
        message: "No Sample Graded Specs found for this workOrder_Id",
      });
    }
    const itemDetails = await ItemDetail.find({ workOrder_Id })
      .select("style_number")
      .lean();
    const styleNumbers = itemDetails
      .map((item) => item.style_number)
      .filter((style) => style !== null && style !== undefined)
      .join(",");

    const data = sampleGradedSpecsList.map((spec) => ({
      style_number: styleNumbers || "Not Available",
      _id: spec._id,
      size_range: spec.size_range,
      DesignDate: spec.DesignDate,
      IntialDate: spec.IntialDate,
      FirstPPdate: spec.FirstPPdate,
      Rev1date: spec.Rev1date,
      SecondPPdate: spec.SecondPPdate,
      Rev2date: spec.Rev2date,
      ThirdPPdate: spec.ThirdPPdate,
      Finaldate: spec.Finaldate,
      Shipdate: spec.Shipdate,
      name: spec.item_type_Id?.name || "Not Available",
      spec_template: spec.spec_template_Id
        ? {
          _id: spec.spec_template_Id._id,
          Name: spec.spec_template_Id.Name,
        }
        : { _id: "Not Available", Name: "Not Available" },

      workOrder: spec.workOrder_Id
        ? {
          _id: spec.workOrder_Id._id,
          workOrderId: spec.workOrder_Id.workOrderId,
          vendor: spec.workOrder_Id.vendor || {
            name: "Not Available",
          },
          category: spec.workOrder_Id.category || {
            name: "Not Available",
          },
          itemType: spec.workOrder_Id.itemType || {
            name: "Not Available",
          },
          subCategory: spec.workOrder_Id.subCategory || {
            name: "Not Available",
          },
          trim_id: spec.workOrder_Id.trim_id || [],
          etd: spec.workOrder_Id.etd || "Not Available",
          pictures: spec.workOrder_Id.pictures || [],
          buttonImages: spec.workOrder_Id.buttonImages || [],
          rivetImages: spec.workOrder_Id.rivetImages || [],
          trimImages: spec.workOrder_Id.trimImages || [],
          createdAt: spec.workOrder_Id.createdAt || "Not Available",
        }
        : "Not Available",
    }));

    res.status(200).json({
      message: "Sample Graded Specs and related data retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Sample Graded Specs:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getSampleGradedSpecsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Sample Graded Spec ID is required" });
    }

    console.log(`Fetching Sample Graded Spec with ID: ${id}`);
    const sampleGradedSpec = await SampleGradedSpecs.findById(id)
      .populate("item_type_Id", "name")
      .populate({
        path: "spec_template_Id",
        select: "_id Name name Size_Range Point_of_Measure",
      })
      .populate({
        path: "workOrder_Id",
        select: "-__v",
        populate: [
          { path: "vendor", select: "name" },
          { path: "category", select: "name" },
          { path: "itemType", select: "name" },
          { path: "subCategory", select: "name" },
          { path: "trim_id", select: "name" },
          { path: "pictures", select: "url" },
          { path: "buttonImages.image", select: "url" },
          { path: "rivetImages.image", select: "url" },
          { path: "trimImages.image", select: "url" },
        ],
      })
      .lean();

    if (!sampleGradedSpec) {
      return res.status(404).json({ message: "Sample Graded Spec not found" });
    }

    const itemDetail = await ItemDetail.findOne({
      workOrder_Id: sampleGradedSpec.workOrder_Id,
    })
      .select("style_number")
      .lean();

    const styleNumber = itemDetail?.style_number || "Not Available";

    const data = {
      style_number: styleNumber,
      _id: sampleGradedSpec._id,
      DesignDate: sampleGradedSpec.DesignDate,
      IntialDate: sampleGradedSpec.IntialDate,
      FirstPPdate: sampleGradedSpec.FirstPPdate,
      Rev1date: sampleGradedSpec.Rev1date,
      SecondPPdate: sampleGradedSpec.SecondPPdate,
      Rev2date: sampleGradedSpec.Rev2date,
      ThirdPPdate: sampleGradedSpec.ThirdPPdate,
      Finaldate: sampleGradedSpec.Finaldate,
      Shipdate: sampleGradedSpec.Shipdate,
      size_range: sampleGradedSpec.size_range,
      name: sampleGradedSpec.item_type_Id?.name || "Not Available",
      spec_template: sampleGradedSpec.spec_template_Id
        ? {
          _id: sampleGradedSpec.spec_template_Id._id,
          Name: sampleGradedSpec.spec_template_Id.Name,
        }
        : null,
      workOrder: sampleGradedSpec.workOrder_Id
        ? {
          _id: sampleGradedSpec.workOrder_Id._id,
          workOrderId: sampleGradedSpec.workOrder_Id.workOrderId,
          vendor: sampleGradedSpec.workOrder_Id.vendor,
          category: sampleGradedSpec.workOrder_Id.category,
          itemType: sampleGradedSpec.workOrder_Id.itemType,
          subCategory: sampleGradedSpec.workOrder_Id.subCategory,
          trim_id: sampleGradedSpec.workOrder_Id.trim_id,
          etd: sampleGradedSpec.workOrder_Id.etd,
          pictures: sampleGradedSpec.workOrder_Id.pictures,
          buttonImages: sampleGradedSpec.workOrder_Id.buttonImages,
          rivetImages: sampleGradedSpec.workOrder_Id.rivetImages,
          trimImages: sampleGradedSpec.workOrder_Id.trimImages,
          createdAt: sampleGradedSpec.workOrder_Id.createdAt,
        }
        : null,
    };

    res.status(200).json({
      message: "Sample Graded Spec retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Sample Graded Spec:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateSampleGradedSpecsById = async (req, res) => {
  try {
    const { id } = req.params; // Extract the ID from params
    const updateData = req.body; // Get the updated data from the request body

    // Check if the ID is provided
    if (!id) {
      return res
        .status(400)
        .json({ message: "Sample Graded Spec ID is required" });
    }

    console.log(`Updating Sample Graded Spec with ID: ${id}`);

    // Update SampleGradedSpecs by ID
    const updatedSpec = await SampleGradedSpecs.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("item_type_Id", "name")
      .populate({
        path: "spec_template_Id",
        select: "_id Name name Size_Range Point_of_Measure",
      })
      .populate({
        path: "workOrder_Id",
        select: "-__v",
        populate: [
          { path: "vendor", select: "name" },
          { path: "categories", select: "name" },
          { path: "itemType", select: "name" },
          { path: "subCategories", select: "name" },
          { path: "trim_id", select: "name" },
          { path: "pictures", select: "url" },
          { path: "buttonImages.image", select: "url" },
          { path: "rivetImages.image", select: "url" },
          { path: "trimImages.image", select: "url" },
        ],
      })
      .populate({
        path: "techpack_Id", // Populate techpack_Id if it's available in the update request
        select: "-__v",
        populate: [
          { path: "vendor", select: "name" },
          { path: "categories", select: "name" },
          { path: "itemType", select: "name" },
          { path: "subCategory", select: "name" },
          { path: "labelTrim", select: "name" },
          {
            path: "pictures",
            select: "imageUrl category imageTitle imageName",
          },
          {
            path: "buttonImages.image",
            select: "imageUrl category imageTitle imageName",
          },
          {
            path: "rivetImages.image",
            select: "imageUrl category imageTitle imageName",
          },
        ],
      })
      .lean();

    // If no document was found for the provided ID
    if (!updatedSpec) {
      return res.status(404).json({ message: "Sample Graded Spec not found" });
    }

    // Update CopiedSampleGradedSpecs if exists
    const updatedCopiedSpec = await CopiedSampleGradedSpecs.findOneAndUpdate(
      { originalSampleGradedId: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    res.status(200).json({
      message: "Sample Graded Spec updated successfully",
      data: updatedSpec,
      copiedData: updatedCopiedSpec || "No copied version found",
    });
  } catch (error) {
    console.error("Error updating Sample Graded Spec:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// delete function of sample spec
// exports.deleteSampleGradedSpecsById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedSampleGradedSpecs =
//       await SampleGradedSpecs.findByIdAndDelete(id);
//     if (!deletedSampleGradedSpecs) {
//       return res.status(404).json({ message: "Sample Graded Specs not found" });
//     }
//     res.status(200).json({
//       message: "Sample Graded Specs deleted successfully",
//       data: deletedSampleGradedSpecs,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error deleting Sample Graded Specs",
//       error: error.message,
//     });
//   }
// };

// delete function of sample spec and graded spec together
exports.deleteSampleGradedSpecsById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete the main SampleGradedSpecs document
    const deletedSampleGradedSpecs = await SampleGradedSpecs.findByIdAndDelete(id);
    if (!deletedSampleGradedSpecs) {
      return res.status(404).json({ message: "Sample Graded Specs not found" });
    }

    // 2. Delete all CopiedSpecTemPoms (POMs) associated with this sampleGradedSpecsId
    await CopiedSpecTemPoms.deleteMany({ sampleGradedSpecsId: id });

    // 3. Delete all CopiedSampleGradedSpecs that reference this sampleGradedSpecsId
    await CopiedSampleGradedSpecs.deleteMany({ originalSampleGradedId: id });

    res.status(200).json({
      message: "Sample Graded Specs and all related POMs & Copied Samples deleted successfully",
      data: deletedSampleGradedSpecs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Sample Graded Specs",
      error: error.message,
    });
  }
};

exports.getAllSampleGradedSpecsByWorkOrderId = async (req, res) => {
  try {
    const { workOrder_Id, techpack_Id } = req.params;

    if (!workOrder_Id && !techpack_Id) {
      return res.status(400).json({
        message: "Either workOrder_Id or techpack_Id is required",
      });
    }

    let sampleGradedSpecsList;

    if (workOrder_Id) {
      console.log(
        `Fetching Sample Graded Specs for workOrder_Id: ${workOrder_Id}`
      );
      sampleGradedSpecsList = await SampleGradedSpecs.find({
        workOrder_Id,
      })
        .populate("item_type_Id", "name")
        .populate({
          path: "spec_template_Id",
          select: "_id Name name Size_Range Point_of_Measure",
        })
        .populate({
          path: "workOrder_Id",
          select: "-__v",
          populate: [
            { path: "vendor", select: "name" },
            { path: "categories", select: "name" },
            { path: "itemType", select: "name" },
            { path: "subCategories", select: "name" },
            { path: "trim_id", select: "name" },
            {
              path: "pictures",
              select: "imageUrl category imageTitle imageName",
            },
            {
              path: "buttonImages.image",
              select: "imageUrl category imageTitle imageName",
            },
            {
              path: "rivetImages.image",
              select: "imageUrl category imageTitle imageName",
            },
            {
              path: "trimImages.image",
              select: "imageUrl category imageTitle imageName",
            },
          ],
        })
        .lean();
    } else if (techpack_Id) {
      console.log(
        `Fetching Sample Graded Specs for techpack_Id: ${techpack_Id}`
      );
      sampleGradedSpecsList = await SampleGradedSpecs.find({
        techpack_Id,
      })
        .populate("item_type_Id", "name")
        .populate({
          path: "spec_template_Id",
          select: "_id Name name Size_Range Point_of_Measure",
        })
        .populate({
          path: "techpack_Id",
          select: "-__v",
          populate: [
            { path: "vendor", select: "name" },
            { path: "categories", select: "name" },
            { path: "itemType", select: "name" },
            { path: "subCategory", select: "name" },
            { path: "labelTrim", select: "name" },
            {
              path: "pictures",
              select: "imageUrl category imageTitle imageName",
            },
            {
              path: "buttonImages.image",
              select: "imageUrl category imageTitle imageName",
            },
            {
              path: "rivetImages.image",
              select: "imageUrl category imageTitle imageName",
            },
          ],
        })
        .lean();
    }

    if (!sampleGradedSpecsList.length) {
      return res
        .status(404)
        .json({ message: "No Sample Graded Specs found for this ID" });
    }

    let extraDetails;
    if (workOrder_Id) {
      extraDetails = await ItemDetail.find({ workOrder_Id })
        .select("style_number")
        .lean();
    } else if (techpack_Id) {
      extraDetails = await SampleRequest.find({ techpack_Id }).lean();
    }

    const data = sampleGradedSpecsList.map((spec) => ({
      _id: spec._id,
      style_number:
        extraDetails
          ?.map((d) => d.style_number)
          .filter(Boolean)
          .join(", ") || "Not Available",
      stylenumbers: spec.workOrder_Id?.stylenumbers || [], // Added stylenumbers from workOrder
      size_range: spec.size_range,
      fabric_content: spec.fabric_content,
      DesignDate: spec.DesignDate ?? null,
      IntialDate: spec.IntialDate ?? null,
      FirstPPdate: spec.FirstPPdate ?? null,
      Rev1date: spec.Rev1date ?? null,
      SecondPPdate: spec.SecondPPdate ?? null,
      Rev2date: spec.Rev2date ?? null,
      ThirdPPdate: spec.ThirdPPdate ?? null,
      Finaldate: spec.Finaldate ?? null,
      Shipdate: spec.Shipdate ?? null,
      size: spec.size,
      createddate: spec.createdAt,
      garment_specs_details: spec.garment_specs_details,
      customer_or_brand: spec.customer_or_brand,
      name: spec.item_type_Id?.name || "Not Available",
      spec_template: spec.spec_template_Id
        ? {
          _id: spec.spec_template_Id._id,
          Name: spec.spec_template_Id.Name,
          size_range: spec.spec_template_Id.Size_Range || "Not Available",
        }
        : {
          _id: "Not Available",
          Name: "Not Available",
          size_range: "Not Available",
        },
      workOrder: spec.workOrder_Id
        ? {
          _id: spec.workOrder_Id._id,
          workOrderId: spec.workOrder_Id.workOrderId,
          vendor: spec.workOrder_Id.vendor || {
            name: "Not Available",
          },
          category: spec.workOrder_Id.category || {
            name: "Not Available",
          },
          itemType: spec.workOrder_Id.itemType || {
            name: "Not Available",
          },
          subCategory: spec.workOrder_Id.subCategory || {
            name: "Not Available",
          },
          trim_id: spec.workOrder_Id.trim_id || [],
          etd: spec.workOrder_Id.etd || "Not Available",
          pictures: spec.workOrder_Id.pictures || [],
          buttonImages: spec.workOrder_Id.buttonImages || [],
          rivetImages: spec.workOrder_Id.rivetImages || [],
          trimImages: spec.workOrder_Id.trimImages || [],
          stylenumbers: spec.workOrder_Id.stylenumbers || [], // Also included in workOrder object
          createdAt: spec.workOrder_Id.createdAt || "Not Available",
        }
        : null,
      techpack: spec.techpack_Id
        ? {
          _id: spec.techpack_Id._id || { name: "Not Available" },
          techpackId: spec.techpack_Id,
          styleId: spec.techpack_Id.styleId,
          vendor: spec.techpack_Id.vendor || {
            name: "Not Available",
          },
          category: spec.techpack_Id.category || {
            name: "Not Available",
          },
          itemType: spec.techpack_Id.itemType || {
            name: "Not Available",
          },
          subCategory: spec.techpack_Id.subCategory || {
            name: "Not Available",
          },
          trim_id: spec.techpack_Id.trim_id || [],
          etd: spec.techpack_Id.etd || "Not Available",
          pictures: spec.techpack_Id.pictures || [],
          buttonImages: spec.techpack_Id.buttonImages || [],
          rivetImages: spec.techpack_Id.rivetImages || [],
          trimImages: spec.techpack_Id.trimImages || [],
          createdAt: spec.techpack_Id.createdAt || "Not Available",
        }
        : null,
      details: extraDetails?.length ? extraDetails : "No Details Found",
    }));

    res.status(200).json({
      message: "Sample Graded Specs and related data retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Sample Graded Specs:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getAllTechpackBasedSampleGradedSpecs = async (_req, res) => {
  try {
    console.log("Fetching all techpack-based sample graded specs");

    // Query for documents with techpack_Id and without workOrder_Id
    const query = {
      techpack_Id: { $exists: true, $ne: null },
      $or: [{ workOrder_Id: { $exists: false } }, { workOrder_Id: null }],
    };

    const sampleGradedSpecsList = await SampleGradedSpecs.find(query)
      .populate("item_type_Id", "name")
      .populate({
        path: "spec_template_Id",
        select: "_id Name name Size_Range Point_of_Measure",
      })
      .populate({
        path: "techpack_Id",
        select: "-__v",
        populate: [
          { path: "vendor", select: "name" },
          { path: "category", select: "name" },
          { path: "itemType", select: "name" },
          { path: "subCategory", select: "name" },
          { path: "labelTrim", select: "name" },
          {
            path: "pictures",
            select: "imageUrl category imageTitle imageName",
          },
          {
            path: "buttonImages.image",
            select: "imageUrl category imageTitle imageName",
          },
          {
            path: "rivetImages.image",
            select: "imageUrl category imageTitle imageName",
          },
        ],
      })
      .lean();

    if (!sampleGradedSpecsList.length) {
      return res.status(404).json({
        message: "No techpack-based sample graded specs found",
        data: [],
      });
    }

    // Get all unique techpack IDs
    const techpackIds = sampleGradedSpecsList
      .map((spec) => spec.techpack_Id?._id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    // Get additional details
    const extraDetails =
      techpackIds.length > 0
        ? await SampleRequest.find({
          techpack_Id: { $in: techpackIds },
        }).lean()
        : [];

    // Format response
    const data = sampleGradedSpecsList.map((spec) => {
      const specTechpackId = spec.techpack_Id?._id?.toString();

      return {
        _id: spec._id,
        style_number:
          extraDetails
            .filter((d) => d.techpack_Id?.toString() === specTechpackId)
            .map((d) => d.style_number)
            .filter(Boolean)
            .join(", ") || "Not Available",
        size_range: spec.size_range,
        fabric_content: spec.fabric_content,
        DesignDate: spec.DesignDate ?? null,
        IntialDate: spec.IntialDate ?? null,
        FirstPPdate: spec.FirstPPdate ?? null,
        Rev1date: spec.Rev1date ?? null,
        SecondPPdate: spec.SecondPPdate ?? null,
        Rev2date: spec.Rev2date ?? null,
        ThirdPPdate: spec.ThirdPPdate ?? null,
        Finaldate: spec.Finaldate ?? null,
        Shipdate: spec.Shipdate ?? null,
        size: spec.size,
        createddate: spec.createdAt,
        garment_specs_details: spec.garment_specs_details,
        customer_or_brand: spec.customer_or_brand,
        name: spec.item_type_Id?.name || "Not Available",
        spec_template: spec.spec_template_Id
          ? {
            _id: spec.spec_template_Id._id,
            Name: spec.spec_template_Id.Name,
            size_range: spec.spec_template_Id.Size_Range || "Not Available",
          }
          : null,
        techpack: spec.techpack_Id
          ? {
            _id: spec.techpack_Id._id,
            techpackId: spec.techpack_Id.techPackId,
            styleId: spec.techpack_Id.styleId,
            vendor: spec.techpack_Id.vendor || {
              name: "Not Available",
            },
            category: spec.techpack_Id.category || {
              name: "Not Available",
            },
            itemType: spec.techpack_Id.itemType || {
              name: "Not Available",
            },
            subCategory: spec.techpack_Id.subCategory || {
              name: "Not Available",
            },
            labelTrim: spec.techpack_Id.labelTrim || {
              name: "Not Available",
            },
            etd: spec.techpack_Id.etd || "Not Available",
            pictures: spec.techpack_Id.pictures || [],
            buttonImages: spec.techpack_Id.buttonImages || [],
            rivetImages: spec.techpack_Id.rivetImages || [],
            createdAt: spec.techpack_Id.createdAt || "Not Available",
          }
          : null,
        details:
          extraDetails.filter(
            (d) => d.techpack_Id?.toString() === specTechpackId
          ) || "No Details Found",
      };
    });

    res.status(200).json({
      message: "Techpack-based sample graded specs retrieved successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error in getAllTechpackBasedSampleGradedSpecs:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
  }
};




// exports.getSamplesWithGradedSpecs = async (_req, res) => {
//   try {
//     // First find all the original sample IDs that have been copied (with fresh data)
//     const copiedSamples = await CopiedSampleGradedSpecs.find({})
//       .select("originalSampleGradedId copiedPOMs")
//       .lean()
//       .session(undefined); // Ensure we don't use a cached session

//     // Create a map of originalSampleId to POMs
//     const samplePomsMap = {};
//     copiedSamples.forEach(sample => {
//       if (sample.originalSampleGradedId) {
//         samplePomsMap[sample.originalSampleGradedId.toString()] = sample.copiedPOMs || [];
//       }
//     });

//     // Extract the unique original sample IDs
//     const originalSampleIds = Object.keys(samplePomsMap);

//     // If no graded specs exist, return empty array
//     if (originalSampleIds.length === 0) {
//       return res.status(200).json({
//         message: "No sample graded specs have been created yet.",
//         data: [],
//       });
//     }

//     // Find all samples that have been used to create graded specs (fresh data)
//     const samples = await SampleGradedSpecs.find({
//       _id: { $in: originalSampleIds }
//     })
//       .select("-__v -updatedAt -techpack_Id") // Exclude meta fields and techpack
//       .populate({
//         path: "workOrder_Id",
//         select: "-__v -updatedAt -techpack", // Only include work order data
//         options: { lean: true } // Ensure fresh population
//       })
//       .populate({
//         path: "spec_template_Id",
//         options: { lean: true } // Ensure fresh population
//       })
//       .populate({
//         path: "item_type_Id",
//         options: { lean: true } // Ensure fresh population
//       })
//       .lean()
//       .session(undefined); // Ensure we don't use a cached session

//     // Enhance samples with POMs information
//     const enhancedSamples = samples.map(sample => {
//       return {
//         ...sample,
//         gradedSpecsPoms: samplePomsMap[sample._id.toString()] || []
//       };
//     });

//     res.status(200).json({
//       message: "Sample Graded Specs retrieved successfully with work order data and POMs information.",
//       data: enhancedSamples,
//     });
//   } catch (error) {
//     console.error("Error fetching sample graded specs:", error);
//     res.status(500).json({
//       message: "Internal server error while fetching sample graded specs",
//       error: error.message,
//     });
//   }
// };



exports.getSamplesWithGradedSpecs = async (_req, res) => {
  try {
    // First find all the original sample IDs that have been copied (with fresh data)
    const copiedSamples = await CopiedSampleGradedSpecs.find({})
      .select("originalSampleGradedId copiedPOMs")
      .lean()
      .session(undefined);

    // Create a map of originalSampleId to POMs
    const samplePomsMap = {};
    copiedSamples.forEach(sample => {
      if (sample.originalSampleGradedId) {
        samplePomsMap[sample.originalSampleGradedId.toString()] = sample.copiedPOMs || [];
      }
    });

    // Extract the unique original sample IDs
    const originalSampleIds = Object.keys(samplePomsMap);

    if (originalSampleIds.length === 0) {
      return res.status(200).json({
        message: "No sample graded specs have been created yet.",
        data: [],
      });
    }

    // Find all samples that have been used to create graded specs AND have work orders
    const samples = await SampleGradedSpecs.find({
      _id: { $in: originalSampleIds },
      workOrder_Id: { $exists: true, $ne: null } // Only include samples with work orders
    })
      .select("-__v -updatedAt -techpack_Id")
      .populate({
        path: "workOrder_Id",
        select: "-__v -updatedAt -techpack",
        options: { lean: true }
      })
      .populate({
        path: "spec_template_Id",
        options: { lean: true }
      })
      .populate({
        path: "item_type_Id",
        options: { lean: true }
      })
      .lean()
      .session(undefined);

    // Enhance samples with POMs information
    const enhancedSamples = samples.map(sample => {
      return {
        ...sample,
        gradedSpecsPoms: samplePomsMap[sample._id.toString()] || []
      };
    });

    res.status(200).json({
      message: "Sample Graded Specs with work orders retrieved successfully with POMs information.",
      data: enhancedSamples,
    });
  } catch (error) {
    console.error("Error fetching sample graded specs:", error);
    res.status(500).json({
      message: "Internal server error while fetching sample graded specs",
      error: error.message,
    });
  }
};


exports.getTechpackSamplesWithGradedSpecs = async (_req, res) => {
  try {
    // First find all the original sample IDs that have been copied
    const copiedSamples = await CopiedSampleGradedSpecs.find({})
      .select("originalSampleGradedId copiedPOMs")
      .lean()
      .session(undefined);

    // Create a map of originalSampleId to POMs
    const samplePomsMap = {};
    copiedSamples.forEach(sample => {
      if (sample.originalSampleGradedId) {
        samplePomsMap[sample.originalSampleGradedId.toString()] = sample.copiedPOMs || [];
      }
    });

    // Extract the unique original sample IDs
    const originalSampleIds = Object.keys(samplePomsMap);

    if (originalSampleIds.length === 0) {
      return res.status(200).json({
        message: "No sample graded specs have been created yet.",
        data: [],
      });
    }

    // Find all samples WITHOUT work orders but WITH techpack references
    const samples = await SampleGradedSpecs.find({
      _id: { $in: originalSampleIds },
      workOrder_Id: { $exists: false },
      techpack_Id: { $exists: true, $ne: null }
    })
      .select("-__v -updatedAt -workOrder_Id")
      .populate({
        path: "techpack_Id",
        select: "-__v", // Exclude version key, include all other fields
        options: { lean: true }
      })
      .populate({
        path: "spec_template_Id",
        select: "-__v", // Include all spec template fields
        options: { lean: true }
      })
      .populate({
        path: "item_type_Id",
        select: "-__v", // Include all item type fields
        options: { lean: true }
      })
      .lean()
      .session(undefined);

    // Enhance samples with POMs information and complete document data
    const enhancedSamples = samples.map(sample => {
      return {
        ...sample, // Includes all sample fields
        gradedSpecsPoms: samplePomsMap[sample._id.toString()] || [],
        // Include complete techpack document (not just _id)
        techpack: sample.techpack_Id ? {
          ...sample.techpack_Id // Spread all techpack fields
        } : null,
        // Include complete spec template document
        spec_template_Id: sample.spec_template_Id ? {
          ...sample.spec_template_Id // Spread all spec template fields
        } : null,
        // Include complete item type document
        item_type_Id: sample.item_type_Id ? {
          ...sample.item_type_Id // Spread all item type fields
        } : null
      };
    });

    res.status(200).json({
      message: "Techpack-related Sample Graded Specs retrieved successfully.",
      data: enhancedSamples,
    });
  } catch (error) {
    console.error("Error fetching techpack sample graded specs:", error);
    res.status(500).json({
      message: "Internal server error while fetching techpack sample graded specs",
      error: error.message,
    });
  }
};