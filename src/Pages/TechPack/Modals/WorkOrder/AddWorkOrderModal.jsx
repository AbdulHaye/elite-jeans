import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Typography
} from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { styled } from '@mui/material/styles';

const BigIcon = styled(AddTaskIcon)({
  fontSize: '5rem',
  margin: '20px auto',
  display: 'block',
  color: '#1976d2' // Using primary color
});

const AddWorkOrderModal = ({ open, handleClose, handleSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await handleSubmit();
      setSuccess(true);
      // Close modal after 1 second to show success message
      setTimeout(() => {
        handleClose();
        setSuccess(false);
      }, 1000);
    } catch (error) {
      console.error('Error submitting work order:', error);
      setError(error.message || 'Failed to submit work order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={!isSubmitting ? handleClose : null}>
        <DialogTitle>Add New Work Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to add this work order?
          </DialogContentText>
          <Box textAlign="center" my={2}>
            <BigIcon />
          
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            color="primary" 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Work order submitted successfully!
        </Alert>
      </Snackbar>

      {/* Error Notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddWorkOrderModal;