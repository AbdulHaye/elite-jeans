import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./WorkOrderpdfStyle.css";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import api from "../../../../../ApiServices/api";
function WorkOrderPDF({ techPackId }) {
  const [workOrderData, setWorkOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const { id } = useParams(); // Extracts ID from URL (e.g., "67b47abf1cfd2c0c8297e540")
  const [pdfData, setPdfData] = useState(null);
  console.log(pdfData, "pdfData");
  const getPdfData = async () => {
    try {
      const response = await api.post(
        "api/work-orders/getWorkOrderFullDetails",
        {
          workOrderId: id, // Use the extracted ID
        }
      );
      setPdfData(response.data); // Store response data
    } catch (error) {
      console.error("Error fetching PDF data:", error);
      // Handle error (show message, redirect, etc.)
    }
  };

  // Call the function when the component mounts
  useEffect(() => {
    if (id) {
      // Ensure ID exists before calling API
      getPdfData();
    }
  }, [id]);

  useEffect(() => {
    const fetchWorkOrderData = async () => {
      try {
      } catch (error) {
        console.error("Error fetching work order data:", error);
        setLoading(false);
      }
    };

    fetchWorkOrderData();
  }, []);

  // const generatePDF = () => {
  //   if (!pdfData) return;

  //   const doc = new jsPDF({
  //     orientation: "portrait",
  //     unit: "mm",
  //     format: "a4",
  //   });

  //   // Set default font
  //   doc.setFont("helvetica");
  //   doc.setFontSize(10);

  //   // Function to add header to each page
  //   const addHeader = (pageNumber) => {
  //     doc.setFontSize(8);
  //     doc.setTextColor(0, 0, 0);
  //     doc.setFont("helvetica", "bold");
  //     doc.text(
  //       `Today’s Apparel Inc - Work Order #${pdfData?.WorkOrder?.workOrderId}`,
  //       14,
  //       10
  //     );

  //     // Add page number
  //     doc.text(`Page ${pageNumber}`, 190, 10, { align: "right" });

  //     // Reset font
  //     doc.setFont("helvetica", "normal");
  //     doc.setFontSize(10);
  //   };

  //   // Page 1: Header and Work Order Details
  //   addHeader(1);

  //   // Top table
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Work Order Details table
  //   doc.setFontSize(8);
  //   doc.text("Work Order Details", 14, 50);
  //   doc.setFontSize(8);

  //   autoTable(doc, {
  //     startY: 55,
  //     head: [
  //       [
  //         "Created date",
  //         "Order #",
  //         "Category",
  //         "Item Type",
  //         "Subcategory",
  //         "Shipping Status",
  //         "Sample Status",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.WorkOrder?.workOrderId,
  //         pdfData?.WorkOrder?.category?.name,
  //         pdfData?.WorkOrder?.itemType?.name,
  //         pdfData?.WorkOrder?.subCategory?.name,
  //         pdfData?.WorkOrder?.shippingStatus,
  //         pdfData?.WorkOrder?.sampleStatus,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //     },
  //   });

  //   autoTable(doc, {
  //     startY: doc.lastAutoTable.finalY + 5,
  //     head: [["Date Created", "ETD / 预期交付日期"]],
  //     body: [[pdfData?.WorkOrder?.createdAt, pdfData?.WorkOrder?.etd]],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //     },
  //   });

  //   // Trim images table
  //   doc.text(
  //     `Trim: ${pdfData?.WorkOrder?.trimImages?.image}`,
  //     14,
  //     doc.lastAutoTable.finalY + 10
  //   );

  //   // Add trim images in a 1x4 grid
  //   const trimImages = pdfData?.WorkOrder?.trimImages[0]?.image;
  //   const trimImageWidth = 40;
  //   const trimImageHeight = 20;
  //   const startY = doc.lastAutoTable.finalY + 15;

  //   doc.text("Trim Images:", 14, startY);

  //   // Add table with images
  //   autoTable(doc, {
  //     startY: startY + 5,
  //     head: [["Trim", "Style", "Bottom Rivets", "Trim"]],
  //     body: [
  //       [
  //         { content: "", rowSpan: 1, colSpan: 1 },
  //         { content: "", rowSpan: 1, colSpan: 1 },
  //         { content: "", rowSpan: 1, colSpan: 1 },
  //         { content: "", rowSpan: 1, colSpan: 1 },
  //       ],
  //     ],
  //     didDrawCell: (data) => {
  //       if (data.section === "body" && data.column.index < trimImages?.length) {
  //         doc.addImage(
  //           trimImages[data.column.index],
  //           "JPEG",
  //           data.cell.x + 2,
  //           data.cell.y + 2,
  //           data.cell.width - 4,
  //           data.cell.height - 4
  //         );
  //       }
  //     },
  //     columnStyles: {
  //       0: { cellWidth: trimImageWidth },
  //       1: { cellWidth: trimImageWidth },
  //       2: { cellWidth: trimImageWidth },
  //       3: { cellWidth: trimImageWidth },
  //     },
  //     styles: {
  //       minCellHeight: trimImageHeight,
  //     },
  //   });

  //   doc.text(`PW2025 SOI MISSY KNITS TIMES`, 14, doc.lastAutoTable.finalY + 5);

  //   // Page 2: Item Details
  //   doc.addPage();
  //   addHeader(2);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Item Details table
  //   doc.setFontSize(8);
  //   doc.text("Item Details", 14, 45);
  //   doc.setFontSize(8);

  //   const itemDetailsBody = pdfData?.itemDetails?.map((item) => [
  //     item?.style_number,
  //     item?.size,
  //     item?.size_scale,
  //     // `Pcs Per Master Poly Bag / 单件一个胶袋: ${item?.number_of_pieces_per_master_carton}\nMaster Polybags Per Master Carton / 每瓶几个中包装: ${item?.number_of_master_polybags_per_master_carton}\nPcs Per Master Carton / 每箱件数: ${item.packaging.number_of_pieces_per_master_carton}`,
  //     item?.quantity,
  //     item?.comments
  //       ? `${item?.color_Id?.name}; ${item?.comments}`
  //       : item?.color_Id?.name,
  //     item?.individual_poly_bag === true ? "individual poly bag" : "N/A",
  //   ]);

  //   autoTable(doc, {
  //     startY: 50,
  //     head: [
  //       [
  //         "Style #",
  //         "Size / R码",
  //         "Size Scale / R码",
  //         // "Packaging Instructions / 包装指示",
  //         "Quantity",
  //         "Comments / Alterations",
  //         "Special Handling / 特别处理",
  //       ],
  //     ],
  //     body: itemDetailsBody,
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //       cellPadding: 1.5,
  //       lineWidth: 0.1,
  //     },
  //     columnStyles: {
  //       0: { cellWidth: 20 },
  //       1: { cellWidth: 15 },
  //       2: { cellWidth: 15 },
  //       3: { cellWidth: 40 },
  //       4: { cellWidth: 15 },
  //       5: { cellWidth: 30 },
  //       6: { cellWidth: 25 },
  //     },
  //     styles: {
  //       overflow: "linebreak",
  //       halign: "left",
  //       valign: "middle",
  //     },
  //   });

  //   // Style Details table
  //   doc.setFontSize(8);
  //   doc.text("Style Details", 14, doc.lastAutoTable.finalY + 10);
  //   doc.setFontSize(8);

  //   autoTable(doc, {
  //     startY: doc.lastAutoTable.finalY + 15,
  //     head: [["Descriptions", "Fabric", "Sewing Thread Color", "Summary"]],
  //     body: [
  //       [
  //         pdfData?.styleDetails[0]?.description,
  //         pdfData?.styleDetails[0]?.fabric,
  //         pdfData?.styleDetails[0]?.sewingThreadColor,
  //         pdfData?.styleDetails[0]?.summary,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //     },
  //   });

  //   // Add style sample pictures
  //   doc.text("Sample Pictures:", 14, doc.lastAutoTable.finalY + 10);

  //   const styleImages = pdfData?.styleDetails?.newDetails?.pic;
  //   const styleImageWidth = 80;
  //   const styleImageHeight = 60;
  //   const styleImageY = doc.lastAutoTable.finalY + 15;

  //   styleImages?.forEach((image, index) => {
  //     const x = 14 + index * (styleImageWidth + 5);
  //     if (x + styleImageWidth < 200) {
  //       // Check if image fits on page
  //       doc.addImage(
  //         image?.imageUrl,
  //         "JPEG",
  //         x,
  //         styleImageY,
  //         styleImageWidth,
  //         styleImageHeight
  //       );
  //     }
  //   });

  //   // Page 3: Construction Details (Front & Back View)
  //   doc.addPage();
  //   addHeader(3);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Front & Back View section
  //   doc.setFontSize(8);
  //   doc.text(pdfData?.styleDetails[0]?.newDetails[0]?.pic?.imageName, 14, 50);
  //   doc.setFontSize(8);

  //   // Add front and back view images
  //   const imageWidth = 85;
  //   const imageHeight = 60;

  //   doc.addImage(
  //     pdfData?.styleDetails[0]?.newDetails[0]?.pic?.imageUrl,
  //     "JPEG",
  //     14,
  //     55,
  //     imageWidth,
  //     imageHeight
  //   );

  //   doc.addImage(
  //     pdfData?.styleDetails[0]?.newDetails[1]?.pic?.imageUrl,
  //     "JPEG",
  //     110,
  //     55,
  //     imageWidth,
  //     imageHeight
  //   );

  //   doc.setTextColor(0, 0, 0);
  //   doc.text(
  //     `Comments: ${pdfData?.styleDetails[0].newDetails[1]?.detail_category}`,
  //     14,
  //     120
  //   );

  //   // Page 4: Construction Details
  //   doc.addPage();
  //   addHeader(4);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Waistband section
  //   // doc.setFontSize(8);
  //   // doc.text(pdfData?.styleDetails[0]?.newDetails[2]?.pic?.imageName, 14, 50);
  //   // doc.setFontSize(8);

  //   // const waistbandLines =
  //   //   workOrderData.constructionDetails.waistband.split("\n");
  //   // waistbandLines.forEach((line, index) => {
  //   //   doc.text(line, 14, 55 + index * 5);
  //   // });

  //   // Add waistband image
  //   // doc.addImage(
  //   //   pdfData?.styleDetails[0]?.newDetails[2]?.pic?.imageUrl,
  //   //   "JPEG",
  //   //   100,
  //   //   50,
  //   //   80,
  //   //   60
  //   // );

  //   // Hem section
  //   // doc.setFontSize(8);
  //   // doc.text(pdfData?.styleDetails[0]?.newDetails[3]?.pic?.imageName, 14, 75);
  //   // doc.setFontSize(8);

  //   // const hemLines = workOrderData.constructionDetails.hem.split("\n");
  //   // hemLines.forEach((line, index) => {
  //   //   doc.text(line, 14, 80 + index * 5);
  //   // });

  //   // Add hem image
  //   // doc.addImage(
  //   //   pdfData?.styleDetails[0]?.newDetails[3]?.pic?.imageUrl,
  //   //   "JPEG",
  //   //   100,
  //   //   75,
  //   //   80,
  //   //   60
  //   // );

  //   // doc.text(
  //   //   `Comments: ${pdfData?.styleDetails[0]?.newDetails[3]?.detail_category}`,
  //   //   14,
  //   //   140
  //   // );

  //   // Page 5: Waistband Construction and Front Pockets
  //   doc.addPage();
  //   addHeader(5);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Waistband Construction
  //   // doc.setFontSize(8);
  //   // doc.text(pdfData?.styleDetails[0]?.newDetails[4]?.pic?.imageName, 14, 50);
  //   // doc.setFontSize(8);
  //   // doc.text(
  //   //   `${workOrderData?.companyName} - Work Order #${workOrderData?.workOrderNumber} - ${workOrderData?.productCodes[0]}, ${workOrderData?.productCodes[1]}, ${workOrderData?.productCodes[3]}`,
  //   //   14,
  //   //   55
  //   // );
  //   // doc.text(
  //   //   `Comments: ${pdfData?.styleDetails[0]?.newDetails[4]?.detail_category}`,
  //   //   14,
  //   //   60
  //   // );

  //   // Add waistband construction image
  //   // doc.addImage(
  //   //   pdfData?.styleDetails[0]?.newDetails[4]?.pic?.imageUrl,
  //   //   "JPEG",
  //   //   100,
  //   //   50,
  //   //   80,
  //   //   60
  //   // );

  //   // Front Pockets
  //   // doc.setFontSize(8);
  //   // doc.text(pdfData?.styleDetails[0]?.newDetails[5]?.pic?.imageName, 14, 120);
  //   // doc.setFontSize(8);
  //   // doc.text(
  //   //   `Comments: ${pdfData?.styleDetails[0]?.newDetails[5]?.detail_category}`,
  //   //   14,
  //   //   125
  //   // );

  //   // Add front pockets image
  //   // doc.addImage(
  //   //   pdfData?.styleDetails[0]?.newDetails[5]?.pic?.imageUrl,
  //   //   "JPEG",
  //   //   100,
  //   //   120,
  //   //   80,
  //   //   60
  //   // );

  //   // Page 6: Wash Details
  //   doc.addPage();
  //   addHeader(6);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Wash Details
  //   doc.setFontSize(8);
  //   doc.text("Wash Details", 14, 50);
  //   doc.setFontSize(8);

  //   // Wash DetailsFV
  //   doc.setFontSize(8);
  //   doc.text("Wash Details", 14, 50);
  //   doc.setFontSize(8);

  //   // Get the dynamic attributes from the first item in washDetails array
  //   const dynamicAttributes =
  //     pdfData?.washDetails?.[0]?.dynamicAttributes || {};

  //   // Convert the dynamicAttributes object into an array of key-value pairs
  //   const dynamicRows = Object.entries(dynamicAttributes).map(
  //     ([key, value]) => [
  //       key, // Property name (e.g., "color", "dry process")
  //       value, // Property value (e.g., "white", "none")
  //     ]
  //   );

  //   autoTable(doc, {
  //     startY: 55,
  //     head: [["Attribute", "Value"]], // Generic headers since we're using dynamic keys
  //     body: dynamicRows,
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //     },
  //   });

  //   // Page 7: Color Details
  //   doc.addPage();
  //   addHeader(7);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   doc.text("Color Details:", 14, doc.lastAutoTable.finalY + 10);

  //   // Add wash sample pictures
  //   const washImages =
  //     pdfData?.washDetails?.[0]?.newDetails
  //       ?.filter((detail) => detail.pic?.imageUrl) // Filter out entries without imageUrl
  //       .map((detail) => detail.pic.imageUrl) || [];

  //   const washImageWidth = 80;
  //   const washImageHeight = 60;
  //   const washImageY = doc.lastAutoTable.finalY + 15;

  //   // Only add images section if there are images
  //   if (washImages.length > 0) {
  //     doc.text("Wash Sample Pictures:", 14, washImageY - 5);

  //     washImages.forEach((imageUrl, index) => {
  //       const x = 14 + index * (washImageWidth + 5);
  //       const maxWidth = doc.internal.pageSize.width - 14;

  //       if (x + washImageWidth < maxWidth) {
  //         try {
  //           doc.addImage(
  //             imageUrl,
  //             imageUrl.toLowerCase().endsWith(".png") ? "PNG" : "JPEG",
  //             x,
  //             washImageY,
  //             washImageWidth,
  //             washImageHeight,
  //             undefined,
  //             "FAST"
  //           );
  //         } catch (error) {
  //           console.error("Error loading image:", error);
  //           // Fallback: Draw a placeholder
  //           doc.rect(x, washImageY, washImageWidth, washImageHeight);
  //           doc.text("Image", x + 30, washImageY + 30);
  //         }
  //       } else {
  //         // If images don't fit horizontally, you could add logic to start a new row
  //         // For example:
  //         // const newRowY = washImageY + washImageHeight + 5;
  //         // doc.addImage(...) with updated y position
  //       }
  //     });
  //   }

  //   // Color Details
  //   // doc.setFontSize(8);
  //   // workOrderData.colorDetails.forEach((color, index) => {
  //   //   const yPos = 50 + index * 20;
  //   //   doc.text(`${color.name}`, 14, yPos);
  //   //   if (color.pantone) {
  //   //     doc.text(`${color.pantone}`, 14, yPos + 5);
  //   //   }
  //   //   if (color.image) {
  //   //     doc.addImage(color.image, "JPEG", 60, yPos - 5, 15, 15);
  //   //   }
  //   // });

  //   // Page 8: Sample Requests
  //   doc.addPage();
  //   addHeader(8);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Sample Requests
  //   doc.setFontSize(8);
  //   doc.text("Sample Requests / 样板需求", 14, 50);
  //   doc.setFontSize(8);

  //   const sampleRequestsBody = pdfData?.sampleRequests.map((request) => [
  //     request.styleNumbers
  //       ? request?.styleNumber.join(" & ")
  //       : request?.styleNumber,
  //     request?.size,
  //     request?.quantity,
  //     request?.sampleType,
  //     request?.dueDate,
  //     request?.comments || "",
  //     request?.status,
  //   ]);

  //   autoTable(doc, {
  //     startY: 55,
  //     head: [
  //       [
  //         "Style #",
  //         "Size / R码",
  //         "Quantity",
  //         "Sample Type / 样板类型",
  //         "Due Date / 完成日期",
  //         "Comments / 备注",
  //         "Status",
  //       ],
  //     ],
  //     body: sampleRequestsBody,
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 8,
  //     },
  //     bodyStyles: {
  //       fontSize: 8,
  //     },
  //     columnStyles: {
  //       0: { cellWidth: 25 },
  //       1: { cellWidth: 15 },
  //       2: { cellWidth: 15 },
  //       3: { cellWidth: 25 },
  //       4: { cellWidth: 20 },
  //       5: { cellWidth: 40 },
  //       6: { cellWidth: 15 },
  //     },
  //   });

  //   // Page 9: Sample Specs
  //   doc.addPage();
  //   addHeader(9);

  //   // Top table (same as page 1)
  //   autoTable(doc, {
  //     startY: 15,
  //     head: [
  //       [
  //         "Date",
  //         "Fabric Name",
  //         "Size Range",
  //         "Vendor",
  //         "Sample Size",
  //         "Fabric content",
  //         "Customer / Brand",
  //         "Description",
  //         "Garment Specs details",
  //       ],
  //     ],
  //     body: [
  //       [
  //         pdfData?.WorkOrder?.createdAt,
  //         pdfData?.fabricName,
  //         pdfData?.sampleSpecs[0]?.size_range,
  //         pdfData?.WorkOrder?.vendor?.name,
  //         pdfData?.sampleSpecs[0]?.size,
  //         pdfData?.sampleSpecs[0]?.fabric_content,
  //         pdfData?.sampleSpecs[0]?.customer_or_brand,
  //         pdfData?.description,
  //         pdfData?.sampleSpecs[0]?.garment_specs_details,
  //       ],
  //     ],
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 9,
  //     },
  //     bodyStyles: {
  //       fontSize: 9,
  //     },
  //     margin: { top: 15 },
  //   });

  //   // Sample Specs
  //   doc.setFontSize(7);
  //   doc.text("Sample Specs", 14, 50);
  //   doc.setFontSize(7);

  //   autoTable(doc, {
  //     startY: 55,
  //     head: [
  //       [
  //         "Code",
  //         "Point of Measure Description",
  //         "Tol (+/-)",
  //         "Design",
  //         "Initial",
  //         "1st PP",
  //         "diff +/-",
  //         "Rev1",
  //         "2nd PP",
  //         "diff +/-",
  //         "Rev2",
  //         "3rd PP",
  //         "diff +/-",
  //         "Final",
  //         "Ship.",
  //         "diff +/-",
  //       ],
  //     ],
  //     body: pdfData?.copiedSampleGradedSpecs[0]?.copiedPOMs?.map((spec) => [
  //       spec?.code,
  //       spec?.description,
  //       spec?.tolerance,
  //       spec?.design,
  //       spec?.Initial,
  //       spec?.FirstPP,
  //       "",
  //       spec?.Rev1,
  //       spec?.SecondPP,
  //       "",
  //       spec?.Rev2,
  //       spec?.ThirdPP,
  //       "",
  //       spec?.Final,
  //       spec?.Ship,
  //       "",
  //     ]),
  //     theme: "grid",
  //     headStyles: {
  //       fillColor: [51, 51, 51],
  //       textColor: 255,
  //       fontStyle: "bold",
  //       fontSize: 6,
  //     },
  //     bodyStyles: {
  //       fontSize: 6,
  //     },
  //     margin: { left: 5, right: 5 },
  //     tableWidth: "wrap",
  //   });

  //   // Save the PDF

  //   doc.save(`ELITEJEANS - ${pdfData?.WorkOrder?.workOrderId} .pdf`);
  // };

  // doc.save(

  //   "PDF"
  // `ELITEJEANS - ${
  //   workOrderData.workOrderNumber
  // } - ${workOrderData.productCodes.join(", ")}.pdf`
  //   );
  // };

  // if (loading) {
  //   return <div className="loading">Loading work order data...</div>;
  // }

  // if (!workOrderData) {
  //   return <div className="error">No work order data available</div>;
  // }




  const generatePDF = async () => {
  if (!pdfData) {
    console.error("No PDF data available");
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set default font
    doc.setFont("helvetica");
    doc.setFontSize(10);

    // Function to add header to each page
    const addHeader = (pageNumber) => {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Today's Apparel Inc - Work Order #${pdfData?.WorkOrder?.workOrderId || ''}`,
        14,
        10
      );
      doc.text(`Page ${pageNumber}`, 190, 10, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    // Helper function to load images with error handling
    const loadImage = async (url) => {
      try {
        if (!url) return null;
        
        // For local development, you might need to proxy the S3 requests
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('Failed to load image');
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error('Error loading image:', url, error);
        return null;
      }
    };

    // ==============================================
    // PAGE 1: Header and Work Order Details
    // ==============================================
    addHeader(1);

    // Top table - made more compact
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Work Order Details tables (split into two for width)
    doc.setFontSize(8);
    doc.text("Work Order Details", 14, doc.lastAutoTable.finalY + 10);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Created", "Order #", "Category", "Item Type", "Subcategory"]],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.WorkOrder?.workOrderId || '',
          pdfData?.WorkOrder?.category?.name || '',
          pdfData?.WorkOrder?.itemType?.name || '',
          pdfData?.WorkOrder?.subCategory?.name || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      tableWidth: 'wrap',
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      head: [["Shipping Status", "Sample Status", "ETD"]],
      body: [
        [
          pdfData?.WorkOrder?.shippingStatus || '',
          pdfData?.WorkOrder?.sampleStatus || '',
          pdfData?.WorkOrder?.etd || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      tableWidth: 'wrap',
    });

    // Trim images handling
    if (pdfData?.WorkOrder?.trimImages?.[0]?.image?.length) {
      doc.text("Trim Images:", 14, doc.lastAutoTable.finalY + 10);
      
      const trimImages = pdfData.WorkOrder.trimImages[0].image;
      const trimImageWidth = 40;
      const trimImageHeight = 20;
      const startY = doc.lastAutoTable.finalY + 15;

      // Load all trim images first
      const loadedImages = await Promise.all(
        trimImages.map(url => loadImage(url))
      );

      autoTable(doc, {
        startY: startY,
        head: [["Trim", "Style", "Bottom Rivets", "Trim"]],
        body: [[{}, {}, {}, {}]],
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index < loadedImages.length && loadedImages[data.column.index]) {
            try {
              doc.addImage(
                loadedImages[data.column.index],
                "JPEG",
                data.cell.x + 2,
                data.cell.y + 2,
                data.cell.width - 4,
                data.cell.height - 4
              );
            } catch (error) {
              console.error('Error adding image:', error);
              doc.text("Image", data.cell.x + 10, data.cell.y + 10);
            }
          }
        },
        columnStyles: {
          0: { cellWidth: trimImageWidth },
          1: { cellWidth: trimImageWidth },
          2: { cellWidth: trimImageWidth },
          3: { cellWidth: trimImageWidth },
        },
        styles: {
          minCellHeight: trimImageHeight,
        },
      });
    }

    doc.text(`PW2025 SOI MISSY KNITS TIMES`, 14, doc.lastAutoTable.finalY + 5);

    // ==============================================
    // PAGE 2: Item Details
    // ==============================================
    doc.addPage();
    addHeader(2);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Item Details table
    doc.setFontSize(8);
    doc.text("Item Details", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(8);

    const itemDetailsBody = pdfData?.itemDetails?.map((item) => [
      item?.style_number || '',
      item?.size || '',
      item?.size_scale || '',
      item?.quantity || '',
      item?.comments
        ? `${item?.color_Id?.name || ''}; ${item?.comments || ''}`
        : item?.color_Id?.name || '',
      item?.individual_poly_bag === true ? "individual poly bag" : "N/A",
    ]) || [];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [
        [
          "Style #",
          "Size / R码",
          "Size Scale / R码",
          "Quantity",
          "Comments / Alterations",
          "Special Handling",
        ],
      ],
      body: itemDetailsBody,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 },
      },
      styles: {
        overflow: "linebreak",
        halign: "left",
        valign: "middle",
      },
      tableWidth: 'wrap',
    });

    // Style Details table
    doc.setFontSize(8);
    doc.text("Style Details", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(8);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Descriptions", "Fabric", "Sewing Thread Color", "Summary"]],
      body: [
        [
          pdfData?.styleDetails?.[0]?.description || '',
          pdfData?.styleDetails?.[0]?.fabric || '',
          pdfData?.styleDetails?.[0]?.sewingThreadColor || '',
          pdfData?.styleDetails?.[0]?.summary || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      tableWidth: 'wrap',
    });

    // Style sample pictures
    if (pdfData?.styleDetails?.[0]?.newDetails?.pic) {
      doc.text("Sample Pictures:", 14, doc.lastAutoTable.finalY + 10);

      const styleImages = pdfData.styleDetails[0].newDetails.pic;
      const styleImageWidth = 80;
      const styleImageHeight = 60;
      const styleImageY = doc.lastAutoTable.finalY + 15;

      // Load all style images first
      const loadedStyleImages = await Promise.all(
        styleImages.map(pic => pic?.imageUrl ? loadImage(pic.imageUrl) : null)
      );

      loadedStyleImages.forEach((imageUrl, index) => {
        if (!imageUrl) return;
        
        const x = 14 + index * (styleImageWidth + 5);
        if (x + styleImageWidth < 200) {
          try {
            doc.addImage(
              imageUrl,
              imageUrl.toLowerCase().endsWith(".png") ? "PNG" : "JPEG",
              x,
              styleImageY,
              styleImageWidth,
              styleImageHeight
            );
          } catch (error) {
            console.error('Error adding style image:', error);
            doc.rect(x, styleImageY, styleImageWidth, styleImageHeight);
            doc.text("Image", x + 30, styleImageY + 30);
          }
        }
      });
    }

    // ==============================================
    // PAGE 3: Construction Details (Front & Back View)
    // ==============================================
    doc.addPage();
    addHeader(3);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Front & Back View section
    if (pdfData?.styleDetails?.[0]?.newDetails?.[0]?.pic) {
      doc.setFontSize(8);
      doc.text(
        pdfData.styleDetails[0].newDetails[0].pic.imageName || 'Front View', 
        14, 
        doc.lastAutoTable.finalY + 10
      );
      
      const imageWidth = 85;
      const imageHeight = 60;
      const imageY = doc.lastAutoTable.finalY + 15;

      // Load front and back view images
      const frontImage = await loadImage(pdfData.styleDetails[0].newDetails[0].pic.imageUrl);
      const backImage = pdfData.styleDetails[0].newDetails[1]?.pic?.imageUrl 
        ? await loadImage(pdfData.styleDetails[0].newDetails[1].pic.imageUrl)
        : null;

      if (frontImage) {
        doc.addImage(
          frontImage,
          "JPEG",
          14,
          imageY,
          imageWidth,
          imageHeight
        );
      }

      if (backImage) {
        doc.addImage(
          backImage,
          "JPEG",
          110,
          imageY,
          imageWidth,
          imageHeight
        );
      }

      doc.setTextColor(0, 0, 0);
      doc.text(
        `Comments: ${pdfData?.styleDetails?.[0]?.newDetails?.[1]?.detail_category || ''}`,
        14,
        imageY + imageHeight + 10
      );
    }

    // ==============================================
    // PAGE 4: Construction Details Continued
    // ==============================================
    doc.addPage();
    addHeader(4);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Waistband section (if data exists)
    if (pdfData?.styleDetails?.[0]?.newDetails?.[2]?.pic) {
      doc.setFontSize(8);
      doc.text(
        pdfData.styleDetails[0].newDetails[2].pic.imageName || 'Waistband Details',
        14,
        doc.lastAutoTable.finalY + 10
      );

      const waistbandImage = await loadImage(pdfData.styleDetails[0].newDetails[2].pic.imageUrl);
      
      if (waistbandImage) {
        doc.addImage(
          waistbandImage,
          "JPEG",
          100,
          doc.lastAutoTable.finalY + 15,
          80,
          60
        );
      }

      doc.text(
        `Comments: ${pdfData?.styleDetails?.[0]?.newDetails?.[2]?.detail_category || ''}`,
        14,
        doc.lastAutoTable.finalY + 80
      );
    }

    // ==============================================
    // PAGE 5: Waistband Construction and Front Pockets
    // ==============================================
    doc.addPage();
    addHeader(5);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Waistband Construction (if data exists)
    if (pdfData?.styleDetails?.[0]?.newDetails?.[4]?.pic) {
      doc.setFontSize(8);
      doc.text(
        pdfData.styleDetails[0].newDetails[4].pic.imageName || 'Waistband Construction',
        14,
        doc.lastAutoTable.finalY + 10
      );

      const waistbandConstructionImage = await loadImage(
        pdfData.styleDetails[0].newDetails[4].pic.imageUrl
      );

      if (waistbandConstructionImage) {
        doc.addImage(
          waistbandConstructionImage,
          "JPEG",
          100,
          doc.lastAutoTable.finalY + 15,
          80,
          60
        );
      }

      doc.text(
        `Comments: ${pdfData?.styleDetails?.[0]?.newDetails?.[4]?.detail_category || ''}`,
        14,
        doc.lastAutoTable.finalY + 80
      );
    }

    // Front Pockets (if data exists)
    if (pdfData?.styleDetails?.[0]?.newDetails?.[5]?.pic) {
      doc.setFontSize(8);
      doc.text(
        pdfData.styleDetails[0].newDetails[5].pic.imageName || 'Front Pockets',
        14,
        doc.lastAutoTable.finalY + 90
      );

      const frontPocketsImage = await loadImage(
        pdfData.styleDetails[0].newDetails[5].pic.imageUrl
      );

      if (frontPocketsImage) {
        doc.addImage(
          frontPocketsImage,
          "JPEG",
          100,
          doc.lastAutoTable.finalY + 95,
          80,
          60
        );
      }

      doc.text(
        `Comments: ${pdfData?.styleDetails?.[0]?.newDetails?.[5]?.detail_category || ''}`,
        14,
        doc.lastAutoTable.finalY + 160
      );
    }

    // ==============================================
    // PAGE 6: Wash Details
    // ==============================================
    doc.addPage();
    addHeader(6);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Wash Details
    doc.setFontSize(8);
    doc.text("Wash Details", 14, doc.lastAutoTable.finalY + 10);
    
    if (pdfData?.washDetails?.[0]?.dynamicAttributes) {
      const dynamicAttributes = pdfData.washDetails[0].dynamicAttributes;
      const dynamicRows = Object.entries(dynamicAttributes).map(
        ([key, value]) => [key, value]
      );

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Attribute", "Value"]],
        body: dynamicRows,
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
        },
        tableWidth: 'wrap',
      });
    }

    // Wash Sample Pictures (if they exist)
    if (pdfData?.washDetails?.[0]?.newDetails) {
      const washImages = pdfData.washDetails[0].newDetails
        .filter(detail => detail.pic?.imageUrl)
        .map(detail => detail.pic.imageUrl);

      if (washImages.length > 0) {
        doc.text("Wash Sample Pictures:", 14, doc.lastAutoTable.finalY + 10);

        const washImageWidth = 80;
        const washImageHeight = 60;
        const washImageY = doc.lastAutoTable.finalY + 15;

        // Load all wash images first
        const loadedWashImages = await Promise.all(
          washImages.map(url => loadImage(url))
        );

        loadedWashImages.forEach((imageUrl, index) => {
          if (!imageUrl) return;
          
          const x = 14 + index * (washImageWidth + 5);
          const maxWidth = doc.internal.pageSize.width - 14;

          if (x + washImageWidth < maxWidth) {
            try {
              doc.addImage(
                imageUrl,
                imageUrl.toLowerCase().endsWith(".png") ? "PNG" : "JPEG",
                x,
                washImageY,
                washImageWidth,
                washImageHeight,
                undefined,
                "FAST"
              );
            } catch (error) {
              console.error('Error adding wash image:', error);
              doc.rect(x, washImageY, washImageWidth, washImageHeight);
              doc.text("Image", x + 30, washImageY + 30);
            }
          }
        });
      }
    }

    // ==============================================
    // PAGE 7: Sample Requests
    // ==============================================
    doc.addPage();
    addHeader(7);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Sample Requests
    if (pdfData?.sampleRequests?.length) {
      doc.setFontSize(8);
      doc.text("Sample Requests / 样板需求", 14, doc.lastAutoTable.finalY + 10);
      
      const sampleRequestsBody = pdfData.sampleRequests.map((request) => [
        request.styleNumbers
          ? request.styleNumber.join(" & ")
          : request?.styleNumber || '',
        request?.size || '',
        request?.quantity || '',
        request?.sampleType || '',
        request?.dueDate || '',
        request?.comments || '',
        request?.status || '',
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [
          [
            "Style #", "Size", "Quantity", "Sample Type", 
            "Due Date", "Comments", "Status"
          ],
        ],
        body: sampleRequestsBody,
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 7,
        },
        bodyStyles: {
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 15 },
          2: { cellWidth: 15 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 15 },
        },
        tableWidth: 'wrap',
      });
    }

    // ==============================================
    // PAGE 8: Sample Specs
    // ==============================================
    doc.addPage();
    addHeader(8);

    // Top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date", "Fabric", "Size Range", "Vendor", "Sample Size", 
          "Fabric Content", "Customer", "Description", "Specs"
        ],
      ],
      body: [
        [
          pdfData?.WorkOrder?.createdAt || '',
          pdfData?.fabricName || '',
          pdfData?.sampleSpecs[0]?.size_range || '',
          pdfData?.WorkOrder?.vendor?.name || '',
          pdfData?.sampleSpecs[0]?.size || '',
          pdfData?.sampleSpecs[0]?.fabric_content || '',
          pdfData?.sampleSpecs[0]?.customer_or_brand || '',
          pdfData?.description || '',
          pdfData?.sampleSpecs[0]?.garment_specs_details || '',
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { top: 15 },
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
    });

    // Sample Specs
    if (pdfData?.copiedSampleGradedSpecs?.[0]?.copiedPOMs?.length) {
      doc.setFontSize(7);
      doc.text("Sample Specs", 14, doc.lastAutoTable.finalY + 10);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [
          [
            "Code", "Description", "Tol (+/-)", "Design", "Initial",
            "1st PP", "diff", "Rev1", "2nd PP", "diff", "Rev2",
            "3rd PP", "diff", "Final", "Ship", "diff"
          ],
        ],
        body: pdfData.copiedSampleGradedSpecs[0].copiedPOMs.map((spec) => [
          spec?.code || '',
          spec?.description || '',
          spec?.tolerance || '',
          spec?.design || '',
          spec?.Initial || '',
          spec?.FirstPP || '',
          "",
          spec?.Rev1 || '',
          spec?.SecondPP || '',
          "",
          spec?.Rev2 || '',
          spec?.ThirdPP || '',
          "",
          spec?.Final || '',
          spec?.Ship || '',
          "",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 5, // Very small font for headers
        },
        bodyStyles: {
          fontSize: 5, // Very small font for body
        },
        margin: { left: 5, right: 5 },
        tableWidth: 'wrap',
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 8 },
          3: { cellWidth: 8 },
          4: { cellWidth: 8 },
          5: { cellWidth: 8 },
          6: { cellWidth: 8 },
          7: { cellWidth: 8 },
          8: { cellWidth: 8 },
          9: { cellWidth: 8 },
          10: { cellWidth: 8 },
          11: { cellWidth: 8 },
          12: { cellWidth: 8 },
          13: { cellWidth: 8 },
          14: { cellWidth: 8 },
          15: { cellWidth: 8 },
        },
      });
    }

    // Save the PDF
    doc.save(`ELITEJEANS - ${pdfData?.WorkOrder?.workOrderId || 'work-order'}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please check console for details.");
  }
};
  return (
    <div className="work-order-container">
      <div className="header">
        <h1>
          Today’s Apparel Inc - Work Order #{pdfData?.WorkOrder?.workOrderId}
        </h1>
        {/* <h2>
            Product Codes:{" "}
            {pdfData?.productCodes?.join(", ") || "No product codes available"}
          </h2> */}
        <button onClick={generatePDF} className="download-btn">
          Download Work Order as PDF
        </button>
      </div>

      <div className="section">
        <h3>Basic Information</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <td>Date:</td>
              <td>{pdfData?.WorkOrder?.createdAt || "N/A"}</td>
              <td>Fabric Name:</td>
              <td>{pdfData?.fabricName || "N/A"}</td>
              <td>Size Range:</td>
              <td>{pdfData?.sampleSpecs[0]?.size_range || "N/A"}</td>
            </tr>
            <tr>
              <td>Vendor:</td>
              <td>{pdfData?.WorkOrder?.vendor?.name || "N/A"}</td>
              <td>Fabric Content:</td>
              <td>{pdfData?.sampleSpecs[0]?.fabric_content || "N/A"}</td>
              <td>Sample Size:</td>
              <td>{pdfData?.sampleSpecs[0]?.size || "N/A"}</td>
            </tr>
            <tr>
              <td>Customer / Brand:</td>
              <td colSpan="5">
                {pdfData?.sampleSpecs[0]?.customer_or_brand || "N/A"}
              </td>
            </tr>
            <tr>
              <td>Description:</td>
              <td colSpan="5">{pdfData?.description || "N/A"}</td>
            </tr>
            <tr>
              <td>Garment Specs details:</td>
              <td colSpan="5">
                {pdfData?.sampleSpecs[0]?.garment_specs_details || "N/A"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Work Order Details</h3>
        <table className="details-table">
          <tbody>
            <tr>
              <td>Created Date:</td>
              <td>{pdfData?.WorkOrder?.createdAt || "N/A"}</td>
              <td>Order #:</td>
              <td>{pdfData?.WorkOrder?.workOrderId || "N/A"}</td>
            </tr>
            <tr>
              <td>Category:</td>
              <td>{pdfData?.WorkOrder?.category?.name || "N/A"}</td>
              <td>Item Type:</td>
              <td>{pdfData?.WorkOrder?.itemType?.name || "N/A"}</td>
            </tr>
            <tr>
              <td>Subcategory:</td>
              <td>{pdfData?.WorkOrder?.subCategory?.name || "N/A"}</td>
              <td>Shipping Status:</td>
              <td>{pdfData?.WorkOrder?.shippingStatus || "N/A"}</td>
            </tr>
            <tr>
              <td>Sample Status:</td>
              <td>{pdfData?.WorkOrder?.sampleStatus || "N/A"}</td>
              <td>ETD:</td>
              <td>{pdfData?.WorkOrder?.etd || "N/A"}</td>
            </tr>
            <tr>
              <td colSpan="4">
                <div className="trim-images-container">
                  <h4>Trim Images</h4>
                  {/* <div className="trim-images">
                      {pdfData?.WorkOrder?.trimImages[0]?.image?.map(
                        (image, index) => (
                          <div key={index} className="trim-image-item">
                            <img src={image} alt={`Trim ${index + 1}`} />
                            <div className="trim-label">
                              {index === 0 && "Trim"}
                              {index === 1 && "Style"}
                              {index === 2 && "Bottom Rivets"}
                              {index === 3 && "Trim"}
                            </div>
                          </div>
                        )
                      )}
                    </div> */}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Item Details</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>Style #</th>
              <th>Size / R码</th>
              <th>Size Scale / R码</th>
              <th>Packaging Instructions / 包装指示</th>
              <th>Quantity</th>
              <th>Comments / Alterations</th>
              <th>Special Handling / 特别处理</th>
            </tr>
          </thead>
          <tbody>
            {pdfData?.itemDetails?.map((item, index) => (
              <tr key={index}>
                <td>{item?.style_number || "N/A"}</td>
                <td>{item?.size || "N/A"}</td>
                <td>{item?.size_scale || "N/A"}</td>
                <td>
                  Pcs Per Master Poly Bag / 单件一个胶袋:{" "}
                  {item?.packaging?.number_of_pieces_per_master_carton || "N/A"}
                  <br />
                  Master Polybags Per Master Carton / 每瓶几个中包装:{" "}
                  {item?.packaging
                    ?.number_of_master_polybags_per_master_carton || "N/A"}
                  <br />
                  Pcs Per Master Carton / 每箱件数:{" "}
                  {item?.packaging?.number_of_pieces_per_master_carton || "N/A"}
                </td>
                <td>{item?.quantity || "N/A"}</td>
                <td>
                  {item?.comments
                    ? `${item?.color_Id?.name || "N/A"}; ${item?.comments}`
                    : item?.color_Id?.name || "N/A"}
                </td>
                <td>
                  {item?.individual_poly_bag === true
                    ? "individual poly bag"
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Style Details</h3>
        <table className="style-table">
          <tbody>
            <tr>
              <td>Descriptions:</td>
              <td>{pdfData?.styleDetails[0]?.description || "N/A"}</td>
            </tr>
            <tr>
              <td>Fabric:</td>
              <td>{pdfData?.styleDetails[0]?.fabric || "N/A"}</td>
            </tr>
            <tr>
              <td>Sewing Thread Color:</td>
              <td>{pdfData?.styleDetails[0]?.sewingThreadColor || "N/A"}</td>
            </tr>
            <tr>
              <td>Summary:</td>
              <td>{pdfData?.styleDetails[0]?.summary || "N/A"}</td>
            </tr>
            <tr>
              <td>Sample Pictures:</td>
              <td>
                <div className="sample-images">
                  {pdfData?.styleDetails[0]?.newDetails?.pic?.map(
                    (image, index) => (
                      <img
                        key={index}
                        src={image?.imageUrl}
                        alt={`Sample ${index + 1}`}
                      />
                    )
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Construction Details</h3>
        <div className="construction-section">
          <h4>Front & Back View</h4>
          <div className="view-images">
            {pdfData?.styleDetails[0]?.newDetails
              ?.slice(0, 2)
              .map((detail, index) => (
                <div key={index} className="view-image">
                  <img
                    src={detail?.pic?.imageUrl}
                    alt={detail?.pic?.imageName || `View ${index + 1}`}
                  />
                  <p>{detail?.pic?.imageName || `View ${index + 1}`}</p>
                </div>
              ))}
          </div>
        </div>

        {pdfData?.styleDetails[0]?.newDetails?.slice(2).map((detail, index) => (
          <div key={index} className="construction-section">
            <h4>{detail?.pic?.imageName || `Detail ${index + 3}`}</h4>
            <p>{detail?.detail_category || "No details available"}</p>
            {detail?.pic?.imageUrl && (
              <img
                src={detail?.pic?.imageUrl}
                alt={detail?.pic?.imageName || `Detail ${index + 3}`}
                className="construction-image"
              />
            )}
          </div>
        ))}

        <div className="comments">
          <p>
            Comments:{" "}
            {pdfData?.styleDetails[0]?.newDetails[1]?.detail_category ||
              "No comments"}
          </p>
        </div>
      </div>

      <div className="section">
        <h3>Wash Details</h3>
        <table className="wash-table">
          <tbody>
            {pdfData?.washDetails?.[0]?.dynamicAttributes &&
              Object.entries(pdfData?.washDetails[0]?.dynamicAttributes)?.map(
                ([key, value]) => (
                  <tr key={key}>
                    <td>{key}:</td>
                    <td>{value || "N/A"}</td>
                  </tr>
                )
              )}
            <tr>
              <td>Sample Pictures:</td>
              <td>
                <div className="sample-images">
                  {pdfData?.washDetails?.[0]?.newDetails
                    ?.filter((detail) => detail.pic?.imageUrl)
                    ?.map((detail, index) => (
                      <img
                        key={index}
                        src={detail?.pic?.imageUrl}
                        alt={`Wash Sample ${index + 1}`}
                      />
                    ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Color Details</h3>
        <div className="color-details">
          {pdfData?.itemDetails?.map((item, index) => (
            <div key={index} className="color-item">
              <div className="color-info">
                <h4>{item?.color_Id?.name || `Color ${index + 1}`}</h4>
                {item?.color_Id?.pantone && <p>{item.color_Id.pantone}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Sample Requests</h3>
        <table className="sample-requests-table">
          <thead>
            <tr>
              <th>Style #</th>
              <th>Size / R码</th>
              <th>Quantity</th>
              <th>Sample Type / 样板类型</th>
              <th>Due Date / 完成日期</th>
              <th>Comments / 备注</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pdfData?.sampleRequests?.map((request, index) => (
              <tr key={index}>
                <td>
                  {request?.styleNumbers
                    ? request.styleNumbers.join(" & ")
                    : request?.styleNumber || "N/A"}
                </td>
                <td>{request?.size || "N/A"}</td>
                <td>{request?.quantity || "N/A"}</td>
                <td>{request?.sampleType || "N/A"}</td>
                <td>{request?.dueDate || "N/A"}</td>
                <td>{request?.comments || ""}</td>
                <td>{request?.status || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Sample Specs</h3>
        <table className="sample-specs-table">
          <thead>
            <tr>
              <th>Sample Status</th>
              <th></th>
              <th></th>
              <th>Design</th>
              <th>Initial</th>
              <th>1st PP</th>
              <th>diff +/-</th>
              <th>Rev1</th>
              <th>2nd PP</th>
              <th>diff +/-</th>
              <th>Rev2</th>
              <th>3rd PP</th>
              <th>diff +/-</th>
              <th>Final</th>
              <th>Ship.</th>
              <th>diff +/-</th>
            </tr>
            <tr>
              <th>Code</th>
              <th>Point of Measure Description</th>
              <th>Tol (+/-)</th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pdfData?.copiedSampleGradedSpecs[0]?.copiedPOMs?.map(
              (spec, index) => (
                <tr key={index}>
                  <td>{spec?.code || "N/A"}</td>
                  <td>{spec?.description || "N/A"}</td>
                  <td>{spec?.tolerance || "N/A"}</td>
                  <td>{spec?.design || "N/A"}</td>
                  <td>{spec?.Initial || "N/A"}</td>
                  <td>{spec?.FirstPP || "N/A"}</td>
                  <td></td>
                  <td>{spec?.Rev1 || "N/A"}</td>
                  <td>{spec?.SecondPP || "N/A"}</td>
                  <td></td>
                  <td>{spec?.Rev2 || "N/A"}</td>
                  <td>{spec?.ThirdPP || "N/A"}</td>
                  <td></td>
                  <td>{spec?.Final || "N/A"}</td>
                  <td>{spec?.Ship || "N/A"}</td>
                  <td></td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkOrderPDF;
