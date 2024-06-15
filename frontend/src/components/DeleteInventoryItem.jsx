import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useSnackbar } from 'notistack';
import DeleteIcon from '@mui/icons-material/Delete';

const DeleteInventoryItem = ({ purchaseOrderId, inventoryItemId, fetchInventoryItems }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDeleteDialog(false);
    setConfirmationText('');
  };

  const handleDialogConfirm = async () => {
    if (confirmationText !== 'delete') {
      enqueueSnackbar('You must type "delete" to confirm.', { variant: 'error' });
      return;
    }

    try {
      const {error: historyDelete} = await supabase
      .from('inventory_item_histories')
      .delete() 
      .eq('inventory_item_id', inventoryItemId)
      if (historyDelete) throw new Error(historyDelete.message)
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('inventoryItemId', inventoryItemId);
      if (error) throw new Error(error.message);
      
      // Update purchase order item count
        const { error: purchaseOrderError } = await supabase
      .rpc('decrement_item_count', { purchase_order_id: purchaseOrderId });

      if (purchaseOrderError) throw new Error(purchaseOrderError.message);
      navigate('/'); // Navigate back to the purchase orders list
      enqueueSnackbar('Inventory item deleted successfully.', { variant: 'success' });
      fetchPurchaseOrders();
    } catch (error) {
      enqueueSnackbar('Error deleting inventory item: ' + error, { variant: 'error' });
      console.error('Error deleting inventory item:', error);
    } finally {
      handleDialogClose();
    }
  };

  return (
    <>
      <Dialog open={openDeleteDialog} onClose={handleDialogClose}>
        <DialogTitle>Careful!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deleting this purchase order is permanent. It will also delete all related inventory items. Are you sure you want to proceed?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'delete' to confirm"
            fullWidth
            variant="standard"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogConfirm} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeletePurchaseOrder;