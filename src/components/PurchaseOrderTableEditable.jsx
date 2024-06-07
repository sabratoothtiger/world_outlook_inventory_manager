import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderTableColumns } from './TableColumns';

export default function PurchaseOrderTableEditable({ rows, loading }) {
  const [selectedRow, setSelectedRow] = useState(null);
  const navigate = useNavigate();

  const handleRowSelectionChange = (selection) => {
    if (selection.length === 1) {
      setSelectedRow(selection[0]);
    } else {
      setSelectedRow(null);
    }
  };

  const handleRowDoubleClick = (row) => {
    navigate(`/purchase-orders/${row.id}`);
  };

  var columns = PurchaseOrderTableColumns();
  columns = columns.map((col) => ({ ...col, flex: 1 })); // Automatically fill the width of the viewport

  return (
    <Box
      sx={{
        height: 500,
        width: '100%',
      }}
    >
      <DataGrid
        rows={rows || []} // Ensure rows is an array
        columns={columns || []} // Ensure columns is an array
        loading={loading}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: {
            pageSize: 25,
          },
        }}
        onSelectionModelChange={handleRowSelectionChange}
        onRowDoubleClick={handleRowDoubleClick}
        rowSelectionModel={selectedRow ? [selectedRow] : []}
        autoHeight
      />
    </Box>
  );
}
