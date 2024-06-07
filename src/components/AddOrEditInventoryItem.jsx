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
import { supabase } from "../client";
import { useSnackbar } from "notistack";

const AddOrEditInventoryItem = ({
  purchaseOrder,
  inventoryItem,
  setInventoryItem,
  fetchInventoryItem,
  openEditDialog,
  handleEditDialogClose,
  isNewItem,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fStops, setFStops] = useState([]);
  const [focalLengths, setFocalLengths] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories data
      const categoriesRes = await supabase
        .from("inventory_item_categories")
        .select("name");
      setCategories(categoriesRes.data.map((category) => category.name));

      // Fetch subcategories data
      const subcategoriesRes = await supabase
        .from("inventory_item_subcategories")
        .select("name");
      setSubcategories(
        subcategoriesRes.data.map((subcategory) => subcategory.name)
      );

      // Fetch brands data
      const brandsRes = await supabase.from("brands").select("name");
      setBrands(brandsRes.data.map((brand) => brand.name));

      // Fetch models data
      const modelsRes = await supabase.from("models").select("name");
      setModels(modelsRes.data.map((model) => model.name));

      // Fetch fStops data
      const fStopsRes = await supabase.from("f_stops").select("f_stop");
      setFStops(fStopsRes.data.map((fStop) => fStop.f_stop));

      // Fetch focalLengths data
      const focalLengthsRes = await supabase
        .from("focal_lengths")
        .select("focal_length");
      setFocalLengths(
        focalLengthsRes.data.map((focalLength) => focalLength.focal_length)
      );

      // Fetch statuses data
      const statusesRes = await supabase
        .from("inventory_item_statuses")
        .select("name");
      setStatuses(statusesRes.data.map((status) => status.name));
    } catch (error) {
      console.error("Error fetching data:", error);
      enqueueSnackbar("Error fetching data.", { variant: "error" });
    }
  };

  const handleEditDialogSave = async (purchaseOrder) => {
    try {
      if (isNewItem) {
        // Generate id for the new inventory item
        const itemId = `${purchaseOrder.id}_${purchaseOrder.itemCount + 1}`;
        // Insert new item
        const { error } = await supabase.from("inventory_items").insert([
          {
            id: itemId,
            category: inventoryItem.category,
            subcategory: inventoryItem.subcategory,
            brand: inventoryItem.brand,
            model: inventoryItem.model,
            f_stop: inventoryItem.fStop,
            focal_length: inventoryItem.focalLength,
            details: inventoryItem.details,
            serial_number: inventoryItem.serialNumber,
            status: inventoryItem.status,
          },
        ]);

        if (error) {
          throw new Error(error.message);
        }

        // Update purchase order item count
        const { error: purchaseOrderError } = await supabase
          .from("purchase_orders")
          .update({
            item_count: supabase.sql("item_count + 1"),
          })
          .eq("id", purchaseOrder.id);

        if (purchaseOrderError) {
          throw new Error(purchaseOrderError.message);
        }

        enqueueSnackbar("New inventory item added successfully.", {
          variant: "success",
        });
      } else {
        // Update existing item
        const { error } = await supabase
          .from("inventory_items")
          .update({
            category: inventoryItem.category,
            subcategory: inventoryItem.subcategory,
            brand: inventoryItem.brand,
            model: inventoryItem.model,
            f_stop: inventoryItem.fStop,
            focal_length: inventoryItem.focalLength,
            details: inventoryItem.details,
            serial_number: inventoryItem.serialNumber,
            status: inventoryItem.status,
            last_updated_at: new Date().toISOString(),
          })
          .eq("id", inventoryItem.id);

        if (error) {
          throw new Error(error.message);
        }
        enqueueSnackbar("Inventory item updated successfully.", {
          variant: "success",
        });
      }
      handleEditDialogClose();
      fetchInventoryItem();
    } catch (error) {
      enqueueSnackbar("Error saving inventory item.", { variant: "error" });
      console.error("Error saving inventory item:", error);
    }
  };

  const handleFieldChange = (field) => (event) => {
    setInventoryItem({
      ...inventoryItem,
      [field]: event.target.value,
    });
  };

  return (
    <Dialog
      open={openEditDialog}
      onClose={handleEditDialogClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isNewItem ? "Add New Inventory Item" : "Edit Inventory Item"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginTop: "5px" }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                label="Category"
                value={inventoryItem.category || ""}
                onChange={handleFieldChange("category")}
              >
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
              <Select
                name="subcategory"
                label="Subcategory"
                value={inventoryItem.subcategory || ""}
                onChange={handleFieldChange("subcategory")}
              >
                {subcategories.map((subcategory) => (
                  <MenuItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                name="brand"
                label="Brand"
                value={inventoryItem.brand || ""}
                onChange={handleFieldChange("brand")}
              >
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                name="model"
                label="Model"
                value={inventoryItem.model || ""}
                onChange={handleFieldChange("model")}
              >
                {models.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>F-stop</InputLabel>
              <Select
                name="f_stop"
                label="F-stop"
                value={inventoryItem.f_stop || ""}
                onChange={handleFieldChange("f_stop")}
              >
                {fStops.map((fStop) => (
                  <MenuItem key={fStop} value={fStop}>
                    {fStop}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Focal Length</InputLabel>
              <Select
                name="focal_length"
                label="Focal Length"
                value={inventoryItem.focal_length || ""}
                onChange={handleFieldChange("focal_length")}
              >
                {focalLengths.map((focalLength) => (
                  <MenuItem key={focalLength} value={focalLength}>
                    {focalLength}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="details"
              label="Details"
              value={inventoryItem.details || ""}
              onChange={handleFieldChange("details")}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="serial_number"
              label="Serial Number"
              value={inventoryItem.serial_number || ""}
              onChange={handleFieldChange("serial_number")}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                label="Status"
                value={inventoryItem.status || ""}
                onChange={handleFieldChange("status")}
              >
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
        <Button
          onClick={() => handleEditDialogSave(purchaseOrder)}
          color="primary"
        >
          {isNewItem ? "Add" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOrEditInventoryItem;
