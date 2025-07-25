import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
  List,
  ListItem,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import api from "../../../ApiServices/api";

const UserEditModal = ({ open, onClose, onSave, user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorError, setVendorError] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    type: "user",
    vendors: [],
    password: "",
    repeatPassword: "",
    roles: {
      general: false,
      shipping: false,
      production: false,
      editSpecsTemplates: false,
      pricing: false,
    },
    notifications: {
      email: false,
      notification: false,
    },
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    repeatPassword: "",
    vendors: "",
  });

  // Fetch vendors when modal opens
  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      setVendorError(null);
      const response = await api.get("/api/vendors");
      if (response.status !== 200) {
        throw new Error("Failed to fetch vendors");
      }
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendorError(error.message);
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Convert the role array to the roles object structure expected by the modal
      const roles = {
        general: user.role?.includes("general") || false,
        shipping: user.role?.includes("shipping") || false,
        production: user.role?.includes("production") || false,
        editSpecsTemplates: user.role?.includes("editSpecsTemplates") || false,
        pricing: user.role?.includes("pricing") || false,
      };

      // Convert the notification array to the notifications object structure
      const notifications = {
        email: user.notification?.includes("email") || false,
        notification: user.notification?.includes("notification") || false,
      };

      // Handle vendor data - assuming user.vendors is an array of vendor IDs or objects
      const userVendors = Array.isArray(user.vendors)
        ? user.vendors.map((v) => (typeof v === "object" ? v._id : v))
        : [];

      setFormData({
        username: user.username || "",
        type: user.type || "user",
        vendors: userVendors,
        password: "",
        repeatPassword: "",
        roles,
        notifications,
      });
    } else {
      // Reset form for new user
      setFormData({
        username: "",
        type: "user",
        vendors: [],
        password: "",
        repeatPassword: "",
        roles: {
          general: false,
          shipping: false,
          production: false,
          editSpecsTemplates: false,
          pricing: false,
        },
        notifications: {
          email: false,
          notification: false,
        },
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleVendorChange = (event) => {
    const {
      target: { value },
    } = event;

    // On autofill we get a stringified value.
    setFormData({
      ...formData,
      vendors: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;

    if (name in formData.roles) {
      setFormData({
        ...formData,
        roles: {
          ...formData.roles,
          [name]: checked,
        },
      });
    } else if (name in formData.notifications) {
      setFormData({
        ...formData,
        notifications: {
          ...formData.notifications,
          [name]: checked,
        },
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    let formErrors = {};
    if (!formData.username) formErrors.username = "Username is required";
    if (!user && !formData.password) formErrors.password = "Password is required";
    if (formData.password !== formData.repeatPassword) {
      formErrors.repeatPassword = "Passwords must match";
      formErrors.password = "Passwords must match";
    }
    if (formData.type === "vendor" && formData.vendors.length === 0)
      formErrors.vendors = "At least one vendor is required";
  
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
  
    // Prepare the data to be saved
    const dataToSave = {
      username: formData.username,
      type: formData.type,
      ...(formData.password && { password: formData.password }), // Only include if changed
      ...(formData.repeatPassword && { repeatPassword: formData.repeatPassword }), // Only include if exists
      roles: formData.roles,
      notifications: formData.notifications,
    };
  
    // Convert roles and notifications to arrays for the parent component
    const transformedData = {
      ...dataToSave,
      role: Object.entries(formData.roles)
        .filter(([_, value]) => value)
        .map(([key]) => key),
      notification: Object.entries(formData.notifications)
        .filter(([_, value]) => value)
        .map(([key]) => key),
    };
  
    // Include vendors if type is vendor
    if (formData.type === "vendor") {
      transformedData.vendors = formData.vendors;
    }
  
    console.log("Data being sent to parent:", transformedData);
    onSave(transformedData);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: isMobile ? "95%" : isTablet ? "85%" : 600,
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: isMobile ? 2 : 4,
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          {user ? "Edit User" : "Add User"}
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Username and Password Section */}
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            Username
          </Typography>
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            fullWidth
            required
            error={Boolean(errors.username)}
            helperText={errors.username}
            margin="normal"
            size={isMobile ? "small" : "medium"}
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
            }}
          >
            <TextField
              label={
                user ? "New Password (leave blank to keep current)" : "Password"
              }
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              required={!user}
              error={Boolean(errors.password)}
              helperText={errors.password}
              margin="normal"
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              label="Repeat Password"
              name="repeatPassword"
              type="password"
              value={formData.repeatPassword}
              onChange={handleInputChange}
              fullWidth
              required={!user}
              margin="normal"
              size={isMobile ? "small" : "medium"}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Types Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Types
          </Typography>
          <FormControl fullWidth margin="normal">
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              size={isMobile ? "small" : "medium"}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="vendor">Vendor User</MenuItem>
              <MenuItem value="read_only">Read Only User</MenuItem>
            </Select>
          </FormControl>

          {/* Vendor Dropdown - Only shown for vendor users */}
          {formData.type === "vendor" && (
            <FormControl
              fullWidth
              margin="normal"
              error={Boolean(errors.vendors)}
            >
              <InputLabel id="vendors-select-label">Vendors</InputLabel>
              <Select
                labelId="vendors-select-label"
                id="vendors-select"
                multiple
                value={formData.vendors}
                onChange={handleVendorChange}
                label="Vendors"
                size={isMobile ? "small" : "medium"}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const vendor = vendors.find((v) => v._id === value);
                      return (
                        <Chip
                          key={value}
                          label={vendor ? vendor.name : value}
                          onDelete={() => {
                            setFormData({
                              ...formData,
                              vendors: formData.vendors.filter(
                                (v) => v !== value
                              ),
                            });
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {loadingVendors ? (
                  <MenuItem disabled>Loading vendors...</MenuItem>
                ) : vendorError ? (
                  <MenuItem disabled>Error loading vendors</MenuItem>
                ) : vendors.length === 0 ? (
                  <MenuItem disabled>No vendors available</MenuItem>
                ) : (
                  vendors.map((vendor) => (
                    <MenuItem key={vendor._id} value={vendor._id}>
                      <Checkbox
                        checked={formData.vendors.indexOf(vendor._id) > -1}
                      />
                      <Typography>{vendor.name}</Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.vendors && (
                <FormHelperText>{errors.vendors}</FormHelperText>
              )}
            </FormControl>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Roles Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Roles
          </Typography>

          {formData.type === "user" && (
            <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
              <ListItem
                sx={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "flex-start",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.general}
                      onChange={handleCheckboxChange}
                      name="general"
                    />
                  }
                  label="General"
                  sx={{ minWidth: isMobile ? "100%" : 150 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                >
                  Full access to Work Orders, Tech Packs, Trims, Pictures, POM
                  Library. View access to Receiving Order Items, Specs
                  Templates.
                </Typography>
              </ListItem>

              <ListItem
                sx={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "flex-start",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.shipping}
                      onChange={handleCheckboxChange}
                      name="shipping"
                    />
                  }
                  label="Shipping"
                  sx={{ minWidth: isMobile ? "100%" : 150 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                >
                  Full access to Time & Action Calendar, Shipping, ASNs,
                  Arrangements.
                </Typography>
              </ListItem>

              <ListItem
                sx={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "flex-start",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.production}
                      onChange={handleCheckboxChange}
                      name="production"
                    />
                  }
                  label="Production"
                  sx={{ minWidth: isMobile ? "100%" : 150 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                >
                  Full access to Configurations, Size Scale Assignments, Repeat
                  Work Orders.
                </Typography>
              </ListItem>

              <ListItem
                sx={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "flex-start",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.editSpecsTemplates}
                      onChange={handleCheckboxChange}
                      name="editSpecsTemplates"
                    />
                  }
                  label="Edit Specs Templates"
                  sx={{ minWidth: isMobile ? "100%" : 150 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                >
                  Full access to Specs Templates.
                </Typography>
              </ListItem>

              <ListItem
                sx={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "flex-start",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.pricing}
                      onChange={handleCheckboxChange}
                      name="pricing"
                    />
                  }
                  label="Pricing"
                  sx={{ minWidth: isMobile ? "100%" : 150 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: isMobile ? 0 : 2, mt: isMobile ? 1 : 0 }}
                >
                  View access to Quotes, Add Prices.
                </Typography>
              </ListItem>
            </List>
          )}

          {formData.type !== "user" && (
            <Typography variant="body2" color="text.secondary">
              {formData.type === "admin"
                ? "Admin users have all permissions automatically."
                : formData.type === "vendor"
                ? "Vendor users have limited permissions based on vendor access."
                : "Read Only users can view Work Orders, Tech Packs, Pictures, Trims, and Shipping modules but cannot make any changes."}
            </Typography>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Notifications Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Notifications
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
            }}
          >
            <Typography variant="subtitle1">ASN Create</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notifications.email}
                  onChange={handleCheckboxChange}
                  name="email"
                />
              }
              label="Email"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notifications.notification}
                  onChange={handleCheckboxChange}
                  name="notification"
                />
              }
              label="Notification"
            />
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}
          >
            <Button
              onClick={onClose}
              color="default"
              variant={isMobile ? "text" : "outlined"}
              size={isMobile ? "small" : "medium"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size={isMobile ? "small" : "medium"}
            >
              Save
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default UserEditModal;