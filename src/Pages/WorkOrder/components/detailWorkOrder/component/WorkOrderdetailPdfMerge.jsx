import WorkOrderPDF from "./WorkOrderPDF";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Alert, Box, Button, Snackbar } from "@mui/material";
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
import ResponsiveAppBar from "../../../../../Navbar/Navbar";
import { generateWorkOrderPDF } from "./workOrderPdfGenerator";
import api from "../../../../../ApiServices/api";

function WorkOrderdetailPdfMerge() {
  // const { id } = useParams();
  const { id } = useParams();
  console.log(id, "id id id");
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
      const response = await api.post(`/api/work-orders/add-teachpack/${id}`);
      console.log("Response data add work:", response.data);
      setOpen(false);
      setOpenAdd(false);
      setOpenAdd(false);
    } catch (error) {
      console.error("Error posting tech pack:", error);
    }
    console.log("Tech Pack Created!");
    setOpen(false);
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // const handleSubmitEmails = (emails) => {
  //   console.log("Submitted Emails:", emails);
  // };

  const [pdfData, setPdfData] = useState(null);
  console.log(pdfData, "pdfData");
  const getPdfData = async () => {
    try {
      const response = await api.post(
        "api/work-orders/getWorkOrderFullDetails",
        {
          workOrderId: id, // Use the extracted ID
        }
      );
      setPdfData(response.data); // Store response data
    } catch (error) {
      console.error("Error fetching PDF data:", error);
      // Handle error (show message, redirect, etc.)
    }
  };
  useEffect(() => {
    getPdfData();
  }, [id]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info", // 'error', 'warning', 'info', 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSubmitEmails = async (emailArray) => {
    try {
      setLoading(true);
      // Show "sending" message
      setSnackbar({
        open: true,
        message: "Sending email, please wait...",
        severity: "info",
      });

      // Generate PDF
      const pdfBlob = await generateWorkOrderPDF(pdfData);
      if (!pdfBlob) throw new Error("Failed to generate PDF");

      // Create FormData
      const formData = new FormData();
      formData.append("pdfs", pdfBlob, `WorkOrder_${id}.pdf`);
      formData.append("workOrder_Id", id);
      formData.append("emails", JSON.stringify(emailArray));

      // Send request
      const response = await api.post(
        "/api/work-orders/send-workorder-email",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Show success message
      setSnackbar({
        open: true,
        message: "Email sent successfully!",
        severity: "success",
      });

      return response.data;
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      // Show error message
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
    setSelectedImage(imageUrl); // Set the selected image
  };

  const handleCloseModal = () => {
    setSelectedImage(null); // Close the modal by setting the image back to null
  };
  const techPackDataa = () => {
    api
      .get(`/api/work-orders/${id}`)
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
    if (id) {
      setLoading(true);
      techPackDataa();
    }
  }, [id]);

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
      .put(`/api/work-orders/${id}`, payload)
      .then(() => {
        setTechPackData((prevData) => ({
          ...prevData,
          //   pictures: [...prevData.pictures, ...payload.pictures],
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };

  // const handleDownload = () => {
  //   fetch(`/api/work-orders/${id}/download-pdf`)
  //     .then((response) => {
  //       if (response.ok) {
  //         return response.blob();
  //       }
  //       throw new Error("Failed to download PDF");
  //     })
  //     .then((blob) => {
  //       const url = window.URL.createObjectURL(blob);
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.setAttribute("download", `workorder-${id}.pdf`);
  //       document.body.appendChild(link);
  //       link.click();
  //       link.remove();
  //     })
  //     .catch((error) => console.error(error));
  // };

  const handlePostSubmitTrim = (payload) => {
    api
      .put(`/api/work-orders/${id}`, payload)
      .then(() => {
        setTechPackData((prevData) => ({
          ...prevData,
          trim_id: [...prevData.trim_id, ...payload.trim_id],

          //   trimImages: Array.isArray(prevData.labelTrim)
          //     ? [...prevData.labelTrim, ...payload.labelTrim]
          //     : [prevData.labelTrim, ...payload.labelTrim],
        }));
        setTechPackData((prevData) => ({
          ...prevData,
          trim_id: [], // Reset trim_id array if necessary
          // trimImages: [], // Optionally reset trimImages
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };
  const handlePostSubmitRivet = (payload) => {
    api
      .put(`/api/work-orders/${id}`, payload)
      .then(() => {
        setTechPackDataRivet((prevData) => ({
          ...prevData,
          // pictures: [...prevData.pictures, ...payload.pictures],
        }));
        techPackDataa();
      })

      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };
  const handlePostSubmitButton = (payload) => {
    api
      .put(`/api/work-orders/${id}`, payload)
      .then(() => {
        setTechPackDataButton((prevData) => ({
          ...prevData,
          // pictures: [...prevData.pictures, ...payload.pictures],
        }));
        techPackDataa();
      })
      .catch((error) => {
        console.error("Error submitting data:", error);
      });
  };
  const handlePostSubmitTrimCon = (payload) => {
    api
      .put(`/api/work-orders/${id}`, payload)

      .then(() => {
        setTechPackDataTrimCon((prevData) => ({
          ...prevData,
          // pictures: [...prevData.pictures, ...payload.pictures],
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

  // Fetch all work orders
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await api.get("/api/work-orders");
        console.log("API Response:", response.data); // Log the response

        // Ensure workOrders is an array
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

  // Find the current work order based on the ID from the URL
  useEffect(() => {
    if (Array.isArray(workOrders) && workOrders.length > 0) {
      const order = workOrders.find((order) => order._id === id);
      setCurrentOrder(order);
    }
  }, [id, workOrders]);

  // Calculate the current index of the work order
  const currentIndex = workOrders.findIndex((order) => order._id === id);

  // Handle "Prev" button click
  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevOrder = workOrders[currentIndex - 1];
      navigate(`/work-order-detail/${prevOrder._id}`);
    }
  };

  // Handle "Next" button click
  const handleNext = () => {
    if (currentIndex < workOrders.length - 1) {
      const nextOrder = workOrders[currentIndex + 1];
      navigate(`/work-order-detail/${nextOrder._id}`);
    }
  };
  const userRole = localStorage.getItem("role");
  return (
    <div>
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
      <ResponsiveAppBar />
      <Box sx={{ my: 2 }}>
       {(userRole === 'admin' || userRole === 'general') && (
        <Button
          variant="contained"
          onClick={openModalEdit}
          color="primary"
          sx={{ mx: 1, fontSize: "12px" }}
        >
          Edit Work Order
        </Button>
)}
        

        <Link to={`/work-order-detail/${id}/sample/graded/spec`}>
          <Button
            variant="contained"
            color="primary"
            sx={{ mx: 1, fontSize: "12px" }}
          >
            Sample/Graded Specs
          </Button>
        </Link>

        <Link to={`/work-order-detail/${id}/design-comment`}>
          <Button
            variant="contained"
            color="primary"
            sx={{ m: 1, fontSize: "12px" }}
            startIcon={<CommentIcon />}
          >
            Design Comments
          </Button>
        </Link>

        <Link to={`/work-order-detail/${id}/fit-comment`}>
          <Button
            variant="contained"
            color="primary"
            sx={{ m: 1, fontSize: "12px" }}
            startIcon={<CommentIcon />}
          >
            Fit Comments
          </Button>
        </Link>

         {(userRole === 'admin' || userRole === 'general') && (
          <Button
          variant="contained"
          color="primary"
          sx={{ mx: 1, fontSize: "12px" }}
          onClick={handleClickOpenAdd}
          startIcon={<AddIcon />}
        >
          Add Tech Pack
        </Button>
)}
        

        <Button
          variant="contained"
          color="warning"
          sx={{ m: 1, color: "white", fontSize: "12px" }}
          onClick={() => {
            // handleDownload();
            navigate(`/sample-specs/Pdf/${id}`); // or your specific route
          }}
          startIcon={<DownloadIcon />}
        >
          Download Work Order
        </Button>


         {(userRole === 'admin' || userRole === 'general') && (
          <Button
          variant="contained"
          color="warning"
          sx={{ m: 1, color: "white", fontSize: "12px" }}
          onClick={handleClickOpen}
          startIcon={<EmailIcon />}
        >
          Email Work Order
        </Button>
)}
      
      </Box>

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
      <WorkOrderPDF id={id} />
    </div>
  );
}

export default WorkOrderdetailPdfMerge;
