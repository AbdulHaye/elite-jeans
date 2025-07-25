import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Modal,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  IconButton,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { styled } from "@mui/system";
import api from "../../../../../../ApiServices/api";
import { v4 as uuidv4 } from 'uuid'; 


const StyledModal = styled(Modal)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: "white",
  padding: theme.spacing(4),
  borderRadius: "8px",
  width: "70%",
  maxWidth: "none",
  maxHeight: "90vh",
  overflowY: "auto",
  [theme.breakpoints.down("md")]: {
    width: "90%",
    padding: theme.spacing(2),
  },
}));

const FormSection = styled(Box)({
  marginBottom: "16px",
});

const sizeTemplates = [
  { label: "1-19 (Junior Numerical)", value: "1-19" },
  { label: "XS-XXL (Junior/Missy Alpha)", value: "XS-XXL" },
  { label: "14-28 (Plus Numerical)", value: "14-28" },
  { label: "1X-4X (Plus Alpha)", value: "1X-4X" },
  { label: "0-16 (Missy Numerical)", value: "0-16" },
  { label: "7-16 (Girls Numerical)", value: "7-16" },
];

const getSizeOptions = (range) => {
  if (range === "1-19") {
    return [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]?.map(String);
  } else if (range === "7-16") {
    return [7, 8, 10, 12, 14, 16]?.map(String);
  } else if (range === "0-16") {
    return [0, 2, 4, 6, 8, 10, 12, 14, 16]?.map(String);
  } else if (range === "14-28") {
    return [14, 16, 18, 20, 22, 24, 26, 28]?.map(String);
  } else if (range === "1X-4X") {
    return ["X", "XX", "XXX", "XXXX"];
  } else if (range === "XS-XXL") {
    return ["XS", "S", "M", "L", "XL", "XXL"];
  }
  return [];
};

const ItemDetailModal = ({ onClose, onSubmit, request }) => {
  const { id } = useParams();
  const workOrderId = id;

  const [formData, setFormData] = useState({
    style_number: "",
    client_Id: "",
    class_Id: "",
    color_Id: "",
    quantity: "",
    size_scale: "",
    size_break: "",
    number_of_master_polybags_per_master_carton: "",
    number_of_pieces_per_master_carton: "",
    cbm_per_master_carton: "",
    number_of_cartons: "",
    total_cbm: "",
    comments: "",
    internal_comments: "",
    customer_po_number: "",
    individual_poly_bag: false,
    price_tickets: false,
    hanger: false,
  });

  const [sizeBreakTotal, setSizeBreakTotal] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [inputFields, setInputFields] = useState([]);
  const [colors, setColors] = useState([]);
  const [clients, setClients] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sizeScales, setSizeScales] = useState([]);
  const [error, setError] = useState(null);
  const [sizeBreaks, setSizeBreaks] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Initialize form data when request prop changes
  useEffect(() => {
    if (request) {
      const hasPackageBySize =
        request.package_by_size && request.package_by_size.length > 0;

      setFormData({
        ...request,
        style_number: request.stylenumber?.number || "",
        client_Id: request?.client_Id?._id,
        class_Id: request?.class_Id?._id,
        color_Id: request?.color_Id?._id,
        size_break: request?.size_break?._id,
        size_scale: request?.size_scale?._id,
        quantity: request?.quantity || "",
        number_of_master_polybags_per_master_carton:
          request?.number_of_master_polybags_per_master_carton || "",
        number_of_pieces_per_master_carton:
          request?.number_of_pieces_per_master_carton || "",
        cbm_per_master_carton: request?.cbm_per_master_carton || "",
        number_of_cartons: request?.number_of_cartons || "",
        total_cbm: request?.total_cbm || "",
      });

      setIsChecked(hasPackageBySize);

      if (hasPackageBySize) {
        setInputFields(
          request.package_by_size.map((item) => ({
            id: item.id || Date.now(),
            size: item.size,
            quantity: item.quantity || "",
            pieces_per_polybag: item.pieces_per_polybag || "",
            master_polybags_per_carton: item.master_polybags_per_carton || "",
            pieces_per_carton: item.pieces_per_carton || "",
            cartons: item.cartons || "",
          }))
        );
      }

      if (request?.size_break?.name) {
        const numbers = request.size_break.name.split("-").map(Number);
        const total = numbers.reduce((sum, num) => sum + num, 0);
        setSizeBreakTotal(total);
      }
    }
  }, [request]);

  // Calculate total quantity from size fields when packing by size
