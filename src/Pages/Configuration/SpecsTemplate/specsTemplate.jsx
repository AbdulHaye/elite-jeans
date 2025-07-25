import React, { useState, useEffect, useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddSpecsModal from "../Modal/AddSpecsModal";
import Navbar from "../../../Navbar/Navbar";
import api from "../../../ApiServices/api";

// Hardcoded size ranges
const SIZE_RANGES = [
  { id: "1-19", label: "1-19 (Junior Numerical)" },
  { id: "XS-XXL", label: "XS-XXL (Junior/Missy Alpha)" },
  { id: "14-28", label: "14-28 (Plus Numerical)" },
  { id: "1X-4X", label: "1X-4X (Plus Alpha)" },
  { id: "0-16", label: "0-16 (Missy Numerical)" },
  { id: "7-16", label: "7-16 (Girls Numerical)" },
];

const getAllTechPacks = async () => {
  try {
    const response = await api.get("/api/specsTemplates");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching tech packs:", error);
    throw error;
  }
};

const deleteTechPack = async (techPackId) => {
  try {
    await api.delete(`/api/specsTemplates/${techPackId}`);
    return techPackId;
  } catch (error) {
    console.error("Error deleting tech pack:", error);
    throw error;
  }
};

const updateTechPack = async (techPackId, updateData) => {
  try {
    const response = await api.put(`/api/specsTemplates/${techPackId}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating tech pack:", error);
    throw error;
  }
};

const getPOMLengthById = async (id) => {
  try {
    const response = await api.get(`/api/specsTemplates/poms/Byid/${id}`);
    return response.data?.data?.length || 0;
  } catch (error) {
    console.error(`Error fetching POM length for ${id}:`, error);
    return 0;
  }
};

const columnToKeyMap = {
  "Name": "Name",
  "Spec Type": "spec_type",
  "Size Range": "Size_Range",
  "Point of Measure": "Point_of_Measure"
};
const columns = Object.keys(columnToKeyMap);

const sortByColumn = (data, column) => {
  const key = columnToKeyMap[column];

  return data.slice().sort((a, b) => {
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';

    const strA = Array.isArray(valA) ? valA.join(',') : String(valA);
    const strB = Array.isArray(valB) ? valB.join(',') : String(valB);

    return strA.localeCompare(strB, undefined, { sensitivity: 'base' });
  });
};

const SpecsTemplate = () => {
  const [selectedColumn, setSelectedColumn] = useState(columns[0]);
  const [techPacks, setTechPacks] = useState([]);
  const [sortedTechPacks, setSortedTechPacks] = useState(techPacks);

  useEffect(() => {
    setSortedTechPacks(sortByColumn(techPacks, selectedColumn));
  }, [selectedColumn, techPacks]);

  const [pomLengths, setPomLengths] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTechPackId, setSelectedTechPackId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const navigate = useNavigate();

  const fetchTechPacks = useCallback(async () => {
    try {
      const data = await getAllTechPacks();
      setTechPacks(data);

      // Fetch POM length for each tech pack
      const pomData = {};
      await Promise.all(
        data.map(async (pack) => {
          const length = await getPOMLengthById(pack._id);
          pomData[pack._id] = length;
        })
      );
      setPomLengths(pomData);
    } catch (error) {
      console.error("Failed to fetch tech packs or POMs:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchTechPacks();
  }, [fetchTechPacks]);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handlePostSubmit = () => {
    fetchTechPacks();
  };

  const handleClick = (techPackId, sizeRange, spec_type) => {
    navigate("/spec-template-detail", {
      state: { techPackId, sizeRange, spec_type },
    });
  };

  const handleOpenDeleteModal = (techPackId) => {
    setSelectedTechPackId(techPackId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTechPackId(null);
  };

  const confirmDelete = async () => {
    if (selectedTechPackId) {
      try {
        await deleteTechPack(selectedTechPackId);
        setTechPacks((prev) =>
          prev.filter((techPack) => techPack._id !== selectedTechPackId)
        );
        const newPomLengths = { ...pomLengths };
        delete newPomLengths[selectedTechPackId];
        setPomLengths(newPomLengths);
      } catch (error) {
        console.error("Failed to delete tech pack:", error.message);
      }
      handleCloseDeleteModal();
    }
  };

  const handleFieldClick = (id, currentValue) => {
    setEditingId(id);
    setEditedName(currentValue);
  };

  const handleFieldBlur = (id) => {
    const currentTechPack = techPacks?.find(pack => pack?._id === id);

    // Check if the value has actually changed
    if (currentTechPack?.Name === editedName || !editedName?.toString().trim()) {
      cancelEditing();
      return;
    }

    // Prepare the update data
    const updateData = { Name: editedName };

    // Store the pending update and show confirmation dialog
    setPendingUpdate({ id, updateData });
    setConfirmDialogOpen(true);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedName("");
  };

  const handleConfirmUpdate = async () => {
    if (pendingUpdate) {
      try {
        const updatedTechPack = await updateTechPack(pendingUpdate.id, pendingUpdate.updateData);
        setTechPacks(prev =>
          prev.map(techPack =>
            techPack._id === pendingUpdate.id ? { ...techPack, ...pendingUpdate.updateData } : techPack
          )
        );
      } catch (error) {
        console.error("Failed to update tech pack:", error.message);
      }
    }
    setConfirmDialogOpen(false);
    cancelEditing();
  };

  const handleCancelUpdate = () => {
    setConfirmDialogOpen(false);
    cancelEditing();
  };

  const handleKeyPress = (e, id) => {
    if (e.key === "Enter") {
      handleFieldBlur(id);
    }
  };

  const renderEditableField = (id, currentValue) => {
    if (editingId === id) {
      return (
        <TextField
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={() => handleFieldBlur(id)}
          onKeyPress={(e) => handleKeyPress(e, id)}
          autoFocus
          fullWidth
          size="small"
        />
      );
    } else {
      return (
        <Typography
          onClick={() => handleFieldClick(id, currentValue)}
          sx={{
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {currentValue || "N/A"}
        </Typography>
      );
    }
  };

  const getSizeRangeLabel = (sizeRangeId) => {
    const range = SIZE_RANGES.find(r => r.id === sizeRangeId);
    return range ? range.label : sizeRangeId;
  };

  return (
    <>
      <Navbar />
      <div className="main_newScale">
        <Box
          display="flex"
          gap={3}
          sx={{
            marginTop: 2,
            marginBottom: 2,
            flexWrap: "wrap",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              minWidth: 200,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Spec Template
            </Typography>
          </Paper>

          <Button variant="contained" color="primary" onClick={openModal}>
            Add New Template
          </Button>
        </Box>

        <AddSpecsModal
          isOpen={modalIsOpen}
          closeModal={closeModal}
          onSubmit={handlePostSubmit}
          sizeRanges={SIZE_RANGES}
        />

        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {columns.map((title) => (
                  <TableCell
                    onClick={() => setSelectedColumn(title)}
                    key={title}
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: selectedColumn === title ? "#1976d2" : "#f4f6f8",
                      color: selectedColumn === title ? "#FFF" : "#5c6bc0",
                      cursor: "pointer"
                    }}
                  >
                    {title}
                  </TableCell>
                ))}

                <TableCell
                  key="Actions"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f4f6f8",
                    color: "#5c6bc0",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTechPacks?.length > 0 ? (
                sortedTechPacks.map((row) => (
                  <TableRow key={row?._id}>
                    <TableCell>
                      {renderEditableField(row?._id, row?.Name)}
                    </TableCell>
                    <TableCell>
                      <Typography>{row?.spec_type
                        || "N/A"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{getSizeRangeLabel(row?.Size_Range)}</Typography>
                    </TableCell>
                    <TableCell>
                      {pomLengths[row?._id] !== undefined
                        ? pomLengths[row?._id]
                        : "Loading..."}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          sx={{ textTransform: "none", fontWeight: 500 }}
                          onClick={() =>
                            handleClick(
                              row?._id,
                              row?.Size_Range,
                              row?.spec_type
                            )
                          }
                        >
                          View
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          sx={{ textTransform: "none", fontWeight: 500 }}
                          onClick={() => handleOpenDeleteModal(row?._id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Delete Template Confirmation"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteModal}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCancelUpdate}
          aria-labelledby="update-dialog-title"
          aria-describedby="update-dialog-description"
        >
          <DialogTitle id="update-dialog-title">
            {"Save Changes Confirmation"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="update-dialog-description">
              Are you sure you want to save these changes?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelUpdate}>Cancel</Button>
            <Button onClick={handleConfirmUpdate} color="primary" autoFocus>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default SpecsTemplate;