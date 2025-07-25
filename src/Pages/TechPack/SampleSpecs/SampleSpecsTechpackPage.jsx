// techpack sample specs data

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
  CircularProgress,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useEffect } from "react";
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import {
  PictureAsPdf,
  Delete,
  AutoAwesome,
  ArrowBack,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import GradedSpecsTableTechpack from "./GradedSpecsTableTechpack";
import GradedSpecsTable1Techpack from "./GradedSpecsTable1Techpack";
import api from "../../../ApiServices/api";

function SampleSpecsTechpackPage({ TechPackId }) {
  const [selectedButton, setSelectedButton] = useState("one");
  const [itemType, setGarmentType] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [currentSpecTemplateId, setCurrentSpecTemplateId] = useState(null);
  const [gradedSpecTableData, setGradedSpecTableData] = useState({});
  const [
    TablesDataOfsamplespecsbelowtable,
    setTablesDataOfsamplespecsbelowtable,
  ] = useState([]);
  const [selectedSpecTemplate, setSelectedSpecTemplate] = useState("");
  const [selectedToggle, setSelectedToggle] = useState("new template"); // Default to new template
  const [specTemplates, setSpecTemplates] = useState([]);
  const [selectedStyleForCopy, setSelectedStyleForCopy] = useState("");
  const [copySpecLoading, setCopySpecLoading] = useState(false);
  const [availableStyles, setAvailableStyles] = useState([]);
  const navigate = useNavigate();
  const handleButtonClick = (value) => {
    setSelectedButton(value);
  };
  useEffect(() => {
    fetchSpecTemplates();
  }, []);

  const fetchSpecTemplates = async () => {
    try {
      const response = await api.get("/api/specsTemplates/");
      setSpecTemplates(response?.data?.data || []); // Assuming API returns an array of spec templates
    } catch (error) {
      console.error("Error fetching spec templates:", error);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };

  const handleChange = (event) => {
    setSelectedSpecTemplate(event.target.value);
    // When spec template changes, set the size range from the selected template
    console.log(event, "dropdown selected");
    const selectedTemplate = specTemplates.find(
      (t) => t._id === event.target.value
    );
    console.log(selectedTemplate, "selectedTemplate showwwwwwwwwwwwwwww");
    if (selectedTemplate) {
      setSelectedValue(selectedTemplate.Size_Range);
    }
  };

  const handleDropdownChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const handleToggleChange = (event, newValue) => {
    if (newValue !== null) {
      setSelectedToggle(newValue);
    }
  };

  const [garmentTypes, setGarmentTypes] = useState([]);

  useEffect(() => {
    fetchGarmentTypes();
  }, []);

  const fetchGarmentTypes = async () => {
    try {
      const response = await api.get("/api/item-types/");
      setGarmentTypes(response?.data);
    } catch (error) {
      console.error("Error fetching garment types:", error);
    }
  };

  const [optionsnewtemplate, setOptionsnewtemplate] = useState([]);
  useEffect(() => {
    let isMounted = true;

    if (itemType && selectedValue) {
      api
        .get(`/api/specsTemplates/byGarmentAndSize`, {
          params: {
            garmentTypeId: itemType,
            sizeRange: selectedValue,
          },
        })
        .then((res) => {
          if (isMounted) {
            setOptionsnewtemplate(res?.data?.data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setOptionsnewtemplate([]);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [itemType, selectedValue]);

  const [selectedValuenewtempalte, setSelectedValuenewtempalte] = useState([]);

  const handleDropdownChangenewtempalte = (event) => {
    setSelectedValuenewtempalte(event.target.value);
  };

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = async (index, sampleSpecId) => {
    setActiveIndex(index);
    const currentSpec = dataSampleSpec?.data?.find(
      (item) => item._id === sampleSpecId
    );

    if (currentSpec) {
      // Update the current spec template ID
      setCurrentSpecTemplateId(currentSpec.spec_template?._id);

      // Fetch POM data for the new spec template
      await fetchPOMData(currentSpec.spec_template?._id);

      // Set the selected size if it exists
      if (currentSpec.size) {
        setSelectedSize((prev) => ({
          ...prev,
          [sampleSpecId]: currentSpec.size,
        }));
      }

      // Fetch graded specs data
      if (gradedSpecTableData[sampleSpecId]) {
        setTablesDataOfsamplespecsbelowtable(gradedSpecTableData[sampleSpecId]);
      } else {
        try {
          const response = await api.get(
            `/api/copied-poms/${sampleSpecId}/${currentSpec.spec_template?._id}/`
          );
          setGradedSpecTableData((prev) => ({
            ...prev,
            [sampleSpecId]: response?.data?.data || [],
          }));
          setTablesDataOfsamplespecsbelowtable(response?.data?.data || []);
        } catch (error) {
          console.error("Error fetching graded specs:", error);
          setTablesDataOfsamplespecsbelowtable([]);
        }
      }
    }
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
    setGarmentType("");
    setSelectedValue("");
    setSelectedToggle("");
    setSelectedValuenewtempalte("");
  };

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [opennoti, setOpennoti] = useState(false);
  const [severity, setSeverity] = useState("success");

  const postData = async () => {
    try {
      const selectedTemplate = specTemplates.find(
        (t) => t._id === selectedSpecTemplate
      );

      const payload = {
        size_range: selectedValue,
        item_type_id: selectedTemplate?.itemType?._id,
        spec_template_Id: selectedSpecTemplate, // Always use the selected template
        techpack_Id: TechPackId,
      };

      const res = await api.post("/api/sampleGradedSpecs", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResponse(res?.data);
      setSeverity("success");
      setOpennoti(true);

      // handleReset();
      // setTimeout(() => {
      //   setOpen(false);
      // }, 2000);

      // Reset and close after success
      resetModal();
      setTimeout(() => {
        setOpen(false);
        fetchData(); // Refresh the data
      }, 2000);
      console.log(res.data, "response created");
    } catch (err) {
      setError(err?.response ? err?.response?.data : err?.message);
      setSeverity("error");
      setOpennoti(true);
      if (err.message && err.message.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };

  const [dataSampleSpec, setDataSampleSpec] = useState([]);
  const [loading, setLoading] = useState(true);

  // const fetchData = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await api.get(
  //       `/api/sampleGradedSpecs/specs/techpack/${TechPackId}`
  //     );
  //     setDataSampleSpec(response?.data);

  //     // Initialize with first sample spec's data if available
  //     if (response?.data?.data?.length > 0) {
  //       const firstSpecId = response.data.data[0]._id;
  //       try {
  //         const gradedSpecsResponse = await api.get(
  //           `/api/copied-poms/${firstSpecId}/${response.data.data[0].spec_template?._id}/`
  //         );

  //         setGradedSpecTableData((prev) => ({
  //           ...prev,
  //           [firstSpecId]: gradedSpecsResponse?.data?.data || [],
  //         }));

  //         setTablesDataOfsamplespecsbelowtable(
  //           gradedSpecsResponse?.data?.data || []
  //         );
  //         setActiveIndex(0);
  //       } catch (error) {
  //         console.error("Error fetching initial graded specs:", error);
  //         setTablesDataOfsamplespecsbelowtable([]);
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Error fetching data:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    fetchData();
  }, [TechPackId]);

  const [selectedSize, setSelectedSize] = useState({});

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
  const [updatedFields, setUpdatedFields] = useState({});
  const [editableField, setEditableField] = useState({});
  const [openSnackbarSave, setOpenSnackbarSave] = useState(false);
  const [overrideSize, setoverrideSize] = useState("");

  const handleInputChange = (id, field, newValue) => {
    setUpdatedFields((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
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
      setSelectedSize((prev) => ({ ...prev, [id]: newValue }));
      setoverrideSize(newValue);
    }
  };

  const handleBlur = async (id) => {
    if (!updatedFields[id]) return;

    try {
      await api.put(`/api/sampleGradedSpecs/${id}`, updatedFields[id]);
      setOpenSnackbarSave(true);
      setUpdatedFields((prev) => ({ ...prev, [id]: {} }));
      setEditableField((prev) => ({ ...prev, [id]: {} }));
    } catch (error) {
      console.error("Error updating:", error);
    }
  };

  const makeEditable = (id, field) => {
    setEditableField((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: true },
    }));
  };

  const isEditable = (id, field) => editableField[id]?.[field] ?? false;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleDeleteClick = (samplespecId) => {
    setSelectedId(samplespecId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await api.delete(`/api/sampleGradedSpecs/${selectedId}`);
      setOpenSnackbar(true);
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error?.response?.data || error?.message);
    } finally {
      setIsModalOpen(false);
      setSelectedId(null);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setSelectedId(null);
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

  const [openGradedSpecsSuccess, setOpenGradedSpecsSuccess] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [specToOverride, setSpecToOverride] = useState(null);
  const [isOverriding, setIsOverriding] = useState(false);

  const handleGenerateGradedSpecs = async (id) => {
    try {
      // Get the current size either from selectedSize state or from content
      const currentContent = dataSampleSpec?.data?.find(
        (item) => item._id === id
      );
      const sizeToUse =
        overrideSize || selectedSize[id] || currentContent?.size;

      if (!sizeToUse) {
        setErrorMessage("Please select a size first");
        setOpenErrorSnackbar(true);
        return;
      }

      const response = await api.post("/api/copied-samples/create", {
        sampleGradedSpecsId: id,
        selectedSize: sizeToUse, // Use the current overrideSize
      });
      fetchDataoftechpack();
      console.log("API response of generate graded specs:", response.data);
      setOpenGradedSpecsSuccess(true);
      setTimeout(() => {
        setSelectedButton("two");
      }, 2000);
    } catch (error) {
      if (
        error?.message ===
        "Copied Sample Graded Specs already exists for this sampleGradedSpecsId"
      ) {
        setSpecToOverride(id);
        setOverrideModalOpen(true);
      } else {
        console.error("Error calling API:", error);
        const message =
          error?.response?.data?.message || "Failed to generate Graded Specs";
        setErrorMessage(message);
        setOpenErrorSnackbar(true);
      }
    }
  };

  const handleOverrideConfirm = async () => {
    setIsOverriding(true);
    try {
      const currentContent = dataSampleSpec?.data?.find(
        (item) => item._id === specToOverride
      );
      const sizeToUse =
        overrideSize || selectedSize[specToOverride] || currentContent?.size;

      if (!sizeToUse) {
        setErrorMessage("Please select a size first");
        setOpenErrorSnackbar(true);
        setIsOverriding(false);
        return;
      }

      const response = await api.post("/api/copied-samples/override", {
        sampleGradedSpecsId: specToOverride,
        selectedSize: sizeToUse, // Use the current overrideSize
      });

      console.log("API response of override graded specs:", response.data);
      setOpenGradedSpecsSuccess(true);
      setOverrideModalOpen(false);
      setTimeout(() => {
        setSelectedButton("two");
      }, 2000);
    } catch (error) {
      console.error("Error overriding specs:", error);
      setErrorMessage(error?.message);
      setOpenErrorSnackbar(true);
    } finally {
      setIsOverriding(false);
      setOverrideModalOpen(false);
      setSpecToOverride(null);
    }
  };

  const handleOverrideCancel = () => {
    setOverrideModalOpen(false);
    setSpecToOverride(null);
  };

  // Callback function to receive data from GradedSpecTablePage
  const handleDataFetched = (data, sampleSpecId) => {
    setGradedSpecTableData((prev) => ({
      ...prev,
      [sampleSpecId]: data,
    }));

    // If this is the currently active spec, update the table data
    if (dataSampleSpec?.data?.[activeIndex]?._id === sampleSpecId) {
      setTablesDataOfsamplespecsbelowtable(data);
    }
  };

  console.log(gradedSpecTableData, "gradedSpecTableData data");

  const checkAllFinalFieldsFilled = (tableData) => {
    if (!tableData || tableData.length === 0) return false;

    return tableData?.every((item) => {
      // Check if Final exists and has a non-empty value
      return (
        item.Final !== undefined && item.Final !== null && item.Final !== ""
      );
    });
  };

  // Check conditions for button enable/disable
  const isGenerateButtonDisabled = (content) => {
    // Check if all final fields are filled
    const allFinalsFilled = checkAllFinalFieldsFilled(
      TablesDataOfsamplespecsbelowtable
    );

    // Check if size is selected (either in state or in content)
    const sizeSelected =
      overrideSize || selectedSize[content._id] || content.size || "";

    // Return true (disabled) if either condition is not met
    return !(allFinalsFilled && sizeSelected);
  };
  const [currentSizeRange, setCurrentSizeRange] = useState(null);
  console.log(currentSizeRange, "size rangessssssssssssss");
  const [sizeHeaders, setSizeHeaders] = useState([]);
  const userRole = localStorage.getItem("role");

  const fetchPOMData = async (specTemplateId) => {
    try {
      setSizeHeaders([]);

      const response = await api.get(
        `/api/specsTemplates/poms/Byid/${specTemplateId}`
      );
      const responseData = response?.data?.data;
      setCurrentSizeRange(responseData);

      if (responseData && responseData.length > 0) {
        const firstObject = responseData[0];

        // Fields to exclude
        const excludedHeaders = new Set([
          "Design",
          "Final",
          "FirstPP",
          "Initial",
          "Rev1",
          "Rev2",
          "SecondPP",
          "Ship",
          "ThirdPP",
          "code",
          "createdAt",
          "description",
          "specTemplateId",
          "tolerance",
          "updatedAt",
          "_id",
          "__v",
          "sampleGradedSpecsId",
        ]);

        // Extract size keys
        const sizeKeys = Object.keys(firstObject).filter(
          (key) => !excludedHeaders.has(key)
        );

        // Helper to score size codes
        const getSizeScore = (key) => {
          const upperKey = key.toUpperCase();

          // Numeric sizes (e.g., 28, 30)
          if (/^\d+$/.test(upperKey)) {
            return 1000 + parseInt(upperKey); // Ensure numeric sizes come last
          }

          // Match patterns like XXXXL, XXS, etc.
          const match = upperKey.match(/^(X*)(S|M|L)?$/);
          if (match) {
            const xCount = match[1]?.length || 0;
            const sizeType = match[2] || "";

            const baseScores = {
              "": 300, // Just Xs (e.g., XX)
              S: 100,
              M: 200,
              L: 300,
            };

            return (baseScores[sizeType] || 300) + xCount * 10;
          }

          // Unrecognized pattern — sort alphabetically
          return 9999;
        };

        const filteredSizes = sizeKeys.filter(
          (key) =>
            /^\d+$/.test(key) ||
            /^[xX]+[smlSML]?$/i.test(key) ||
            /^[smlSML]{1,3}$/i.test(key)
        );

        const sortedSizes = filteredSizes.sort((a, b) => {
          return getSizeScore(a) - getSizeScore(b);
        });

        setSizeHeaders(sortedSizes);
      }
    } catch (error) {
      console.error("Error fetching POM data:", error);
    }
  };

  const [allsamplespecsdata, setallsamplespecsdata] = useState();

  useEffect(() => {
    fetchallsamplespecsdata();
  }, []);
  console.log(
    allsamplespecsdata?.workOrder_Id?.stylenumber[0],
    "allsamplespecsdata "
  );
  const fetchallsamplespecsdata = async () => {
    try {
      const response = await api.get("/api/sampleGradedSpecs/allsamplespecs");
      console.log(response?.data?.data, "sample specs all :;:");
      setallsamplespecsdata(response?.data?.data || []); // Assuming API returns an array of spec templates
    } catch (error) {
      console.error("Error fetching spec templates:", error);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };
  // Add this useEffect to populate styles
  useEffect(() => {
    if (allsamplespecsdata && allsamplespecsdata.length > 0) {
      const stylesWithTemplates = allsamplespecsdata
        .filter(
          (spec) =>
            spec.workOrder_Id?.stylenumber?.length > 0 && spec.spec_template_Id
        )
        .flatMap((spec) =>
          spec.workOrder_Id.stylenumber.map((styleNum) => ({
            styleNumber: styleNum,
            specId: spec._id,
            templateId: spec.spec_template_Id._id,
            templateName: spec.spec_template_Id.Name,
            sizeRange: spec.size_range,
          }))
        );
      setAvailableStyles(stylesWithTemplates);
    }
  }, [allsamplespecsdata]);

  // Add this handler for copying specs
  // Update your handleCopySpec function
  const handleCopySpec = async () => {
    if (!selectedStyleForCopy) {
      setErrorMessage("Please select a style number to copy");
      setOpenErrorSnackbar(true);
      return;
    }

    if (!selectedCopySize) {
      setErrorMessage("Please select a size to copy");
      setOpenErrorSnackbar(true);
      return;
    }

    setCopySpecLoading(true);
    try {
      const response = await api.post("/api/sampleGradedSpecs/copy/techpack", {
        styleNumber: selectedStyleForCopy.techpack?.styleId,
        techpack_Id: TechPackId,
        sourceSampleSpecId: selectedStyleForCopy._id,
        size: selectedCopySize,
        spec_template_Id: selectedStyleForCopy.spec_template?._id,
      });

      if (response.data.success) {
        setSeverity("success");
        setOpennoti(true);
        handleReset();
        fetchDataoftechpack();
        // Reset and close after success
        resetModal();
        setTimeout(() => {
          setOpen(false);
          fetchData(); // Refresh the data
        }, 2000);
      } else {
        setErrorMessage(response.data.message || "Failed to copy spec");
        setOpenErrorSnackbar(true);
      }
    } catch (error) {
      console.error("Error copying spec:", error);
      setErrorMessage(
        error.response?.data?.message || error.message || "Failed to copy spec"
      );
      setOpenErrorSnackbar(true);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setCopySpecLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/sampleGradedSpecs/specs/techpack/${TechPackId}`
      );
      setDataSampleSpec(response?.data);

      // Initialize size data for all sample specs
      if (response?.data?.data?.length > 0) {
        const firstSpec = response.data.data[0];
        const firstSpecId = firstSpec._id;
        const firstSpecTemplateId = firstSpec.spec_template?._id;

        // Set the first spec's template as the initial size range
        setCurrentSpecTemplateId(firstSpecTemplateId);
        await fetchPOMData(firstSpecTemplateId);

        // Set the initial selected size if it exists
        if (firstSpec.size) {
          setSelectedSize((prev) => ({
            ...prev,
            [firstSpecId]: firstSpec.size,
          }));
        }

        // Fetch graded specs for the first sample spec
        try {
          const gradedSpecsResponse = await api.get(
            `/api/copied-poms/${firstSpecId}/${firstSpecTemplateId}/`
          );

          setGradedSpecTableData((prev) => ({
            ...prev,
            [firstSpecId]: gradedSpecsResponse?.data?.data || [],
          }));

          setTablesDataOfsamplespecsbelowtable(
            gradedSpecsResponse?.data?.data || []
          );

          setActiveIndex(0);
        } catch (error) {
          console.error("Error fetching initial graded specs:", error);
          setTablesDataOfsamplespecsbelowtable([]);
          if (error?.message && error?.message?.includes("Unauthorized")) {
            navigate("/login");
          }
        }
      }
    } catch (err) {
      setDataSampleSpec("");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataoftechpack();
  }, []);

  const [gettechpackdataofsamplespec, setgettechpackdataofsamplespec] =
    useState("");
  const [copySpecSizes, setCopySpecSizes] = useState([]);
  const [selectedCopySize, setSelectedCopySize] = useState("");
  const [isLoadingSizes, setIsLoadingSizes] = useState(false);

  console.log(gettechpackdataofsamplespec, "gettechpackdataofsamplespec");

  const fetchDataoftechpack = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/sampleGradedSpecs/samples-with-graded-specs/techpack`
      );
      console.log(response, "tech pack graded spec data show:::");
      setgettechpackdataofsamplespec(response?.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sizes when a style is selected
  useEffect(() => {
    const fetchSizesForSelectedSpec = async () => {
      if (!selectedStyleForCopy?._id) {
        setCopySpecSizes([]);
        return;
      }

      setIsLoadingSizes(true);
      try {
        const response = await api.get(
          `/api/sampleGradedSpecs/poms-headers/${selectedStyleForCopy._id}`
        );
        console.log(response, "size show for copy specs");
        setCopySpecSizes(response?.data?.data || []);
        setSelectedCopySize(""); // Reset selected size when changing style
      } catch (error) {
        console.error("Error fetching sizes:", error);
        setCopySpecSizes([]);
      } finally {
        setIsLoadingSizes(false);
      }
    };

    fetchSizesForSelectedSpec();
  }, [selectedStyleForCopy]);

  // Create a reset function for the modal
  const resetModal = () => {
    setSelectedSpecTemplate("");
    setSelectedValue("");
    setSelectedToggle("new template");
    setSelectedStyleForCopy("");
    setSelectedCopySize("");
  };
  return (
    <div>
      <Box sx={{ mt: 3, ml: 1, width: "96%" }}>
        <Modal open={overrideModalOpen} onClose={handleOverrideCancel}>
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
            <Typography variant="h6" component="h2" gutterBottom>
              Override Existing Graded Specs?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Graded specs already exist for this sample. Do you want to
              override them?
            </Typography>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={handleOverrideCancel}
                disabled={isOverriding}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOverrideConfirm}
                disabled={isOverriding}
              >
                {isOverriding ? "Overriding..." : "Yes, Override"}
              </Button>
            </Box>
          </Box>
        </Modal>

        <Box display="flex" gap={3}>
          <Link to={`/tech-pack-detail/${TechPackId}`}>
            <Button
              startIcon={<ArrowBack />}
              variant="outlined"
              sx={{
                backgroundColor: "inherit",
                color: "rgba(0, 0, 0, 0.87)",
                "&:hover": {
                  backgroundColor: "primary.main",
                  color: "#fff",
                },
              }}
            >
              Tech pack
            </Button>
          </Link>
          <ButtonGroup variant="contained" aria-label="Basic button group">
            <Button
              onClick={() => handleButtonClick("one")}
              color={selectedButton === "one" ? "primary" : "inherit"}
            >
              Sample Specs
            </Button>
            <Button
              onClick={() => handleButtonClick("two")}
              color={selectedButton === "two" ? "primary" : "inherit"}
            >
              Graded Specs
            </Button>
          </ButtonGroup>
        </Box>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={2000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={() => setOpenSnackbar(false)} severity="success">
            Deleted successfully!
          </Alert>
        </Snackbar>

        <Snackbar
          open={openSnackbarSave}
          autoHideDuration={2000}
          onClose={() => setOpenSnackbarSave(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={() => setOpenSnackbarSave(false)} severity="success">
            Save successfully!
          </Alert>
        </Snackbar>

        <Snackbar
          open={openGradedSpecsSuccess}
          autoHideDuration={2000}
          onClose={() => setOpenGradedSpecsSuccess(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setOpenGradedSpecsSuccess(false)}
            severity="success"
          >
            Graded Specs generated successfully! Switching to Graded Specs
            tab...
          </Alert>
        </Snackbar>

        <Snackbar
          open={openErrorSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenErrorSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={() => setOpenErrorSnackbar(false)} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>

        {selectedButton === "one" && (
          <>
            <Box sx={{ mt: 5 }}>
              {(userRole === "admin" || userRole === "general") && (
                <Button
                  color="primary"
                  startIcon={<MenuBookIcon />}
                  onClick={() => setOpen(true)}
                  variant="outlined"
                  sx={{
                    backgroundColor: "inherit",
                    color: "rgba(0, 0, 0, 0.87)",
                    "&:hover": {
                      backgroundColor: "primary.main",
                      color: "#fff",
                    },
                  }}
                >
                  Add
                </Button>
              )}

              <hr />

              <Modal
                open={open}
                onClose={() => {
                  resetModal();
                  setOpen(false);
                }}
              >
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
                  {/* Toggle Buttons - Moved to top and more prominent */}
                  <ToggleButtonGroup
                    value={selectedToggle}
                    exclusive
                    onChange={handleToggleChange}
                    sx={{ mb: 3, width: "100%" }}
                  >
                    <ToggleButton
                      value="new template"
                      sx={{
                        width: "50%",
                        backgroundColor:
                          selectedToggle === "new template"
                            ? "#4caf50" // Green for success
                            : "grey.200",
                        color:
                          selectedToggle === "new template"
                            ? "white"
                            : "inherit",
                        "&:hover": {
                          backgroundColor:
                            selectedToggle === "new template"
                              ? "#388e3c" // Darker green on hover
                              : "grey.300",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#4caf50", // Ensure green when selected
                          color: "white",
                          "&:hover": {
                            backgroundColor: "#388e3c", // Darker green on hover when selected
                          },
                        },
                      }}
                    >
                      New Template
                    </ToggleButton>
                    <ToggleButton
                      value="copy spec"
                      sx={{
                        width: "50%",
                        backgroundColor:
                          selectedToggle === "copy spec"
                            ? "#388e3c" // Darker green on hover
                            : "grey.300",
                        color:
                          selectedToggle === "copy spec" ? "white" : "inherit",
                        "&:hover": {
                          backgroundColor:
                            selectedToggle === "copy spec"
                              ? "#388e3c" // Darker green on hover
                              : "grey.300",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#388e3c", // Ensure blue when selected
                          color: "white",
                          "&:hover": {
                            backgroundColor: "#388e3c", // Darker blue on hover when selected
                          },
                        },
                      }}
                    >
                      Copy Spec
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {selectedToggle === "new template" ? (
                    <>
                      {/* New Template Section */}
                      {/* Spec Template Dropdown */}
                      <Typography
                        variant="body1"
                        component="p"
                        sx={{ mt: "1%" }}
                      >
                        Spec Template
                      </Typography>
                      <FormControl sx={{ width: "100%", mt: "1%" }}>
                        <InputLabel>Select Spec Template</InputLabel>
                        <Select
                          value={selectedSpecTemplate}
                          onChange={handleChange}
                          label="Select Spec Template"
                        >
                          {specTemplates?.map((template) => (
                            <MenuItem
                              key={template._id}
                              value={template._id}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "#e3f2fd", // Light gray on hover
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "#e3f2fd", // Light blue when selected
                                },
                                "&.Mui-selected:hover": {
                                  backgroundColor: "#e3f2fd", // Slightly darker blue when selected and hovered
                                },
                              }}
                            >
                              {template.Name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Size Range Dropdown (non-editable) */}
                      <Typography
                        variant="body1"
                        component="p"
                        sx={{ mt: "1%" }}
                      >
                        Size Range
                      </Typography>
                      <FormControl sx={{ width: "100%", mt: "1%" }}>
                        <InputLabel>Size Range</InputLabel>
                        <Select
                          value={selectedValue}
                          onChange={handleDropdownChange}
                          disabled // Make it non-editable
                        >
                          <MenuItem value={selectedValue}>
                            {selectedValue}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      {/* Buttons for New Template */}
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        sx={{ mt: 3 }}
                      >
                        <Button
                          variant="contained"
                          sx={{ backgroundColor: "#B0B0B0", color: "white" }}
                          onClick={handleReset}
                        >
                          Reset
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          onClick={postData}
                          disabled={!selectedSpecTemplate}
                        >
                          Add
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Copy Spec Section */}
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Select Style to Copy From</InputLabel>
                        <Select
                          value={selectedStyleForCopy}
                          onChange={(e) =>
                            setSelectedStyleForCopy(e.target.value)
                          }
                          label="Select Style to Copy From"
                          renderValue={(selected) => (
                            <div>
                              {selected?.techpack?.styleId} -{" "}
                              {selected?.spec_template?.Name} (
                              {selected?.spec_template?.size_range})
                            </div>
                          )}
                        >
                          {gettechpackdataofsamplespec?.data?.map(
                            (style, index) => (
                              <MenuItem
                                key={`${style?.techpack?.styleId}-${index}`}
                                value={style}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "#e3f2fd", // Light gray on hover
                                  },
                                  "&.Mui-selected": {
                                    backgroundColor: "#e3f2fd", // Light blue when selected
                                  },
                                  "&.Mui-selected:hover": {
                                    backgroundColor: "#e3f2fd", // Slightly darker blue when selected and hovered
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <Typography variant="body1">
                                    <strong>Style:</strong>{" "}
                                    {style?.techpack?.styleId}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Template:</strong>{" "}
                                    {style?.spec_template_Id?.Name}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Size Range:</strong>{" "}
                                    {style?.spec_template_Id?.Size_Range}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>

                      {selectedStyleForCopy && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>Select Size to Copy</InputLabel>
                          <Select
                            value={selectedCopySize}
                            onChange={(e) =>
                              setSelectedCopySize(e.target.value)
                            }
                            label="Select Size to Copy"
                            disabled={
                              isLoadingSizes || copySpecSizes.length === 0
                            }
                          >
                            {isLoadingSizes ? (
                              <MenuItem disabled>
                                <CircularProgress size={20} />
                                Loading sizes...
                              </MenuItem>
                            ) : (
                              copySpecSizes.map((size) => (
                                <MenuItem
                                  key={size}
                                  value={size}
                                  sx={{
                                    "&:hover": { backgroundColor: "#e3f2fd" },
                                    "&.Mui-selected": {
                                      backgroundColor: "#e3f2fd",
                                    },
                                  }}
                                >
                                  {size}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      )}
                      <Box
                        display="flex"
                        justifyContent="flex-end"
                        sx={{ mt: 3, gap: 2 }}
                      >
                        <Button
                          variant="outlined"
                          // onClick={handleReset}
                          disabled={copySpecLoading}
                          onClick={() => {
                            resetModal();
                            setOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleCopySpec}
                          disabled={!selectedStyleForCopy || copySpecLoading}
                          startIcon={
                            copySpecLoading ? (
                              <CircularProgress size={20} />
                            ) : null
                          }
                        >
                          {copySpecLoading ? "Copying..." : "Copy Spec"}
                        </Button>
                      </Box>
                    </>
                  )}

                  <Snackbar
                    open={opennoti}
                    autoHideDuration={3000}
                    onClose={() => setOpennoti(false)}
                  >
                    <Alert
                      onClose={() => setOpennoti(false)}
                      severity={severity}
                      sx={{ width: "100%" }}
                    >
                      {severity === "success"
                        ? "successful!"
                        : "Error occurred!"}
                    </Alert>
                  </Snackbar>
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
                  {dataSampleSpec
                    ? dataSampleSpec?.data?.map((item, index) => (
                        <Button
                          key={item._id}
                          variant={
                            activeIndex === index ? "contained" : "outlined"
                          }
                          onClick={() => handleClick(index, item._id)}
                          sx={{ fontSize: "0.75rem", padding: "4px 8px" }}
                        >
                          {`Sample Spec ${index + 1}`}
                        </Button>
                      ))
                    : null}
                </Box>

                {dataSampleSpec
                  ? dataSampleSpec?.data?.map((content, index) => (
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
                            <Typography variant="h6">
                              {content?.spec_template?.Name}
                            </Typography>
                            <Box
                              display="flex"
                              justifyContent="center"
                              gap={2}
                              p={2}
                            >
                              {userRole !== "read_only" && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<AutoAwesome />}
                                  onClick={() =>
                                    handleGenerateGradedSpecs(content?._id)
                                  }
                                  disabled={isGenerateButtonDisabled(content)}
                                  sx={{
                                    "&:disabled": {
                                      backgroundColor: "#e0e0e0",
                                      color: "#a0a0a0",
                                    },
                                  }}
                                >
                                  Generate Graded Specs
                                </Button>
                              )}
                              <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<PictureAsPdf />}
                                onClick={handleGeneratePdf}
                              >
                                Generate PDF
                              </Button>
                              {(userRole === "admin" ||
                                userRole === "general") && (
                                <Button
                                  variant="contained"
                                  color="error"
                                  startIcon={<Delete />}
                                  onClick={() =>
                                    handleDeleteClick(content?._id)
                                  }
                                >
                                  Delete Specs
                                </Button>
                              )}
                            </Box>
                            {isModalOpen && (
                              <div className="modal">
                                <div className="modal-content">
                                  <h2>
                                    Are you sure you want to delete this sample
                                    spec?
                                  </h2>
                                  <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    sx={{ mt: 2 }}
                                  >
                                    <Button
                                      variant="contained"
                                      color="error"
                                      sx={{ mr: 2 }}
                                      onClick={confirmDelete}
                                    >
                                      Yes, Delete
                                    </Button>
                                    <Button
                                      variant="contained"
                                      color="secondary"
                                      onClick={cancelDelete}
                                    >
                                      No, Cancel
                                    </Button>
                                  </Box>
                                </div>
                              </div>
                            )}

                            <Box sx={{ width: "100%" }}>
                              <Grid
                                container
                                rowSpacing={1}
                                columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                              >
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box
                                    p={2}
                                    bgcolor="grey.200"
                                    borderRadius={2}
                                    border="1px solid rgba(0,0,0,0.2)"
                                  >
                                    <Typography variant="h8">
                                      Style #
                                    </Typography>
                                    {console.log(
                                      content,
                                      "this is techack detail"
                                    )}
                                    <TextField
                                      disabled
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      value={content?.techpack?.styleId}
                                      InputProps={{ readOnly: true }}
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

                                    <Typography variant="h8">
                                      Created on
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      value={content?.createddate.split("T")[0]}
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

                                    <Typography variant="h8">
                                      Techpack #
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      value={content?.techpack?.techpackId?.techPackId}
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

                                    <Typography variant="subtitle2">
                                      Garment Type
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      value={content?.techpack?.itemType?.name}
                                      disabled
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
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box p={2} bgcolor="white" borderRadius={2}>
                                    {/* Fabric Content */}
                                    <Typography variant="subtitle2">
                                      Fabric Content
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      placeholder="Type fabric content..."
                                      value={
                                        fabricContentValues[content._id] ??
                                        content.fabric_content ??
                                        ""
                                      }
                                      onClick={() =>
                                        makeEditable(
                                          content._id,
                                          "fabric_content"
                                        )
                                      }
                                      onChange={(e) =>
                                        handleInputChange(
                                          content._id,
                                          "fabric_content",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() => handleBlur(content._id)}
                                      sx={{
                                        height: "30px",
                                        "& .MuiInputBase-root": {
                                          height: "30px",
                                          fontSize: "12px",
                                          backgroundColor: isEditable(
                                            content._id,
                                            "fabric_content"
                                          )
                                            ? "#fff"
                                            : "#f0f0f0",
                                        },
                                        "& .MuiOutlinedInput-input": {
                                          padding: "5px",
                                          fontSize: "12px",
                                        },
                                      }}
                                    />

                                    {/* Customer / Brand */}
                                    <Typography variant="subtitle2">
                                      Customer / Brand
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      placeholder="Type customer or brand..."
                                      value={
                                        customerBrandValues[content._id] ??
                                        content.customer_or_brand ??
                                        ""
                                      }
                                      onClick={() =>
                                        makeEditable(
                                          content._id,
                                          "customer_or_brand"
                                        )
                                      }
                                      onChange={(e) =>
                                        handleInputChange(
                                          content._id,
                                          "customer_or_brand",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() => handleBlur(content._id)}
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "30px",
                                          fontSize: "12px",
                                          backgroundColor: isEditable(
                                            content._id,
                                            "customer_or_brand"
                                          )
                                            ? "#fff"
                                            : "#f0f0f0",
                                        },
                                        "& .MuiOutlinedInput-input": {
                                          padding: "5px",
                                          fontSize: "12px",
                                        },
                                      }}
                                    />

                                    {/* Size */}
                                    <Typography variant="subtitle2">
                                      Size
                                    </Typography>
                                    <TextField
                                      select
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      value={
                                        selectedSize[content._id] ||
                                        content.size ||
                                        ""
                                      }
                                      onClick={() => {
                                        makeEditable(content._id, "size");
                                        // Ensure we have the latest size headers for this spec
                                        if (
                                          content?.spec_template?._id !==
                                          currentSpecTemplateId
                                        ) {
                                          fetchPOMData(
                                            content?.spec_template?._id
                                          );
                                        }
                                      }}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        handleInputChange(
                                          content._id,
                                          "size",
                                          value
                                        );
                                      }}
                                      onBlur={() => handleBlur(content._id)}
                                      disabled={
                                        !isEditable(content._id, "size")
                                      }
                                      sx={{
                                        height: "30px",
                                        "& .MuiInputBase-root": {
                                          height: "30px",
                                          fontSize: "12px",
                                          backgroundColor: isEditable(
                                            content._id,
                                            "size"
                                          )
                                            ? "#fff"
                                            : "#f0f0f0",
                                        },
                                        "& .MuiOutlinedInput-input": {
                                          padding: "5px",
                                          fontSize: "12px",
                                        },
                                      }}
                                    >
                                      {sizeHeaders?.length > 0 ? (
                                        sizeHeaders.map((size, index) => (
                                          <MenuItem key={index} value={size}>
                                            {size}
                                          </MenuItem>
                                        ))
                                      ) : (
                                        <MenuItem disabled value="">
                                          Loading sizes...
                                        </MenuItem>
                                      )}
                                    </TextField>

                                    <Typography variant="subtitle2">
                                      Garment Specs Details
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      variant="outlined"
                                      margin="dense"
                                      placeholder="Type garment specs..."
                                      value={
                                        garmentSpecsValues[content._id] ??
                                        content.garment_specs_details ??
                                        ""
                                      }
                                      onClick={() =>
                                        makeEditable(
                                          content._id,
                                          "garment_specs_details"
                                        )
                                      }
                                      onChange={(e) =>
                                        handleInputChange(
                                          content._id,
                                          "garment_specs_details",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() => handleBlur(content._id)}
                                      sx={{
                                        height: "30px",
                                        "& .MuiInputBase-root": {
                                          height: "30px",
                                          fontSize: "12px",
                                          backgroundColor: isEditable(
                                            content._id,
                                            "garment_specs_details"
                                          )
                                            ? "#fff"
                                            : "#f0f0f0",
                                        },
                                        "& .MuiOutlinedInput-input": {
                                          padding: "5px",
                                          fontSize: "12px",
                                        },
                                      }}
                                    />
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Item>
                                    {console.log(content, "images")}
                                    {content?.workOrder?.pictures[0]
                                      ?.imageUrl && (
                                      <img
                                        src={
                                          content?.workOrder?.pictures[0]
                                            ?.imageUrl
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
                                </Grid>
                              </Grid>
                            </Box>

                            <GradedSpecsTableTechpack
                              TechPackId={TechPackId}
                              specId={content?.spec_template?._id}
                              datesdata={content}
                              samplesgradedspecId={content?._id}
                              onDataFetched={handleDataFetched}
                            />
                          </>
                        }
                      </Box>
                    ))
                  : null}
              </Box>
            </Box>
          </>
        )}

        {selectedButton === "two" && (
          <Box
            sx={{
              mt: 3,
              ml: 3,
              mr: 3,
              p: 2,
              border: "1px solid #ccc",
              borderRadius: 2,
            }}
          >
            <GradedSpecsTable1Techpack TechPackId={TechPackId} />
          </Box>
        )}
      </Box>
    </div>
  );
}

export default SampleSpecsTechpackPage;
