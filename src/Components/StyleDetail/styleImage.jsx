import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styleImage.css";
import { Modal, Box, Button, Snackbar, Alert } from "@mui/material";
import NewDetailModal from "../../Pages/TechPack/Modals/WorkOrder/StyleDetail/NewDetailModal";
import api from "../../ApiServices/api";

const StyleImage = ({ techPackId, styleDetail, category_Id }) => {
  const style_id = styleDetail && styleDetail?._id;
  console.log(category_Id,"new dtail category id ")
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [resetForm, setResetForm] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  // Snackbar state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const openModal = (cardData = null) => {
    setSelectedCard(cardData);
    setIsModalOpen(true);
    setResetForm(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handleEditClick = (id, cardData) => {
    openModal(cardData);
  };

  const handleDelete = (id) => {
    setCardToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (cardToDelete) {
      await deleteCard(cardToDelete);
      setShowDeleteModal(false);
      setCardToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCardToDelete(null);
  };

  const deleteCard = async (id) => {
    try {
      const response = await api.delete(`/api/work-orders/new-detail/${id}`);
      if (response?.status === 200) {
        setCards((prevCards) => prevCards?.filter((card) => card?.id !== id));
        showSnackbar("Card deleted successfully", "success");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      showSnackbar("An error occurred while deleting the card", "error");
    }
  };

  const handleNewDetailClick = () => {
    setSelectedCard(null);
    openModal();
  };

  const handleSubmit = async (payload, selectedCard) => {
    try {
      const apiUrl = selectedCard
        ? `/api/work-orders/new-detail/${selectedCard.id}`
        : "/api/work-orders/new-detail/create";

      const method = selectedCard ? "PUT" : "POST";

      const response = await api({
        method,
        url: apiUrl,
        data: payload,
        category_Id: category_Id,
      });

      if (response) {
        if (techPackId && style_id) {
          const updatedCards = await fetchStyleDetail(techPackId, style_id);
          setCards(updatedCards);
          showSnackbar("Data submitted successfully", "success");

          // Trigger form reset for new entries
          if (!selectedCard) {
            setResetForm(true);
          } else {
            closeModal();
          }
        }
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showSnackbar("An error occurred while submitting the data", "error");
    }
  };

  const fetchStyleDetail = async (techPackId, styleId) => {
    const style_Id = styleId;
    try {
      const response = await api.post(
        "/api/work-orders/new-detail-by-work-orders",
        {
          techpack_Id: techPackId,
          style_detail_id: style_Id,
            category_Id: category_Id,
        }
      );

      const styleDetails = response.data.data;

      return styleDetails.map((detail) => ({
        title: detail?.pic?.category || "Unknown",
        comments: detail?.pic?.imageTitle || "N/A",
        imageUrl: detail?.pic?.imageUrl || "https://via.placeholder.com/150",
        id: detail?._id,
      }));
    } catch (error) {
      console.error("Error fetching style details:", error);
      return [];
    }
  };

  const openImageViewer = (imageUrl) => {
    setCurrentImage(imageUrl);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentImage("");
  };

  useEffect(() => {
    const loadStyleDetails = async () => {
      if (techPackId && style_id) {
        try {
          const fetchedCards = await fetchStyleDetail(techPackId, style_id);
          setCards(fetchedCards);
        } catch (error) {
          if (!isInitialLoad) {
            showSnackbar("Error loading style details", "error");
          }
        } finally {
          setIsInitialLoad(false);
        }
      }
    };

    loadStyleDetails();
  }, [techPackId, style_id]);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };
  const userRole = localStorage.getItem("role");
  return (
    <div className="card-container_style container">
      {cards?.map((card, index) => (
        <div
          key={index}
          className={`card_styleImg ${selectedCard ? "button-only-card" : ""}`}
        >
          <div 
            className="card-image_style" 
            onClick={() => openImageViewer(card?.imageUrl)}
            style={{ cursor: "pointer" }}
          >
            <img src={card?.imageUrl} alt={card?.title} />
          </div>
          <div className="card-content_style">
            <h4>{card?.title}</h4>
            <p>Comments: {card?.comments}</p>
          </div>

          {(userRole === 'admin' || userRole === 'general') && (
            <div className="card-actions_style">
            <button
              className="btn_style edit_style"
              onClick={() => handleEditClick(card?.id, card)}
            >
              Edit
            </button>
            <button
              className="btn_style delete_style"
              onClick={() => handleDelete(card?.id)}
            >
              Delete
            </button>
          </div>
)}
 
        </div>
      ))}

      {(userRole === 'admin' || userRole === 'general') && (
        <div className="card_styleImg button-container">
          <button
            className="btn_style action_style"
            onClick={handleNewDetailClick}
          >
            New Detail
          </button>
        </div>
      )}

      <NewDetailModal
        show={isModalOpen}
        closeModal={closeModal}
        onSubmit={(payload) => handleSubmit(payload, selectedCard)}
        techPackId={techPackId}
        styleDetail={styleDetail}
        selectedCard={selectedCard}
        resetForm={resetForm}
        setResetForm={setResetForm}
        category_Id= {category_Id}
      />

      {/* Image Viewer Modal */}
      <Modal
        open={imageViewerOpen}
        onClose={closeImageViewer}
        aria-labelledby="image-viewer-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "1200px",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            outline: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img 
            src={currentImage} 
            alt="Full size preview" 
            style={{ 
              maxWidth: "100%", 
              maxHeight: "80vh",
              objectFit: "contain" 
            }} 
          />
        </Box>
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-confirmation-modal"
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
          <h3 id="delete-confirmation-modal">
            Are you sure you want to delete this item?
          </h3>
          <div className="modal-actions">
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{ mr: 2 }}
            >
              Yes, Delete
            </Button>
            <Button
              onClick={handleDeleteCancel}
              variant="outlined"
              color="primary"
            >
              No, Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default StyleImage;