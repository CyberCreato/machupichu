import { RequestHandler } from "express";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import moment from "moment";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock form submissions data (in real app, this would come from database)
import { formSubmissions } from "./forms";

export const handleGenerateFormPDF: RequestHandler = async (req, res) => {
  try {
    const { submissionId } = req.params;
    console.log("PDF Generation - Requested submissionId:", submissionId);
    console.log(
      "PDF Generation - Available submissions:",
      formSubmissions.length,
    );
    console.log(
      "PDF Generation - Available submission IDs:",
      formSubmissions.map((s) => s.id),
    );

    if (!submissionId) {
      console.error("PDF Generation - Missing submissionId");
      return res.status(400).json({ error: "Submission ID is required" });
    }

    // Find the form submission
    const submission = formSubmissions.find((sub) => sub.id === submissionId);

    if (!submission) {
      console.error(
        "PDF Generation - Submission not found for ID:",
        submissionId,
      );
      return res.status(404).json({ error: "Form submission not found" });
    }

    console.log("PDF Generation - Found submission:", {
      id: submission.id,
      formId: submission.formId,
      submittedBy: submission.submittedBy,
      dataKeys: Object.keys(submission.data || {}),
    });

    // Handle different form types
    let pdfBytes: Uint8Array;

    console.log(
      "PDF Generation - Attempting to generate PDF for form type:",
      submission.formId,
    );

    switch (submission.formId) {
      case "form-absa-certificate":
        console.log("PDF Generation - Generating ABSA PDF");
        pdfBytes = await generateABSAPDF(submission);
        break;
      case "form-clearance-certificate":
        console.log("PDF Generation - Generating Clearance PDF");
        pdfBytes = await generateClearancePDF(submission);
        break;
      case "form-sahl-certificate":
        console.log("PDF Generation - Generating SAHL PDF");
        pdfBytes = await generateSAHLPDF(submission);
        break;
      case "form-discovery-geyser":
        console.log("PDF Generation - Generating Discovery PDF");
        pdfBytes = await generateDiscoveryPDF(submission);
        break;
      case "form-liability-certificate":
        console.log("PDF Generation - Generating Liability PDF");
        pdfBytes = await generateLiabilityPDF(submission);
        break;
      default:
        console.error(
          "PDF Generation - Unsupported form type:",
          submission.formId,
        );
        return res
          .status(400)
          .json({ error: "PDF generation not supported for this form type" });
    }

    console.log(
      "PDF Generation - Successfully generated PDF, size:",
      pdfBytes.length,
      "bytes",
    );

    // Set response headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${submission.formId}-submission-${submission.submissionNumber}.pdf`,
    });

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

async function generateABSAPDF(submission: any): Promise<Uint8Array> {
  const data = submission.data;
  const inputPath = path.join(
    __dirname,
    "../../public/forms/ABSACertificate.pdf",
  );

  let pdfDoc: PDFDocument;
  let useTemplate = false;

  try {
    const templateBuffer = await fs.readFile(inputPath);
    pdfDoc = await PDFDocument.load(templateBuffer);
    useTemplate = true;
  } catch (error) {
    console.warn("ABSA PDF template not found, creating basic PDF:", error);
    pdfDoc = await PDFDocument.create();
  }

  if (useTemplate) {
    try {
      const form = pdfDoc.getForm();

      // Fill form fields
      form.getTextField("CSA Ref").setText(data["field-csa-ref"] || "");
      form
        .getTextField("Full name of Insured")
        .setText(data["field-full-name"] || "");
      form.getTextField("Claim no").setText(data["field-claim-number"] || "");
      form
        .getTextField("Property address")
        .setText(data["field-property-address"] || "");
      form
        .getTextField("Cause of damage")
        .setText(data["field-cause-damage"] || "");
      form
        .getTextField("IWe confirm that the work undertaken by")
        .setText(data["field-staff-name-absa"] || "");

      // Handle radio button for excess paid
      if (data["field-excess-paid-absa"]?.toLowerCase() === "yes") {
        form.getRadioGroup("Group1").select("Choice1");
      } else {
        form.getRadioGroup("Group1").select("Choice2");
      }

      // Add date
      form.getTextField("Text2").setText(moment().format("Do,MM"));

      // Handle signature if present - check multiple possible signature field names
      const signatureData =
        data["signature"] ||
        data["field-signature"] ||
        data["field-signature-absa"];
      if (signatureData) {
        try {
          console.log(
            "Processing signature for ABSA PDF:",
            signatureData.substring(0, 50) + "...",
          );

          // Handle both data URLs and direct image URLs
          let imageBytes;
          if (signatureData.startsWith("data:image/")) {
            // Data URL - extract base64 data
            const base64Data = signatureData.split(",")[1];
            imageBytes = Uint8Array.from(atob(base64Data), (c) =>
              c.charCodeAt(0),
            );
          } else {
            // Regular URL - fetch the image
            const response = await fetch(signatureData);
            imageBytes = new Uint8Array(await response.arrayBuffer());
          }

          const pngImage = await pdfDoc.embedPng(imageBytes);

          // Calculate appropriate size for signature (fit in designated area)
          const maxWidth = 150;
          const maxHeight = 60;
          const imageWidth = pngImage.width;
          const imageHeight = pngImage.height;

          let scaleX = maxWidth / imageWidth;
          let scaleY = maxHeight / imageHeight;
          let scale = Math.min(scaleX, scaleY, 0.5); // Cap at 0.5 to avoid oversizing

          const finalWidth = imageWidth * scale;
          const finalHeight = imageHeight * scale;
          const firstPage = pdfDoc.getPages()[0];

          // Better positioning for signature in designated signature area
          firstPage.drawImage(pngImage, {
            x: 400, // Position in signature area
            y: 100,
            width: finalWidth,
            height: finalHeight,
            opacity: 1.0, // Ensure full opacity for black signature
          });

          console.log("Successfully added signature to ABSA PDF");
        } catch (signatureError) {
          console.error("Could not add signature to ABSA PDF:", signatureError);
        }
      } else {
        console.log("No signature found in ABSA form data");
      }

      // Handle checkboxes (1-13)
      for (let i = 1; i <= 13; i++) {
        const val = parseInt(data[`field-checkbox${i}`], 10);
        if (val > 0) {
          const checkboxId = `Check Box3.${i + 1}.${val - 1}`;
          try {
            form.getCheckBox(checkboxId).check();
          } catch (checkboxError) {
            console.warn(`Checkbox ${checkboxId} not found`);
          }
        }
      }

      form.flatten();
    } catch (templateError) {
      console.warn(
        "Error filling template, creating basic PDF:",
        templateError,
      );
      useTemplate = false;
    }
  }

  if (!useTemplate) {
    // Create a basic PDF with form data
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("ABSA Certificate", {
      x: 50,
      y: 750,
      size: 20,
    });

    let yPosition = 700;
    const formFields = [
      { label: "CSA Ref", value: data["field-csa-ref"] },
      { label: "Full Name of Insured", value: data["field-full-name"] },
      { label: "Claim Number", value: data["field-claim-number"] },
      { label: "Property Address", value: data["field-property-address"] },
      { label: "Cause of Damage", value: data["field-cause-damage"] },
      { label: "Staff Name", value: data["field-staff-name-absa"] },
      { label: "Excess Paid", value: data["field-excess-paid-absa"] },
      { label: "Date", value: moment().format("Do,MM") },
    ];

    formFields.forEach(({ label, value }) => {
      if (value && yPosition > 50) {
        page.drawText(`${label}: ${value}`, {
          x: 50,
          y: yPosition,
          size: 12,
        });
        yPosition -= 25;
      }
    });
  }
  return await pdfDoc.save();
}

async function generateClearancePDF(submission: any): Promise<Uint8Array> {
  const data = submission.data;
  const inputPath = path.join(
    __dirname,
    "../../public/forms/BBPClearanceCertificate.pdf",
  );

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Fill text fields
  form.getTextField("CName").setText(data["field-cname"] || "");
  form.getTextField("CRef").setText(data["field-cref"] || "");
  form.getTextField("CAddress").setText(data["field-caddress"] || "");
  form.getTextField("CDamage").setText(data["field-cdamage"] || "");
  form.getTextField("GComments").setText(data["field-gcomments"] || "");
  form.getTextField("ScopeWork").setText(data["field-scopework"] || "");
  form
    .getTextField("OLDGEYSER")
    .setText(
      data["field-oldgeyser"] === "Other"
        ? data["field-oldgeyser-details"] || ""
        : data["field-oldgeyser"] || "",
    );
  form
    .getTextField("NEWGEYSER")
    .setText(
      data["field-newgeyser"] === "Other"
        ? data["field-newgeyser-details"] || ""
        : data["field-newgeyser"] || "",
    );
  form.getTextField("Staff").setText(data["field-staff"] || "");
  form.getTextField("Date_UAAD").setText(moment().format("MMMM Do, YYYY"));

  // Quality Yes/No logic
  const yesNoFields = [
    { field: "field-cquality1", yes: "CQuality1yes", no: "CQuality1" },
    { field: "field-cquality2", yes: "CQuality2yes", no: "CQuality2No" },
    { field: "field-cquality3", yes: "CQuality3Yes", no: "CQuality3No" },
    { field: "field-cquality4", yes: "CQuality4Yes", no: "CQuality4No" },
    { field: "field-cquality5", yes: "CQuality5Yes", no: "CQuality5No" },
  ];

  yesNoFields.forEach(({ field, yes, no }) => {
    const val = (data[field] || "").toLowerCase();
    if (val === "yes") form.getTextField(yes).setText("X");
    else if (val === "no") form.getTextField(no).setText("X");
  });

  // Workmanship rating (1–10)
  const rating = parseInt(data["field-cquality6"], 10);
  if (!isNaN(rating) && rating >= 1 && rating <= 10) {
    form.getTextField(`CQuality6=${rating}`).setText("X");
  }

  // Excess Paid: Yes/No + Amount
  const excess = (data["field-excess"] || "").toLowerCase();
  if (excess === "yes") {
    form.getTextField("Excess=Yes").setText("X");
  } else if (excess === "no") {
    form.getTextField("Excess=No").setText("X");
  }

  if (data["field-amount"]) {
    form.getTextField("Excess").setText(data["field-amount"]);
  }

  // Signature handling - check multiple possible signature field names
  const signatureData =
    data["signature"] ||
    data["field-signature"] ||
    data["field-signature-clearance"];
  if (signatureData) {
    try {
      console.log(
        "Processing signature for Clearance PDF:",
        signatureData.substring(0, 50) + "...",
      );

      let imageBytes;
      if (signatureData.startsWith("data:image/")) {
        const base64Data = signatureData.split(",")[1];
        imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      } else {
        const response = await fetch(signatureData);
        imageBytes = new Uint8Array(await response.arrayBuffer());
      }

      const sigImg = await pdfDoc.embedPng(imageBytes);

      // Calculate appropriate size for signature
      const maxWidth = 150;
      const maxHeight = 60;
      const imageWidth = sigImg.width;
      const imageHeight = sigImg.height;

      let scaleX = maxWidth / imageWidth;
      let scaleY = maxHeight / imageHeight;
      let scale = Math.min(scaleX, scaleY, 0.5);

      const finalWidth = imageWidth * scale;
      const finalHeight = imageHeight * scale;
      const page = pdfDoc.getPages()[0];

      // Better positioning for signature
      page.drawImage(sigImg, {
        x: 400,
        y: 150,
        width: finalWidth,
        height: finalHeight,
        opacity: 1.0,
      });

      console.log("Successfully added signature to Clearance PDF");
    } catch (signatureError) {
      console.error(
        "Could not add signature to clearance PDF:",
        signatureError,
      );
    }
  } else {
    console.log("No signature found in Clearance form data");
  }

  form.flatten();
  return await pdfDoc.save();
}

async function generateSAHLPDF(submission: any): Promise<Uint8Array> {
  const data = submission.data;
  const inputPath = path.join(__dirname, "../../public/forms/sahlld.pdf");

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Fill basic text fields
  form.getTextField("ClientName_ZIUG").setText(data["field-clientname"] || "");
  form.getTextField("ClientRef").setText(data["field-clientref"] || "");
  form.getTextField("ClientAddress").setText(data["field-clientaddress"] || "");
  form.getTextField("ClientDamage").setText(data["field-clientdamage"] || "");
  form.getTextField("StaffName").setText(data["field-staffname"] || "");
  form
    .getTextField("textarea_26kyol")
    .setText(data["field-scopework-general"] || "");
  form.getTextField("Date").setText(moment().format("MMMM Do, YYYY"));

  // Yes/No checkboxes mapped - improved handling
  const yesNoCheckboxes = [
    { field: "field-checkbox1", yes: "CheckBox1-1", no: "CheckBox1-2" },
    { field: "field-checkbox2", yes: "CheckBox2-1", no: "CheckBox2-2" },
    { field: "field-checkbox3", yes: "CheckBox3-1", no: "CheckBox3-2" },
    { field: "field-checkbox4", yes: "CheckBox4-1", no: "CheckBox4-2" },
    { field: "field-checkbox5", yes: "CheckBox5-1", no: "CheckBox5-2" },
    { field: "field-checkbox7", yes: "CheckBox7-1", no: "CheckBox7-2" },
  ];

  yesNoCheckboxes.forEach(({ field, yes, no }) => {
    const val = (data[field] || "").toLowerCase();
    try {
      if (val === "yes" || val === "y") {
        const yesField = form.getFieldMaybe(yes);
        if (yesField) {
          form.getTextField(yes).setText("X");
          console.log(`Set SAHL yes field: ${yes}`);
        } else {
          console.warn(`SAHL yes field not found: ${yes}`);
        }
      } else if (val === "no" || val === "n") {
        const noField = form.getFieldMaybe(no);
        if (noField) {
          form.getTextField(no).setText("X");
          console.log(`Set SAHL no field: ${no}`);
        } else {
          console.warn(`SAHL no field not found: ${no}`);
        }
      }
    } catch (error) {
      console.warn(`Error setting SAHL checkbox for ${field}:`, error);
    }
  });

  // Workmanship rating (1–10)
  const rating = parseInt(data["field-checkbox6"], 10);
  if (!isNaN(rating) && rating >= 1 && rating <= 10) {
    const ratingField = `CheckBox6-${rating}`;
    form.getTextField(ratingField).setText("X");
  }

  // Signature handling - check multiple possible signature field names
  const signatureData =
    data["signature"] ||
    data["field-signature"] ||
    data["field-signature-sahl"];
  if (signatureData) {
    try {
      console.log(
        "Processing signature for SAHL PDF:",
        signatureData.substring(0, 50) + "...",
      );

      let imageBytes;
      if (signatureData.startsWith("data:image/")) {
        const base64Data = signatureData.split(",")[1];
        imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      } else {
        const response = await fetch(signatureData);
        imageBytes = new Uint8Array(await response.arrayBuffer());
      }

      const pngImage = await pdfDoc.embedPng(imageBytes);

      // Calculate appropriate size for signature
      const maxWidth = 150;
      const maxHeight = 60;
      const imageWidth = pngImage.width;
      const imageHeight = pngImage.height;

      let scaleX = maxWidth / imageWidth;
      let scaleY = maxHeight / imageHeight;
      let scale = Math.min(scaleX, scaleY, 0.5);

      const finalWidth = imageWidth * scale;
      const finalHeight = imageHeight * scale;
      const page = pdfDoc.getPages()[0];

      page.drawImage(pngImage, {
        x: 400,
        y: 100,
        width: finalWidth,
        height: finalHeight,
        opacity: 1.0,
      });

      console.log("Successfully added signature to SAHL PDF");
    } catch (signatureError) {
      console.error("Could not add signature to SAHL PDF:", signatureError);
    }
  } else {
    console.log("No signature found in SAHL form data");
  }

  form.flatten();
  return await pdfDoc.save();
}

async function generateDiscoveryPDF(submission: any): Promise<Uint8Array> {
  const data = submission.data;
  const inputPath = path.join(__dirname, "../../public/forms/DiscoveryCS.pdf");

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Map form fields from React input names to PDF field names
  form.getTextField("ClaimNo").setText(data["field-claim-number"] || "");
  form.getTextField("ClientName").setText(data["field-client-name"] || "");
  form
    .getTextField("Date")
    .setText(data["field-date"] || moment().format("MMMM Do, YYYY"));
  form.getTextField("Address").setText(data["field-address"] || "");
  form.getTextField("company").setText(data["field-company-name"] || "");
  form.getTextField("staff").setText(data["field-plumber-name"] || "");
  form
    .getTextField("license number")
    .setText(data["field-license-number"] || "");

  // Action taken — geyser replaced/repair
  if ((data["field-geyser-replaced"] || "").toUpperCase() === "Y") {
    form.getTextField("geyserreplaced_Y").setText("X");
  } else {
    form.getTextField("geyserreplaced_N").setText("X");
  }
  if ((data["field-geyser-repair"] || "").toUpperCase() === "Y") {
    form.getTextField("geyserrepaired_Y").setText("X");
  } else {
    form.getTextField("geyserrepaired_N").setText("X");
  }

  // Old geyser type
  const oldType = data["field-old-geyser-type"]?.toLowerCase();
  form
    .getTextField("ELECTRICgeyser")
    .setText(oldType === "electric" ? "X" : "");
  form.getTextField("SOLARgeyser").setText(oldType === "solar" ? "X" : "");
  form.getTextField("OTHERgeyser").setText(oldType === "other" ? "X" : "");
  form
    .getTextField("OTHERgeyserspecs")
    .setText(data["field-old-geyser-other"] || "");

  // Old size & make - improved handling
  const sizes = ["50", "100", "150", "200", "250", "300", "350"];
  const oldGeyserSize = data["field-old-geyser-size"];
  console.log(`Setting old geyser size: ${oldGeyserSize}`);

  sizes.forEach((s) => {
    const fieldName = `geyserSize${s}`;
    try {
      const field = form.getFieldMaybe(fieldName);
      if (field) {
        const shouldCheck = oldGeyserSize === s || oldGeyserSize === `${s}L`;
        form.getTextField(fieldName).setText(shouldCheck ? "X" : "");
        if (shouldCheck) {
          console.log(`Set old geyser size field: ${fieldName}`);
        }
      } else {
        console.warn(`Old geyser size field not found: ${fieldName}`);
      }
    } catch (error) {
      console.warn(`Error setting old geyser size ${fieldName}:`, error);
    }
  });
  const makeOld = data["field-old-geyser-make"];
  form
    .getTextField("HeatTechgeyser")
    .setText(makeOld === "Heat Tech" ? "X" : "");
  form.getTextField("KwiKotgeyser").setText(makeOld === "Kwikot" ? "X" : "");
  form.getTextField("OtherTypegeyser").setText(makeOld === "Other" ? "X" : "");

  form
    .getTextField("serialgeyser")
    .setText(data["field-old-serial-number"] || "");
  form.getTextField("geysercode").setText(data["field-old-code"] || "");
  form.getTextField("notag").setText(data["field-old-no-tag"] || "");
  form
    .getTextField("wallmountedgeyser")
    .setText(data["field-wall-mounted"] === "Y" ? "X" : "");
  form
    .getTextField("inroofgeyser")
    .setText(data["field-inside-roof"] === "Y" ? "X" : "");
  form
    .getTextField("OtherAreageyser")
    .setText(data["field-other-location"] || "");

  // New geyser type
  const newType = data["field-new-geyser-type"]?.toLowerCase();
  form
    .getTextField("newgeyserELECTRIC")
    .setText(newType === "electric" ? "X" : "");
  form.getTextField("newgeyserSOLAR").setText(newType === "solar" ? "X" : "");
  form.getTextField("newgeyserOTHER").setText(newType === "other" ? "X" : "");
  form
    .getTextField("newgeyserOTHERTEXT")
    .setText(data["field-new-geyser-other"] || "");

  // New size & make - improved handling
  const newGeyserSize = data["field-new-geyser-size"];
  console.log(`Setting new geyser size: ${newGeyserSize}`);

  sizes.forEach((s) => {
    const fieldName = `NEWgeyserSize${s}`;
    try {
      const field = form.getFieldMaybe(fieldName);
      if (field) {
        const shouldCheck = newGeyserSize === s || newGeyserSize === `${s}L`;
        form.getTextField(fieldName).setText(shouldCheck ? "X" : "");
        if (shouldCheck) {
          console.log(`Set new geyser size field: ${fieldName}`);
        }
      } else {
        console.warn(`New geyser size field not found: ${fieldName}`);
      }
    } catch (error) {
      console.warn(`Error setting new geyser size ${fieldName}:`, error);
    }
  });
  const makeNew = data["field-new-geyser-make"];
  form
    .getTextField("newgeyserHEATECH")
    .setText(makeNew === "Heat Tech" ? "X" : "");
  form.getTextField("newgeyserKWIKOT").setText(makeNew === "Kwikot" ? "X" : "");

  form
    .getTextField("NEWserialgeyser")
    .setText(data["field-new-serial-number"] || "");
  form.getTextField("NEWgeysercode").setText(data["field-new-code"] || "");

  // Installed items Y/N/NA - improved handling
  const itemFields = {
    "field-item-geyser": "INSTALLEDgeyser",
    "field-item-drip-tray": "INSTALLEDDrip",
    "field-item-vacuum-breakers": "INSTALLEDVB",
    "field-item-platform": "INSTALLEDPlatform",
    "field-item-bonding": "INSTALLEDBonding",
    "field-item-isolator": "INSTALLEDIsolator",
    "field-item-pressure-valve": "INSTALLEDPCV",
    "field-item-relocated": "INSTALLEDRelocated",
    "field-item-thermostat": "INSTALLEDThermostat",
    "field-item-element": "INSTALLEDElement",
    "field-item-safety-valve": "INSTALLEDSafetyValve",
    "field-item-non-return": "INSTALLEDNonreturn",
  };

  Object.entries(itemFields).forEach(([field, pdfKey]) => {
    const val = (data[field] || "").toUpperCase();
    const suffix =
      val === "Y" || val === "YES"
        ? "YES"
        : val === "N" || val === "NO"
          ? "NO"
          : "NA";
    const targetFieldName = pdfKey + suffix;

    try {
      const targetField = form.getFieldMaybe(targetFieldName);
      if (targetField) {
        form.getTextField(targetFieldName).setText("X");
        console.log(`Set field ${targetFieldName} for ${field} = ${val}`);
      } else {
        console.warn(`Field ${targetFieldName} not found in PDF`);
      }
    } catch (error) {
      console.warn(`Error setting field ${targetFieldName}:`, error);
    }
  });

  // Solar items - improved handling
  const solarFields = {
    "field-solar-vacuum-tubes": "SOLARVacuumTubes",
    "field-solar-flat-panels": "SOLARFlatPanels",
    "field-solar-circulation-pump": "SOLARCirculationPump",
    "field-solar-geyser-wise": "SOLARGeyserWise",
    "field-solar-mixing-valve": "SOLARMixingValve",
    "field-solar-panel-12v": "SOLAR12VPanel",
  };

  Object.entries(solarFields).forEach(([field, pdfKey]) => {
    const val = (data[field] || "").toUpperCase();
    const suffix =
      val === "Y" || val === "YES"
        ? "YES"
        : val === "N" || val === "NO"
          ? "NO"
          : "NA";
    const targetFieldName = pdfKey + suffix;

    try {
      const targetField = form.getFieldMaybe(targetFieldName);
      if (targetField) {
        form.getTextField(targetFieldName).setText("X");
        console.log(`Set solar field ${targetFieldName} for ${field} = ${val}`);
      } else {
        console.warn(`Solar field ${targetFieldName} not found in PDF`);
      }
    } catch (error) {
      console.warn(`Error setting solar field ${targetFieldName}:`, error);
    }
  });

  // Signature handling - check multiple possible signature field names
  const signatureData =
    data["signature"] ||
    data["field-signature"] ||
    data["field-signature-discovery"];
  if (signatureData) {
    try {
      console.log(
        "Processing signature for Discovery PDF:",
        signatureData.substring(0, 50) + "...",
      );

      let imageBytes;
      if (signatureData.startsWith("data:image/")) {
        const base64Data = signatureData.split(",")[1];
        imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      } else {
        const response = await fetch(signatureData);
        imageBytes = new Uint8Array(await response.arrayBuffer());
      }

      const img = await pdfDoc.embedPng(imageBytes);
      const dims = img.scale(0.3);
      const page = pdfDoc.getPages()[0];

      page.drawImage(img, {
        x: 400,
        y: 200,
        width: dims.width,
        height: dims.height,
      });

      console.log("Successfully added signature to Discovery PDF");
    } catch (signatureError) {
      console.error(
        "Could not add signature to discovery PDF:",
        signatureError,
      );
    }
  } else {
    console.log("No signature found in Discovery form data");
  }

  form.flatten();
  return await pdfDoc.save();
}

async function generateLiabilityPDF(submission: any): Promise<Uint8Array> {
  const data = submission.data;
  const inputPath = path.join(__dirname, "../../public/forms/liabWave.pdf");

  const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
  const form = pdfDoc.getForm();

  // Basic info
  form.getTextField("L_Date").setText(moment().format("Do,MM"));
  form
    .getTextField("L_Insurance")
    .setText(data["field-liability-insurance"] || "");
  form
    .getTextField("L_ClaimNumber")
    .setText(data["field-liability-claim-number"] || "");
  form.getTextField("C_Name").setText(data["field-client-name"] || "");
  form.getTextField("P_Name").setText(data["field-plumber-name"] || "");

  // L1 to L8
  for (let i = 1; i <= 8; i++) {
    form.getTextField(`L${i}`).setText(data[`field-l${i}`] || "");
  }

  // Extra info
  form
    .getTextField("P_KPABEFORE")
    .setText(data["field-old-geyser-liability"] || "");
  form
    .getTextField("P_KPAAFTER")
    .setText(data["field-new-geyser-liability"] || "");
  form
    .getTextField("T_BEFORE")
    .setText(data["field-temp-before-liability"] || "");
  form
    .getTextField("T_AFTER")
    .setText(data["field-temp-after-liability"] || "");
  form
    .getTextField("textarea_33bxdi")
    .setText(data["field-general-comments-liability"] || "");

  // Yes/No mapped fields
  const yesNoFields = [
    { formYes: "WH_Yes", formNo: "WH_No", field: "field-l9wh" },
    { formYes: "WHA_Yes", formNo: "WHA_No", field: "field-additional-work" },
    {
      formYes: "EI_Yes",
      formNo: "EI_No",
      field: "field-excess-paid-liability",
    },
    { formYes: null, formNo: "Geyser_No", field: "field-geyser-installed" },
    {
      formYes: "Balanced_System_Yes",
      formNo: "Balanced_System_YesBalanced_System_No",
      field: "field-balanced-system",
    },
    { formYes: "NRValve_Yes", formNo: "NRValve_No", field: "field-nr-valve" },
  ];

  yesNoFields.forEach(({ formYes, formNo, field }) => {
    const val = (data[field] || "").toLowerCase();
    if (val === "yes" && formYes) form.getTextField(formYes).setText("✔");
    else if (val === "no" && formNo) form.getTextField(formNo).setText("✔");
  });

  // Signature handling - check multiple possible signature field names
  const signatureData =
    data["signature"] ||
    data["field-signature"] ||
    data["field-signature-liability"];
  if (signatureData) {
    try {
      console.log(
        "Processing signature for Liability PDF:",
        signatureData.substring(0, 50) + "...",
      );

      let imageBytes;
      if (signatureData.startsWith("data:image/")) {
        const base64Data = signatureData.split(",")[1];
        imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      } else {
        const response = await fetch(signatureData);
        imageBytes = new Uint8Array(await response.arrayBuffer());
      }

      const img = await pdfDoc.embedPng(imageBytes);
      const dims = img.scale(0.3);
      const page = pdfDoc.getPages()[0];

      page.drawImage(img, {
        x: 400,
        y: 100,
        width: dims.width,
        height: dims.height,
      });

      console.log("Successfully added signature to Liability PDF");
    } catch (signatureError) {
      console.error(
        "Could not add signature to liability PDF:",
        signatureError,
      );
    }
  } else {
    console.log("No signature found in Liability form data");
  }

  form.flatten();
  return await pdfDoc.save();
}

// Additional route handlers for PDF generation system
export const handleJobPDFGeneration: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "Job PDF generation not implemented yet" });
};

export const handleGetFormTemplates: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "Form templates not implemented yet" });
};

export const handleUpdatePDFConfig: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "PDF config update not implemented yet" });
};

export const handleIndividualFormPDF: RequestHandler = async (req, res) => {
  // This should route to the main PDF generation function
  return handleGenerateFormPDF(req, res);
};

export const handleAdminPDFTemplates: RequestHandler = async (req, res) => {
  res.status(501).json({ error: "Admin PDF templates not implemented yet" });
};

export const handleSetPDFTemplateAssociation: RequestHandler = async (
  req,
  res,
) => {
  res
    .status(501)
    .json({ error: "PDF template association not implemented yet" });
};

export const handleTestPDF: RequestHandler = async (req, res) => {
  try {
    // Create a simple test PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("Test PDF Generation", {
      x: 50,
      y: 750,
      size: 20,
    });

    page.drawText(`Generated at: ${new Date().toISOString()}`, {
      x: 50,
      y: 700,
      size: 12,
    });

    const pdfBytes = await pdfDoc.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=test.pdf",
    });

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating test PDF:", error);
    res.status(500).json({ error: "Failed to generate test PDF" });
  }
};

// Non-compliance PDF generation
export const handleGenerateNoncompliancePDF: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;
    const q = req.query;

    // Parse selectedIssues from JSON string
    const selectedIssues = q.selectedIssues
      ? JSON.parse(q.selectedIssues as string)
      : [];

    const data = {
      ...q,
      selectedIssues: selectedIssues,
    };

    const inputPath = path.join(
      __dirname,
      "../../public/forms/Noncompliance.pdf",
    );
    const outputPath = path.join(
      __dirname,
      "../temp",
      `noncompliance-${id}-${Date.now()}.pdf`,
    );

    const pdfDoc = await PDFDocument.load(await fs.readFile(inputPath));
    const form = pdfDoc.getForm();

    // Fill text fields
    try {
      form.getTextField("C_Number").setText((data.claimNumber as string) || "");
      form.getTextField("C_FName").setText((data.clientName as string) || "");
      form.getTextField("I_Name").setText((data.insuranceName as string) || "");
      form
        .getTextField("Date")
        .setText((data.date as string) || moment().format("YYYY-MM-DD"));
      form
        .getTextField("Geyser_make")
        .setText((data.geyserMake as string) || "");
      form.getTextField("Geyser_Serial").setText((data.serial as string) || "");
      form.getTextField("Geyser_Code").setText((data.code as string) || "");
    } catch (fieldError) {
      console.warn("Some text fields not found in PDF:", fieldError);
    }

    // Plumber Indemnity
    const PI_MAP = {
      "Electric geyser": "EG_PI",
      "Solar geyser": "SG_PI",
      "Heat pump": "HP_PI",
      "Pipe Repairs": "PR_PI",
      Assessment: "A_PI",
    };
    const plumberField = PI_MAP[data.plumberIndemnity as string];
    if (plumberField) {
      try {
        form.getCheckBox(plumberField).check();
      } catch (checkboxError) {
        console.warn(`Checkbox ${plumberField} not found in PDF`);
      }
    }

    // Quotation Available
    try {
      if (data.quotationAvailable === "YES")
        form.getCheckBox("Quote_Y").check();
      if (data.quotationAvailable === "NO") form.getCheckBox("Quote_N").check();
    } catch (checkboxError) {
      console.warn("Quotation checkboxes not found in PDF");
    }

    // Selected Issues (checkboxes n1–n33) - improved handling
    console.log("Processing selected issues:", data.selectedIssues);
    (data.selectedIssues || []).forEach((index: number) => {
      // Try multiple possible field name patterns
      const possibleFieldNames = [
        `n${index + 1}`,
        `checkbox${index + 1}`,
        `issue${index + 1}`,
        `item${index + 1}`,
        `Check Box${index + 1}`,
        `CheckBox${index + 1}`,
      ];

      let fieldFound = false;
      for (const fieldName of possibleFieldNames) {
        try {
          const field = form.getFieldMaybe(fieldName);
          if (field && field.constructor.name === "PDFCheckBox") {
            form.getCheckBox(fieldName).check();
            console.log(`Successfully checked field: ${fieldName}`);
            fieldFound = true;
            break;
          }
        } catch (checkboxError) {
          // Continue to next field name
        }
      }

      if (!fieldFound) {
        console.warn(`No checkbox field found for index ${index + 1}`);
      }
    });

    form.flatten();

    const pdfBytes = await pdfDoc.save();

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, `noncompliance-${id}.pdf`, async (err) => {
      if (!err) await fs.unlink(outputPath);
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate Noncompliance PDF");
  }
};

// Material List PDF generation
export const handleGenerateMaterialListPDF: RequestHandler = async (
  req,
  res,
) => {
  try {
    const {
      date,
      plumber,
      claimNumber,
      insurance,
      geyser,
      dripTray,
      vacuumBreaker1,
      vacuumBreaker2,
      pressureControlValve,
      nonReturnValve,
      fogiPack,
      extraItem1,
      extraItem2,
      sundries,
      additionalMaterials,
    } = req.body;

    const filePath = path.join(
      __dirname,
      "../../public/forms/material-list.pdf",
    );
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Core fields
    form.getTextField("ML_Date").setText(date || "");
    form.getTextField("ML_Plumber").setText(plumber || "");
    form.getTextField("ML_ClaimNumber").setText(claimNumber || "");
    form.getTextField("ML_Insurance").setText(insurance || "");

    // Helper: fill brand checkboxes
    const fillBrand = (item: any, prefix: string) => {
      if (item.kwikot) form.getTextField(`${prefix}_Kwikot`).setText("✔");
      if (item.heatTech) form.getTextField(`${prefix}_HeatTech`).setText("✔");
      if (item.techron) form.getTextField(`${prefix}_Techron`).setText("✔");
    };

    // Geyser
    form.getTextField("Geyser_Size").setText(geyser.size || "");
    fillBrand(geyser, "Geyser");

    // Drip Tray
    form.getTextField("Drip_Tray").setText(dripTray.size || "");
    fillBrand(dripTray, "Drip_Tray");

    // Vacuum Breakers
    const vbCombinedSize =
      `${vacuumBreaker1.size || ""} ${vacuumBreaker2?.size || ""}`.trim();
    form.getTextField("Vacumm_B").setText(vbCombinedSize);
    fillBrand(vacuumBreaker1, "VB"); // You could merge VB1 and VB2 logic if needed

    // Pressure Control Valve
    form.getTextField("P_CValve").setText(pressureControlValve.size || "");
    fillBrand(pressureControlValve, "PCV");

    // Non Return Valve
    form.getTextField("Non_return").setText(nonReturnValve.size || "");
    fillBrand(nonReturnValve, "NRV");

    // Fogi Pack
    form.getTextField("Fogi_Pack").setText(fogiPack.size || "");

    // Extra Items
    form.getTextField("Extra_Item").setText(extraItem1.name || "");
    form
      .getTextField("Extra_ItemQty")
      .setText(extraItem1.quantity?.toString() || "");

    form.getTextField("Extra_Item2").setText(extraItem2.name || "");
    form
      .getTextField("Extra_ItemQty2")
      .setText(extraItem2.quantity?.toString() || "");

    // Sundries (names & quantities)
    sundries.forEach((s, i) => {
      if (i < 15) {
        form.getTextField(`Sundries${i + 1}`).setText(s.name || "");
        form
          .getTextField(`SundriesQR${i + 1}`)
          .setText(s.qtyRequested?.toString() || "");
        form
          .getTextField(`SundriesQU${i + 1}`)
          .setText(s.qtyUsed?.toString() || "");
      }
    });

    // Additional Materials
    additionalMaterials.forEach((a, i) => {
      if (i < 5) {
        form.getTextField(`Added${i + 1}`).setText(a.name || "");
        form
          .getTextField(`Added${i + 1}_Req`)
          .setText(a.qtyRequested?.toString() || "");
        form
          .getTextField(`Added${i + 1}_Used`)
          .setText(a.qtyUsed?.toString() || "");
      }
    });

    const pdfBytesModified = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Material_List_Filled.pdf",
    );
    res.send(pdfBytesModified);
  } catch (error) {
    console.error("Failed to generate Material List PDF", error);
    res.status(500).send("Failed to generate PDF");
  }
};

// Helper function to get form data by ID (mock implementation)
async function getFormDataById(id: string): Promise<any> {
  // This should fetch from your database
  // For now returning empty object
  return {};
}

// Specific form PDF generation handlers matching your implementation
export const handleGenerateABSAPDF: RequestHandler = async (req, res) => {
  try {
    const data = req.body;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `ABSACertificate_filled_${Date.now()}.pdf`,
    );

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateABSAPDF({ data });

    // Save the file to disk first
    await fs.writeFile(outputPath, pdfBytes);

    // Then send the file for download
    res.download(outputPath, "ABSACertificate_filled.pdf", async (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error sending the PDF file.");
      } else {
        // Delete the temp file after download
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp file:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating ABSA PDF:", err);
    res.status(500).send("Failed to generate ABSA PDF.");
  }
};

export const handleGenerateLiabilityPDF: RequestHandler = async (req, res) => {
  try {
    const data = req.query;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `LiabilityReport_filled_${Date.now()}.pdf`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateLiabilityPDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, "LiabilityReport.pdf", async (err) => {
      if (err) {
        console.error("Error sending liability PDF:", err);
        res.status(500).send("Error sending the liability PDF file.");
      } else {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp liability PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating liability PDF:", err);
    res.status(500).send("Failed to generate liability PDF.");
  }
};

export const handleGenerateSAHLPDF: RequestHandler = async (req, res) => {
  try {
    const data = req.query;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `SAHLReport_filled_${Date.now()}.pdf`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateSAHLPDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, "SAHLReport.pdf", async (err) => {
      if (err) {
        console.error("Error sending SAHL PDF:", err);
        if (!res.headersSent)
          res.status(500).send("Error sending the SAHL PDF file.");
      } else {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp SAHL PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating SAHL PDF:", err);
    res.status(500).send("Failed to generate SAHL PDF.");
  }
};

export const handleGenerateClearancePDF: RequestHandler = async (req, res) => {
  try {
    const data = req.query;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(
      tempDir,
      `BBPClearanceCertificate_filled_${Date.now()}.pdf`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    const pdfBytes = await generateClearancePDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, "BBPClearanceCertificate.pdf", async (err) => {
      if (err) {
        console.error("Error sending Clearance PDF:", err);
        if (!res.headersSent)
          res.status(500).send("Error sending the Clearance PDF file.");
      } else {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp Clearance PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating Clearance PDF:", err);
    res.status(500).send("Failed to generate Clearance PDF.");
  }
};

export const handleGenerateDiscoveryPDF: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id;
    const tempDir = path.join(__dirname, "../temp");
    const outputPath = path.join(tempDir, `discovery-${id}-${Date.now()}.pdf`);

    await fs.mkdir(tempDir, { recursive: true });

    // For discovery, we'd need to get the product data from database
    // For now, using req.body as fallback
    const data = req.body || req.query;

    const pdfBytes = await generateDiscoveryPDF({ data });

    await fs.writeFile(outputPath, pdfBytes);

    res.download(outputPath, `discovery-${id}.pdf`, async (err) => {
      if (!err) {
        try {
          await fs.unlink(outputPath);
        } catch (unlinkErr) {
          console.error("Failed to delete temp discovery PDF:", unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error("Error generating discovery PDF:", err);
    res.status(500).send("Failed generating discovery PDF.");
  }
};
