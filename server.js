const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Import routes
const pictureRoutes = require("./routes/picture/PictureRoutes");
const trimRoutes = require("./routes/trim/TrimRoutes");
const techPackRoutes = require("./routes/techpack/TechPackRoutes");
const vendorRoutes = require("./routes/vendor/VendorRoutes");
const categoryRoutes = require("./routes/category/CategoryRoutes");
const subCategoryRoutes = require("./routes/subcategory/SubCategoryRoutes");
const itemTypeRoutes = require("./routes/itemtype/ItemTypeRoutes");
const colorRoutes = require("./routes/color/ColorRoutes");
const sizeScaleRoutes = require("./routes/sizescale/SizeScaleRoutes");
const sizeBreakRoutes = require("./routes/sizebreak/SizeBreakRoutes");
const clientRoutes = require("./routes/client/ClientRoutes");
const sampleRequestRoutes = require("./routes/samplerequest/SampleRequestRoutes");
const styleDetailRoutes = require("./routes/styledetail/StyleDetailRoutes");
const washDetailRoutes = require("./routes/washdetails/WashDetailRoutes");
const pointOfMeasureRoutes = require("./routes/pom/PomRoutes");
const sizeRangeRoutes = require("./routes/sizerange/SizeRangeRoutes");
const garmentTypeRoutes = require("./routes/garmenttype/GarmentTypeRoutes");
const newScaleAssignmentRoutes = require("./routes/newsizescaleassignment/NewSizeScaleAssignmentRoutes");
const classRoutes = require("./routes/class/ClassRoutes");
const washColorNewDetailRoutes = require("./routes/washcolordetail/WashColorDetailRoutes");
const styleNewDetailRoutes = require("./routes/stylenewdetail/StyleNewDetailRoutes");
const sampleGradedSpecsRoutes = require("./routes/samplegradedspecs/SampleGradedSpecsRoutes");
const copiedSpecsTemplatePomRoutes = require("./routes/copiedspecstemplatepom/CopiedSpecsTemplatePomRoutes");
const specsTempalteRoutes = require("./routes/specstemplate/SpecsTemplateRoutes");
const specsTempaltePomRoutes = require("./routes/specstemplatepom/SpecsTemplatePomRoutes");
const workOrderRoutes = require("./routes/workorder/WorkOrderRoutes");
const asnRoutes = require("./routes/asn/ASNRoutes");
const arrangementRoutes = require("./routes/arrangement/ArrangementRoutes");
const userRoutes = require("./routes/user/UserRoutes");
const copiedSampleRoutes = require("./routes/copiedsamplegradedspecs/CopiedSampleGradedSpecsRoutes");
const sampleStatusRoutes = require("./routes/samplestatus/SampleStatusRoutes");
const sampleRequestingStatusRoutes = require("./routes/samplerequestingstatus/SampleRequestingStatusRoutes");
const designCommentRoutes = require("./routes/designcomment/DesignCommentRoutes");
const fitCommentsRoutes = require("./routes/fitcomment/FitCommentRoutes");
const digitalPatternRoutes = require("./routes/digitalpattern/DigitalPatternRoutes");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(logger("dev"));
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initializeDbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

initializeDbConnection();

// Routes
app.use("/api/trim", trimRoutes);
app.use("/api/picture", pictureRoutes);
app.use("/api/techPack", techPackRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);

app.use("/api/item-types", itemTypeRoutes);
app.use("/api/garment-type", garmentTypeRoutes);

app.use("/api/colors", colorRoutes);
app.use("/api/size-scales", sizeScaleRoutes);
app.use("/api/size-breaks", sizeBreakRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/sample-requests", sampleRequestRoutes);
app.use("/api/style-details", styleDetailRoutes);
app.use("/api/wash-details", washDetailRoutes);
app.use("/api/point-of-measure", pointOfMeasureRoutes);

app.use("/api/size-range", sizeRangeRoutes);
app.use("/api/new-scale-assignments", newScaleAssignmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/wash-color-new-details", washColorNewDetailRoutes);
app.use("/api/style-new-details", styleNewDetailRoutes);
app.use("/api/sampleGradedSpecs", sampleGradedSpecsRoutes);
app.use(copiedSpecsTemplatePomRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/asn", asnRoutes);
app.use("/api/arrangements", arrangementRoutes);
app.use("/api/users", userRoutes);
app.use("/api", sampleStatusRoutes);
app.use("/api", sampleRequestingStatusRoutes);
app.use("/api", designCommentRoutes);
app.use("/api", fitCommentsRoutes);
app.use("/api/copied-samples", copiedSampleRoutes);
app.use("/api/digital-patterns", digitalPatternRoutes);
app.use("/api/specsTemplates", specsTempalteRoutes);
app.use("/api/specsTemplates", specsTempaltePomRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong",
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
