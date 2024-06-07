import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { DateField, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { supabase } from '../client';
import { useSnackbar } from 'notistack';
import EditIcon from '@mui/icons-material/Edit';


const EditPurchaseOrder = ({ purchaseOrder, setPurchaseOrder, fetchPurchaseOrder }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchStatuses();
  }, []);

  async function fetchStatuses() {
    const { data } = await supabase.from('purchase_order_statuses').select('name');
    setStatuses(data.map((status) => status.name));
  }

  const handleEditClick = () => {
    setOpenEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
  };

  const handleEditDialogSave = async () => {
    try {
      await supabase
        .from('purchase_orders')
        .update({
          order_date: purchaseOrder.order_date ? purchaseOrder.order_date.toISOString() : null,
          tracking_number: purchaseOrder.tracking_number,
          status: purchaseOrder.status,
          acquisition_cost: purchaseOrder.acquisition_cost,
        })
        .eq('id', purchaseOrder.id);

      enqueueSnackbar('Purchase order updated successfully.', { variant: 'success' });
      setOpenEditDialog(false);
      fetchPurchaseOrder();
    } catch (error) {
      enqueueSnackbar('Error updating purchase order.', { variant: 'error' });
      console.error('Error updating purchase order:', error);
    }
  };

  const handleFieldChange = (field) => (event) => {
    setPurchaseOrder({
      ...purchaseOrder,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (date) => {
    setPurchaseOrder({
      ...purchaseOrder,
      order_date: date,
    });
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleEditClick}
        sx={{ mr: 1 }}
        startIcon= {<EditIcon />}
      >
        Edit
      </Button>

      <Dialog open={openEditDialog} onClose={handleEditDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: '5px' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="supplier"
                label="Supplier"
                value={purchaseOrder.supplier}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="supplier_reference_id"
                label="Supplier Reference ID"
                value={purchaseOrder.supplier_reference_id}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateField
                  label="Ordered Date"
                  name="order_date"
                  value={purchaseOrder.order_date}
                  onChange={handleDateChange}
                  fullWidth
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  label="Status"
                  value={purchaseOrder.status}
                  onChange={handleFieldChange('status')}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
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
                onChange={handleFieldChange('tracking_number')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="acquisition_cost"
                label="Acquisition Cost"
                type="number"
                value={purchaseOrder.acquisition_cost}
                onChange={handleFieldChange('acquisition_cost')}
                InputProps={{ inputProps: { step: 'any' } }}
                fullWidth
              />
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
    </>
  );
};

export default EditPurchaseOrder;
