import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PictureModal from "./Modals/pictureModal";
import TrimModal from "./Modals/trimModal";
import SampleRequestList from "./sampleRequest";
import RivetModal from "./Modals/rivetModal";
import ButtonModal from "./Modals/buttonModal";
import StyleDetail from "../../Components/StyleDetail/styleDetail";
import StyleDetailAll from "../../Components/StyleDetail/StyleDetailAll";
import "./techPackDetails.css";
import Navbar from "../../Navbar/Navbar";
import EditTechPackModal from "./Modals/WorkOrder/DetailPage/EditTechPackModal";
import AddWorkOrderModal from "./Modals/WorkOrder/AddWorkOrderModal";
import { useParams } from "react-router-dom";
import WashDetailTechPack from "./WashDetailTechPack";
import { DownloadTechpackFilegenerate } from "./DownloadTechpackFilegenerate";
import api from "../../ApiServices/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

function VerticalTechPackTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [techPack, setTechPack] = useState({});
  const { id: techPackId } = useParams();
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [techPackData, setTechPackData] = useState(null);
  const [techPackDataTrim, setTechPackDataTrim] = useState(null);
  const [techPackDataRivet, setTechPackDataRivet] = useState(null);
  const [techPackDataButton, setTechPackDataButton] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalIsOpenTrim, setModalIsOpenTrim] = useState(false);
  const [modalIsOpenRivet, setModalIsOpenRivet] = useState(false);
  const [modalIsOpenButton, setModalIsOpenButton] = useState(false);
  const [modalIsOpenEdit, setModalIsOpenEdit] = useState(false);
  const openModalEdit = () => setModalIsOpenEdit(true);
  const closeModalEdit = () => setModalIsOpenEdit(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const techPackDataa = () => {
    api
      .get(`/api/techPack/${techPackId}`)
      .then((response) => {
        setTechPackData(response.data.data);
        setTechPackDataTrim(response.data.data);
        setTechPackDataRivet(response.data.data);
        setTechPackDataButton(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load TechPack data");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (techPackId) {
      setLoading(true);
      techPackDataa();
    }
  }, [techPackId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const openModalTrim = () => setModalIsOpenTrim(true);
  const openModalRivet = () => setModalIsOpenRivet(true);
  const closeModalRivet = () => setModalIsOpenRivet(false);
  const openModalButton = () => setModalIsOpenButton(true);
  const closeModalButton = () => setModalIsOpenButton(false);
  const closeModalTrim = () => setModalIsOpenTrim(false);

  const handlePostSubmit = (payload) => {
    api
      .put(`/api/techPack/${techPackId}`, payload)
      .then(() => {
        setTechPackData((prevData) => ({
          ...prevData,
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };

  const handlePostSubmitTrim = (payload) => {
    api
      .put(`/api/techPack/${techPackId}`, payload)
      .then(() => {
        setTechPackData((prevData) => ({
          ...prevData,
          labelTrim: Array.isArray(prevData?.labelTrim)
            ? [...prevData?.labelTrim, ...payload?.labelTrim]
            : [prevData?.labelTrim, ...payload?.labelTrim],
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };

  const handlePostSubmitRivet = (payload) => {
    api
      .put(`/api/techPack/${techPackId}`, payload)
      .then(() => {
        setTechPackDataRivet((prevData) => ({
          ...prevData,
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };

  const handlePostSubmitButton = (payload) => {
    api
      .put(`/api/techPack/${techPackId}`, payload)
      .then(() => {
        setTechPackDataButton((prevData) => ({
          ...prevData,
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };

  const handlePostSubmitEdit = (newTechPack) => {
    techPackDataa();
  };

  useEffect(() => {
    handlePostSubmit();
  }, []);

  const handleSampleSpecsButtonClick = () => {
    if (techPackId) {
      navigate(`/sample-specs/${techPackId}`);
    } else {
      console.error("TechPack ID is not available");
    }
  };

  const [modalOpen, setModalOpen] = useState(false);

  const handleaddWorkOrder = () => {
    setModalOpen(true);
  };

  const handleCloseModalworkorder = () => {
    setModalOpen(false);
  };

  const handleSubmitWorkOrder = async () => {
    try {
      const response = await api.post(
        `/api/techPack/create-from-techpack/${techPackId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error?.response?.data?.message);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/techPack/${techPackId}`);

      setSnackbarMessage("Tech pack deleted successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setIsModalOpen(false);
      setTimeout(() => {
        navigate("/techpack");
      }, 2000);
    } catch (error) {
      console.error("Error deleting tech pack:", error);
      setSnackbarMessage("Failed to delete tech pack. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const [techPackOrder, settechPackOrder] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    const fetchtechPackOrder = async () => {
      try {
        const response = await api.get("/api/techPack/filtered/sp/f");
        console.log("API Response of tech pack all:", response?.data);

        if (Array.isArray(response?.data)) {
          settechPackOrder(response?.data);
        } else if (Array.isArray(response?.data?.data)) {
          settechPackOrder(response?.data?.data);
        } else {
          throw new Error("Invalid API response format");
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        if (error?.message && error?.message?.includes("Unauthorized")) {
          navigate("/login");
        }
      }
    };

    fetchtechPackOrder();
  }, []);

  useEffect(() => {
    if (Array.isArray(techPackOrder) && techPackOrder.length > 0) {
      const order = techPackOrder.find((order) => order._id === techPackId);
      setCurrentOrder(order);
    }
  }, [techPackId]);

  const currentIndex = techPackOrder.findIndex(
    (order) => order._id === techPackId
  );

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevOrder = techPackOrder[currentIndex - 1];
      navigate(`/tech-pack-detail/${prevOrder._id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < techPackOrder.length - 1) {
      const nextOrder = techPackOrder[currentIndex + 1];
      navigate(`/tech-pack-detail/${nextOrder._id}`);
    }
  };

  const [pdfData, setPdfData] = useState(null);
  const getPdfData = async () => {
    try {
      const response = await api.post("/api/techPack/getpdfFullDetails", {
        techpack_Id: techPackId,
      });
      setPdfData(response.data);
    } catch (error) {
      console.error("Error fetching PDF data:", error);
    }
  };
  useEffect(() => {
    getPdfData();
  }, [techPackId]);

  const handleDownloadtechpackfile = () => {
    DownloadTechpackFilegenerate(pdfData);
  };

  const userRole = localStorage.getItem("role");

  // Determine if we need tabs based on categories count
  const hasMultipleCategories = techPackData?.categories?.length > 1;

  return (
    <>
      <Dialog open={isModalOpen} onClose={cancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this tech pack?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiSnackbar-root": {
            top: "24px",
            right: "24px",
          },
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Navbar />

      {/* Action Buttons */}
      <Box
        sx={{
          mt: 2,
          px: { xs: 1, sm: 3 },
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            onClick={openModalEdit}
            color="primary"
            startIcon={<EditIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Edit Tech Pack
          </Button>
        )}

        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleaddWorkOrder}
            startIcon={<AddIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Add Work Order
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSampleSpecsButtonClick}
          size={isMobile ? "small" : "medium"}
        >
          Sample/Graded Specs
        </Button>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#FF5722",
            "&:hover": {
              backgroundColor: "#E64A19",
            },
          }}
          onClick={handleDownloadtechpackfile}
          startIcon={<FileDownloadIcon />}
          size={isMobile ? "small" : "medium"}
        >
          Download Tech Pack
        </Button>

        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#F44336",
              "&:hover": {
                backgroundColor: "#D32F2F",
              },
            }}
            onClick={handleDeleteClick}
            startIcon={<DeleteIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Delete Tech Pack
          </Button>
        )}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          px: { xs: 1, sm: 3 },
          mt: 2,
          overflowX: "auto",
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 }, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="div">
              Pack ID: {techPackData?.techPackId || "N/A"}
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                startIcon={<ArrowBackIcon />}
                size={isMobile ? "small" : "medium"}
              >
                {!isMobile && "Next"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleNext}
                disabled={currentIndex >= techPackOrder.length - 1}
                endIcon={<ArrowForwardIcon />}
                size={isMobile ? "small" : "medium"}
              >
                {!isMobile && "Prev"}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Style:</Typography>
              <Typography>{techPackData?.styleId || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Vendor:</Typography>
              <Typography>{techPackData?.vendor?.name || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Category:</Typography>
              {console.log(techPackData, "tech pack detail data show")}
              <Typography>
                {techPackData?.categories
                  ?.map((category) => category.name)
                  .join(", ") || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Sub Category:</Typography>
              <Typography>
                {techPackData?.subCategory?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Item Type:</Typography>
              <Typography>{techPackData?.itemType?.name || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">Date Created:</Typography>
              <Typography>
                {techPackData?.lastUpdated?.split("T")[0] || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Image Sections */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
  {/* Style Pictures */}
  <Grid item xs={12} sm={6} md={3}>
    <Paper elevation={3} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom>
        Style Picture
      </Typography>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
          alignContent: "flex-start",
        }}
      >
        {techPackData?.pictures?.map((picture) => (
          <Box
            key={picture?._id}
            sx={{
           width: "100%",
              height: "150px",
              overflow: "hidden",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => handleImageClick(picture?.imageUrl)}
          >
            <img
              src={picture?.imageUrl}
              alt={`Picture for ${picture?.category}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "#f5f5f5",
              }}
            />
          </Box>
        ))}
      </Box>
      {(userRole === "admin" || userRole === "general") && (
        <Button
          variant="contained"
          color="primary"
          onClick={openModal}
          fullWidth
          size="small"
        >
          Upload Image
        </Button>
      )}
    </Paper>
  </Grid>

  {/* Packaging */}
  <Grid item xs={12} sm={6} md={3}>
    <Paper elevation={3} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom>
        Packaging
      </Typography>
      <Box sx={{ flexGrow: 1, mb: 2 }}>
        {techPackDataTrim?.labelTrim ? (
          <Box
            sx={{
              width: "100%",
              height: "150px",
              overflow: "hidden",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => handleImageClick(techPackDataTrim?.labelTrim?.previewImage)}
          >
            <img
              src={techPackDataTrim?.labelTrim?.previewImage}
              alt={`Picture for ${techPackDataTrim?.labelTrim?.name}`}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "150px",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
          >
            <Typography variant="body2" color="textSecondary">
              No image uploaded
            </Typography>
          </Box>
        )}
      </Box>
      {(userRole === "admin" || userRole === "general") && (
        <Button
          variant="contained"
          color="primary"
          onClick={openModalTrim}
          fullWidth
          size="small"
        >
          Upload Image
        </Button>
      )}
    </Paper>
  </Grid>

  {/* Rivets */}
  <Grid item xs={12} sm={6} md={3}>
    <Paper elevation={3} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom>
        Rivets
      </Typography>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
          alignContent: "flex-start",
        }}
      >
        {techPackDataRivet?.rivetImages?.length > 0 ? (
          techPackDataRivet?.rivetImages?.map((rivetImage) => (
            <Box
              key={rivetImage?._id}
              sx={{
                width: "80px",
                height: "80px",
                overflow: "hidden",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#f5f5f5",
              }}
              onClick={() => handleImageClick(rivetImage?.image?.imageUrl)}
            >
              <img
                src={rivetImage?.image?.imageUrl}
                alt={`Picture for ${rivetImage?.image?.category}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
          ))
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "80px",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
          >
            <Typography variant="body2" color="textSecondary">
              No images uploaded
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Color:</strong>{" "}
          {techPackDataRivet?.rivetImages[0]?.color || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Size:</strong>{" "}
          {techPackDataRivet?.rivetImages[0]?.size || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Quantity:</strong>{" "}
          {techPackDataRivet?.rivetImages[0]?.quantity || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Comment:</strong>{" "}
          {techPackDataRivet?.rivetImages[0]?.comment || "N/A"}
        </Typography>
      </Box>
      {(userRole === "admin" || userRole === "general") && (
        <Button
          variant="contained"
          color="primary"
          onClick={openModalRivet}
          fullWidth
          size="small"
        >
          Upload Image
        </Button>
      )}
    </Paper>
  </Grid>

  {/* Buttons */}
  <Grid item xs={12} sm={6} md={3}>
    <Paper elevation={3} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom>
        Button
      </Typography>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
          alignContent: "flex-start",
        }}
      >
        {techPackDataButton?.buttonImages?.length > 0 ? (
          techPackDataButton?.buttonImages?.map((buttonImage) => (
            <Box
              key={buttonImage?._id}
              sx={{
                width: "80px",
                height: "80px",
                overflow: "hidden",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#f5f5f5",
              }}
              onClick={() => handleImageClick(buttonImage?.image?.imageUrl)}
            >
              <img
                src={buttonImage?.image?.imageUrl}
                alt={`Picture for ${buttonImage?.image?.category}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
          ))
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "80px",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
          >
            <Typography variant="body2" color="textSecondary">
              No images uploaded
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Color:</strong>{" "}
          {techPackDataButton?.buttonImages[0]?.color || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Size:</strong>{" "}
          {techPackDataButton?.buttonImages[0]?.size || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Quantity:</strong>{" "}
          {techPackDataButton?.buttonImages[0]?.quantity || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Comment:</strong>{" "}
          {techPackDataButton?.buttonImages[0]?.comment || "N/A"}
        </Typography>
      </Box>
      {(userRole === "admin" || userRole === "general") && (
        <Button
          variant="contained"
          color="primary"
          onClick={openModalButton}
          fullWidth
          size="small"
        >
          Upload Image
        </Button>
      )}
    </Paper>
  </Grid>
</Grid>

        {/* Sample Request List */}
        <SampleRequestList techPackId={techPackId} />

        {/* Category Tabs Section */}
        {hasMultipleCategories ? (
          <Paper sx={{ my: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              aria-label="category tabs"
            >
              {techPackData?.categories?.map((category, index) => (
                <Tab
                  key={category._id}
                  label={`Category ${index + 1}: ${category.name}`}
                  id={`category-tab-${index}`}
                  aria-controls={`category-tabpanel-${index}`}
                />
              ))}
            </Tabs>

            {techPackData?.categories?.map((category, index) => (
              <TabPanel key={category._id} value={tabValue} index={index}>
                <StyleDetailAll
                  techPackId={techPackId}
                  categoryId={category._id}
                />
                <WashDetailTechPack
                  techPackId={techPackId}
                  categoryId={category._id}
                />
              </TabPanel>
            ))}
          </Paper>
        ) : (
          // Single category view (no tabs)
          <Box sx={{ my: 4 }}>
            {techPackData?.categories?.length > 0 && (
              <>
                <StyleDetailAll
                  techPackId={techPackId}
                  categoryId={techPackData.categories[0]._id}
                />
                <WashDetailTechPack
                  techPackId={techPackId}
                  categoryId={techPackData.categories[0]._id}
                />
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Modals */}
      <AddWorkOrderModal
        open={modalOpen}
        handleClose={handleCloseModalworkorder}
        handleSubmit={handleSubmitWorkOrder}
      />

      <PictureModal
        isOpen={modalIsOpen}
        closeModal={closeModal}
        onSubmit={handlePostSubmit}
        techPackData={techPackData}
      />

      <TrimModal
        isOpen={modalIsOpenTrim}
        closeModal={closeModalTrim}
        onSubmit={handlePostSubmitTrim}
        techPackData={techPackDataTrim}
      />

      <RivetModal
        isOpen={modalIsOpenRivet}
        closeModal={closeModalRivet}
        onSubmit={handlePostSubmitRivet}
        techPackData={techPackDataRivet}
      />

      <ButtonModal
        isOpen={modalIsOpenButton}
        closeModal={closeModalButton}
        onSubmit={handlePostSubmitButton}
        techPackData={techPackDataButton}
      />

      <EditTechPackModal
        isOpen={modalIsOpenEdit}
        closeModal={closeModalEdit}
        onSubmit={handlePostSubmitEdit}
        techPackData={techPackData}
      />

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onClose={handleCloseModal} maxWidth="md">
        <DialogContent>
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default VerticalTechPackTable;
