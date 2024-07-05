import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Button,
  TextField,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { supabase } from "../supabase";
import { useSnackbar } from "notistack";
import titlecase from "titlecase";
import { sendLabelsToPrinter } from "./DymoPrinter";

const AddInventoryItem = ({
  purchaseOrder,
  openAddDrawer,
  handleAddDrawerClose,
  fetchInventoryItem,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [inventoryItem, setInventoryItem] = useState({
    status: "Received (unlisted)",
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fStops, setFStops] = useState([]);
  const [focalLengths, setFocalLengths] = useState([]);
  const [focalLengthUnit, setFocalLengthUnit] = useState([]);
  const [focalLengthUnits, setFocalLengthUnits] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [openNewValueDialog, setOpenNewValueDialog] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newFieldValueLow, setNewFieldValueLow] = useState(""); // Added for low range
  const [newFieldValueHigh, setNewFieldValueHigh] = useState(""); // Added for high range
  const [fieldToAdd, setFieldToAdd] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(""); // State for selected brand

  const fieldsToCheck = [
    {
      field: "category",
      table: "inventory_item_categories",
      options: categories,
      columnName: "category",
      isRequired: true,
    },
    {
      field: "subcategory",
      table: "inventory_item_subcategories",
      options: subcategories,
      columnName: "subcategory",
      isRequired: false,
    },
    {
      field: "brand",
      table: "brands",
      options: brands,
      columnName: "brand",
      isRequired: false,
    },
    {
      field: "model",
      table: "models",
      options: models,
      columnName: "model",
      isRequired: false,
    },
    {
      field: "fStop",
      table: "f_stops",
      options: fStops,
      columnName: "f_stop",
      isRequired: false,
    },
    {
      field: "focalLength",
      table: "focal_lengths",
      options: focalLengths,
      columnName: "focal_length",
      isRequired: false,
    },
    {
      field: "status",
      table: "inventory_item_statuses",
      options: statuses,
      columnName: "status",
      isRequired: true,
    },
  ];

  const findColumnNameByTable = (table) => {
    const fieldToCheck = fieldsToCheck.find(
      (fieldItem) => fieldItem.table === table
    );
    return fieldToCheck ? fieldToCheck.columnName : null;
  };

  const findTableByField = (field) => {
    const fieldToCheck = fieldsToCheck.find(
      (fieldItem) => fieldItem.field === field
    );
    return fieldToCheck ? fieldToCheck.table : null;
  };

  const fetchOptions = async (table, columnName) => {
    const res = await supabase
      .from(table)
      .select(columnName)
      .order("id", { ascending: true });
    return res.data ? res.data.map((item) => item[columnName]) : [];
  };

  const fetchData = useCallback(async () => {
    try {
      setCategories(
        await fetchOptions("inventory_item_categories", "category")
      );
      setBrands(await fetchOptions("brands", "brand"));
      setFStops(await fetchOptions("f_stops", "f_stop"));
      setFocalLengths(await fetchOptions("focal_lengths", "focal_length"));
      setStatuses(await fetchOptions("inventory_item_statuses", "status"));
      setFocalLengthUnits(await fetchOptions("focal_length_units", "unit"));
    } catch (error) {
      console.error("Error fetching data:", error);
      enqueueSnackbar("Error fetching data: " + error, { variant: "error" });
    }
  }, [enqueueSnackbar]); // Add any dependencies if they are used in fetchData

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchModels = useCallback(
    async (brand) => {
      try {
        const res = await supabase
          .from("models")
          .select("model")
          .eq("brand", brand)
          .order("model", { ascending: true });

        setModels(res.data.map((item) => item.model));
      } catch (error) {
        console.error("Error fetching models:", error);
        enqueueSnackbar("Error fetching models: " + error, {
          variant: "error",
        });
      }
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    if (inventoryItem.brand) {
      fetchModels(inventoryItem.brand);
    }
  }, [inventoryItem.brand, fetchModels]);

  const fetchSubcategories = useCallback(
    async (category) => {
      try {
        const res = await supabase
          .from("inventory_item_subcategories")
          .select("subcategory")
          .eq("category", category)
          .order("id", { ascending: true });

        setSubcategories(res.data.map((item) => item.subcategory));
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        enqueueSnackbar("Error fetching subcategories: " + error, {
          variant: "error",
        });
      }
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    if (inventoryItem.category) {
      fetchSubcategories(inventoryItem.category);
    }
  }, [inventoryItem.category, fetchSubcategories]); // fetchSubcategories is now a dependency

  const filter = createFilterOptions();

  const handleAddDrawerSave = async () => {
    try {
      for (const { field, isRequired } of fieldsToCheck) {
        if (isRequired && !inventoryItem[field]) {
          enqueueSnackbar(`${field} is required.`, { variant: "error" });
          return;
        }
      }

      const saveNewValue = async (field, value) => {
        const table = findTableByField(field);
        const columnName = findColumnNameByTable(table);

        if (!existsInArray(table, value)) {
          const { data, error } = await supabase
            .from(table)
            .insert([{ [columnName]: value }]);
          if (error) throw new Error(error.message);
          return data[0][columnName];
        }

        return value;
      };

      for (const { field } of fieldsToCheck) {
        if (inventoryItem[field]) {
          inventoryItem[field] = await saveNewValue(
            field,
            inventoryItem[field]
          );
        }
      }

      // Step 0: Get Model ID
      let modelId = null
      if (inventoryItem.model) {
        const { data: existingModel, error: fetchModelError } = await supabase
        .from("models")
        .select("id")
        .eq("brand", inventoryItem.brand)
        .eq("model", inventoryItem.model)
        .single();

        if (fetchModelError && fetchModelError.code !== 'PGRST116') {
          throw fetchModelError;
        }
        if (existingModel) {
          modelId = existingModel.id;
        }
      }

      // Step 1: Fetch the maximum number
      const { data: maxNumberData, error: maxNumberError } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("purchase_order_reference_id", purchaseOrder.id);

      if (maxNumberError) {
        throw maxNumberError;
      }

      // Extract the numbers and find the maximum
      const maxNumber = maxNumberData
        .map((item) => {
          const match = item.id.match(/_(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .reduce((max, current) => (current > max ? current : max), 0);

      // Step 2: Generate the new id
      const newNumber = maxNumber + 1;
      const inventoryItemId = `${purchaseOrder.id}_${newNumber}`;

      const { error } = await supabase.from("inventory_items").insert([
        {
          id: inventoryItemId,
          category: inventoryItem.category,
          subcategory: inventoryItem.subcategory,
          brand: inventoryItem.brand,
          model_id: modelId,
          f_stop: inventoryItem.fStop,
          focal_length: inventoryItem.focalLength,
          details: inventoryItem.details,
          serial_number: inventoryItem.serial_number,
          status: inventoryItem.status,
          purchase_order_reference_id: purchaseOrder.id,
        },
      ]);
      if (error) throw new Error(error.message);
      const { error: purchaseOrderError } = await supabase.rpc(
        "increment_item_count",
        { purchase_order_id: purchaseOrder.id }
      );
      if (purchaseOrderError) throw new Error(error.message);

      await supabase
        .from("inventory_item_histories")
        .insert([
          { inventory_item_id: inventoryItemId, status: inventoryItem.status },
        ]);

      enqueueSnackbar("New inventory item added successfully.", {
        variant: "success",
      });
      handleAddDrawerClose();
      if (
        inventoryItem.status === "Received (unlisted)" ||
        inventoryItem.status === "For parts"
      ) {
        const detailsParts = [
          inventoryItem.brand,
          inventoryItem.model,
          inventoryItem.fStop,
          inventoryItem.focalLength,
          inventoryItem.details,
        ];
        const detailsString = detailsParts.filter(part => part).join(" ");
        
        let serial_number = ""
        if (inventoryItem.serial_number) {
          serial_number = inventoryItem.serial_number
        }
        const barcodeParts = [
          "INV",
          inventoryItemId,
          serial_number
        ]
        const barcode = barcodeParts.join("^")
        const labelData = [
          {
            "Inventory ID": inventoryItemId,
            "Category": inventoryItem.category + " " + inventoryItem.subcategory,
            "Details": detailsString,
            "Serial Number": "#" + serial_number,
            "Inventory Barcode": barcode,
          },
        ];
        sendLabelsToPrinter(labelData, "inventory");
      }
      setInventoryItem({
        status: "Received (unlisted)",
      });
    } catch (error) {
      enqueueSnackbar("Error adding inventory item.", { variant: "error" });
      console.error("Error adding inventory item:", error);
    }
  };

  const existsInArray = (table, value) => {
    switch (table) {
      case "inventory_item_categories":
        return categories.includes(value);
      case "inventory_item_subcategories":
        return subcategories.includes(value);
      case "brands":
        return brands.includes(value);
      case "models":
        return models.includes(value);
      case "f_stops":
        return fStops.includes(value);
      case "focal_lengths":
        return focalLengths.includes(value);
      case "inventory_item_statuses":
        return statuses.includes(value);
      default:
        return false;
    }
  };

  const handleFieldChange = (field) => (event, newValue) => {
    if (typeof newValue === "string") {
      if (newValue.startsWith('Add "')) {
        newValue = newValue.substring(5, newValue.length - 1)
        handleAddNewValue(field, newValue);
        return;
      }
      setInventoryItem({ ...inventoryItem, [field]: newValue });
      if (field === "brand") {
        setSelectedBrand(newValue)
      }
    } else if (newValue && newValue.inputValue) {
      handleAddNewValue(field, newValue.inputValue);
    } else {
      setInventoryItem({ ...inventoryItem, [field]: newValue });
      if (field === "brand") {
        setSelectedBrand(newValue)
      }
    }
  };

  const handleAddNewValue = (field, value) => {
    setFieldToAdd(field);
    setNewFieldValue(titlecase(value));
    setNewFieldValueLow(value.startsWith("1:") ? value.slice(2) : value);
    setNewFieldValueHigh("");
    setFocalLengthUnit("mm");
    setOpenNewValueDialog(true);
  };

  const handleDialogSave = async () => {
    if (newFieldValue.trim() === "") {
      enqueueSnackbar("Value cannot be empty.", { variant: "error" });
      return;
    }

    try {
      const table = findTableByField(fieldToAdd);
      const columnName = findColumnNameByTable(table);
      const newValue =
        fieldToAdd === "fStop"
          ? newFieldValueHigh
            ? `1:${newFieldValueLow}-${newFieldValueHigh}`
            : `1:${newFieldValueLow}`
          : fieldToAdd === "focalLength"
          ? newFieldValueHigh
            ? `${newFieldValueLow}-${newFieldValueHigh} ${focalLengthUnit}`
            : `${newFieldValueLow} ${focalLengthUnit}`
          : newFieldValue;
      if (!existsInArray(table, newValue)) {
        var error = null;
        if (fieldToAdd === "model") {
          const { error: insertError } = await supabase.from(table).insert([
            {
              [columnName]: newValue,
              brand: selectedBrand,
            },
          ]);
          error = insertError;
        } else if (fieldToAdd === "fStop") {
          const { error: insertError } = await supabase.from(table).insert([
            {
              [columnName]: newValue,
              range_low: Number(newFieldValueLow),
              range_high: Number(newFieldValueHigh),
            },
          ]);
          error = insertError;
        } else if (fieldToAdd === "focalLength") {
          const { error: insertError } = await supabase.from(table).insert([
            {
              [columnName]: newValue,
              range_low: Number(newFieldValueLow),
              range_high: Number(newFieldValueHigh),
              unit: focalLengthUnit,
            },
          ]);
          error = insertError;
        } else {
          const { error: insertError } = await supabase.from(table).insert([
            {
              [columnName]: newValue,
            },
          ]);
          error = insertError;
        }

        if (error) throw new Error(error.message);

        switch (table) {
          case "inventory_item_categories":
            setCategories([...categories, newValue]);
            break;
          case "inventory_item_subcategories":
            setSubcategories([...subcategories, newValue]);
            break;
          case "brands":
            setBrands([...brands, newValue]);
            setSelectedBrand(newValue);
            break;
          case "models":
            setModels([...models, newValue]);
            break;
          case "f_stops":
            setFStops([...fStops, newValue]);
            break;
          case "focal_lengths":
            setFocalLengths([...focalLengths, newValue]);
            break;
          case "inventory_item_statuses":
            setStatuses([...statuses, newValue]);
            break;
          default:
            break;
        }

        setInventoryItem({
          ...inventoryItem,
          [fieldToAdd]: newValue,
        });

        setOpenNewValueDialog(false);
        setNewFieldValue("");
        enqueueSnackbar("New value added successfully.", {
          variant: "success",
        });
      } else {
        enqueueSnackbar("Value already exists.", { variant: "warning" });
      }
    } catch (error) {
      enqueueSnackbar("Error adding new value.", { variant: "error" });
      console.error("Error adding new value:", error);
    }
  };

  const renderDialogContent = () => {
    switch (fieldToAdd) {
      case "model":
        return (
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}>
              <TextField
                label="Brand"
                disabled
                id="outlined-disabled"
                defaultValue={selectedBrand}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Model"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        );
      case "fStop":
        return (
          <Grid container spacing={2} mt={1}>
            <Grid item xs={4} p={3}>
              <TextField
                label="Low Range"
                value={newFieldValueLow}
                onChange={(e) => setNewFieldValueLow(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} p={3}>
              <TextField
                label="High Range"
                value={newFieldValueHigh}
                onChange={(e) => setNewFieldValueHigh(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        );
      case "focalLength":
        return (
          <Grid container spacing={2} mt={1}>
            <Grid item xs={4}>
              <TextField
                label="Low Range"
                value={newFieldValueLow}
                onChange={(e) => setNewFieldValueLow(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="High Range"
                value={newFieldValueHigh}
                onChange={(e) => setNewFieldValueHigh(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <Autocomplete
                value={focalLengthUnit}
                onChange={handleFieldChange("focalLength")}
                options={focalLengthUnits}
                renderInput={(params) => (
                  <TextField {...params} label="Focal Length" fullWidth />
                )}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
              />
            </Grid>
          </Grid>
        );
      default:
        return (
          <TextField
            autoFocus
            margin="normal"
            label="New Value"
            type="text"
            fullWidth
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
          />
        );
    }
  };

  const isLensSubcategory = (subcategory) => {
    return subcategory && subcategory.toLowerCase() === "lens";
  };

  return (
    <Drawer anchor="right" open={openAddDrawer} onClose={handleAddDrawerClose}>
      <Box display="flex" flexDirection="column" height="100%">
        <Box p={3} width="400px" flexGrow={1} overflow="auto">
          <Box mb={2}>
            <Autocomplete
              value={inventoryItem.status || ""}
              onChange={handleFieldChange("status")}
              options={statuses}
              renderInput={(params) => (
                <TextField {...params} label="Status" fullWidth required />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some(
                  (option) => inputValue === option
                );
                if (inputValue !== "" && !isExisting) {
                  filtered.push(`Add "${inputValue}"`);
                }
                return filtered;
              }}
            />
          </Box>
          <Box mb={2}>
            <Autocomplete
              value={inventoryItem.category || ""}
              onChange={handleFieldChange("category")}
              options={categories}
              renderInput={(params) => (
                <TextField {...params} label="Category" fullWidth required />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some(
                  (option) => inputValue === option
                );
                if (inputValue !== "" && !isExisting) {
                  filtered.push(`Add "${inputValue}"`);
                }
                return filtered;
              }}
            />
          </Box>
          <Box mb={2}>
            <Autocomplete
              value={inventoryItem.subcategory || ""}
              onChange={handleFieldChange("subcategory")}
              options={subcategories}
              renderInput={(params) => (
                <TextField {...params} label="Subcategory" fullWidth />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some(
                  (option) => inputValue === option
                );
                if (inputValue !== "" && !isExisting) {
                  filtered.push(`Add "${inputValue}"`);
                }
                return filtered;
              }}
            />
          </Box>
          <Box mb={2}>
            <Autocomplete
              value={inventoryItem.brand || ""}
              onChange={handleFieldChange("brand")}
              options={brands}
              renderInput={(params) => (
                <TextField {...params} label="Brand" fullWidth />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some(
                  (option) => inputValue === option
                );
                if (inputValue !== "" && !isExisting) {
                  filtered.push(`Add "${inputValue}"`);
                }
                return filtered;
              }}
            />
          </Box>
          <Box mb={2}>
            <Autocomplete
              value={inventoryItem.model || ""}
              onChange={handleFieldChange("model")}
              options={models}
              renderInput={(params) => (
                <TextField {...params} label="Model" fullWidth />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some(
                  (option) => inputValue === option
                );
                if (inputValue !== "" && !isExisting) {
                  filtered.push(`Add "${inputValue}"`);
                }
                return filtered;
              }}
            />
          </Box>
          {isLensSubcategory(inventoryItem.subcategory) && (
            <Box mb={2}>
              <Autocomplete
                value={inventoryItem.fStop || "1:"}
                onChange={handleFieldChange("fStop")}
                options={fStops}
                renderInput={(params) => (
                  <TextField {...params} label="fStop" fullWidth />
                )}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some(
                    (option) => inputValue === option
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  return filtered;
                }}
              />
            </Box>
          )}
          {isLensSubcategory(inventoryItem.subcategory) && (
            <Box mb={2}>
              <Autocomplete
                value={inventoryItem.focalLength || ""}
                onChange={handleFieldChange("focalLength")}
                options={focalLengths}
                renderInput={(params) => (
                  <TextField {...params} label="Focal Length" fullWidth />
                )}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some(
                    (option) => inputValue === option
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  return filtered;
                }}
              />
            </Box>
          )}
          <Box mb={2}>
            <TextField
              value={inventoryItem.serial_number || ""}
              onChange={(e) =>
                setInventoryItem({
                  ...inventoryItem,
                  serial_number: e.target.value,
                })
              }
              label="Serial Number"
              fullWidth
            />
          </Box>
          <Box mb={2} flexGrow={1}>
            <TextField
              value={inventoryItem.details || ""}
              onChange={(e) =>
                setInventoryItem({ ...inventoryItem, details: e.target.value })
              }
              label="Details"
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </Box>
        <Box p={3}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleAddDrawerSave}
          >
            Save
          </Button>
        </Box>
      </Box>
      <Dialog
        open={openNewValueDialog}
        onClose={() => setOpenNewValueDialog(false)}
      >
        <DialogTitle>Add New Value</DialogTitle>
        <DialogContent>{renderDialogContent(inventoryItem)}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewValueDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default AddInventoryItem;
