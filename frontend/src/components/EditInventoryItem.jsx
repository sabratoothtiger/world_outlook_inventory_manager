import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { supabase } from "../supabase";
import { useSnackbar } from "notistack";

const EditInventoryItem = ({ inventoryItem, setInventoryItem, fetchInventoryItem, openEditDialog, handleEditDialogClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fStops, setFStops] = useState([]);
  const [focalLengths, setFocalLengths] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [openNewValueDialog, setOpenNewValueDialog] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [fieldToAdd, setFieldToAdd] = useState("");
  const fieldsToCheck = [
    {
      field: "category",
      table: "inventory_item_categories",
      options: categories,
      columnName: "category",
    },
    {
      field: "subcategory",
      table: "inventory_item_subcategories",
      options: subcategories,
      columnName: "subcategory",
    },
    { field: "brand", table: "brands", options: brands, columnName: "brand" },
    { field: "model", table: "models", options: models, columnName: "model" },
    { field: "fStop", table: "f_stops", options: fStops, columnName: "f_stop" },
    {
      field: "focalLength",
      table: "focal_lengths",
      options: focalLengths,
      columnName: "focal_length",
    },
    {
      field: "status",
      table: "inventory_item_statuses",
      options: statuses,
      columnName: "status",
    },
  ];
  useEffect(() => {
    fetchData();
  });

  const findColumnNameByTable = (table) => {
    const fieldToCheck = fieldsToCheck.find((fieldItem) => fieldItem.table === table);
    return fieldToCheck ? fieldToCheck.columnName : null;
    };
    const findTableByField = (field) => {
        const fieldToCheck = fieldsToCheck.find((fieldItem) => fieldItem.field === field);
        return fieldToCheck ? fieldToCheck.table : null;
        };

  const fetchData = async () => {
    // Fetch data for the dropdowns
    const fetchOptions = async (table) => {
      const columnName = findColumnNameByTable(table);
      const res = await supabase.from(table).select(columnName);
      return res.data.map((item) => item[columnName]);
    };

    try {
      setCategories(await fetchOptions("inventory_item_categories"));
      setSubcategories(await fetchOptions("inventory_item_subcategories"));
      setBrands(await fetchOptions("brands"));
      setModels(await fetchOptions("models"));
      setFStops(await fetchOptions("f_stops"));
      setFocalLengths(await fetchOptions("focal_lengths"));
      setStatuses(await fetchOptions("inventory_item_statuses"));
    } catch (error) {
      console.error("Error fetching data:", error);
      enqueueSnackbar("Error fetching data: " + error, { variant: "error" });
    }
  };

  const handleEditDialogSave = async () => {
    try {
      // Check and save new values to the database
      const saveNewValue = async (table, value) => {
        if (!(await existsInArray(table, value))) {
          const { data, error } = await supabase
            .from(table)
            .insert([{ name: value }]);
          if (error) throw new Error(error.message);
          return data[0].name;
        }
        return value;
      };

      for (const { field, table, options } of fieldsToCheck) {
        if (inventoryItem[field] && !options.includes(inventoryItem[field])) {
          inventoryItem[field] = await saveNewValue(
            table,
            inventoryItem[field]
          );
        }
      }
      // Update existing item
      const { error } = await supabase
        .from("inventory_items")
        .update({
          category: inventoryItem.category,
          subcategory: inventoryItem.subcategory,
          brand: inventoryItem.brand,
          model: inventoryItem.model,
          f_stop: inventoryItem.f_stop,
          focal_length: inventoryItem.focal_length,
          details: inventoryItem.details,
          serial_number: inventoryItem.serial_number,
          status: inventoryItem.status,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", inventoryItem.id);

      if (error) {
        throw new Error(error.message);
      }
      await supabase
      .from('inventory_item_histories')
      .insert([
        { inventory_item_id: inventoryItem.id, status: inventoryItem.status },
      ]) 

      enqueueSnackbar("Inventory item updated successfully.", {
        variant: "success",
      });

      handleEditDialogClose();
      fetchInventoryItem();
    } catch (error) {
      enqueueSnackbar("Error updating inventory item.", { variant: "error" });
      console.error("Error updating inventory item:", error);
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

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    if (value === "__add_new__") {
      handleAddNewValue(field);
    } else {
      setInventoryItem({
        ...inventoryItem,
        [field]: value,
      });
    }
  };
  const handleNewFieldValueChange = (event) => {
    setNewFieldValue(event.target.value);
  };

  const handleAddNewValue = (field) => {
    setFieldToAdd(field);
    setOpenNewValueDialog(true);
  };


  const handleNewValueDialogSave = async () => {
    try {
      if (newFieldValue.trim() === "") {
        enqueueSnackbar("Please enter a value.", { variant: "error" });
        return;
      }

      const table = findTableByField(fieldToAdd);
      const columnName = findColumnNameByTable(table);
      // Save new value to the database
      const { error } = await supabase
        .from(table)
        .insert([{ [columnName]: newFieldValue }]);
      if (error) throw new Error(error.message);

      // Update local state based on the field to add
      switch (fieldToAdd) {
        case "category":
          setCategories([...categories, newFieldValue]);
          setInventoryItem({ ...inventoryItem, category: newFieldValue });
          break;
        case "subcategory":
          setSubcategories([...subcategories, newFieldValue]);
          setInventoryItem({ ...inventoryItem, subcategory: newFieldValue });
          break;
        case "brand":
          setBrands([...brands, newFieldValue]);
          setInventoryItem({ ...inventoryItem, brand: newFieldValue });
          break;
        case "model":
          setModels([...models, newFieldValue]);
          setInventoryItem({ ...inventoryItem, model: newFieldValue });
          break;
        case "f_stop":
          setFStops([...fStops, newFieldValue]);
          setInventoryItem({ ...inventoryItem, f_stop: newFieldValue });
          break;
        case "focal_length":
          setFocalLengths([...focalLengths, newFieldValue]);
          setInventoryItem({ ...inventoryItem, focalLength: newFieldValue });
          break;
        case "status":
          setStatuses([...statuses, newFieldValue]);
          setInventoryItem({ ...inventoryItem, status: newFieldValue });
          break;
        default:
          break;
      }

      enqueueSnackbar("New value added successfully.", { variant: "success" });
      setOpenNewValueDialog(false);
    } catch (error) {
      enqueueSnackbar("Error adding new value.", { variant: "error" });
      console.error("Error adding new value:", error);
    }
  };

  return (
    <>
    <Dialog open={openEditDialog} onClose={handleEditDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Inventory Item</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginTop: "5px" }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select name="category" label="Category" value={inventoryItem.category || ""} onChange={handleFieldChange("category")}>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Subcategory</InputLabel>
              <Select name="subcategory" label="Subcategory" value={inventoryItem.subcategory || ""} onChange={handleFieldChange("subcategory")}>
                {subcategories.map((subcategory) => (
                  <MenuItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </MenuItem>
                ))}
                <MenuItem key="new_subcategory" value="__add_new__">
                    Add New
                  </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select name="brand" label="Brand" value={inventoryItem.brand || ""} onChange={handleFieldChange("brand")}>
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
                <MenuItem key="new_brand" value="__add_new__">
                    Add New
                  </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select name="model" label="Model" value={inventoryItem.model || ""} onChange={handleFieldChange("model")}>
                {models.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
                <MenuItem key="new_model" value="__add_new__">
                    Add New
                  </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>F-stop</InputLabel>
              <Select name="f_stop" label="F-stop" value={inventoryItem.f_stop || ""} onChange={handleFieldChange("f_stop")}>
                {fStops.map((fStop) => (
                  <MenuItem key={fStop} value={fStop}>
                    {fStop}
                  </MenuItem>
                ))}
                <MenuItem key="new_f_stop" value="__add_new__">
                    Add New
                  </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Focal Length</InputLabel>
              <Select name="focal_length" label="Focal Length" value={inventoryItem.focal_length || ""} onChange={handleFieldChange("focal_length")}>
                {focalLengths.map((focalLength) => (
                  <MenuItem key={focalLength} value={focalLength}>
                    {focalLength}
                  </MenuItem>
                ))}
                <MenuItem key="new_focal_length" value="__add_new__">
                  Add New
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField name="details" label="Details" value={inventoryItem.details || ""} onChange={handleFieldChange("details")} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="serial_number" label="Serial Number" value={inventoryItem.serial_number || ""} onChange={handleFieldChange("serial_number")} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select name="status" label="Status" value={inventoryItem.status || ""} onChange={handleFieldChange("status")}>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleEditDialogClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleEditDialogSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
    {/* Dialog for adding new field value */}
      <Dialog
        open={openNewValueDialog}
        onClose={() => setOpenNewValueDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Value</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="new-value"
            label={`New ${fieldToAdd.replace("_", " ")} value`}
            fullWidth
            value={newFieldValue}
            onChange={handleNewFieldValueChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewValueDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleNewValueDialogSave} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      </>
  );
};

export default EditInventoryItem;