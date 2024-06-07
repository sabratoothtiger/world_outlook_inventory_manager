import { formatDate, formatFinancialData } from "../formattingUtils";

export function PurchaseOrderTableColumns() {
  const columns = [
    {
      field: "supplier",
      headerName: "Supplier",
      minWidth: 30,
    },
    {
      field: "supplier_reference_id",
      headerName: "ID",
      minWidth: 100,
    },
    {
      field: "order_date",
      headerName: "Ordered On",
      minWidth: 100,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 100,
    },
    {
      field: "last_updated_at",
      headerName: "Updated",
      minWidth: 100,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "tracking_number",
      headerName: "Tracking Number",
      minWidth: 200,
    },
    {
      field: "acquisition_cost",
      headerName: "Acquisition Cost",
      minWidth: 100,
      valueFormatter: (params) => formatFinancialData(params.value),
    },
    {
      field: "item_count",
      headerName: "Item Count",
      minWidth: 50,
    },
    {
      field: 'avgCostPerItem',
      headerName: 'Avg Cost per Item',
      width: 180,
      renderCell: (params) => {
        const itemCount = params.row.item_count;
        const acquisitionCost = params.row.acquisition_cost;
        let avgCost = '--';
        if (itemCount !== 0) {
          avgCost = acquisitionCost / itemCount;
          avgCost = isNaN(avgCost) ? '--' : avgCost;
        }
        return formatFinancialData(avgCost);
      },
    },
  ];

  return columns;
}

export function POInventoryItemsTableColumns() {
  const columns = [
    {
      field: "id",
      headerName: "ID",
      type: "text",
      width: 200,
      editable: false,
    },
    {
      field: "category",
      headerName: "Category",
      type: "singleSelect",
      width: 100,
      editable: false,
    },
    {
      field: "subcategory",
      headerName: "Subcategory",
      type: "singleSelect",
      width: 100,
      editable: false,
    },
    {
      field: "brand",
      headerName: "Brand",
      type: "singleSelect",
      width: 100,
      editable: false,
    },
    {
      field: "model",
      headerName: "Model",
      type: "singleSelect",
      width: 100,
      editable: false,
    },
    {
      field: "f_stop",
      headerName: "F-stop",
      type: "singleSelect",
      width: 180,
      editable: false,
    },
    {
      field: "focal_length",
      headerName: "Focal Length",
      type: "singleSelect",
      width: 100,
      editable: false,
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      type: "singleSelect",
      editable: false,
    },
  ];

  return columns;
}
