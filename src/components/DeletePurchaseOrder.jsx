import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client';
import { useSnackbar } from 'notistack';
import DeleteIcon from '@mui/icons-material/Delete';

const DeletePurchaseOrder = ({ purchaseOrderId, fetchPurchaseOrders }) => {
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
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', purchaseOrderId);

      enqueueSnackbar('Purchase order deleted successfully.', { variant: 'success' });
      navigate('/'); // Navigate back to the purchase orders list
      fetchPurchaseOrders();
    } catch (error) {
      enqueueSnackbar('Error deleting purchase order.', { variant: 'error' });
      console.error('Error deleting purchase order:', error);
    } finally {
      handleDialogClose();
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleDeleteClick}
        startIcon={<DeleteIcon />}
      >
        Delete
      </Button>

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