import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CORS_PROXY = "https://corsproxy.io/?";

export const DownloadTechpackFilegenerate = async (pdfData) => {
  try {
    if (!pdfData) {
      console.error("[PDF Generation] Error: pdfData is null or undefined");
      return null;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set default font
    doc.setFont("helvetica");
    doc.setFontSize(10);

    // Header function
    const addHeader = (pageNumber) => {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Today's Apparel Inc - Tech Pack #${pdfData?.techPack?.techPackId}`,
        14,
        10
      );
      doc.text(`Page ${pageNumber}`, 190, 10, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    // Common Top Table
    const topTableData = [
      [
        pdfData?.techPack?.lastUpdated || "N/A",
        pdfData?.sampleSpecs[0]?.size_range || "N/A",
        pdfData?.techPack?.vendor?.name || "N/A",
        pdfData?.sampleSpecs[0]?.size || "N/A",
        pdfData?.sampleSpecs[0]?.fabric_content || "N/A",
        pdfData?.sampleSpecs[0]?.customer_or_brand || "N/A",
        pdfData?.description || "N/A",
        pdfData?.sampleSpecs[0]?.garment_specs_details || "N/A",
      ],
    ];

    const addTopTable = (startY = 15) => {
      autoTable(doc, {
        startY,
        head: [
          [
            "Date",
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
        bodyStyles: { fontSize: 9 },
        margin: { top: 15 },
      });
    };

    // Image loading utility
    const loadImage = async (url) => {
      if (!url) return null;
      try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Image load error:", error);
        return null;
      }
    };

    // Image section with pagination
    const addImagesWithPagination = async (
      images,
      title,
      pageNumber,
      startY
    ) => {
      const imgWidth = 80;
      const imgHeight = 60;
      const imagesPerRow = 2;
      const horizontalGap = 15;
      const verticalGap = 20;
      const maxImagesPerPage = 4;

      let currentPage = pageNumber;
      let currentY = startY;
      let imagesAdded = 0;
      const pageHeight = doc.internal.pageSize.height;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`${title}:`, 14, currentY);
      currentY += 7;
      doc.setFont("helvetica", "normal");

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const row = Math.floor(imagesAdded / imagesPerRow);
        const col = imagesAdded % imagesPerRow;

        const x = 14 + col * (imgWidth + horizontalGap);
        const y = currentY + row * (imgHeight + verticalGap);

        // Page break check
        if (
          y + imgHeight + 30 > pageHeight ||
          imagesAdded % maxImagesPerPage === 0
        ) {
          doc.addPage();
          currentPage++;
          addHeader(currentPage);
          addTopTable(15);
          currentY = 50;
          imagesAdded = 0;

          doc.setFont("helvetica", "bold");
          doc.text(`${title} (continued):`, 14, currentY);
          currentY += 7;
          doc.setFont("helvetica", "normal");
        }

        try {
          const imageData = await loadImage(image.url);
          doc.setDrawColor(200, 200, 200);
          doc.rect(x, y, imgWidth, imgHeight);

          if (imageData) {
            doc.addImage(
              imageData,
              "JPEG",
              x + 1,
              y + 1,
              imgWidth - 2,
              imgHeight - 2
            );
          }

          if (image.caption) {
            doc.setFontSize(8);
            const captionLines = doc.splitTextToSize(
              image.caption,
              imgWidth - 5
            );
            doc.text(captionLines, x + imgWidth / 2, y + imgHeight + 10, {
              align: "center",
              maxWidth: imgWidth - 5,
            });
          }
        } catch (error) {
          doc.setDrawColor(200, 0, 0);
          doc.rect(x, y, imgWidth, imgHeight);
          doc.setFontSize(8);
          doc.setTextColor(200, 0, 0);
          doc.text("Image Error", x + imgWidth / 2, y + imgHeight / 2, {
            align: "center",
          });
        }
        imagesAdded++;
      }
      return currentPage;
    };

    // ========== Page 1 Content ==========
    addHeader(1);
    addTopTable();

    // Tech Pack Details Table
    autoTable(doc, {
      startY: 55,
      head: [
        [
          "Name",
          "Vendor",
          "Category",
          "Item Type",
          "Subcategory",
          "Date Created",
          "Sample Status",
          "Description",
        ],
      ],
      body: [
        [
          pdfData?.techPack?.techPackId || "N/A",
          pdfData?.techPack?.vendor?.name || "N/A",
          pdfData?.techPack?.category?.name || "N/A",
          pdfData?.techPack?.itemType?.name || "N/A",
          pdfData?.techPack?.subCategory?.name || "N/A",
          pdfData?.sampleSpecs[0]?.createdAt || "N/A",
          pdfData?.sampleSpecs[0]?.garment_specs_details || "N/A",
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
    });

    // Product Images Section
    const imagesStartY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Product Images", 14, imagesStartY);

    const imageData = {
      main: pdfData?.techPack?.pictures?.[0]?.imageUrl,
      label: pdfData?.techPack?.labelTrim?.previewImage,
      rivet: pdfData?.techPack?.rivetImages?.[0]?.image?.imageUrl,
      button: pdfData?.techPack?.buttonImages?.[0]?.image?.imageUrl,
    };

    const addProductImage = async (url, x, y, label) => {
      try {
        const data = await loadImage(url);
        if (data) {
          doc.addImage(data, "JPEG", x, y, 40, 40);
        }
        doc.setFontSize(8);
        doc.text(label, x, y + 45);
      } catch {
        doc.setFontSize(8);
        doc.text(`${label} Missing`, x, y + 45);
      }
    };

    await Promise.all([
      addProductImage(imageData.main, 15, imagesStartY + 5, "Main Picture"),
      addProductImage(imageData.label, 70, imagesStartY + 5, "Label/Trim"),
      addProductImage(imageData.rivet, 15, imagesStartY + 60, "Rivet"),
      addProductImage(imageData.button, 70, imagesStartY + 60, "Button"),
    ]);

    // ========== Additional Pages ==========
    let currentPage = 2;

    // Style Details Page
    if (pdfData?.styleDetails?.length) {
      doc.addPage();
      addHeader(currentPage);
      addTopTable();

      const styleDetail = pdfData.styleDetails[0];
      autoTable(doc, {
        startY: 50,
        head: [
          ["Fabric", "Stitching Thickness", "Sewing Thread Color", "Summary"],
        ],
        body: [
          [
            styleDetail?.fabric || "N/A",
            styleDetail?.stitchingThickness || "N/A",
            styleDetail?.sewingThreadColor || "N/A",
            styleDetail?.summary || "N/A",
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
      });

      const styleImages =
        styleDetail?.newDetails?.map((detail) => ({
          url: detail?.pic?.imageUrl,
          caption: detail?.detail_category || "",
        })) || [];

      if (styleImages.length > 0) {
        currentPage = await addImagesWithPagination(
          styleImages,
          "Style Images",
          currentPage,
          doc.lastAutoTable.finalY + 10
        );
      }
    }

    // Wash Details Page
    if (pdfData?.washDetails?.[0]) {
      doc.addPage();
      addHeader(++currentPage);
      addTopTable();

      const washDetail = pdfData.washDetails[0];
      const dynamicAttributes = Object.entries(
        washDetail.dynamicAttributes || {}
      );

      autoTable(doc, {
        startY: 50,
        head: [["Attribute", "Value"]],
        body: dynamicAttributes,
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
      });

      const washImages =
        washDetail?.newDetails?.map((detail) => ({
          url: detail?.pic?.imageUrl,
          caption: detail?.detail_category || "",
        })) || [];

      if (washImages.length > 0) {
        currentPage = await addImagesWithPagination(
          washImages,
          "Wash Images",
          currentPage,
          doc.lastAutoTable.finalY + 10
        );
      }
    }

    // Sample Requests Page
    if (pdfData?.sampleRequests?.length) {
      doc.addPage();
      addHeader(++currentPage);
      addTopTable();

      autoTable(doc, {
        startY: 50,
        head: [
          ["Style #", "Size", "Quantity", "Sample Type", "Due Date", "Status"],
        ],
        body: pdfData.sampleRequests.map((req) => [
          req.styleNumber || "N/A",
          req.size || "N/A",
          req.quantity || "N/A",
          req.sampleType || "N/A",
          req.dueDate || "N/A",
          req.status || "N/A",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
      });
    }

    // Final Save
    const fileName = `TechPack-${
      pdfData?.techPack?.techPackId || Date.now()
    }.pdf`;
    doc.save(fileName);
    return doc.output("blob");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return null;
  }
};
