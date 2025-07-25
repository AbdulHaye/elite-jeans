import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styleImage.css";
import NewDetailModal from "../../../../TechPack/Modals/WorkOrder/StyleDetail/NewDetailModal";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import api from "../../../../../ApiServices/api";
import { useConfirmationDialog } from "../../../../../Components/dialog/ConfirmationDialogProvider";

const StyleImage = ({ techPackId, styleDetail,category }) => {
  const style_id = styleDetail && styleDetail?._id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

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

  const showConfirmationDialog = useConfirmationDialog();

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirmationDialog({
      message: "Are you sure you want to delete this item?",
    });
    if (isConfirmed) {
      deleteCard(id);
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
        category_Id: category?.category?._id
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
          style_detail_id: styleId,
            category_Id: category?.category?._id,
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
      console.error("Error fetching style details:", error);
      return []; // Return empty array to maintain UI
    }
  };

  useEffect(() => {
    const loadStyleDetails = async () => {
      if (techPackId && style_id) {
        try {
          const fetchedCards = await fetchStyleDetail(techPackId, style_id);
          setCards(fetchedCards);
        } catch (error) {
          // Only show error if it's not the initial load
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
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <div className="card-container_style container">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`card_styleImg ${selectedCard ? "button-only-card" : ""}`}
        >
          <div className="card-image_style">
            <img src={card.imageUrl} alt={card.title} />
          </div>
          <div className="card-content_style">
            <h4>{card.title}</h4>
            <p>Comments: {card.comments}</p>
          </div>
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
        </div>
      ))}

      <div className="card_styleImg button-container">
        <button
          className="btn_style action_style"
          onClick={handleNewDetailClick}
        >
          New Detail
        </button>
      </div>

      <NewDetailModal
        show={isModalOpen}
        closeModal={closeModal}
        onSubmit={(payload) => handleSubmit(payload, selectedCard)}
        techPackId={techPackId}
        styleDetail={styleDetail}
        selectedCard={selectedCard}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default StyleImage;
