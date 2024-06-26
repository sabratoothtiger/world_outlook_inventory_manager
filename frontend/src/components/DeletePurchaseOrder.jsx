import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useSnackbar } from "notistack";
import DeleteIcon from "@mui/icons-material/Delete";

const DeletePurchaseOrder = ({ purchaseOrderId, fetchPurchaseOrders }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDeleteDialog(false);
    setConfirmationText("");
  };

  const handleDialogConfirm = async () => {
    if (confirmationText !== "delete") {
      enqueueSnackbar('You must type "delete" to confirm.', {
        variant: "error",
      });
      return;
    }

    try {
      const { error: poDeletion } = await supabase
        .from("purchase_order_histories")
        .delete()
        .eq("purchase_order_id", purchaseOrderId);
      if (poDeletion) throw new Error(poDeletion.message);

      const { data, error: inventoryCollectionError } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("purchase_order_reference_id", purchaseOrderId);
      if (inventoryCollectionError)
        throw new Error(inventoryCollectionError.message);
      for (const item of data) {
        await supabase
          .from("inventory_item_histories")
          .delete()
          .eq("inventory_item_id", item.id);
        await supabase.from("inventory_items").delete().eq("id", item.id);
      }

      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", purchaseOrderId);
      if (error) throw new Error(error.message);

      navigate("/"); // Navigate back to the purchase orders list
      enqueueSnackbar("Purchase order deleted successfully.", {
        variant: "success",
      });
      fetchPurchaseOrders();
    } catch (error) {
      enqueueSnackbar("Error deleting purchase order: " + error, {
        variant: "error",
      });
      console.error("Error deleting purchase order:", error);
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
            Deleting this purchase order is permanent. It will also delete all
            related inventory items. Are you sure you want to proceed?
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
