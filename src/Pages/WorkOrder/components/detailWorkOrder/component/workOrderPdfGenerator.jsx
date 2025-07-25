import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateWorkOrderPDF = async (pdfData) => {
  try {
    // Validate input data
    if (!pdfData) {
      console.error("[PDF Generation] Error: pdfData is null or undefined");
      return null;
    }

    if (!pdfData.WorkOrder || !pdfData.sampleSpecs?.[0]) {
      console.error("[PDF Generation] Error: Required data missing", {
        hasWorkOrder: !!pdfData.WorkOrder,
        hasSampleSpecs: !!pdfData.sampleSpecs?.[0]
      });
      return null;
    }

    console.log("[PDF Generation] Starting PDF creation with data:", pdfData);

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
      doc.text(`Page ${pageNumber}`, 190, 10, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    // ========== PAGE 1: Header and Work Order Details ==========
    addHeader(1);

    // Top table - with error handling for each field
    const topTableData = [
      [
        pdfData?.WorkOrder?.createdAt || "N/A",
        pdfData?.fabricName || "N/A",
        pdfData?.sampleSpecs[0]?.size_range || "N/A",
        pdfData?.WorkOrder?.vendor?.name || "N/A",
        pdfData?.sampleSpecs[0]?.size || "N/A",
        pdfData?.sampleSpecs[0]?.fabric_content || "N/A",
        pdfData?.sampleSpecs[0]?.customer_or_brand || "N/A",
        pdfData?.description || "N/A",
        pdfData?.sampleSpecs[0]?.garment_specs_details || "N/A",
      ],
    ];

    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Work Order Details table
    doc.setFontSize(8);
    doc.text("Work Order Details", 14, 50);
    
    const workOrderTableData = [
      [
        pdfData?.WorkOrder?.createdAt || "N/A",
        pdfData?.WorkOrder?.workOrderId || "N/A",
        pdfData?.WorkOrder?.category?.name || "N/A",
        pdfData?.WorkOrder?.itemType?.name || "N/A",
        pdfData?.WorkOrder?.subCategory?.name || "N/A",
        pdfData?.WorkOrder?.shippingStatus || "N/A",
        pdfData?.WorkOrder?.sampleStatus || "N/A",
      ],
    ];

    autoTable(doc, {
      startY: 55,
      head: [
        [
          "Created date",
          "Order #",
          "Category",
          "Item Type",
          "Subcategory",
          "Shipping Status",
          "Sample Status",
        ],
      ],
      body: workOrderTableData,
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
    });

    // ETD Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      head: [["Date Created", "ETD / 预期交付日期"]],
      body: [[pdfData?.WorkOrder?.createdAt || "N/A", pdfData?.WorkOrder?.etd || "N/A"]],
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
    });

    // Trim Images Section with Error Handling
    const trimImages = pdfData?.WorkOrder?.trimImages?.[0]?.image;
    if (trimImages?.length) {
      doc.text("Trim Images:", 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Trim", "Style", "Bottom Rivets", "Trim"]],
        body: [["", "", "", ""]], // Empty cells to be filled with images
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index < trimImages.length) {
            try {
              doc.addImage(
                trimImages[data.column.index],
                "JPEG",
                data.cell.x + 2,
                data.cell.y + 2,
                data.cell.width - 4,
                data.cell.height - 4
              );
            } catch (error) {
              console.error("Error adding trim image:", error);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
              doc.text("Image Error", data.cell.x + 5, data.cell.y + 10);
            }
          }
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
        },
        styles: {
          minCellHeight: 20,
        },
      });
    }

    doc.text(`PW2025 SOI MISSY KNITS TIMES`, 14, doc.lastAutoTable.finalY + 5);

    // ========== PAGE 2: Item Details ==========
    doc.addPage();
    addHeader(2);

    // Repeat top table (same as page 1)
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Item Details Table with Error Handling
    if (pdfData?.itemDetails?.length) {
      doc.setFontSize(8);
      doc.text("Item Details", 14, 45);
      
      const itemDetailsBody = pdfData.itemDetails.map((item) => [
        item?.style_number || "N/A",
        item?.size || "N/A",
        item?.size_scale || "N/A",
        item?.quantity || "N/A",
        item?.comments
          ? `${item?.color_Id?.name || ""}; ${item?.comments}`
          : item?.color_Id?.name || "N/A",
        item?.individual_poly_bag === true ? "individual poly bag" : "N/A",
      ]);

      autoTable(doc, {
        startY: 50,
        head: [
          [
            "Style #",
            "Size / R码",
            "Size Scale / R码",
            "Quantity",
            "Comments / Alterations",
            "Special Handling / 特别处理",
          ],
        ],
        body: itemDetailsBody,
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 1.5,
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 15 },
          2: { cellWidth: 15 },
          3: { cellWidth: 40 },
          4: { cellWidth: 15 },
          5: { cellWidth: 30 },
        },
        styles: {
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
        },
      });
    }

    // Style Details table
    if (pdfData?.styleDetails?.[0]) {
      doc.setFontSize(8);
      doc.text("Style Details", 14, doc.lastAutoTable.finalY + 10);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Descriptions", "Fabric", "Sewing Thread Color", "Summary"]],
        body: [
          [
            pdfData?.styleDetails[0]?.description || "N/A",
            pdfData?.styleDetails[0]?.fabric || "N/A",
            pdfData?.styleDetails[0]?.sewingThreadColor || "N/A",
            pdfData?.styleDetails[0]?.summary || "N/A",
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
      });

      // Add style sample pictures if available
      const styleImages = pdfData?.styleDetails?.[0]?.newDetails?.filter(d => d.pic?.imageUrl);
      if (styleImages?.length) {
        doc.text("Sample Pictures:", 14, doc.lastAutoTable.finalY + 10);
        
        const styleImageWidth = 80;
        const styleImageHeight = 60;
        const styleImageY = doc.lastAutoTable.finalY + 15;
        
        styleImages.forEach((detail, index) => {
          const x = 14 + index * (styleImageWidth + 5);
          if (x + styleImageWidth < 200) {
            try {
              doc.addImage(
                detail.pic.imageUrl,
                detail.pic.imageUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG',
                x,
                styleImageY,
                styleImageWidth,
                styleImageHeight
              );
            } catch (error) {
              console.error("Error adding style image:", error);
              doc.rect(x, styleImageY, styleImageWidth, styleImageHeight);
              doc.text("Image Error", x + 30, styleImageY + 30);
            }
          }
        });
      }
    }

    // ========== PAGE 3: Construction Details (Front & Back View) ==========
    doc.addPage();
    addHeader(3);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Front & Back View section
    const frontView = pdfData?.styleDetails?.[0]?.newDetails?.[0]?.pic;
    const backView = pdfData?.styleDetails?.[0]?.newDetails?.[1]?.pic;
    
    if (frontView || backView) {
      doc.setFontSize(8);
      doc.text("Construction Details", 14, 50);
      
      const imageWidth = 85;
      const imageHeight = 60;
      const imageY = 55;
      
      if (frontView?.imageUrl) {
        try {
          doc.addImage(
            frontView.imageUrl,
            frontView.imageUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG',
            14,
            imageY,
            imageWidth,
            imageHeight
          );
          doc.text(frontView.imageName || "Front View", 14, imageY + imageHeight + 5);
        } catch (error) {
          console.error("Error adding front view image:", error);
          doc.rect(14, imageY, imageWidth, imageHeight);
          doc.text("Front View Image Error", 14 + 30, imageY + 30);
        }
      }
      
      if (backView?.imageUrl) {
        try {
          doc.addImage(
            backView.imageUrl,
            backView.imageUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG',
            110,
            imageY,
            imageWidth,
            imageHeight
          );
          doc.text(backView.imageName || "Back View", 110, imageY + imageHeight + 5);
        } catch (error) {
          console.error("Error adding back view image:", error);
          doc.rect(110, imageY, imageWidth, imageHeight);
          doc.text("Back View Image Error", 110 + 30, imageY + 30);
        }
      }
      
      if (pdfData?.styleDetails?.[0]?.newDetails?.[1]?.detail_category) {
        doc.text(
          `Comments: ${pdfData.styleDetails[0].newDetails[1]?.detail_category}`,
          14,
          imageY + imageHeight + 15
        );
      }
    }

    // ========== PAGE 4: Construction Details Continued ==========
    doc.addPage();
    addHeader(4);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Additional construction details can be added here
    // For example, waistband and hem sections if data is available
    // This is a placeholder for additional construction details
    doc.setFontSize(8);
    doc.text("Additional Construction Details", 14, 50);
    doc.text("(Details would be added here based on available data)", 14, 60);

    // ========== PAGE 5: Waistband Construction and Front Pockets ==========
    doc.addPage();
    addHeader(5);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Placeholder for waistband and front pockets details
    doc.setFontSize(8);
    doc.text("Waistband Construction Details", 14, 50);
    doc.text("Front Pockets Details", 14, 100);

    // ========== PAGE 6: Wash Details ==========
    doc.addPage();
    addHeader(6);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Wash Details
    if (pdfData?.washDetails?.[0]) {
      doc.setFontSize(8);
      doc.text("Wash Details", 14, 50);
      
      // Get dynamic attributes
      const dynamicAttributes = pdfData.washDetails[0]?.dynamicAttributes || {};
      const dynamicRows = Object.entries(dynamicAttributes).map(([key, value]) => [key, value]);

      if (dynamicRows.length > 0) {
        autoTable(doc, {
          startY: 55,
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
        });
      }

      // Add wash sample pictures if available
      const washImages = pdfData.washDetails[0]?.newDetails
        ?.filter(detail => detail.pic?.imageUrl)
        .map(detail => detail.pic.imageUrl) || [];

      if (washImages.length > 0) {
        doc.text("Wash Sample Pictures:", 14, doc.lastAutoTable.finalY + 10);
        
        const washImageWidth = 80;
        const washImageHeight = 60;
        const washImageY = doc.lastAutoTable.finalY + 15;

        washImages.forEach((imageUrl, index) => {
          const x = 14 + index * (washImageWidth + 5);
          if (x + washImageWidth < 200) {
            try {
              doc.addImage(
                imageUrl,
                imageUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG',
                x,
                washImageY,
                washImageWidth,
                washImageHeight,
                undefined,
                'FAST'
              );
            } catch (error) {
              console.error("Error adding wash image:", error);
              doc.rect(x, washImageY, washImageWidth, washImageHeight);
              doc.text("Image Error", x + 30, washImageY + 30);
            }
          }
        });
      }
    }

    // ========== PAGE 7: Color Details ==========
    doc.addPage();
    addHeader(7);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Color Details section
    doc.setFontSize(8);
    doc.text("Color Details:", 14, 50);

    // Placeholder for color details - you would add your actual color details here
    // For example:
    // pdfData?.colorDetails?.forEach((color, index) => {
    //   const yPos = 55 + index * 15;
    //   doc.text(`${color.name}: ${color.pantone || ''}`, 14, yPos);
    //   if (color.image) {
    //     doc.addImage(color.image, "JPEG", 60, yPos - 5, 15, 15);
    //   }
    // });

    // ========== PAGE 8: Sample Requests ==========
    doc.addPage();
    addHeader(8);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
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
      margin: { top: 15 },
    });

    // Sample Requests
    if (pdfData?.sampleRequests?.length) {
      doc.setFontSize(8);
      doc.text("Sample Requests / 样板需求", 14, 50);
      
      const sampleRequestsBody = pdfData.sampleRequests.map((request) => [
        request.styleNumbers ? request.styleNumbers.join(" & ") : request.styleNumber || "N/A",
        request.size || "N/A",
        request.quantity || "N/A",
        request.sampleType || "N/A",
        request.dueDate || "N/A",
        request.comments || "",
        request.status || "N/A",
      ]);

      autoTable(doc, {
        startY: 55,
        head: [
          [
            "Style #",
            "Size / R码",
            "Quantity",
            "Sample Type / 样板类型",
            "Due Date / 完成日期",
            "Comments / 备注",
            "Status",
          ],
        ],
        body: sampleRequestsBody,
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
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 15 },
          2: { cellWidth: 15 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 40 },
          6: { cellWidth: 15 },
        },
      });
    }

    // ========== PAGE 9: Sample Specs ==========
    doc.addPage();
    addHeader(9);

    // Repeat top table
    autoTable(doc, {
      startY: 15,
      head: [
        [
          "Date",
          "Fabric Name",
          "Size Range",
          "Vendor",
          "Sample Size",
          "Fabric content",
          "Customer / Brand",
          "Description",
          "Garment Specs details",
        ],
      ],
      body: topTableData,
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { top: 15 },
    });

    // Sample Specs
    if (pdfData?.copiedSampleGradedSpecs?.[0]?.copiedPOMs?.length) {
      doc.setFontSize(7);
      doc.text("Sample Specs", 14, 50);
      
      autoTable(doc, {
        startY: 55,
        head: [
          [
            "Code",
            "Point of Measure Description",
            "Tol (+/-)",
            "Design",
            "Initial",
            "1st PP",
            "diff +/-",
            "Rev1",
            "2nd PP",
            "diff +/-",
            "Rev2",
            "3rd PP",
            "diff +/-",
            "Final",
            "Ship.",
            "diff +/-",
          ],
        ],
        body: pdfData.copiedSampleGradedSpecs[0].copiedPOMs.map((spec) => [
          spec?.code || "N/A",
          spec?.description || "N/A",
          spec?.tolerance || "N/A",
          spec?.design || "N/A",
          spec?.Initial || "N/A",
          spec?.FirstPP || "N/A",
          "",
          spec?.Rev1 || "N/A",
          spec?.SecondPP || "N/A",
          "",
          spec?.Rev2 || "N/A",
          spec?.ThirdPP || "N/A",
          "",
          spec?.Final || "N/A",
          spec?.Ship || "N/A",
          "",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 6,
        },
        bodyStyles: {
          fontSize: 6,
        },
        margin: { left: 5, right: 5 },
        tableWidth: "wrap",
      });
    }

    // Save the PDF
    // const fileName = `ELITEJEANS - ${pdfData?.WorkOrder?.workOrderId || "workorder"}.pdf`;
    // doc.save(fileName);

    console.log("[PDF Generation] PDF created successfully");
    return doc.output('blob');
  } catch (error) {
    console.error("[PDF Generation] Error creating PDF:", error);
    return null;
  }
};