useEffect(() => {
  if (isChecked) {
    const totalQuantity = inputFields.reduce(
      (sum, field) => sum + (Number(field.quantity) || 0),
      0
    );
    setFormData((prev) => ({
      ...prev,
      quantity: totalQuantity || "",
    }));
  }
}, [inputFields, isChecked]);

  // Calculate total CBM based on cartons
  useEffect(() => {
    const cbmPerCarton = Number(formData.cbm_per_master_carton) || 0;
    const numCartons = Number(formData.number_of_cartons) || 0;
    const totalCBM = cbmPerCarton * numCartons;

    setFormData((prev) => ({
      ...prev,
      total_cbm: totalCBM || "",
    }));
  }, [formData.cbm_per_master_carton, formData.number_of_cartons]);

  // Calculate pieces per master carton and total master cartons when not packing by size
  useEffect(() => {
    if (!isChecked) {
      const masterPolybags =
        Number(formData.number_of_master_polybags_per_master_carton) || 0;
      const totalPieces = sizeBreakTotal * masterPolybags;
      const quantity = Number(formData.quantity) || 0;
      const totalMasterCartons =
        quantity > 0 && totalPieces > 0 ? Math.ceil(quantity / totalPieces) : 0;

      setFormData((prev) => ({
        ...prev,
        number_of_pieces_per_master_carton: totalPieces || "",
        number_of_cartons: totalMasterCartons || "",
      }));
    }
  }, [
    sizeBreakTotal,
    formData.number_of_master_polybags_per_master_carton,
    formData.quantity,
    isChecked,
  ]);

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);

    if (!newCheckedState) {
      setInputFields([]);
      setFormData((prev) => ({
        ...prev,
        quantity: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;

    if (type === "checkbox") {
      finalValue = checked;
    } else if (type === "number") {
      const numericValue = value === "" ? "" : Number(value);
      finalValue = numericValue < 0 ? "" : numericValue;
    } else {
      finalValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (name === "size_break") {
      const selectedSizeBreak = sizeBreaks.find((sb) => sb._id === value);
      if (selectedSizeBreak) {
        const numbers = selectedSizeBreak.name.split("-").map(Number);
        const total = numbers.reduce((sum, num) => sum + num, 0);
        setSizeBreakTotal(total);
      } else {
        setSizeBreakTotal(0);
      }
    }
  };

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Prepare the payload - remove size_scale and size_break when packing by size
  const payload = {
    ...formData,
 stylenumber: {
      number: formData.style_number,
      // Keep existing _id if editing, generate new one if creating
      _id: request?.stylenumber?._id || uuidv4()
    },
    package_by_size: isChecked ? inputFields : [],
    workOrder_Id: workOrderId,
  };



  if (isChecked) {
    delete payload.size_scale;
    delete payload.size_break;
  }

  onSubmit(payload);
};
  const handleTemplateChange = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);

    if (template) {
      const sizes = getSizeOptions(template);
      const newFields = sizes.map((size) => ({
        id: Date.now() + Math.random(),
        size,
        quantity: "",
        pieces_per_polybag: "",
        master_polybags_per_carton: "",
        pieces_per_carton: "",
        cartons: "",
      }));
      setInputFields(newFields);
    }
  };

  const handleAddFields = () => {
    setInputFields([
      ...inputFields,
      {
        id: Date.now(),
        size: "",
        quantity: "",
        pieces_per_polybag: "",
        master_polybags_per_carton: "",
        pieces_per_carton: "",
        cartons: "",
      },
    ]);
  };

  const handleFieldChange = (e, id) => {
    const { name, value } = e.target;
    let newValue = value;

    if (
      ["quantity", "pieces_per_polybag", "master_polybags_per_carton"].includes(
        name
      )
    ) {
      const numericValue = value === "" ? "" : Number(value);
      newValue = numericValue < 0 ? "" : numericValue;
    }

    setInputFields((prev) =>
      prev.map((field) => {
        if (field.id === id) {
          const updatedField = { ...field, [name]: newValue };

          if (
            name === "pieces_per_polybag" ||
            name === "master_polybags_per_carton"
          ) {
            const piecesPerPolybag =
              Number(updatedField.pieces_per_polybag) || 0;
            const masterPolybags =
              Number(updatedField.master_polybags_per_carton) || 0;
            const piecesPerCarton = piecesPerPolybag * masterPolybags;
            const quantity = Number(updatedField.quantity) || 0;
            const cartons =
              piecesPerCarton > 0 ? Math.ceil(quantity / piecesPerCarton) : 0;

            return {
              ...updatedField,
              pieces_per_carton: piecesPerCarton || "",
              cartons: cartons || "",
            };
          }

          if (name === "quantity") {
            const piecesPerPolybag =
              Number(updatedField.pieces_per_polybag) || 0;
            const masterPolybags =
              Number(updatedField.master_polybags_per_carton) || 0;
            const piecesPerCarton = piecesPerPolybag * masterPolybags;
            const quantity = Number(newValue) || 0;
            const cartons =
              piecesPerCarton > 0 ? Math.ceil(quantity / piecesPerCarton) : 0;

            return {
              ...updatedField,
              cartons: cartons || "",
            };
          }

          return updatedField;
        }
        return field;
      })
    );
  };

  const handleDeleteField = (id) => {
    setInputFields(inputFields.filter((field) => field.id !== id));
  };

  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          colorsResponse,
          clientsResponse,
          classesResponse,
          sizeBreaksResponse,
          sizeScalesResponse,
        ] = await Promise.all([
          api.get("/api/colors"),
          api.get("/api/clients"),
          api.get("/api/classes"),
          api.get("/api/size-breaks"),
          api.get("/api/size-scales"),
        ]);

        setColors(colorsResponse?.data);
        setClients(clientsResponse?.data);
        setClasses(classesResponse?.data);
        setSizeBreaks(sizeBreaksResponse?.data);
        setSizeScales(sizeScalesResponse?.data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      }
    };

    fetchData();
  }, []);

  const handleNumericInput = (e) => {
    const { name, value } = e.target;

    if (
      [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        ".",
      ].includes(e.key) ||
      (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key))
    ) {
      return;
    }

    if (isNaN(Number(e.key))) {
      e.preventDefault();
      return;
    }
  };

  return (
    <StyledModal
      open
      onClose={onClose}
      disableBackdropClick
      disableEscapeKeyDown
    >
      <ModalContent ref={modalRef}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {request ? "Edit Item" : "Add Item"}
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormSection>
            <FormControlLabel
              control={
                <Checkbox checked={isChecked} onChange={handleCheckboxChange} />
              }
              label="Packing by Size"
            />
            {isChecked && (
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 250 }}>
                  <InputLabel>Size Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    label="Size Template"
                  >
                    <MenuItem value="">Select Template</MenuItem>
                    {sizeTemplates.map((template) => (
                      <MenuItem key={template.value} value={template.value}>
                        {template.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleAddFields}>
                  Add Size
                </Button>
              </Box>
            )}
          </FormSection>

          {isChecked &&
            inputFields?.map((field) => (
              <FormSection key={field?.id}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={1.5}>
                    <TextField
                      label="Size"
                      name="size"
                      value={field?.size}
                      onChange={(e) => handleFieldChange(e, field?.id)}
                      fullWidth
                      margin="normal"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={1.5}>
                    <TextField
                      label="Quantity"
                      name="quantity"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={field?.quantity}
                      onChange={(e) => handleFieldChange(e, field?.id)}
                      fullWidth
                      margin="normal"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Pcs per Poly Bag"
                      name="pieces_per_polybag"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={field?.pieces_per_polybag}
                      onChange={(e) => handleFieldChange(e, field?.id)}
                      fullWidth
                      margin="normal"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Poly Bags per Carton"
                      name="master_polybags_per_carton"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={field?.master_polybags_per_carton}
                      onChange={(e) => handleFieldChange(e, field?.id)}
                      fullWidth
                      margin="normal"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Pcs per Carton"
                      name="pieces_per_carton"
                      type="number"
                      inputProps={{ min: 0, readOnly: true }}
                      value={field?.pieces_per_carton || ""}
                      fullWidth
                      margin="normal"
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Cartons"
                      name="cartons"
                      type="number"
                      inputProps={{ min: 0, readOnly: true }}
                      value={field?.cartons || ""}
                      fullWidth
                      margin="normal"
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleDeleteField(field?.id)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </FormSection>
            ))}

          <FormSection>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  label="Style #"
                  name="style_number"
                  value={formData?.style_number}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth margin="normal" size="small">
                  <InputLabel>Client Name</InputLabel>
                  <Select
                    name="client_Id"
                    value={formData?.client_Id || ""}
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {clients?.map((client) => (
                      <MenuItem
                        key={client?._id}
                        value={client?._id?.toString()}
                      >
                        {client?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  inputProps={{ min: 0, readOnly: isChecked }}
                  value={formData?.quantity}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Customer PO #"
                  name="customer_po_number"
                  value={formData?.customer_po_number}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth margin="normal" size="small">
                  <InputLabel>Class Name</InputLabel>
                  <Select
                    name="class_Id"
                    value={formData?.class_Id || ""}
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {classes?.map((classItem) => (
                      <MenuItem
                        key={classItem?._id}
                        value={classItem?._id?.toString()}
                      >
                        {classItem?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth margin="normal" size="small">
                  <InputLabel>Color Name</InputLabel>
                  <Select
                    name="color_Id"
                    value={formData?.color_Id || ""}
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {colors?.map((color) => (
                      <MenuItem key={color?._id} value={color?._id?.toString()}>
                        {color?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                  <FormControlLabel
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "12px",
                      },
                    }}
                    control={
                      <Checkbox
                        name="individual_poly_bag"
                        checked={formData?.individual_poly_bag}
                        onChange={handleChange}
                        size="small"
                      />
                    }
                    label="Individual Poly Bag"
                  />
                  <FormControlLabel
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "12px",
                      },
                    }}
                    control={
                      <Checkbox
                        name="price_tickets"
                        checked={formData?.price_tickets}
                        onChange={handleChange}
                        size="small"
                      />
                    }
                    label="Price Tickets"
                  />
                  <FormControlLabel
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "12px",
                      },
                    }}
                    control={
                      <Checkbox
                        name="hanger"
                        checked={formData?.hanger}
                        onChange={handleChange}
                        size="small"
                      />
                    }
                    label="Hanger"
                  />
                </Box>
              </Grid>
            </Grid>
          </FormSection>

          {/* Only show size scale and size break when not packing by size */}
          {!isChecked && (
            <FormSection>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth margin="normal" size="small">
                        <InputLabel>Size Scale</InputLabel>
                        <Select
                          name="size_scale"
                          value={formData?.size_scale || ""}
                          onChange={handleChange}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {sizeScales?.map((scale) => (
                            <MenuItem
                              key={scale?._id}
                              value={scale?._id?.toString()}
                            >
                              {scale?.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth margin="normal" size="small">
                        <InputLabel>Size Break</InputLabel>
                        <Select
                          name="size_break"
                          value={formData?.size_break || ""}
                          onChange={handleChange}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {sizeBreaks?.map((sizeBreak) => (
                            <MenuItem
                              key={sizeBreak?._id}
                              value={sizeBreak?._id?.toString()}
                            >
                              {sizeBreak?.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={6}>
                  {formData.size_break && (
                    <Typography variant="body2" sx={{ mt: 3 }}>
                      Size Break Total: {sizeBreakTotal}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </FormSection>
          )}

          {!isChecked && (
            <>
              <FormSection>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      label="Master Polybags per Carton"
                      name="number_of_master_polybags_per_master_carton"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={
                        formData?.number_of_master_polybags_per_master_carton
                      }
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Pieces per Master Carton"
                      name="number_of_pieces_per_master_carton"
                      type="number"
                      inputProps={{ min: 0, readOnly: true }}
                      value={formData?.number_of_pieces_per_master_carton || ""}
                      fullWidth
                      margin="normal"
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Total Master Cartons"
                      name="number_of_cartons"
                      type="number"
                      inputProps={{ min: 0, readOnly: true }}
                      value={formData?.number_of_cartons || ""}
                      fullWidth
                      margin="normal"
                      size="small"
                      disabled
                    />
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="CBM per Master Carton"
                      name="cbm_per_master_carton"
                      type="number"
                      inputProps={{ step: "0.001", min: 0 }}
                      value={formData?.cbm_per_master_carton}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Total CBM"
                      name="total_cbm"
                      type="number"
                      inputProps={{ min: 0, readOnly: true }}
                      value={formData?.total_cbm || ""}
                      fullWidth
                      margin="normal"
                      size="small"
                      disabled
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </>
          )}

          <FormSection>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Comments"
                  name="comments"
                  value={formData?.comments}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Internal Comments"
                  name="internal_comments"
                  value={formData?.internal_comments}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  size="small"
                />
              </Grid>
            </Grid>
          </FormSection>

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mr: 2, px: 4 }}
            >
              {request ? "Update" : "Save"}
            </Button>
            <Button variant="outlined" onClick={onClose} sx={{ px: 4 }}>
              Cancel
            </Button>
          </Box>
        </form>
      </ModalContent>
    </StyledModal>
  );
};

export default ItemDetailModal;