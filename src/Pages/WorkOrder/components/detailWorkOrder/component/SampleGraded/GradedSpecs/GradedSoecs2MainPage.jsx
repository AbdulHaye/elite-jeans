import { useState } from "react";
import { Box, Button, Typography, Modal } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useEffect } from "react";
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import { PictureAsPdf } from "@mui/icons-material"; // Import icons
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import GradedSpec2Table from "./GradedSpec2Table";
import api from "../../../../../../../ApiServices/api";
import { useNavigate } from "react-router-dom";

function GradedSoecs2MainPage({ workOrderkId, generatedSampleGradedSpecId }) {
  const [selectedButton, setSelectedButton] = useState("one");
  const [itemType, setGarmentType] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedToggle, setSelectedToggle] = useState("");

  const [sizeRange, setsizeRange] = useState("");

  const navigate = useNavigate();
  const fetchWorkOrderData = async () => {
    try {
      const response = await api.get(
        `/api/copied-samples/copied-sample-graded-specs/workorder/${workOrderkId}`
      );
      setGradedSpecsdata(response?.data?.copiedSamples);
      setLoading(false);
    } catch (err) {
      setError(
        err.message || "An error occurred while fetching work order data"
      );
      setLoading(false);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };

  const [GradedSpecsdata, setGradedSpecsdata] = useState(null);

  useEffect(() => {
    fetchWorkOrderData();
  }, [workOrderkId]);

  const handleDataUpdate = () => {
    fetchWorkOrderData();
  };

  console.log(GradedSpecsdata, "GradedSpecsdata");

  // workOrderkId idddddd
  console.log(workOrderkId, "workOrderkId");

  //new template value selected
  const [selectedValuenewtempalte, setSelectedValuenewtempalte] = useState([]);

  const [open, setOpen] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = (index) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  useEffect(() => {
    const index = GradedSpecsdata
      ? GradedSpecsdata.findIndex((item) => item._id === generatedSampleGradedSpecId)
      : undefined;
    if (index && index != -1) setActiveIndex(index);
  }, [GradedSpecsdata]);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
    ...theme.applyStyles("dark", {
      backgroundColor: "#1A2027",
    }),
  }));

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [opennoti, setOpennoti] = useState(false);
  const [severity, setSeverity] = useState("success");

  const [dataSampleSpec, setDataSampleSpec] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/sampleGradedSpecs/specs/${workOrderkId}`
      );
      setDataSampleSpec(response?.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.message && err.message.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch data when workOrderkId changes
  useEffect(() => {
    fetchData();
  }, [workOrderkId]);

  const [selectedSize, setSelectedSize] = useState({});

  console.log(selectedSize, "selectedSize newwwww");

  const [fabricContentValues, setFabricContentValues] = useState({});
  const [garmentSpecsValues, setGarmentSpecsValues] = useState({});
  const [customerBrandValues, setCustomerBrandValues] = useState({});
  const [updatedFields, setUpdatedFields] = useState({}); // Track edited fields

  const handleInputChange = (id, field, newValue) => {
    setUpdatedFields((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}), // Preserve existing values
        [field]: newValue,
      },
    }));

    if (field === "fabric_content") {
      setFabricContentValues((prev) => ({ ...prev, [id]: newValue }));
    } else if (field === "garment_specs_details") {
      setGarmentSpecsValues((prev) => ({ ...prev, [id]: newValue }));
    } else if (field === "customer_or_brand") {
      setCustomerBrandValues((prev) => ({ ...prev, [id]: newValue }));
    } else if (field === "size") {
      setSelectedSize((prev) => ({ ...prev, [id]: newValue })); // Ensure selectedSize state is updated correctly
    }

    console.log("Updated Fields:", updatedFields); // Debugging
  };

  const handleGeneratePdf = () => {
    const input = document.getElementById("pdf-content");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("download.pdf");
    });
  };
  return (
    <Box sx={{ mt: 3, ml: 1, width: "96%" }}>
      <>
        <Box sx={{ mt: 5 }}>
          {/* Add Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<MenuBookIcon />}
            onClick={() => setOpen(true)}
          >
            Add
          </Button>
          <hr />

          {/* Modal */}
          <Modal open={open} onClose={() => setOpen(false)}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
              }}
            >
              Switch to "Sample Specs" view in order to add a new one.
            </Box>
          </Modal>

          <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
            <Box
              display="flex"
              gap={1}
              mb={2}
              flexWrap="wrap"
              sx={{ width: "80%" }}
            >
              {GradedSpecsdata?.map((item, index) => (
                <Button
                  key={item._id} // Use a unique ID instead of index for better performance
                  variant={activeIndex === index ? "contained" : "outlined"}
                  onClick={() => handleClick(index)}
                  sx={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  {`Graded Spec ${index + 1}`}{" "}
                  {/* Adjusting index for better readability */}
                </Button>
              ))}
            </Box>

            {/* Content Display */}
            {GradedSpecsdata?.map((content, index) => (
              <Box
                key={index}
                display={activeIndex === index ? "block" : "none"}
                p={2}
                bgcolor="grey.200"
                borderRadius={2}
                sx={{ width: "100%" }}
                id="pdf-content"
              >
                {
                  <>
                    <Box display="flex" justifyContent="center" gap={2} p={2}>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<PictureAsPdf />}
                        onClick={handleGeneratePdf}
                      >
                        Generate PDF
                      </Button>
                    </Box>

                    <Box sx={{ width: "100%" }}>
                      <Grid
                        container
                        rowSpacing={1}
                        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                      >
                        <Grid item xs={12} sm={6} md={3}>
                          <Item>
                            {" "}
                            <Box
                              p={2}
                              bgcolor="grey.200"
                              borderRadius={2}
                              width="auto"
                            >
                              <Typography variant="h8">Style #</Typography>
                              <TextField
                                disabled
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                value={
                                  Array.isArray(content?.style_number)
                                    ? content?.style_number
                                        ?.map((item) => item?.style_number)
                                        .join(", ")
                                    : ""
                                }
                                InputProps={{ readOnly: true }}
                              />

                              <Typography variant="h8">Created on</Typography>
                              <TextField
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                value={content?.createdAt?.split("T")[0]}
                                disabled // Make field non-editable
                                sx={{
                                  height: "30px",
                                  "& .MuiInputBase-root": {
                                    height: "30px",
                                    fontSize: "12px",
                                    backgroundColor: "#f0f0f0", // Optional: Light gray background for disabled look
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "5px",
                                    fontSize: "12px",
                                  },
                                }}
                              />

                              <Typography variant="h8">Order #</Typography>
                              <TextField
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                value={content?.workOrder_Id?.workOrderId}
                                disabled // Make field non-editable
                                sx={{
                                  height: "30px",
                                  "& .MuiInputBase-root": {
                                    height: "30px",
                                    fontSize: "12px",
                                    backgroundColor: "#f0f0f0", // Optional: Light gray background for disabled look
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "5px",
                                    fontSize: "12px",
                                  },
                                }}
                              />
                            </Box>
                          </Item>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Item>
                            <Box
                              p={2}
                              bgcolor="grey.200"
                              borderRadius={2}
                              width="auto"
                            >
                              <Typography variant="h8">Garment Type</Typography>
                              {console.log(
                                content,
                                "garment typeeeeeeeeeeeee checkkkkk"
                              )}

                              {console.log("size range:::::::::", content)}
                              <TextField
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                value={content?.workOrder_Id?.itemType?.name}
                                disabled // Make field non-editable
                                sx={{
                                  height: "30px",
                                  "& .MuiInputBase-root": {
                                    height: "30px",
                                    fontSize: "12px",
                                    backgroundColor: "#f0f0f0", // Optional: Light gray background for disabled look
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "5px",
                                    fontSize: "12px",
                                  },
                                }}
                              />
                              <Typography variant="h6">
                                {" "}
                                {/* 'h8' is invalid; use a valid heading level */}
                                Fabric Content
                              </Typography>
                              <TextField
                                fullWidth
                                disabled
                                variant="outlined"
                                margin="dense"
                                placeholder="Type fabric content..."
                                value={content?.fabric_content}
                                onChange={(e) =>
                                  handleInputChange(
                                    content?._id,
                                    "fabric_content",
                                    e.target.value
                                  )
                                }
                                sx={{
                                  height: "30px",
                                  "& .MuiInputBase-root": {
                                    height: "30px",
                                    fontSize: "12px",
                                    backgroundColor: "#f0f0f0",
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "5px",
                                    fontSize: "12px",
                                  },
                                }}
                              />

                              <Typography variant="h6">
                                Customer / Brand
                              </Typography>
                              <TextField
                                fullWidth
                                disabled
                                variant="outlined"
                                margin="dense"
                                placeholder="Type customer or brand..."
                                value={
                                  customerBrandValues[content?._id] ??
                                  content?.customer_or_brand ??
                                  ""
                                }
                                onChange={(e) =>
                                  setCustomerBrandValues((prev) => ({
                                    ...prev,
                                    [content?._id]: e.target.value, // Ensure full value is stored
                                  }))
                                }
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: "30px",
                                    fontSize: "12px",
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "5px",
                                    fontSize: "12px",
                                  },
                                }}
                              />

                              <Typography variant="h6">Size</Typography>
                              <TextField
                                fullWidth
                                disabled
                                variant="outlined"
                                margin="dense"
                                value={content?.size ?? ""}
                                sx={{
                                  height: "30px",
                                  "& .MuiInputBase-root": {
                                    height: "30px",
                                    fontSize: "12px",
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "5px",
                                    fontSize: "12px",
                                  },
                                }}
                              />
                            </Box>
                          </Item>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Item>
                            <Typography variant="h8">
                              Garment Specs Details
                            </Typography>
                            <TextField
                              fullWidth
                              disabled
                              variant="outlined"
                              margin="dense"
                              placeholder="Type garment specs..."
                              value={
                                content?.garment_specs_details
                                  ? content?.garment_specs_details
                                  : "N/A"
                              }
                              sx={{
                                height: "30px",
                                "& .MuiInputBase-root": {
                                  height: "30px",
                                  fontSize: "12px",
                                },
                                "& .MuiOutlinedInput-input": {
                                  padding: "5px",
                                  fontSize: "12px",
                                },
                              }}
                            />
                          </Item>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Item>
                            <img
                              src=""
                              alt="Displayed"
                              style={{
                                width: "100%",
                                height: "300px",
                                objectFit: "cover",
                              }}
                            />
                          </Item>

                          {/* <Button
                            variant="contained"
                            sx={{ mt: 9 }}
                            onClick={() => handleAPIUpdate(content?._id)}
                          >
                            Save
                          </Button> */}
                        </Grid>
                      </Grid>
                    </Box>

                    {/* <Box display="flex" justifyContent="center" gap={2} p={2}>
                        <Button
                          variant="contained"
                          sx={{ mt: 3 }}
                          onClick={() => handleAPIUpdate(content?._id)}
                        >
                          Save
                        </Button>
                      </Box> */}

                    {/* <GradedSpecTablePage
                      workOrderkId={workOrderkId}
                      specId={content.spec_template._id}
                    /> */}
                    <GradedSpec2Table
                      workOrderkId={workOrderkId}
                      specId={content?._id}
                      copiedPOMs={content?.copiedPOMs}
                      realPOMs={content?.realPOMs}
                      onDataUpdate={handleDataUpdate}
                      size={content?.size}
                      sizeRange={content?.size_range}
                    />
                  </>
                }
              </Box>
            ))}
          </Box>
        </Box>
      </>
    </Box>
  );
}

export default GradedSoecs2MainPage;
