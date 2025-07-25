import React from "react";
import {
  Button,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import if missing

const ModalPdffile = ({ open, onClose, data }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Arrangement Details", 10, 10);
    doc.text(`Arrangement #: ${data?.arrangementNumber}`, 10, 20);
    doc.text(
      `Ship Date: ${new Date(data?.shipDate).toLocaleDateString()}`,
      10,
      30
    );
    doc.text(
      `Arrival Date: ${new Date(data?.arrivalDate).toLocaleDateString()}`,
      10,
      40
    );
    doc.text(`Status: ${data?.shippingStatus}`, 10, 50);
    doc.text(`Destination: ${data?.destination}`, 10, 60);

    const tableData = data?.selectedASN || [];
    const headers = [
      "ASN #",
      "Vendor",
      "Style #",
      "Order #",
      "Sample Status",
      "Requested ETD",
      "Quantity",
      "Total Carton",
      "Status",
      "CBM",
      "Weight (KG)",
      "Comments",
    ];

    const tableRows = tableData?.map((row) => [
      row?.asnNumber,
      row?.vendor?.name,
      row?.selectedItemDetails?.[0]?.style_number,
      row?.selectedItemDetails?.[0]?.workOrder_Id?.workOrderId,
      row?.selectedItemDetails?.[0]?.workOrder_Id?.sampleStatus,
      row?.selectedItemDetails?.[0]?.workOrder_Id?.etd
        ? new Date(row.selectedItemDetails[0].workOrder_Id.etd)
            .toISOString()
            .split("T")[0]
        : "",
      row?.selectedItemDetails?.[0]?.quantity,
      (row?.carbon ?? 0).toFixed(3),
      row?.status,
      row?.selectedItemDetails?.[0]?.total_cbm,
      "0.000",
      row?.comments,
    ]);

    doc.autoTable({
      head: [headers],
      body: tableRows,
      startY: 70,
      margin: { top: 10 },
    });

    doc.save("arrangement-details.pdf");
  };

  const tableData = data?.selectedASN || [];

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Paper
          onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
          sx={{
            padding: 3,
            width: "80%",
            maxWidth: "1200px",
            backgroundColor: "white",
            borderRadius: "8px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Arrangement Details
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Arrangement #: {data?.arrangementNumber}
          </Typography>
          <Typography variant="body1">
            Ship Date: {new Date(data?.shipDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body1">
            Arrival Date: {new Date(data?.arrivalDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body1">
            Status: {data?.shippingStatus}
          </Typography>
          <Typography variant="body1">
            Destination: {data?.destination}
          </Typography>

          <Paper sx={{ padding: 2, marginTop: 2 }}>
            <Typography variant="h6" gutterBottom>
              Table Data
            </Typography>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>ASN #</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Style #</TableCell>
                    <TableCell>Order #</TableCell>
                    <TableCell>Sample Status</TableCell>
                    <TableCell>Requested ETD</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Total Carton</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">CBM</TableCell>
                    <TableCell align="right">Weight (KG)</TableCell>
                    <TableCell>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row?.asnNumber}</TableCell>
                      <TableCell>{row?.vendor?.name}</TableCell>
                      <TableCell>
                        {row?.selectedItemDetails?.[0]?.style_number}
                      </TableCell>
                      <TableCell>
                        {
                          row?.selectedItemDetails?.[0]?.workOrder_Id
                            ?.workOrderId
                        }
                      </TableCell>
                      <TableCell>
                        {
                          row?.selectedItemDetails?.[0]?.workOrder_Id
                            ?.sampleStatus
                        }
                      </TableCell>
                      <TableCell>
                        {row?.selectedItemDetails?.[0]?.workOrder_Id?.etd
                          ? new Date(
                              row?.selectedItemDetails[0]?.workOrder_Id?.etd
                            )
                              ?.toISOString()
                              ?.split("T")[0]
                          : ""}
                      </TableCell>
                      <TableCell align="right">
                        {row?.selectedItemDetails?.[0]?.quantity}
                      </TableCell>
                      <TableCell align="right">
                        {row?.carbon?.toFixed(3)}
                      </TableCell>
                      <TableCell>{row?.status}</TableCell>
                      <TableCell align="right">
                        {row?.selectedItemDetails?.[0]?.total_cbm}
                      </TableCell>
                      <TableCell align="right">0.000</TableCell>
                      <TableCell>{row?.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Buttons for PDF Download and Closing the Modal */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}
          >
            <Button onClick={generatePDF} variant="contained" color="primary">
              Download PDF
            </Button>
            <Button
              onClick={onClose} // Changed from handleClose to onClose
              variant="contained"
              color="secondary"
              sx={{ marginLeft: 2 }}
            >
              Close
            </Button>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};

export default ModalPdffile;
