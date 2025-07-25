import { createContext, useState, useContext } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const ConfirmationDialogContext = createContext();

export default function ConfirmationDialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);

  const showDialog = ({
    message,
    title,
    confirmText,
    cancelText,
    confirmColor = "primary",
    cancelColor = "inherit",
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        message,
        title: title || "Confirmation",
        confirmText: confirmText || "Confirm",
        cancelText: cancelText || "Cancel",
        confirmColor,
        cancelColor,
        resolve,
      });
    });
  };

  const handleClose = (confirmed) => {
    if (dialogState?.resolve) {
      dialogState.resolve(confirmed);
    }
    setDialogState(null);
  };

  return (
    <ConfirmationDialogContext.Provider value={{ showDialog }}>
      {children}

      <Dialog
        open={!!dialogState?.open}
        onClose={() => handleClose(false)}
        aria-labelledby="confirmation-dialog-title"
      >
        <DialogTitle id="confirmation-dialog-title">
          {dialogState?.title}
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogState?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleClose(false)}
            color={dialogState?.cancelColor}
          >
            {dialogState?.cancelText}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            color={dialogState?.confirmColor}
            autoFocus
          >
            {dialogState?.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmationDialogContext.Provider>
  );
}

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmationDialog must be used within a ConfirmationDialogProvider"
    );
  }
  return context.showDialog;
};
