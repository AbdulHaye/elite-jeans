import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from '@mui/material';

const EmailWorkOrderModal = ({ open, onClose, onSubmit }) => {
  const [emailInput, setEmailInput] = useState('');

  const handleSubmit = () => {
    // Split by comma and trim whitespace, then filter out empty strings
    const emailArray = emailInput.split(',')
      .map(email => email.trim())
      .filter(email => email !== '');
    
    onSubmit(emailArray);
    setEmailInput('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Enter recipient emails (separated by comma)</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Recipient Emails"
          type="text"
          fullWidth
          variant="outlined"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          helperText="Separate multiple emails with commas (e.g., email1@example.com, email2@example.com)"
          placeholder="email1@example.com, email2@example.com"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={!emailInput.trim()}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailWorkOrderModal;