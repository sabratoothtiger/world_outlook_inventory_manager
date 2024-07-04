import React, { useCallback, useEffect, useState } from 'react';
import { DataGrid, GridActionsCellItem, GridToolbarQuickFilter } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabase';
import { POInventoryItemsTableColumns } from './TableColumns';
import AddInventoryItem from './AddInventoryItem';
import EditInventoryItem from './EditInventoryItem';
import { sendLabelsToPrinter } from './DymoPrinter';

function CustomToolbar({ handleAddInventoryClick}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginTop: 1,
        marginLeft: 1,
        marginRight: 1,
      }}
    >
      <Button variant="contained" color="primary" onClick={handleAddInventoryClick} startIcon={<AddIcon />}>
        Add Inventory
      </Button>
      <GridToolbarQuickFilter sx={{ width: "20%" }} />
    </Box>
  );
}

const PurchaseOrderInventoryItemsTable = ({ purchaseOrder, inventoryItems, setInventoryItems, onInventoryItemsChange }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [openAddDrawer, setOpenAddDrawer] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleEditClick = (itemId) => () => {
    const item = inventoryItems.find((item) => item.id === itemId);
    setItemToEdit(item);
    setOpenEditDialog(true);
  };

  const fetchInventoryItems = async() => {
    const {data} = await supabase.from('inventory_items').select('*').eq('purchase_order_reference_id', purchaseOrder.id)
    setInventoryItems(data)
  }

  const [modelsLookup, setModelsLookup] = useState({});

  const fetchModelsLookup = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("models")
        .select("id, model");
  
      if (error) throw error;
  
      const lookup = data.reduce((acc, model) => {
        acc[model.id] = model.model;
        return acc;
      }, {});
  
      setModelsLookup(lookup);
    } catch (error) {
      console.error("Error fetching models lookup:", error);
      enqueueSnackbar("Error fetching models lookup: " + error.message, { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchModelsLookup();
    /*
    if (onInventoryItemsChange) {
      onInventoryItemsChange();
    }
    */
  }, [fetchModelsLookup, inventoryItems, onInventoryItemsChange]);

  const handlePrintClick = (itemId) => async () => {
    try {
      const item = inventoryItems.find((item) => item.id === itemId);
      const modelName = modelsLookup[item.model_id] || "";
      const detailsParts = [
        item.brand,
        modelName,
        item.f_stop,
        item.focal_length,
        item.details,
      ];
      const detailsString = detailsParts.filter(part => part).join(" ");
      const barcode = 'INV^' + item.id + '^' + item.serial_number;
      const labelData = [{
        'Inventory ID': item.id,
        'Category': item.category,
        'Details': detailsString,
        'Serial Number': item.serial_number,
        'Inventory Barcode': barcode, 
      }];
      await sendLabelsToPrinter(labelData, 'inventory');
    } catch (error) {
      enqueueSnackbar('Error printing label: ' + error, { variant: 'error' });
      console.error('Error printing label:', error);
    }
  };

  const handleDeleteClick = (itemId) => () => {
    setItemToDelete(itemId);
    setOpenDialog(true);
  };

  const handleAddInventoryClick = () => {
    setItemToEdit(null);
    setOpenAddDrawer(true);
  };

  const handleAddDrawerClose = () => {
    setOpenAddDrawer(false)
    fetchInventoryItems(purchaseOrder.id)
  }

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

        await supabase
          .from('inventory_item_histories')
          .delete() 
          .eq('inventory_item_id', itemToDelete)
       
        // Update purchase order item count
        await supabase.rpc('decrement_item_count', { purchase_order_id: purchaseOrder.id });

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
      <DataGrid
        rows={inventoryItems || []}
        columns={columns || []}
        pageSizeOptions={[15, 25, 50]}
        initialState={{
          pagination: {
            pageSize: 15,
          },
        }}
        components={{ Toolbar: () => <CustomToolbar handleAddInventoryClick={handleAddInventoryClick} /> }}
        autoHeight
      />
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this item?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">Cancel</Button>
          <Button onClick={handleDialogConfirm} color="primary" autoFocus>Confirm</Button>
        </DialogActions>
      </Dialog>
      {openEditDialog &&
          <EditInventoryItem
            inventoryItem={itemToEdit}
            setInventoryItem={setItemToEdit}
            fetchInventoryItem={fetchInventoryItems}
            openEditDialog={openEditDialog}
            handleEditDialogClose={handleEditDialogClose}
          />
      }
      <AddInventoryItem
            purchaseOrder={purchaseOrder}
            openAddDrawer={openAddDrawer}
            handleAddDrawerClose={handleAddDrawerClose}
            fetchInventoryItem={fetchInventoryItems}
          />
    </div>
  );
};

export default PurchaseOrderInventoryItemsTable;
