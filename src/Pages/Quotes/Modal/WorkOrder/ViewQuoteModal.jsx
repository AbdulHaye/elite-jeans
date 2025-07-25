import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import axios from "axios";
import api from "../../../../ApiServices/api";

const ViewQuoteModal = ({
  open,
  handleClose,
  quoteData,
  setQuoteData,
  selectedQuoteId,
  vendorId,
  fetchVendorDataWorkOrder,
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteIndex === null) return;

    try {
      await api.delete(
        `/api/work-orders/item-details/${selectedQuoteId}/quotes/${deleteIndex}`
      );

      // Close modals
      setDeleteConfirmationOpen(false);
      handleClose();

      // Refresh vendor data in parent component
      fetchVendorDataWorkOrder(vendorId);
    } catch (error) {
      console.error("Error deleting quote:", error);
    }
  };

  const quotes =
    quoteData?.data && Array.isArray(quoteData.data) ? quoteData.data : [];

  return (
    <>
      <Modal open={open} onClose={handleClose} aria-labelledby="quote-details-modal">
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            Quote Details
          </Typography>

          {quotes.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table aria-label="quote table">
                <TableHead>
                  <TableRow>
                    <TableCell>Price</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Fabric</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotes?.map((quote, index) => (
                    <TableRow key={quote?._id}>
                      <TableCell>{quote?.price}</TableCell>
                      <TableCell>{quote?.vendor?.name}</TableCell>
                      <TableCell>
                        {new Date(quote?.date).toLocaleString()}
                      </TableCell>
                      <TableCell>{quote?.fabric}</TableCell>
                      <TableCell>{quote?.notes}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteClick(index)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ mt: 2 }} variant="body2" color="textSecondary">
              No quote data available.
            </Typography>
          )}
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
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
          <Typography variant="h6" component="h2" gutterBottom>
            Confirm Delete
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Are you sure you want to delete this quote?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
            >
              Confirm Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ViewQuoteModal;