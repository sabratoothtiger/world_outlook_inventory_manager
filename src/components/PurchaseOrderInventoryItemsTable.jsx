import React, { useState } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { supabase } from '../client';
import { POInventoryItemsTableColumns } from './TableColumns';
import AddOrEditInventoryItem from './AddOrEditInventoryItem'; 

const PurchaseOrderInventoryItemsTable = ({ purchaseOrder, inventoryItems, fetchInventoryItems}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [addingNewItem, setAddingNewItem] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleEditClick = (itemId) => () => {
    const item = inventoryItems.find((item) => item.id === itemId);
    setItemToEdit(item);
    setOpenEditDialog(true);
    setAddingNewItem(false);
  };

  const handlePrintClick = (itemId) => () => {
    /* setItemToPrint(itemId); */
  };

  const handleDeleteClick = (itemId) => () => {
    setItemToDelete(itemId);
    setOpenDialog(true);
  };

  const handleAddInventoryClick = () => {
    setItemToEdit({});
    setOpenEditDialog(true);
    setAddingNewItem(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setItemToDelete(null);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setItemToEdit(null);
  };

  const handleDialogConfirm = async () => {
    if (itemToDelete) {
      try {
        await supabase
          .from('inventory_items')
          .delete()
          .eq('id', itemToDelete);

        enqueueSnackbar('Item deleted successfully.', { variant: 'success' });

        fetchInventoryItems();
      } catch (error) {
        enqueueSnackbar('Error deleting item.', { variant: 'error' });
        console.error('Error deleting item:', error);
      } finally {
        handleDialogClose();
      }
    }
  };

  var columns = POInventoryItemsTableColumns();
  columns.push(
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => [
        <GridActionsCellItem
          icon={<PrintIcon />}
          label="Print"
          onClick={handlePrintClick(id)}
          color="inherit"
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={handleEditClick(id)}
          color="inherit"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDeleteClick(id)}
          color="inherit"
        />,
      ],
    }
  );
  columns = columns.map((col) => ({ ...col, flex: 1 })); /* Automatically fill the width of the viewport */

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Inventory Items
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddInventoryClick} startIcon={<AddIcon />} sx={{ mr: 1 }}>
  Add Inventory
</Button>
      <DataGrid
        rows={inventoryItems || []}
        columns={columns || []}
        pageSizeOptions={[10, 15, 20]}
        initialState={{
          pagination: {
            pageSize: 10,
          },
        }}
        autoHeight
      />
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this item?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogConfirm} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {itemToEdit && (
        <AddOrEditInventoryItem
          purchaseOrder={purchaseOrder}
          inventoryItem={itemToEdit}
          setInventoryItem={setItemToEdit}
          fetchInventoryItem={fetchInventoryItems}
          openEditDialog={openEditDialog}
          handleEditDialogClose={handleEditDialogClose}
        />
      )}
      {itemToEdit && addingNewItem && (
        <AddOrEditInventoryItem
          purchaseOrder={purchaseOrder}
          inventoryItem={itemToEdit}
          setInventoryItem={setItemToEdit}
          fetchInventoryItem={fetchInventoryItems}
          openEditDialog={openEditDialog}
          handleEditDialogClose={handleEditDialogClose}
        />
      )}
    </div>
  );
};

export default PurchaseOrderInventoryItemsTable;
