import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import api from "../../../../../../ApiServices/api";

const LibraryItemsModal = ({
  open,
  handleClose,
  sampleSpecsId,
  techPackId,
  onPayloadSend,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSelectedItems([]);
      api
        .get("/api/point-of-measure")
        .then((response) => {
          setData(response.data);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch data");
          setLoading(false);
        });
    }
  }, [open]);

  const handleCheckboxChange = (event, item) => {
    if (event.target.checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((selected) => selected !== item));
    }
  };

  const handleAdd = () => {
    const payload = {
      pomIds: selectedItems.map((item) => item._id),
    };

    api
      .post(
        `/api/copied-poms-multiple/${sampleSpecsId}/${techPackId}/`,
        payload
      )
      .then((response) => {
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: "success",
        });
        if (onPayloadSend) {
          onPayloadSend(response.data);
        }
        // ✅ Auto-close modal after short delay
        setTimeout(() => {
          handleModalClose();
        }, 1000);
      })
      .catch((err) => {
        setSnackbar({
          open: true,
          message: "Error adding items: " + err?.response?.data?.error,
          severity: "error",
        });
        // Optional: close modal after error (commented out by default)
        // handleModalClose();
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleModalClose = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
    handleClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleModalClose}
        aria-labelledby="library-items-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 600,
            maxHeight: "80vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="library-items-modal" variant="h6" component="h2">
            Library Items
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Select items to add from the library.
          </Typography>

          {loading ? (
            <Typography sx={{ mt: 2 }}>Loading...</Typography>
          ) : error ? (
            <Typography sx={{ mt: 2, color: "error.main" }}>{error}</Typography>
          ) : (
            <>
              <TableContainer
                component={Paper}
                sx={{ mt: 3, maxHeight: "50vh", overflowY: "auto" }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.length === data.length}
                          indeterminate={
                            selectedItems.length > 0 &&
                            selectedItems.length < data.length
                          }
                          onChange={(e) => {
                            setSelectedItems(e.target.checked ? data : []);
                          }}
                        />
                      </TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Tolerance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item)}
                            onChange={(e) => handleCheckboxChange(e, item)}
                          />
                        </TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.tolerance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={3} textAlign="right">
                <Typography sx={{ mb: 2 }}>
                  Selected Items: {selectedItems.length}
                </Typography>
                <Button
                  onClick={handleAdd}
                  variant="contained"
                  color="secondary"
                  disabled={selectedItems.length === 0}
                >
                  Add{" "}
                  {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}
                </Button>
                <Button
                  onClick={handleModalClose}
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2 }}
                >
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LibraryItemsModal;
