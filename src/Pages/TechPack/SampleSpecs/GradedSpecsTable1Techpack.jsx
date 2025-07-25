import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Modal,
  Alert,
  Snackbar,
  Checkbox,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useEffect } from "react";
import { TextField } from "@mui/material";
import axios from "axios";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentPasteOffIcon from "@mui/icons-material/ContentPasteOff";
import dayjs from "dayjs";
import { cleanDigitSectionValue } from "@mui/x-date-pickers/internals/hooks/useField/useField.utils";
import { PictureAsPdf, Delete, AutoAwesome } from "@mui/icons-material"; // Import icons
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import GradedSpecsTable2Techpack from "./GradedSpecsTable2Techpack";
import api from "../../../ApiServices/api";

function GradedSpecsTable1Techpack({ TechPackId }) {
  const [selectedButton, setSelectedButton] = useState("one");
  const [itemType, setGarmentType] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedToggle, setSelectedToggle] = useState("");
  const [GradedSpecsdata, setGradedSpecsdata] = useState(null);

  const fetchWorkOrderData = async () => {
    try {
      const response = await api.get(
        `/api/copied-samples/copied-sample-graded-specs/techpack/${TechPackId}`
      );
      setGradedSpecsdata(response?.data?.copiedSamples);
      setLoading(false);
    } catch (err) {
      setError(
        err.message || "An error occurred while fetching work order data"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrderData();
  }, [TechPackId]);

  const handleDataUpdate = () => {
    fetchWorkOrderData();
  };

  console.log(GradedSpecsdata, "GradedSpecsdata");

  // TechPackId idddddd
  console.log(TechPackId, "TechPackId");

  //new template value selected
  const [selectedValuenewtempalte, setSelectedValuenewtempalte] = useState([]);

  const handleDropdownChangenewtempalte = (event) => {
    setSelectedValuenewtempalte(event.target.value);
  };

  const [open, setOpen] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = (index) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

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

  const handleReset = () => {
    setGarmentType(""); // Reset garment type dropdown
    setSelectedValue(""); // Reset size range dropdown
    setSelectedToggle(""); // Reset toggle button selection
    setSelectedValuenewtempalte(""); // Reset conditional dropdown
  };

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [opennoti, setOpennoti] = useState(false);
  const [severity, setSeverity] = useState("success");

  const postData = async () => {
    try {
      const payload = {
        size_range: selectedValue,
        item_type_id: itemType,
        spec_template_Id: selectedValuenewtempalte,
        techpack_Id: TechPackId,
      };

      const res = await api.post("/api/sampleGradedSpecs", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResponse(res.data);
      setSeverity("success");
      setOpennoti(true);
      handleReset();
      console.log(res.data, "response created");

      // Fetch updated data after successful post
      fetchData();
    } catch (err) {
      setError(err.response ? err.response.data : err.message);
      setSeverity("error");
      setOpennoti(true);
    }
  };

  const [dataSampleSpec, setDataSampleSpec] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/sampleGradedSpecs/specs/${TechPackId}`
      );
      setDataSampleSpec(response?.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch data when TechPackId changes
  useEffect(() => {
    fetchData();
  }, [TechPackId]);

  const [selectedSize, setSelectedSize] = useState({});

  console.log(selectedSize, "selectedSize newwwww");
  const getSizeOptions = (range) => {
    if (range === "1-19") {
      return [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]?.map(String);
    } else if (range === "7-16") {
      return [7, 8, 10, 12, 14, 16]?.map(String);
    } else if (range === "0-16") {
      return [0, 2, 4, 6, 8, 10, 12, 14, 16]?.map(String);
    } else if (range === "14-28") {
      return [14, 16, 18, 20, 22, 24, 26, 28]?.map(String);
    } else if (range === "1X-4X") {
      return ["X", "XX", "XXX", "XXXX"];
    } else if (range === "XS-XXL") {
      return ["XS", "S", "M", "L", "XL", "XXL"];
    }
    return [];
  };

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

  const handleAPIUpdate = async (id) => {
    try {
      if (!updatedFields[id]) return; // No changes, don't send request

      await api.put(`/api/sampleGradedSpecs/${id}`, updatedFields[id]);

      console.log(`Updated ID: ${id}`, updatedFields[id]);

      // Clear only the updated fields after saving
      setUpdatedFields((prev) => ({ ...prev, [id]: {} }));
    } catch (error) {
      console.error("Error updating:", error);
    }
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
    <div>
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

            <Box
              display="flex"
              flexDirection="column"
              alignItems="start"
              gap={2}
            >
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
                                  value={content?.techpack_Id?.styleId}
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

                                <Typography variant="h8">Pack #</Typography>
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  margin="dense"
                                  value={content?.techpack_Id?.techPackId}
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
                                <Typography variant="h8">
                                  Garment Type
                                </Typography>
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  margin="dense"
                                  value={content?.techpack_Id?.itemType?.name}
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
                                {console.log(content, "for sizeeeee")}
                                <TextField
                                  fullWidth
                                  disabled
                                  variant="outlined"
                                  margin="dense"
                                  value={content?.size || ""}
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
                              {content?.techpack_Id?.pictures[0]?.imageUrl && (
                                <img
                                  src={
                                    content?.techpack_Id?.pictures[0]?.imageUrl
                                  }
                                  alt="Work order"
                                  style={{
                                    width: "200px",
                                    height: "300px",
                                    objectFit: "cover", // This ensures the image covers the area without distortion
                                  }}
                                />
                              )}
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
                      TechPackId={TechPackId}
                      specId={content.spec_template._id}
                    /> */}
                      <GradedSpecsTable2Techpack
                        TechPackId={TechPackId}
                        specId={content?._id}
                        copiedPOMs={content?.copiedPOMs}
                        realPOMs={content?.realPOMs}
                        onDataUpdate={handleDataUpdate}
                        size={content?.size}
                      />
                    </>
                  }
                </Box>
              ))}
            </Box>
          </Box>
        </>
      </Box>
    </div>
  );
}

export default GradedSpecsTable1Techpack;
