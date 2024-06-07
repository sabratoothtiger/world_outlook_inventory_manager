// src/components/AddPurchaseOrderForm.js

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
import { DateField, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { supabase } from "../client";
import { enqueueSnackbar } from "notistack";
import { getFormattedTodayDate } from "../formattingUtils";
import { NumericFormat } from "react-number-format";
import AddIcon from "@mui/icons-material/Add";

const AddPurchaseOrderForm = ({ fetchPurchaseOrders }) => {
  const [purchaseOrder, setPurchaseOrder] = useState({
    supplier: "",
    supplier_reference_id: "",
    order_date: getFormattedTodayDate(), // Set default date to today
    tracking_number: "",
    acquisition_cost: "",
    status: "Ordered",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchStatuses();
  }, []);

  async function fetchSuppliers() {
    const { data } = await supabase.from("suppliers").select("name");
    setSuppliers(data.map((supplier) => supplier.name));
  }

  async function fetchStatuses() {
    const { data } = await supabase.from("purchase_order_statuses").select("name").order('id', { ascending: true });
    setStatuses(data.map((status) => status.name));
  }

  const handleAddClick = () => {
    setOpenAddDialog(true);
  };

  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
  };

  const handleAddDialogSave = async (event) => {
    event.preventDefault();
    const currentTime = new Date(Date.now()).toISOString();

    const { data, error } = await supabase.from("purchase_orders").insert([
      {
        id: purchaseOrder.supplier + "_" + purchaseOrder.supplier_reference_id,
        created_at: currentTime,
        last_updated_at: currentTime,
        supplier: purchaseOrder.supplier,
        supplier_reference_id: purchaseOrder.supplier_reference_id,
        order_date: purchaseOrder.order_date || null,
        tracking_number: purchaseOrder.tracking_number,
        status: purchaseOrder.status,
        acquisition_cost: purchaseOrder.acquisition_cost || null,
        item_count: 0,
      },
    ]);

    if (error) {
      console.error("Error inserting data: ", error);
      enqueueSnackbar("Oh no! We couldn't save the purchase order", { variant: 'error' })
      return;
    } else {
      enqueueSnackbar("Yay! We added purchase order " + data.id, { variant: 'success' })
    }

    setPurchaseOrder({
      supplier: "",
      supplier_reference_id: "",
      order_date: getFormattedTodayDate(), // Reset to today's date
      tracking_number: "",
      acquisition_cost: "",
      status: "Ordered",
    });

    fetchPurchaseOrders();
    handleAddDialogClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPurchaseOrder((prevOrder) => ({
      ...prevOrder,
      [name]: value,
    }));
  };

  const handleCostChange = (values) => {
    const { floatValue } = values;
    setPurchaseOrder({
      ...purchaseOrder,
      acquisition_cost: floatValue,
    });
  };


  return (
    <>
    
    <Button
        variant="contained"
        color="primary"
        onClick={handleAddClick}
        startIcon={<AddIcon />}
        sx={{ mr: 1 }}
      >
        Add
      </Button>
    <Dialog 
        open={openAddDialog}
        onClose={handleAddDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Add Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: '5px' }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth className="formControl">
                <InputLabel>Supplier</InputLabel>
                <Select
                  name="supplier"
                  label="Supplier"
                  value={purchaseOrder.supplier}
                  onChange={handleChange}
                >
                  {suppliers.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="supplier_reference_id"
                label="Supplier Reference ID"
                value={purchaseOrder.supplier_reference_id}
                onChange={handleChange}
                fullWidth
                required
                className="textField"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateField
                  label="Ordered Date"
                  name="order_date"
                  value={purchaseOrder.order_date}
                  onChange={(date) => setPurchaseOrder((prevOrder) => ({
                    ...prevOrder,
                    order_date: date,
                  }))}
                  fullWidth
                  className="textField"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth className="formControl">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  label="Status"
                  value={purchaseOrder.status}
                  onChange={handleChange}
                >
                  {statuses.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="tracking_number"
                label="Tracking Number"
                value={purchaseOrder.tracking_number}
                onChange={handleChange}
                fullWidth
                className="textField"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <NumericFormat
                name="acquisition_cost"
                label="Acquisition Cost"
                value={purchaseOrder.acquisition_cost}
                customInput={TextField}
                thousandSeparator
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
                fullWidth
                onValueChange={handleCostChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddDialogSave} color="primary">
            Save
          </Button>
          </DialogActions>
    </Dialog>

    </>
  );
};

export default AddPurchaseOrderForm;