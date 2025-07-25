import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../../ApiServices/api";

const AddSpecsModal = ({ isOpen, closeModal, onSubmit, sizeRanges }) => {
  const [formData, setFormData] = useState({
    Name: "",
    spec_type: "",
    Size_Range: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [selectedTemplateSizeRange, setSelectedTemplateSizeRange] = useState("");

  // Fetch existing templates when modal opens
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get("/api/specsTemplates");
        setExistingTemplates(response.data.data || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
      }
    };

    if (isOpen) {
      fetchTemplates();
      setFormData({
        Name: "",
        spec_type: "",
        Size_Range: "",
      });
      setSelectedTemplateSizeRange("");
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "spec_type") {
      // When a template is selected, find its size range
      const selectedTemplate = existingTemplates.find(t => t.Name === value);
      setSelectedTemplateSizeRange(selectedTemplate?.Size_Range || "");
      
      setFormData({
        ...formData,
        [name]: value,
        Size_Range: selectedTemplate?.Size_Range || ""
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation - Size Range is required when no template is selected
    if (!formData.spec_type && !formData.Size_Range) {
      setError("Size Range is required when no template is selected");
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/specsTemplates", formData);
      onSubmit(formData);
      setSnackbarOpen(true);
      closeModal();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "There was an error submitting the form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          Add Specs Template
        </DialogTitle>
        <DialogContent sx={{ padding: "20px" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <TextField
              fullWidth
              label="Name"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              required
            />

            {existingTemplates.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Copy From Existing Template (Optional)</InputLabel>
                <Select
                  name="spec_type"
                  value={formData.spec_type}
                  onChange={handleChange}
                  label="Copy From Existing Template (Optional)"
                >
                  <MenuItem value="">None (Create Empty Template)</MenuItem>
                  {existingTemplates.map((template) => (
                    <MenuItem key={template._id} value={template.Name}>
                      {template.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {!formData.spec_type && (
              <FormControl fullWidth required>
                <InputLabel>Size Range</InputLabel>
                <Select
                  name="Size_Range"
                  value={formData.Size_Range}
                  onChange={handleChange}
                  label="Size Range"
                >
                  <MenuItem value="">Select Size Range</MenuItem>
                  {sizeRanges.map((range) => (
                    <MenuItem key={range.id} value={range.id}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <DialogActions
              sx={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
              <Button
                onClick={closeModal}
                color="secondary"
                variant="outlined"
                sx={{ flex: 1, marginRight: "10px" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
        >
          Spec Template Created Successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddSpecsModal;