import { enqueueSnackbar } from "notistack";
import { listingLabel } from "../utils/listingLabel";
import { inventoryLabel } from "../utils/inventoryLabel";

const initializeDymoLabelFramework = async () => {
  try {
    if (!window.dymo) {
      throw new Error("Dymo SDK not loaded");
    }
    await new Promise((resolve, reject) => {
      window.dymo.label.framework.init(resolve, reject);
    });
  } catch (error) {
    enqueueSnackbar("Error initializing Dymo Label Framework: " + error, {
      variant: "error",
    });
    console.error("Error initializing Dymo Label Framework:", error);
  }
};

const sendLabelsToPrinter = async (labelData, type) => {
  try {
    if (!window.dymo) {
      throw new Error("Dymo SDK not loaded");
    }
    await initializeDymoLabelFramework();
    const printerName = "DYMO LabelWriter 450";
    const printParamsXml =
      window.dymo.label.framework.createLabelWriterPrintParamsXml();

    // Fetch XML template based on type
    type = type.toLowerCase(); // Ensure consistent input
    let labelTemplateXml = ""; // Set default
    if (type === "inventory") {
      labelTemplateXml = inventoryLabel;
    } else if (type === "listing") {
      labelTemplateXml = listingLabel;
    } else {
      throw new Error("Invalid label type");
    }

    const labelXml = await loadLabelFromXml(labelTemplateXml);
    const labelSetXml =
      window.dymo.label.framework.LabelSetBuilder.toXml(labelData);

    await window.dymo.label.framework.printLabel(
      printerName,
      printParamsXml,
      labelXml,
      labelSetXml
    );
  } catch (error) {
    enqueueSnackbar("Error printing label: " + error.message, {
      variant: "error",
    });
    console.error("Error printing label:", error);
  }
};

const loadLabelFromXml = async (xmlContent) => {
  try {
    return new Promise((resolve, reject) => {
      try {
        const label = window.dymo.label.framework.openLabelXml(xmlContent);
        resolve(label);
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    enqueueSnackbar("Error loading label from XML: " + error, {
      variant: "error",
    });
  }
};

export { sendLabelsToPrinter };
