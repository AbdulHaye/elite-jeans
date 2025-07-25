import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../../../../../ApiServices/api";


// Modal style
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 1000,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: "80vh",
  overflowY: "auto"
};

const DesignCommentLogsModal = ({ open, handleClose, styleNumber, name }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log(styleNumber,open ,":show style idddd" )
 useEffect(() => {
  if (open && styleNumber) {  // Only fetch when modal is open AND styleNumber exists
    console.log("Fetching logs for style:", styleNumber);
    fetchLogs();
  }
}, [open, styleNumber]);  // Add both dependencies
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/api/CombinedLogslog/style/${styleNumber}`
      );
      setLogs(response.data.logs);
    } catch (err) {
      console.error("Error fetching design comment logs:", err);
      setError("No logs Available for this style");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="design-comment-logs-modal-title"
      aria-describedby="design-comment-logs-modal-description"
    >
      <Box sx={modalStyle}>
        {/* Modal Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography id="design-comment-logs-modal-title" variant="h6" component="h2">
            Logs - Style # {name}
          </Typography>
          <IconButton 
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" my={4}>
            {error}
          </Typography>
        ) : logs.length === 0 ? (
          <Typography align="center" my={4}>
            No logs found for this style number
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="design comment logs table">
              <TableHead>
                <TableRow>
                  <TableCell>Log Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Sample Stage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Comments</TableCell>
                  {/* <TableCell>Images</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.logId}>
                    <TableCell>{formatDate(log.logDate)}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.sampleStage}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          color:
                            log.status === "Approved"
                              ? "success.main"
                              : log.status === "Rejected"
                              ? "error.main"
                              : "warning.main",
                          fontWeight: "bold"
                        }}
                      >
                        {log.status}
                      </Box>
                    </TableCell>
                    <TableCell>{log.comments || "-"}</TableCell>
                    {/* <TableCell>
                      {log.images?.length > 0 ? (
                        <Box display="flex" gap={1}>
                          {log.images.map((img, index) => (
                            <a
                              key={index}
                              href={img}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Box
                                component="img"
                                src={img}
                                alt={`Design comment ${index + 1}`}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                  borderRadius: 1
                                }}
                              />
                            </a>
                          ))}
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Modal>
  );
};

export default DesignCommentLogsModal;