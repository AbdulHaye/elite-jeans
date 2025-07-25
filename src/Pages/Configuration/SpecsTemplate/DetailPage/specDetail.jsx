import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import Navbar from "../../../../Navbar/Navbar";
import OpenPOMModal from "../../Modal/OpenPOMModal";
import api from "../../../../ApiServices/api";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { useConfirmationDialog } from "../../../../Components/dialog/ConfirmationDialogProvider";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
const SpecDetail = () => {
  const location = useLocation();
  const { techPackId, sizeRange, spec_type } = location.state || {};
  const [templateName, setTemplateName] = useState(techPackId || "");
  const [sizeRangeData, setSizeRangeData] = useState(sizeRange || "");
  const [specTypeData, setSpecTypeData] = useState(spec_type || "");

  const [data, setData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});
  const [originalRowData, setOriginalRowData] = useState({});
  const [dynamicKeys, setDynamicKeys] = useState([]);
  const [isAddingSize, setIsAddingSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeValues, setNewSizeValues] = useState({});
  const [activeSizeCell, setActiveSizeCell] = useState(null);
  const [showEditDescriptionDialog, setShowEditDescriptionDialog] =
    useState(false);

  const showConfirmationDialog = useConfirmationDialog();

  const fetchData = async () => {
    try {
      const response = await api.get(
        `/api/specsTemplates/poms/Byid/${techPackId}`
      );
      const result = response.data.data;
      console.log(result[0]?.specTemplateId?.Name, "epc templte poms data");
      console.log(
        result[0]?.specTemplateId?.Size_Range,
        "epc templte poms data"
      );
      console.log(
        result[0]?.specTemplateId?.spec_type,
        "epc templte poms data"
      );
      setTemplateName(result[0]?.specTemplateId?.Name || techPackId || "");
      setSizeRangeData(
        result[0]?.specTemplateId?.Size_Range || sizeRange || ""
      );
      setSpecTypeData(result[0]?.specTemplateId?.spec_type || spec_type || "");

      setData(result);

      if (result && result.length > 0) {
        const firstRow = result[0];
        const excludedKeys = [
          "_id",
          "specTemplateId",
          "createdAt",
          "updatedAt",
          "__v",
          "code",
          "description",
          "tolerance",
          "Initial",
          "FirstPP",
          "Rev1",
          "SecondPP",
          "Rev2",
          "ThirdPP",
          "Final",
          "Ship",
          "Design",
        ];

        setDynamicKeys(
          Object.keys(firstRow).filter((key) => !excludedKeys.includes(key))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [techPackId]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handlePayload = (payload) => {
    console.log("Received payload from modal:", payload);
    setTimeout(() => {
      fetchData();
    }, 1000);
  };

  const handleSelectAll = () => {
    const allIds = data?.map((row) => row?._id);
    setSelectedIds(allIds);
  };

  const handleUnselectAll = () => {
    setSelectedIds([]);
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleDeleteSelected = async () => {
    const confirmDelete = await showConfirmationDialog({
      message: "Are you sure you want to delete the selected items?",
    });
    if (confirmDelete) {
      try {
        await Promise.all(
          selectedIds?.map((id) =>
            api.delete(`/api/specsTemplates/deleted/${id}`)
          )
        );
        fetchData();
        setSelectedIds([]);
      } catch (error) {
        console.error("Error deleting selected records:", error);
      }
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row._id);
    setOriginalRowData(row);
    setEditedRowData({ ...row });
  };

  const handleSaveClick = async () => {
    try {
      const response = await api.put(
        `/api/specsTemplates/edit/${editedRowData._id}`,
        editedRowData
      );
      console.log("Updated successfully:", response.data);
      fetchData();
      setEditingRow(null);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleCancelClick = () => {
    setEditedRowData({ ...originalRowData });
    setEditingRow(null);
  };

  const handleDeleteClick = async (id) => {
    const confirmDelete = await showConfirmationDialog({
      message: "Are you sure you want to delete this item?",
    });
    if (confirmDelete) {
      try {
        await api.delete(`/api/specsTemplates/deleted/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  const handleChange = (e, field) => {
    setEditedRowData((prevData) => ({
      ...prevData,
      [field]: e.target.value,
    }));
  };

  const handleAddSizeClick = (index) => {
    setIsAddingSize(true);
    setActiveSizeCell(index);
    // Initialize empty values for each row
    const initialValues = {};
    data?.forEach((row) => {
      initialValues[row._id] = "";
    });
    setNewSizeValues(initialValues);
    setNewSizeName("");
  };

  const handleNewSizeNameChange = (e) => {
    setNewSizeName(e.target.value);
  };

  const handleNewSizeValueChange = (rowId, value) => {
    setNewSizeValues((prev) => ({
      ...prev,
      [rowId]: value,
    }));
  };
 const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'error' | 'warning' | 'info' | 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  const handleSaveNewSize = async () => {
  if (!newSizeName.trim()) {
    setSnackbar({
      open: true,
      message: "Please enter a size name",
      severity: 'error',
    });
    return;
  }

  try {
    const values = data?.map((row) => newSizeValues[row._id] || "");

    const response = await api.post(
      `/api/specsTemplates/poms/Byid/${techPackId}/add-size`,
      {
        size: newSizeName,
        values: values,
      }
    );

    if (response.data.message) {
      console.log(response, "response of update add size");
      fetchData();
      setIsAddingSize(false);
      setNewSizeName("");
      setNewSizeValues({});
      setActiveSizeCell(null);
      setSnackbar({
        open: true,
        message: "Size added successfully!",
        severity: 'success',
      });
    }
  } catch (error) {
    console.error("Error adding new size:", error);
    setSnackbar({
      open: true,
      message: "Failed to add new size. Please try again.",
      severity: 'error',
    });
  }
};
  const handleCancelAddSize = () => {
    setIsAddingSize(false);
    setNewSizeName("");
    setNewSizeValues({});
    setActiveSizeCell(null);
  };

  const handleDeleteSizeClick = async (index) => {
  const sizeToDelete = dynamicKeys[index];
  const confirmDelete = await showConfirmationDialog({
    message: `Are you sure you want to delete size: ${sizeToDelete}?`,
  });

  if (confirmDelete) {
    try {
      const response = await api.post(
        `/api/specsTemplates/poms/Byid/${techPackId}/delete-size`,
        { size: sizeToDelete }
      );

      if (response.data.message) {
        console.log("Deleted size:", sizeToDelete);
        fetchData(); // Refresh table
        setSnackbar({
          open: true,
          message: `Size "${sizeToDelete}" deleted successfully!`,
          severity: 'success',
        });
      }
    } catch (error) {
      console.error("Error deleting size:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete size. Please try again.",
        severity: 'error',
      });
    }
  }
};

  return (
    <>
      <Navbar />
      <Box p={3}>
        <Box mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.history.back()}
          >
            <span style={{ marginRight: "8px" }}>←</span> Specs Template Grading
          </Button>

          <Box
            display="flex"
            gap={3}
            sx={{
              marginTop: 3,
              marginBottom: 3,
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
              <Typography variant="subtitle1" color="text.secondary">
                Template
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {templateName || "Unnamed Template"}
              </Typography>
            </Paper>

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
              <Typography variant="subtitle1" color="text.secondary">
                Size Range
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {sizeRangeData || "N/A"}
              </Typography>
            </Paper>

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
              <Typography variant="subtitle1" color="text.secondary">
                Spec Type
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {specTypeData || "N/A"}
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Button variant="contained" color="primary" onClick={openModal}>
            Open POM Library
          </Button>
          <Button variant="contained" color="primary" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUnselectAll}
          >
            Unselect All
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
          >
            Delete Selected
          </Button>
        </Box>

        {data ? (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, boxShadow: 3 }}
          >
            <Table sx={{ minWidth: 650, borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}></TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tolerance</TableCell>
                  {dynamicKeys?.map((key, index) => (
                    <TableCell key={key} sx={{ fontWeight: "bold" }}>
                      {key}
                      {index < dynamicKeys.length - 1 && (
                        <IconButton
                          onClick={() => handleDeleteSizeClick(index)}
                          aria-label="delete"
                          size="small"
                          color="error"
                          disabled={isAddingSize}
                        >
                          <CloseIcon fontSize="inherit" />
                        </IconButton>
                      )}
                      {index === dynamicKeys.length - 1 && !isAddingSize && (
                        <IconButton
                          size="small"
                          onClick={() => handleAddSizeClick(index + 1)}
                          color="primary"
                          sx={{ ml: 1 }}
                        >
                          <AddIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  ))}
                  {isAddingSize && activeSizeCell === dynamicKeys.length && (
                    <TableCell sx={{ fontWeight: "bold", p: 0 }}>
                      <Box display="flex" alignItems="center">
                        <TextField
                          value={newSizeName}
                          onChange={handleNewSizeNameChange}
                          placeholder="Enter size"
                          size="small"
                          fullWidth
                          autoFocus
                          sx={{
                            "& .MuiInputBase-input": {
                              py: 1,
                              textAlign: "center",
                              fontWeight: "bold",
                            },
                          }}
                        />
                        <IconButton
                          color="primary"
                          onClick={handleSaveNewSize}
                          sx={{ ml: 1 }}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={handleCancelAddSize}
                        >
                          ×
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((row) => (
                  <TableRow key={row?._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(row?._id)}
                        onChange={() => handleCheckboxChange(row?._id)}
                      />
                    </TableCell>
                    <TableCell>
                      {editingRow === row?._id ? (
                        <TextField
                          value={editedRowData?.code}
                          onChange={(e) => handleChange(e, "code")}
                          fullWidth
                        />
                      ) : (
                        row?.code
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === row?._id ? (
                        <TextField
                          value={editedRowData?.description}
                          // onFocus={() => setShowEditDescriptionDialog(true)}
                          onChange={(e) => handleChange(e, "description")}
                          fullWidth
                          multiline
                        />
                      ) : (
                        row?.description
                      )}

                      <Dialog
                        open={showEditDescriptionDialog}
                        onClose={() => setShowEditDescriptionDialog(false)}
                      >
                        <DialogTitle>Edit Description</DialogTitle>
                        <DialogContent>
                          <TextField
                            value={editedRowData?.description}
                            onChange={(e) => handleChange(e, "description")}
                            fullWidth
                            multiline
                          />
                        </DialogContent>
                        <DialogActions>
                          <Button
                            onClick={() => setShowEditDescriptionDialog(false)}
                          >
                            OK
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      {editingRow === row?._id ? (
                        <TextField
                          value={editedRowData?.tolerance}
                          onChange={(e) => handleChange(e, "tolerance")}
                          fullWidth
                        />
                      ) : (
                        row.tolerance
                      )}
                    </TableCell>
                    {dynamicKeys?.map((key, index) => (
                      <TableCell key={key}>
                        {editingRow === row?._id ? (
                          <TextField
                            value={editedRowData[key] || ""}
                            onChange={(e) => handleChange(e, key)}
                            fullWidth
                          />
                        ) : (
                          row[key]
                        )}
                        {isAddingSize && activeSizeCell === index && (
                          <TextField
                            value={newSizeValues[row._id] || ""}
                            onChange={(e) =>
                              handleNewSizeValueChange(row._id, e.target.value)
                            }
                            size="small"
                            fullWidth
                            sx={{
                              mt: 1,
                              "& .MuiInputBase-input": {
                                py: 1,
                                textAlign: "center",
                              },
                            }}
                          />
                        )}
                      </TableCell>
                    ))}
                    {isAddingSize && activeSizeCell === dynamicKeys.length && (
                      <TableCell sx={{ p: 0 }}>
                        <TextField
                          value={newSizeValues[row._id] || ""}
                          onChange={(e) =>
                            handleNewSizeValueChange(row._id, e.target.value)
                          }
                          size="small"
                          fullWidth
                          sx={{
                            "& .MuiInputBase-input": {
                              py: 1,
                              textAlign: "center",
                            },
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {editingRow === row?._id ? (
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveClick}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleCancelClick}
                          >
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <Box display="flex" gap={1}>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleEditClick(row)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteClick(row?._id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, boxShadow: 3 }}
          >
            <Table sx={{ minWidth: 650, borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}></TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tolerance</TableCell>
                  {dynamicKeys?.map((key) => (
                    <TableCell key={key} sx={{ fontWeight: "bold" }}>
                      {key}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography>No data available</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <OpenPOMModal
          open={isModalOpen}
          handleClose={closeModal}
          techPackId={techPackId}
          onPayloadSend={handlePayload}
        />
      </Box>
       <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleCloseSnackbar}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default SpecDetail;
