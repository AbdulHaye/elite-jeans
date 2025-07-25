import React, { useEffect, useState } from "react";
import axios from "axios";
import "./washImage.css";
import NewWashModal from "../../../../../TechPack/Modals/WorkOrder/WashDetail/NewWashModal";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import api from "../../../../../../ApiServices/api";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const WashImage = ({ techPackId, washDetail, category }) => {
  console.log(washDetail, "washDetail work order");
  const style_id = washDetail && washDetail?._id;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const openModal = (cardData = null) => {
    setSelectedCard(cardData);
    setIsModalOpen(true);
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
    setDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCardToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (cardToDelete) {
      await deleteCard(cardToDelete);
      setDeleteModalOpen(false);
      setCardToDelete(null);
    }
  };

  const deleteCard = async (id) => {
    try {
      const response = await api.delete(`/api/work-orders/new-detail/${id}`);
      if (response.status === 200) {
        setCards((prevCards) => prevCards.filter((card) => card.id !== id));
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
        category_Id: category,
      });

      if (response) {
        showSnackbar("Data submitted successfully", "success");
        if (techPackId && style_id) {
          const updatedCards = await fetchStyleDetail(techPackId, style_id);
          setCards(updatedCards);
        }
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showSnackbar("An error occurred while submitting the data", "error");
    }
  };

  const fetchStyleDetail = async (techPackId, styleId) => {
    try {
      const response = await api.post(
        "/api/work-orders/new-detail-by-work-orders",
        {
          workOrder_Id: techPackId,
          wash_detail_id: styleId,
          category_Id: category,
        }
      );

      const styleDetails = response?.data?.data;

      return styleDetails?.map((detail) => ({
        title: detail?.pic?.category || "Unknown",
        comments: detail?.pic?.imageTitle || "N/A",
        imageUrl: detail?.pic?.imageUrl || "https://via.placeholder.com/150",
        id: detail?._id,
      }));
    } catch (error) {
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
            showSnackbar("Error loading wash details", "error");
          }
        } finally {
          setIsInitialLoad(false);
        }
      }
    };

    loadStyleDetails();
  }, [techPackId, style_id]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
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
                onClick={() => handleEditClick(card.id, card)}
              >
                Edit
              </button>
              <button
                className="btn_style delete_style"
                onClick={() => handleDelete(card.id)}
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
            + New Color and wash 
          </button>
        </div>
      )}

      <NewWashModal
        show={isModalOpen}
        closeModal={closeModal}
        onSubmit={(payload) => handleSubmit(payload, selectedCard)}
        techPackId={techPackId}
        styleDetail={washDetail}
        selectedCard={selectedCard}
        showSnackbar={showSnackbar}
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

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={handleCancelDelete}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Are you sure you want to delete this item?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This action cannot be undone.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 3,
            }}
          >
            <Button variant="outlined" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WashImage;