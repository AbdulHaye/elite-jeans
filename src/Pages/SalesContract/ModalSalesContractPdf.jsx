import React from "react";
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
  Grid,
  Button,
} from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 1200,
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  overflow: "auto",
};

const ModalSalesContractPdf = ({ open, pdfData, onClose }) => {
  console.log(pdfData, "pdfData of cotract sales in opdf");
  const contractData = {
    contractNumber: pdfData?.contractNo,
    date:
      pdfData?.createdAt && !isNaN(new Date(pdfData.createdAt))
        ? new Date(pdfData.createdAt).toISOString().split("T")[0]
        : "N/A",
    vendor: pdfData?.vendorId?.name,
    fobPort: pdfData?.FOBPort,
    // vendorCompany: pdfData?.vendorCompanyName,
    beneficiary: pdfData?.vendorCompanyName,
    beneficiaryAddress: pdfData?.vendorBeneficiaryAddress,
    items: [
      {
        style: pdfData?.workOrderquoteId[0]?.style_number,
        workOrder: "5188",
        fabric: pdfData?.workOrderquoteId[0]?.work_order_quotes[0]?.fabric,
        deliveryDate: pdfData?.workOrderquoteId[0]?.work_order_quotes[0]?.date,
        quantities: [1, 1, 2, 2, 3, 2, 2, 2],
        casePack: 15,
        totalQuantity: 795,
        unitPrice: 3.5,
        amount: 2782.5,
      },
    ],
    bankInfo: {
      name: pdfData?.bankName,
      address: pdfData?.bankAddress,
      account: pdfData?.accountNumber,
    },
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10; // Equal left/right margins
    let yPos = 10;

    // Header Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TODAY'S APPAREL, INC.", margin, yPos, { align: "left" });
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("1410 Broadway suite 1805 New York, N.Y. 10018", margin, yPos);
    yPos += 4;
    doc.text("Tel: 1-212-278-8051", margin, yPos);
    yPos += 10;

    // Contract Info
    doc.setFontSize(8);
    doc.text(`Contract #: ${contractData.contractNumber}`, margin, yPos);
    doc.text(`Date: ${contractData.date}`, margin + 50, yPos);
    // doc.text(`Vendor: ${contractData.vendor}`, margin + 100, yPos);
    // doc.text(`FOB Port: ${contractData.fobPort}`, pageWidth - margin - 60, yPos, { align: 'right' });
    yPos += 6;

    // Contract Info
    doc.setFontSize(8);
    doc.text(`Vendor: ${contractData.vendor}`, margin, yPos);
    doc.text(`FOB Port: ${contractData.fobPort}`, margin + 50, yPos);
    //    doc.text(`Vendor: ${contractData.vendor}`, margin + 100, yPos);
    //    doc.text(`FOB Port: ${contractData.fobPort}`, pageWidth - margin - 60, yPos, { align: 'right' });
    yPos += 6;

    // Vendor Information
    doc.setFontSize(8);
    // doc.text(
    //   `Vendor Company Name: ${contractData.vendorCompany}`,
    //   margin,
    //   yPos,
    //   { maxWidth: 180 }
    // );
    yPos += 6;
    doc.text(`Beneficiary: ${contractData.beneficiary}`, margin, yPos, {
      maxWidth: 180,
    });
    yPos += 6;
    doc.text(`Address: ${contractData.beneficiaryAddress}`, margin, yPos, {
      maxWidth: 180,
    });
    yPos += 12;

    // Items Table
    const headers = [
      "Style",
      "Work Order",
      "Fabric",
      "Delivery Date",
      ...Array.from({ length: 8 }, (_, i) => `${i * 2}/24`),
      "Case Pack",
      "Total Qty",
      "Unit Price",
      "Amount",
    ];

    const data = contractData.items.map((item) => [
      item.style,
      item.workOrder,
      { content: item.fabric, styles: { cellWidth: 40, fontStyle: "bold" } },
      item.deliveryDate,
      ...item.quantities,
      item.casePack,
      item.totalQuantity,
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.amount.toFixed(2)}`,
    ]);

    doc.autoTable({
      startY: yPos,
      head: [headers],
      body: data,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: "linebreak",
        halign: "center",
      },
      headerStyles: {
        fillColor: [211, 211, 211],
        textColor: 0,
        fontSize: 6,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 10 },
        2: { cellWidth: 10 },
        3: { cellWidth: 10 },
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => [4 + i, { cellWidth: 8 }])
        ),
        12: { cellWidth: 10 },
        13: { cellWidth: 10 },
        14: { cellWidth: 10 },
        15: { cellWidth: 10 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // Terms & Conditions
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Delivery: As per each work order required.", margin, yPos, {
      maxWidth: 180,
    });
    yPos += 5;
    doc.text("Deduction for late delivery:", margin, yPos, { maxWidth: 180 });
    yPos += 5;
    doc.text(
      "1-3days 5% off. 4-7days 5% off. 8-15days 10% off.",
      margin + 5,
      yPos,
      { maxWidth: 180 }
    );
    yPos += 4;
    doc.text(
      "16-20days 15% off. 21-30days 30% off or ship by air freight by Sellers expense.",
      margin + 5,
      yPos,
      { maxWidth: 180 }
    );
    yPos += 10;

    // Bank Information
    doc.setFont("helvetica", "bold");
    doc.text("Bank Information:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Name: ${contractData.bankInfo.name}`, margin, yPos, {
      maxWidth: 180,
    });
    yPos += 5;
    doc.text(`Address: ${contractData.bankInfo.address}`, margin, yPos, {
      maxWidth: 180,
    });
    yPos += 5;
    doc.text(`Account #: ${contractData.bankInfo.account}`, margin, yPos, {
      maxWidth: 180,
    });
    yPos += 15;

    // Signatures
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("SELLER SIGNATURE", margin + 25, yPos);
    doc.text("BUYER SIGNATURE", pageWidth - margin - 55, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signature", margin + 25, yPos);
    doc.text("Authorized Signature", pageWidth - margin - 55, yPos);

    doc.save(`Purchase-Order-${contractData.contractNumber}.pdf`);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          TODAY'S APPAREL, INC.
        </Typography>
        <Typography variant="body2" gutterBottom>
          1410 Broadway suite 1805 New York, N.Y. 10018
          <br />
          Tel: 1-212-278-8051
        </Typography>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2">
              <strong>Contract #:</strong> {contractData.contractNumber}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2">
              <strong>Date:</strong> {contractData.date}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2">
              <strong>Vendor:</strong> {contractData.vendor}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2">
              <strong>FOB Port:</strong> {contractData.fobPort}
            </Typography>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small" sx={{ "& td, & th": { fontSize: "0.75rem" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Style</TableCell>
                <TableCell>Work Order</TableCell>
                <TableCell>Fabric</TableCell>
                <TableCell>Delivery Date</TableCell>
                {[...Array(8)].map((_, i) => (
                  <TableCell key={i} align="center">
                    {i * 2}/24
                  </TableCell>
                ))}
                <TableCell>Case Pack</TableCell>
                <TableCell>Total Qty</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contractData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.style}</TableCell>
                  <TableCell>{item.workOrder}</TableCell>
                  <TableCell>{item.fabric}</TableCell>
                  <TableCell>{item.deliveryDate}</TableCell>
                  {item.quantities.map((qty, i) => (
                    <TableCell key={i} align="center">
                      {qty}
                    </TableCell>
                  ))}
                  <TableCell>{item.casePack}</TableCell>
                  <TableCell>{item.totalQuantity}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>${item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* <TableContainer 
          component={Paper} 
          sx={{ 
            mb: 2,
            maxHeight: 200,  // Fixed height
            overflow: 'auto',  // Enable scrolling
            '& .MuiTable-root': {
              minWidth: 1000  // Ensure table has minimum width for all columns
            }
          }}
        >
          <Table 
            size="small" 
            sx={{ 
              "& td, & th": { 
                fontSize: "0.75rem",
                whiteSpace: 'nowrap'  // Prevent text wrapping
              },
              position: 'relative'
            }}
            stickyHeader  // Makes header sticky during scroll
          >
            <TableHead>
            <TableRow>
                <TableCell>Style</TableCell>
                <TableCell>Work Order</TableCell>
                <TableCell>Fabric</TableCell>
                <TableCell>Delivery Date</TableCell>
                {[...Array(8)].map((_, i) => (
                  <TableCell key={i} align="center">
                    {i * 2}/24
                  </TableCell>
                ))}
                <TableCell>Case Pack</TableCell>
                <TableCell>Total Qty</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contractData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.style}</TableCell>
                  <TableCell>{item.workOrder}</TableCell>
                  <TableCell>{item.fabric}</TableCell>
                  <TableCell>{item.deliveryDate}</TableCell>
                  {item.quantities.map((qty, i) => (
                    <TableCell key={i} align="center">
                      {qty}
                    </TableCell>
                  ))}
                  <TableCell>{item.casePack}</TableCell>
                  <TableCell>{item.totalQuantity}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>${item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer> */}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Terms & Conditions
            </Typography>
            <Typography variant="body2" paragraph sx={{ fontSize: "0.75rem" }}>
              Delivery: As per each work order required.
              <br />
              Deduction for late delivery:
              <br />
              1-3days 5% off, 4-7days 5% off, 8-15days 10% off,
              <br />
              16-20days 15% off, 21-30days 30% off or ship by air freight by
              Seller's expense.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Bank Information
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
              <strong>Bank Name:</strong> {contractData.bankInfo.name}
              <br />
              <strong>Address:</strong> {contractData.bankInfo.address}
              <br />
              <strong>Account #:</strong> {contractData.bankInfo.account}
            </Typography>
          </Grid>
        </Grid>

        <Grid container sx={{ mt: 2, justifyContent: "space-between" }}>
          <Grid item xs={5}>
            <Typography
              variant="body2"
              sx={{ borderTop: "1px solid black", pt: 1 }}
            >
              Seller Signature
              <br />
              <small>Authorized Signature</small>
            </Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography
              variant="body2"
              sx={{ borderTop: "1px solid black", pt: 1 }}
            >
              Buyer Signature
              <br />
              <small>Authorized Signature</small>
            </Typography>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Button
            onClick={generatePDF}
            variant="contained"
            color="success"
            size="small"
          >
            Download PDF
          </Button>
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
            size="small"
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalSalesContractPdf;
