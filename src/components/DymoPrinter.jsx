import { enqueueSnackbar } from 'notistack';

const initializeDymoLabelFramework = async () => {
    try {
        if (!window.dymo) {
            throw new Error('Dymo SDK not loaded');
        }
        await new Promise((resolve, reject) => {
            window.dymo.label.framework.init(resolve, reject);
        });
    } catch (error) {
        enqueueSnackbar("Error initializing Dymo Label Framework: " + error, {
            variant: "error",
        });
        console.error("Error initializing Dymo Label Framework:", error);
        throw error;
    }
};

const sendLabelsToPrinter = async (labelData, type) => {
    try {
        if (!window.dymo) {
            throw new Error('Dymo SDK not loaded');
        }
        type = type.toLowerCase(); // Ensure consistent input
        let labelTemplateXml = ''; // Set default
        await initializeDymoLabelFramework();
        const printerName = "DYMO LabelWriter 450";
        const printParamsXml = window.dymo.label.framework.createLabelWriterPrintParamsXml();
        
        // Fetch XML template based on type
        let filename;
        if (type === 'inventory') {
            filename = 'inventoryLabel.dymo';
        } else if (type === 'listing') {
            filename = 'listingLabel.dymo';
        } else {
            throw new Error('Invalid label type');
        }
        
        // labelTemplateXml = await loadLabelTemplate(filename); // Useful if hosting on backend, but currently just serving through public react files.
        labelTemplateXml = process.env.PUBLIC_URL + '/assets/' + filename;
        const labelXml = await loadLabelFromXml(labelTemplateXml);
        const labelSetXml = window.dymo.label.framework.LabelSetBuilder.toXml(labelData);

        await window.dymo.label.framework.printLabel(printerName, printParamsXml, labelXml, labelSetXml);
    } catch (error) {
        enqueueSnackbar("Error printing label: " + error.message, { variant: "error" });
        console.error("Error printing label:", error);
    }
};

// Useful if hosting on backend, but currently just serving through public react files.
async function loadLabelTemplate(filename) {
    const response = await fetch(`http://localhost:5001/assets/${filename}`);
    if (!response.ok) {
        throw new Error('Failed to load the label file');
    }
    const labelXml = await response.text();
    return labelXml;
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
        enqueueSnackbar("Error loading label from XML: " + error, { variant: "error" });
        throw new Error("Error loading label from XML: " + error.message);
    }
};

export { sendLabelsToPrinter };