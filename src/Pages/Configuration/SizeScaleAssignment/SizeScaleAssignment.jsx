import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import Navbar from "../../../Navbar/Navbar";
import "./SizeScaleAssignment.css";
import api from "../../../ApiServices/api";
import { useNavigate } from "react-router-dom";

const NewScaleAssignment = () => {

  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");


  const [formData, setFormData] = useState({
    client: "",
    packBySize: false,
    itemType: "",
    category: "",
    class: "",
    sizeScale: "",
    sizeBreak: "",
    MP_per_MC: "",
    individualPolyBag: false,
    fittingSample: {
      size: "",
      piece: "",
      daysAfterWorkOrderDate: "",
      daysBeforeWorkOrderETDDate: "",
    },
    shippingSample: {
      size: "",
      piece: "",
      daysAfterWorkOrderDate: "",
      daysBeforeWorkOrderETDDate: "",
    },
  });
  const [clients, setClients] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sizeScaleOptions, setSizeScaleOptions] = useState([]);
  const [sizeBreakOptions, setSizeBreakOptions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);
  const navigate = useNavigate();
  const fetchInitialData = () => {
    setLoading(true);
    api
      .get("api/clients")
      .then((response) => {
        setClients(response.data);
        return api.get("api/item-types");
      })
      .then((response) => {
        setItemTypes(response.data);
        return api.get("api/categories");
      })
      .then((response) => {
        setCategories(response.data);
        return api.get("api/classes");
      })
      .then((response) => {
        setClassOptions(response.data);
        return api.get("api/size-breaks");
      })
      .then((response) => {
        setSizeBreakOptions(response.data);
        return api.get("api/size-scales");
      })
      .then((response) => {
        setSizeScaleOptions(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
    fetchAssignments();
  };

  const fetchAssignments = () => {
    api
      .get("api/new-scale-assignments")
      .then((response) => {
        setAssignments(response.data);
      })
      .catch((error) => {
        console.error("Error fetching assignments:", error);
         if (error?.message && error?.message?.includes("Unauthorized")) {
          navigate("/login");
        }
      });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEdit = (assignment) => {
    setFormData({
      ...assignment,
      client: assignment?.client?._id,
      itemType: assignment?.itemType?._id,
      sizeBreak: assignment?.sizeBreak?._id,
      sizeScale: assignment?.sizeScale?._id,
      class: assignment?.class?._id,
      category: assignment?.category?._id,
      fittingSample: assignment?.fittingSample || {},
      shippingSample: assignment?.shippingSample || {},
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setSelectedAssignmentId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`api/new-scale-assignments/${selectedAssignmentId}`);
      setAssignments(
        assignments.filter(
          (assignment) => assignment._id !== selectedAssignmentId
        )
      );
      setDeleteModalOpen(false);
     
      setSnackbarMessage("Assignment deleted successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      setSnackbarMessage("Failed to delete assignment.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleNestedInputChange = (e, section) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [name]: value,
      },
    });
  };

  const handleSelectChange = (selectedValue, fieldName) => {
    setFormData({ ...formData, [fieldName]: selectedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client || !formData.itemType || !formData.category) {
      setSnackbarMessage("Please fill out all required fields.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;

    }

    const isEditMode = formData._id;
    const url = isEditMode
      ? `api/new-scale-assignments/${formData._id}`
      : "api/new-scale-assignments";

    try {
      const response = isEditMode
        ? await api.put(url, formData)
        : await api.post(url, formData);

      setAssignments(
        isEditMode
          ? assignments.map((a) => (a._id === formData._id ? response.data : a))
          : [...assignments, response.data]
      );
      setShowModal(false);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error("Error submitting data:", error);
      setSnackbarMessage("Error submitting the assignment.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const resetForm = () => {
    setFormData({
      client: "",
      packBySize: false,
      individualPolyBag: false,
      itemType: "",
      category: "",
      class: "",
      sizeScale: "",
      sizeBreak: "",
      MP_per_MC: "",
      fittingSample: {
        size: "",
        piece: "",
        daysAfterWorkOrderDate: "",
        daysBeforeWorkOrderETDDate: "",
      },
      shippingSample: {
        size: "",
        piece: "",
        daysAfterWorkOrderDate: "",
        daysBeforeWorkOrderETDDate: "",
      },
    });
  };

  const renderDropdownOptions = (data) => {
    return data?.map((item) => (
      <MenuItem key={item._id} value={item._id}>
        {item.name}
      </MenuItem>
    ));
  };

  return (
    <div>
      <Navbar />
      <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert 
            onClose={() => setOpenSnackbar(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      <div className="main_newScale">
        <Button
          variant="contained"
          color="primary"
          className="btn_add_new_scale"
          onClick={() => setShowModal(true)}
        >
          Add New Scale Assignment
        </Button>

        {/* Add/Edit Dialog */}
        <Dialog
          open={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {formData._id ? "Edit" : "Add New"} Scale Assignment
          </DialogTitle>
          <DialogContent>
            {loading ? (
              <CircularProgress />
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Client"
                  fullWidth
                  select
                  value={formData.client}
                  onChange={(e) => handleSelectChange(e.target.value, "client")}
                  margin="normal"
                  required
                >
                  {renderDropdownOptions(clients)}
                </TextField>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.packBySize}
                      onChange={handleInputChange}
                      name="packBySize"
                    />
                  }
                  label="Pack by Size"
                />

                <TextField
                  label="Item Type"
                  fullWidth
                  select
                  value={formData.itemType}
                  onChange={(e) =>
                    handleSelectChange(e.target.value, "itemType")
                  }
                  margin="normal"
                  required
                >
                  {renderDropdownOptions(itemTypes)}
                </TextField>

                <TextField
                  label="Category"
                  fullWidth
                  select
                  value={formData.category}
                  onChange={(e) =>
                    handleSelectChange(e.target.value, "category")
                  }
                  margin="normal"
                  required
                >
                  {renderDropdownOptions(categories)}
                </TextField>

                <TextField
                  label="Class"
                  fullWidth
                  select
                  value={formData.class}
                  onChange={(e) => handleSelectChange(e.target.value, "class")}
                  margin="normal"
                >
                  {renderDropdownOptions(classOptions)}
                </TextField>

                <TextField
                  label="Size Scale"
                  fullWidth
                  select
                  value={formData.sizeScale}
                  onChange={(e) =>
                    handleSelectChange(e.target.value, "sizeScale")
                  }
                  margin="normal"
                >
                  {renderDropdownOptions(sizeScaleOptions)}
                </TextField>

                <TextField
                  label="Size Break"
                  fullWidth
                  select
                  value={formData.sizeBreak}
                  onChange={(e) =>
                    handleSelectChange(e.target.value, "sizeBreak")
                  }
                  margin="normal"
                >
                  {renderDropdownOptions(sizeBreakOptions)}
                </TextField>

                <TextField
                  label="MP per MC"
                  type="number"
                  fullWidth
                  value={formData.MP_per_MC}
                  onChange={handleInputChange}
                  name="MP_per_MC"
                  margin="normal"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.individualPolyBag}
                      onChange={handleInputChange}
                      name="individualPolyBag"
                    />
                  }
                  label="Individual Poly Bag"
                />

                <Box mt={2}>
                  <h5>Fitting Sample</h5>
                  <TextField
                    label="Size"
                    fullWidth
                    value={formData.fittingSample.size}
                    onChange={(e) =>
                      handleNestedInputChange(e, "fittingSample")
                    }
                    name="size"
                    margin="normal"
                  />
                  <TextField
                    label="Piece"
                    fullWidth
                    type="number"
                    value={formData.fittingSample.piece}
                    onChange={(e) =>
                      handleNestedInputChange(e, "fittingSample")
                    }
                    name="piece"
                    margin="normal"
                  />
                  <TextField
                    label="Days After Work Order Date"
                    fullWidth
                    type="number"
                    value={formData.fittingSample.daysAfterWorkOrderDate}
                    onChange={(e) =>
                      handleNestedInputChange(e, "fittingSample")
                    }
                    name="daysAfterWorkOrderDate"
                    margin="normal"
                  />
                  <TextField
                    label="Days Before Work Order ETD Date"
                    fullWidth
                    type="number"
                    value={formData.fittingSample.daysBeforeWorkOrderETDDate}
                    onChange={(e) =>
                      handleNestedInputChange(e, "fittingSample")
                    }
                    name="daysBeforeWorkOrderETDDate"
                    margin="normal"
                  />
                </Box>

                <Box mt={2}>
                  <h5>Shipping Sample</h5>
                  <TextField
                    label="Size"
                    fullWidth
                    value={formData.shippingSample.size}
                    onChange={(e) =>
                      handleNestedInputChange(e, "shippingSample")
                    }
                    name="size"
                    margin="normal"
                  />
                  <TextField
                    label="Piece"
                    fullWidth
                    type="number"
                    value={formData.shippingSample.piece}
                    onChange={(e) =>
                      handleNestedInputChange(e, "shippingSample")
                    }
                    name="piece"
                    margin="normal"
                  />
                  <TextField
                    label="Days After Work Order Date"
                    fullWidth
                    type="number"
                    value={formData.shippingSample.daysAfterWorkOrderDate}
                    onChange={(e) =>
                      handleNestedInputChange(e, "shippingSample")
                    }
                    name="daysAfterWorkOrderDate"
                    margin="normal"
                  />
                  <TextField
                    label="Days Before Work Order ETD Date"
                    fullWidth
                    type="number"
                    value={formData.shippingSample.daysBeforeWorkOrderETDDate}
                    onChange={(e) =>
                      handleNestedInputChange(e, "shippingSample")
                    }
                    name="daysBeforeWorkOrderETDDate"
                    margin="normal"
                  />
                </Box>

                <DialogActions>
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outlined"
                    color="secondary"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" color="primary">
                    {formData._id ? "Update" : "Submit"}
                  </Button>
                </DialogActions>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Box p={2}>
              Are you sure you want to delete this assignment? This action
              cannot be undone.
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteModalOpen(false)}
              variant="outlined"
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              autoFocus
            >
              Confirm Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assignments Table */}
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>Client</TableCell>
                <TableCell>Pack by Size</TableCell>
                <TableCell>Item Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Size Scale</TableCell>
                <TableCell>Size Break</TableCell>
                <TableCell>MP per MC</TableCell>
                <TableCell>Poly Bag</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment._id}>
                  <TableCell>{assignment.client?.name}</TableCell>
                  <TableCell>
                    <Checkbox checked={assignment.packBySize} disabled />
                  </TableCell>
                  <TableCell>{assignment.itemType?.name}</TableCell>
                  <TableCell>{assignment.category?.name}</TableCell>
                  <TableCell>{assignment.class?.name}</TableCell>
                  <TableCell>{assignment.sizeScale?.name}</TableCell>
                  <TableCell>{assignment.sizeBreak?.name}</TableCell>
                  <TableCell>{assignment.MP_per_MC}</TableCell>
                  <TableCell>
                    <Checkbox checked={assignment.individualPolyBag} disabled />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleEdit(assignment)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(assignment._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default NewScaleAssignment;
