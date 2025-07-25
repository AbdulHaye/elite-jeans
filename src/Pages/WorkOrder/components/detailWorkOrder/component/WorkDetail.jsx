import React, { useState, useEffect } from "react";
import axios from "axios";
import { Alert, Box, Button, Snackbar, useMediaQuery, useTheme } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import "../../../../TechPack/techPackDetails.css";
import PictureModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/pictureModal";
import TrimModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/trimModal";
import RivetModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/rivetModal";
import ButtonModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/buttonModal";
import TrimConModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/trimConModal";
import EditWorkOrderModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/EditWorkOrderModal";
import EmailWorkOrderModal from "../../../../TechPack/Modals/WorkOrder/DetailPage/EmailWorkOrderModal";
import ConfirmDialog from "../../../../TechPack/Modals/WorkOrder/DetailPage/ConfirmDialog";
import EmailIcon from "@mui/icons-material/Email";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import CommentIcon from "@mui/icons-material/Comment";
import { useParams, useNavigate } from "react-router-dom";
import { generateWorkOrderPDF } from "./workOrderPdfGenerator";
import api from "../../../../../ApiServices/api";

function WorkDetail({ techPackId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const { id } = useParams();

  const [techPackData, setTechPackData] = useState(null);
  const [techPackDataTrim, setTechPackDataTrim] = useState(null);
  const [techPackDataRivet, setTechPackDataRivet] = useState(null);
  const [techPackDataButton, setTechPackDataButton] = useState(null);
  const [techPackDataTrimCon, setTechPackDataTrimCon] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalIsOpenTrim, setModalIsOpenTrim] = useState(false);
  const [modalIsOpenRivet, setModalIsOpenRivet] = useState(false);
  const [modalIsOpenButton, setModalIsOpenButton] = useState(false);
  const [modalIsOpenTrimCon, setModalIsOpenTrimCon] = useState(false);
  const [modalIsOpenEdit, setModalIsOpenEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const handleClickOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
  };

  const handleConfirm = async () => {
    try {
      const response = await api.post(
        `/api/work-orders/add-teachpack/${techPackId}`
      );
      console.log("Response data add work:", response.data);

      setSnackbar({
        open: true,
        message: "Tech Pack created successfully!",
        severity: "success",
      });

      setOpen(false);
      setOpenAdd(false);
    } catch (error) {
      console.error("Error posting tech pack:", error);

      if (
        error?.error?.includes("dup key") ||
        error.error?.includes("dup key")
      ) {
        setSnackbar({
          open: true,
          message: "Tech Pack already exists! Cannot create duplicate.",
          severity: "error",
        });
        setOpen(false);
        setOpenAdd(false);
      } else {
        setSnackbar({
          open: true,
          message: error?.message || "Failed to create Tech Pack",
          severity: "error",
        });
        setOpen(false);
        setOpenAdd(false);
      }
    }
  };
  
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getPdfData = async () => {
    try {
      const response = await api.post(
        "api/work-orders/getWorkOrderFullDetails",
        {
          workOrderId: id,
        }
      );
      setPdfData(response.data);
    } catch (error) {
      console.error("Error fetching PDF data:", error);
    }
  };
  
  useEffect(() => {
    getPdfData();
  }, [id]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSubmitEmails = async (emailArray) => {
    try {
      setLoading(true);
      setSnackbar({
        open: true,
        message: "Sending email, please wait...",
        severity: "info",
      });

      const pdfBlob = await generateWorkOrderPDF(pdfData);
      if (!pdfBlob) throw new Error("Failed to generate PDF");

      const formData = new FormData();
      formData.append("pdfs", pdfBlob, `WorkOrder_${id}.pdf`);
      formData.append("workOrder_Id", id);
      formData.append("emails", JSON.stringify(emailArray));

      const response = await api.post(
        "/api/work-orders/send-workorder-email",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSnackbar({
        open: true,
        message: "Email sent successfully!",
        severity: "success",
      });

      return response.data;
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to send email",
        severity: "error",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };
  
  const techPackDataa = () => {
    api
      .get(`/api/work-orders/${techPackId}`)
      .then((response) => {
        setTechPackData(response.data);
        setTechPackDataTrim(response.data);
        setTechPackDataRivet(response.data);
        setTechPackDataButton(response.data);
        setTechPackDataTrimCon(response.data);
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

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const openModalTrim = () => setModalIsOpenTrim(true);
  const openModalRivet = () => setModalIsOpenRivet(true);
  const closeModalRivet = () => setModalIsOpenRivet(false);
  const openModalButton = () => setModalIsOpenButton(true);
  const openModalTrimCon = () => setModalIsOpenTrimCon(true);
  const openModalEdit = () => setModalIsOpenEdit(true);

  const closeModalButton = () => setModalIsOpenButton(false);
  const closeModalTrimCon = () => setModalIsOpenTrimCon(false);
  const closeModalEdit = () => setModalIsOpenEdit(false);
  const closeModalTrim = () => setModalIsOpenTrim(false);

  const handlePostSubmit = (payload) => {
    api
      .put(`/api/work-orders/${techPackId}`, payload)
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
      .put(`/api/work-orders/${techPackId}`, payload)
      .then(() => {
        setTechPackData((prevData) => ({
          ...prevData,
          trim_id: [...prevData.trim_id, ...payload.trim_id],
        }));
        setTechPackData((prevData) => ({
          ...prevData,
          trim_id: [],
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };

  const [showToast, setShowToast] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastMode, setToastMode] = useState("success");

  const handleToastClose = (event, reason) => {
    console.log("Toast close reason:", reason);
    if (reason === "clickaway") return;
    setShowToast(false);
  };

  const handlePostSubmitRivet = (payload) => {
    api
      .put(`/api/work-orders/${techPackId}`, payload)
      .then(() => {
        setTechPackDataRivet((prevData) => ({ ...prevData }));
        techPackDataa();

        console.log("Showing success toast");
        setToastContent("Successfully saved changes!");
        setToastMode("success");
        setShowToast(true);
      })
      .catch((error) => {
        const errorMsg = error?.response?.data?.error || "Operation failed";
        console.error("API Error:", errorMsg);
        setToastContent(errorMsg);
        setToastMode("error");
        setShowToast(true);
      });
  };

  const handlePostSubmitButton = (payload) => {
    api
      .put(`/api/work-orders/${techPackId}`, payload)
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
  
  const handlePostSubmitTrimCon = (payload) => {
    api
      .put(`/api/work-orders/${techPackId}`, payload)
      .then(() => {
        setTechPackDataTrimCon((prevData) => ({
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

  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await api.get("/api/work-orders");
        console.log("API Response:", response.data);

        if (Array.isArray(response.data)) {
          setWorkOrders(response.data);
        } else if (Array.isArray(response.data.data)) {
          setWorkOrders(response.data.data);
        } else {
          throw new Error("Invalid API response format");
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  useEffect(() => {
    if (Array.isArray(workOrders) && workOrders.length > 0) {
      const order = workOrders.find((order) => order._id === id);
      setCurrentOrder(order);
    }
  }, [id, workOrders]);

  const currentIndex = workOrders.findIndex((order) => order._id === id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevOrder = workOrders[currentIndex - 1];
      navigate(`/work-order-detail/${prevOrder._id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < workOrders.length - 1) {
      const nextOrder = workOrders[currentIndex + 1];
      navigate(`/work-order-detail/${nextOrder._id}`);
    }
  };

  const userRole = localStorage.getItem("role");
  
  return (
    <div style={{ overflowX: 'auto', }}>
      <Snackbar
        open={showToast}
        autoHideDuration={6000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleToastClose}
          severity={toastMode}
          style={{ minWidth: 300 }}
        >
          {toastContent}
        </Alert>
      </Snackbar>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Box sx={{ my: 2, mx:2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            onClick={openModalEdit}
            color="primary"
            sx={{ fontSize: "12px" }}
            size={isMobile ? "small" : "medium"}
          >
            Edit Work Order
          </Button>
        )}

        <Link to={`/work-order-detail/${techPackId}/sample/graded/spec`}>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontSize: "12px" }}
            size={isMobile ? "small" : "medium"}
          >
            Sample/Graded Specs
          </Button>
        </Link>

        <Link to={`/work-order-detail/${techPackId}/design-comment`}>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontSize: "12px" }}
            startIcon={<CommentIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Design Comments
          </Button>
        </Link>

        <Link to={`/work-order-detail/${techPackId}/fit-comment`}>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontSize: "12px" }}
            startIcon={<CommentIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Fit Comments
          </Button>
        </Link>
        
        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            color="primary"
            sx={{ fontSize: "12px" }}
            onClick={handleClickOpenAdd}
            startIcon={<AddIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Add Tech Pack
          </Button>
        )}

        <Button
          variant="contained"
          color="warning"
          sx={{ color: "white", fontSize: "12px" }}
          onClick={() => {
            navigate(`/sample-specs/Pdf/${techPackId}`);
          }}
          startIcon={<DownloadIcon />}
          size={isMobile ? "small" : "medium"}
        >
          Download Work Order
        </Button>

        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            color="warning"
            sx={{ color: "white", fontSize: "12px" }}
            onClick={handleClickOpen}
            startIcon={<EmailIcon />}
            size={isMobile ? "small" : "medium"}
          >
            Email Work Order
          </Button>
        )}
      </Box>

      <div className="table_container_detail_page" style={{ 
        width: '100%', 
        overflowX: 'auto',
        margin: isMobile ? '0' : '0 auto',
        padding: isMobile ? '0 8px' : '0'
      }}>
        <div className="style-detail-container" style={{ 
          minWidth: isMobile ? '100%' : 'auto',
          margin: isMobile ? '0' : '0 auto'
        }}>
          <table className="style-detail-table" style={{
            width: '100%',
            tableLayout: isMobile ? 'auto' : 'fixed'
          }}>
            <thead>
              <tr>
                <th colSpan={isMobile ? 2 : 4} className="style-detail-header">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '8px' : '0'
                  }}>
                    <div>Work Order Details</div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexDirection: isMobile ? 'column' : 'row',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleNext}
                        disabled={currentIndex >= workOrders.length - 1}
                        fullWidth={isMobile}
                        size={isMobile ? "small" : "medium"}
                      >
                        {"<<"} Prev
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handlePrev}
                        disabled={currentIndex <= 0}
                        fullWidth={isMobile}
                        size={isMobile ? "small" : "medium"}
                      >
                        Next {">>"}
                      </Button>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="label_style1" style={{ width: isMobile ? '50%' : '25%' }}>Vendor</td>
                <td className="value_style1" style={{ width: isMobile ? '50%' : '25%' }}>
                  {techPackData?.vendor?.name || "N/A"}
                </td>
                {!isMobile && (
                  <>
                    <td className="label_style1" style={{ width: '25%' }}>Work Order #</td>
                    <td className="value_style1" style={{ width: '25%' }}>
                      {techPackData?.workOrderId || "N/A"}
                    </td>
                  </>
                )}
              </tr>
              
              {isMobile && (
                <tr>
                  <td className="label_style1">Work Order #</td>
                  <td className="value_style1">
                    {techPackData?.workOrderId || "N/A"}
                  </td>
                </tr>
              )}
              
              <tr>
                <td className="label_style1">Packaging</td>
                <td className="value_style1">
                  {Array.isArray(techPackData?.trim_id) &&
                  techPackData.trim_id.length > 0
                    ? techPackData.trim_id[0].name
                    : "N/A"}
                </td>
                {!isMobile && (
                  <>
                    <td className="label_style1">Item Type</td>
                    <td className="value_style1">
                      {techPackData?.itemType?.name || "N/A"}
                    </td>
                  </>
                )}
              </tr>
              
              {isMobile && (
                <tr>
                  <td className="label_style1">Item Type</td>
                  <td className="value_style1">
                    {techPackData?.itemType?.name || "N/A"}
                  </td>
                </tr>
              )}
              
              <tr>
                <td className="label_style1">Category</td>
                <td className="value_style1">
                  {techPackData?.category?.name || "N/A"}
                </td>
                {!isMobile && (
                  <>
                    <td className="label_style1">Shipping Status</td>
                    <td className="value_style1">
                      {techPackData?.shippingStatus || "N/A"}
                    </td>
                  </>
                )}
              </tr>
              
              {isMobile && (
                <tr>
                  <td className="label_style1">Shipping Status</td>
                  <td className="value_style1">
                    {techPackData?.shippingStatus || "N/A"}
                  </td>
                </tr>
              )}
              
              <tr>
                <td className="label_style1">Subcategory</td>
                <td className="value_style1">
                  {techPackData?.subCategory?.name || "N/A"}
                </td>
                {!isMobile && (
                  <>
                    <td className="label_style1">Date Created</td>
                    <td className="value_style1">
                      {new Date(techPackData?.createdAt)?.toLocaleDateString()}
                    </td>
                  </>
                )}
              </tr>
              
              {isMobile && (
                <tr>
                  <td className="label_style1">Date Created</td>
                  <td className="value_style1">
                    {new Date(techPackData?.createdAt)?.toLocaleDateString()}
                  </td>
                </tr>
              )}
              
              <tr>
                <td className="label_style1">ETD</td>
                <td className="value_style1">
                  {new Date(techPackData?.etd)?.toLocaleDateString()}
                </td>
                {!isMobile && (
                  <>
                    <td className="label_style1">Last Updated</td>
                    <td className="value_style1">
                      {techPackData?.lastUpdated || "N/A"}
                    </td>
                  </>
                )}
              </tr>
              
              {isMobile && (
                <tr>
                  <td className="label_style1">Last Updated</td>
                  <td className="value_style1">
                    {techPackData?.lastUpdated || "N/A"}
                  </td>
                </tr>
              )}
              
              <tr>
                <td colSpan={isMobile ? 2 : 4} className="value_style1" style={{ padding: '16px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Style Picture Section */}
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Style Picture</h3>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        {techPackData?.pictures?.map((picture) => (
                          <img
                            key={picture._id}
                            src={picture.imageUrl}
                            alt={`Picture for ${picture.category}`}
                            style={{
                              width: isMobile ? '100px' : '150px',
                              height: isMobile ? '100px' : '150px',
                              objectFit: 'cover',
                              borderRadius: "8px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              cursor: "pointer",
                            }}
                            onClick={() => handleImageClick(picture.imageUrl)}
                          />
                        ))}
                      </div>
                      {(userRole === "admin" || userRole === "general") && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={openModal}
                          sx={{ mt: 2, width: isMobile ? '100%' : 'auto' }}
                          size={isMobile ? "small" : "medium"}
                        >
                          Upload Image
                        </Button>
                      )}
                    </div>

                    {/* Packaging Section */}
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Packaging</h3>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        {techPackData?.trim_id?.map((trim) => (
                          <img
                            key={trim?._id}
                            src={trim?.previewImage}
                            alt={`trim for ${trim?.name}`}
                            style={{
                              width: isMobile ? '100px' : '150px',
                              height: isMobile ? '100px' : '150px',
                              objectFit: 'cover',
                              borderRadius: "8px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              cursor: "pointer",
                            }}
                            onClick={() => handleImageClick(trim.previewImage)}
                          />
                        ))}
                      </div>
                      {(userRole === "admin" || userRole === "general") && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={openModalTrim}
                          sx={{ mt: 2, width: isMobile ? '100%' : 'auto' }}
                          size={isMobile ? "small" : "medium"}
                        >
                          Upload Image
                        </Button>
                      )}
                    </div>

                    {/* Buttons/Rivets Section */}
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Buttons/Rivets</h3>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: '16px'
                      }}>
                        {/* Buttons Column */}
                        <div>
                          <h4 style={{ marginBottom: '8px' }}>Buttons</h4>
                          {techPackDataButton?.buttonImages?.length > 0 ? (
                            techPackDataButton.buttonImages.map((buttonImage, index) => (
                              <div
                                key={`button-${index}`}
                                style={{
                                  marginBottom: "16px",
                                  padding: "12px",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "8px",
                                  backgroundColor: '#fff'
                                }}
                              >
                                {buttonImage?.image?.imageUrl && (
                                  <div style={{ textAlign: "center", marginBottom: "8px" }}>
                                    <img
                                      src={buttonImage?.image?.imageUrl}
                                      alt={`Button ${index}`}
                                      style={{
                                        width: '100%',
                                        maxWidth: '150px',
                                        height: 'auto',
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                        cursor: "pointer",
                                      }}
                                      onClick={() => handleImageClick(buttonImage?.image?.imageUrl)}
                                    />
                                  </div>
                                )}
                                <div style={{ 
                                  textAlign: "center",
                                  fontSize: '14px'
                                }}>
                                  <div><strong>Color:</strong> {buttonImage?.color || "N/A"}</div>
                                  <div><strong>Size:</strong> {buttonImage?.size || "N/A"}</div>
                                  <div><strong>Quantity:</strong> {buttonImage?.quantity || "N/A"}</div>
                                  <div><strong>Comment:</strong> {buttonImage?.comment || "N/A"}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', color: '#666' }}>No buttons added</div>
                          )}
                          {(userRole === "admin" || userRole === "general") && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={openModalButton}
                              sx={{ mt: 1, width: isMobile ? '100%' : 'auto' }}
                              size={isMobile ? "small" : "medium"}
                            >
                              Upload Button
                            </Button>
                          )}
                        </div>

                        {/* Rivets Column */}
                        <div>
                          <h4 style={{ marginBottom: '8px' }}>Rivets</h4>
                          {techPackDataRivet?.rivetImages?.length > 0 ? (
                            techPackDataRivet.rivetImages.map((rivetImage, index) => (
                              <div
                                key={`rivet-${index}`}
                                style={{
                                  marginBottom: "16px",
                                  padding: "12px",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "8px",
                                  backgroundColor: '#fff'
                                }}
                              >
                                {rivetImage?.image?.imageUrl && (
                                  <div style={{ textAlign: "center", marginBottom: "8px" }}>
                                    <img
                                      src={rivetImage?.image?.imageUrl}
                                      alt={`Rivet ${index}`}
                                      style={{
                                        width: '100%',
                                        maxWidth: '150px',
                                        height: 'auto',
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                        cursor: "pointer",
                                      }}
                                      onClick={() => handleImageClick(rivetImage?.image?.imageUrl)}
                                    />
                                  </div>
                                )}
                                <div style={{ 
                                  textAlign: "center",
                                  fontSize: '14px'
                                }}>
                                  <div><strong>Color:</strong> {rivetImage?.color || "N/A"}</div>
                                  <div><strong>Size:</strong> {rivetImage?.size || "N/A"}</div>
                                  <div><strong>Quantity:</strong> {rivetImage?.quantity || "N/A"}</div>
                                  <div><strong>Comment:</strong> {rivetImage?.comment || "N/A"}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', color: '#666' }}>No rivets added</div>
                          )}
                          {(userRole === "admin" || userRole === "general") && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={openModalRivet}
                              sx={{ mt: 1, width: isMobile ? '100%' : 'auto' }}
                              size={isMobile ? "small" : "medium"}
                            >
                              Upload Rivet
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trim Section */}
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '16px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Trim</h3>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        {techPackDataTrimCon?.trimImages?.length > 0 ? (
                          techPackDataTrimCon.trimImages.map((trimImage) => (
                            <div key={trimImage?._id} style={{ 
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              padding: '8px',
                              backgroundColor: '#fff'
                            }}>
                              <img
                                src={trimImage?.image?.imageUrl}
                                alt={`Trim ${trimImage?.image?.category}`}
                                style={{
                                  width: isMobile ? '100px' : '150px',
                                  height: isMobile ? '100px' : '150px',
                                  objectFit: 'cover',
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleImageClick(trimImage?.image?.imageUrl)}
                              />
                              <div style={{ 
                                textAlign: "center",
                                fontSize: '14px',
                                marginTop: '8px'
                              }}>
                                <div><strong>Color:</strong> {trimImage?.color || "N/A"}</div>
                                <div><strong>Size:</strong> {trimImage?.size || "N/A"}</div>
                                <div><strong>Quantity:</strong> {trimImage?.quantity || "N/A"}</div>
                                <div><strong>Comment:</strong> {trimImage?.comment || "N/A"}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', color: '#666', width: '100%' }}>No trim images added</div>
                        )}
                      </div>
                      {(userRole === "admin" || userRole === "general") && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={openModalTrimCon}
                          sx={{ mt: 2, width: isMobile ? '100%' : 'auto' }}
                          size={isMobile ? "small" : "medium"}
                        >
                          Upload Image
                        </Button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Components */}
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
      <TrimConModal
        isOpen={modalIsOpenTrimCon}
        closeModal={closeModalTrimCon}
        onSubmit={handlePostSubmitTrimCon}
        techPackData={techPackDataTrimCon}
      />
      <EditWorkOrderModal
        isOpen={modalIsOpenEdit}
        closeModal={closeModalEdit}
        onSubmit={handlePostSubmitEdit}
        techPackData={techPackData}
      />
      <EmailWorkOrderModal
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmitEmails}
      />
      <ConfirmDialog
        open={openAdd}
        onClose={handleCloseAdd}
        onConfirm={handleConfirm}
        title="Confirm"
        message="Do you want to create Tech Pack from Order?"
      />
      
      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <img
            src={selectedImage}
            alt="Selected"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "10px",
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default WorkDetail;