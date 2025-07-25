import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Box,
  Typography,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Navbar from "../../Navbar/Navbar";
import UserDetailModal from "./Modal/UserDetailModal";
import api from "../../ApiServices/api";
import { useNavigate } from "react-router-dom";

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users/all");
      console.log(response,"user data response")
      const formattedUsers = response.data.map(user => ({
        _id: user._id,
        username: user.username || user.name,
        type: user.type || 'user',
        role: Array.isArray(user.role) ? user.role : [user.role || 'user'],
        vendor: user.vendor || null,
        status: user.status || 'inactive', // Changed from active boolean to status string
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      setUsers(formattedUsers);
    } catch (err) {
      setError(err);
      setSnackbar({
        open: true,
        message: "Failed to fetch users",
        severity: "error",
      });
       if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleConfirm = (userId) => {
    const user = users.find(u => u._id === userId);
    setUserToToggle(user);
    setConfirmOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    
    setConfirmOpen(false);
    setLoadingUserId(userToToggle._id);
    
    try {
      const newStatus = userToToggle.status === 'active' ? 'inactive' : 'active';
      
      await api.patch(`/api/users/${userToToggle._id}/status`, {
        status: newStatus // Changed from active boolean to status string
      });
      
      setUsers(users.map(user =>
        user._id === userToToggle._id ? { ...user, status: newStatus } : user
      ));
      
      setSnackbar({
        open: true,
        message: `User ${newStatus === 'active' ? "activated" : "deactivated"} successfully`,
        severity: "success",
      });
    } catch (err) {
      console.error("Error updating user status:", err);
      const errorMessage = err.response?.data?.message || "Failed to update user status";
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoadingUserId(null);
      setUserToToggle(null);
    }
  };

  const handleAddUser = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleOpenModal = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (userData) => {
    try {
      // Prepare the base payload
      const payload = {
        username: userData.username,
        type: userData.type,
        notification: Array.isArray(userData.notification) 
          ? userData.notification 
          : Object.keys(userData.notifications || {}).filter(notif => userData.notifications[notif]),
      };
  
      // Only include password fields if they exist (for new users or password changes)
      if (userData.password) {
        payload.password = userData.password;
        payload.repeatPassword = userData.repeatPassword;
      }
  
      // Handle different user types
      if (userData.type === "vendor") {
        // For vendor users, include the vendor field with the selected vendor IDs
        payload.vendor = Array.isArray(userData.vendors) ? userData.vendors : [];
      } else {
        // For regular users and admins, include the roles
        payload.role = Array.isArray(userData.role) 
          ? userData.role 
          : Object.keys(userData.roles || {}).filter(role => userData.roles[role]);
      }
  
      console.log("Final Payload:", payload);
  
      let response;
      if (isEditing && selectedUser) {
        response = await api.put(`/api/users/update/${selectedUser._id}`, payload);
        setUsers(users.map(user =>
          user._id === selectedUser._id ? response.data : user
        ));
      } else {
        response = await api.post("/api/users/register", payload);
        setUsers([...users, response.data]);
      }
  
      fetchUsers();
      setSnackbar({
        open: true,
        message: `User ${isEditing ? "updated" : "created"} successfully`,
        severity: "success",
      });
      handleCloseModal();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Error saving user",
        severity: "error",
      });
    }
  };
  

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <div>
      <Navbar />
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="flex-start" mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddUser}
            sx={{ textTransform: "none" }}
          >
            + Add User
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" mt={4}>
            Error loading users: {error.message}
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              overflow: "hidden",
              backgroundColor: "#fff",
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f4f6f8", color: "#5c6bc0" }}>
                    Username
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f4f6f8", color: "#5c6bc0" }}>
                    Role
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f4f6f8", color: "#5c6bc0" }}>
                    Vendor(s)
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f4f6f8", color: "#5c6bc0" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f4f6f8", color: "#5c6bc0" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length > 0 ? (
                  users.map((row) => (
                    <TableRow
                      key={row._id}
                      sx={{
                        "&:hover": { backgroundColor: "#f5f5f5" },
                        transition: "background-color 0.3s ease",
                      }}
                    >
                      <TableCell>{row.username}</TableCell>
                      <TableCell>
                        {Array.isArray(row.role) ? row.role.join(", ") : row.role}
                      </TableCell>
                      <TableCell>
  {Array.isArray(row.vendor) && row.vendor.length > 0
    ? row.vendor.map(v => v.name).join(", ")
    : "-"}
</TableCell>

                      <TableCell>
                        <Chip
                          label={row.status === 'active' ? "Active" : "Inactive"}
                          color={row.status === 'active' ? "success" : "error"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit user" arrow>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              sx={{
                                minWidth: "auto",
                                "&:hover": { backgroundColor: "#e3f2fd" },
                              }}
                              onClick={() => handleOpenModal(row)}
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          <Tooltip title={row.status === 'active' ? "Deactivate user" : "Activate user"} arrow>
                            <Button
                              variant="outlined"
                              color={row.status === 'active' ? "success" : "error"}
                              size="small"
                              sx={{
                                minWidth: "auto",
                                "&:hover": {
                                  backgroundColor: row.status === 'active' ? "#e8f5e9" : "#ffebee",
                                },
                              }}
                              onClick={() => handleToggleConfirm(row._id)}
                              disabled={loadingUserId === row._id}
                            >
                              {loadingUserId === row._id ? (
                                <CircularProgress size={20} />
                              ) : row.status === 'active' ? (
                                <CheckCircleOutlineIcon fontSize="small" />
                              ) : (
                                <HighlightOffIcon fontSize="small" />
                              )}
                            </Button>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ fontStyle: "italic", color: "#757575" }}
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <UserDetailModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          user={selectedUser}
          isEditing={isEditing}
        />

        <Dialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Confirm Status Change
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {userToToggle && `Are you sure you want to ${userToToggle.status === 'active' ? "deactivate" : "activate"} ${userToToggle.username}?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleToggleStatus} color={userToToggle?.status === 'active' ? "error" : "success"} autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

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
      </Box>
    </div>
  );
}

export default Users;