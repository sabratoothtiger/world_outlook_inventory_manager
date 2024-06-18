import { formatDate, formatFinancialData } from "../utils/dataFormatting";

export function PurchaseOrderTableColumns() {
  const columns = [
    {
      field: "id",
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
      width: 80,
      editable: false,
    },
    {
      field: "subcategory",
      headerName: "Subcategory",
      type: "singleSelect",
      width: 80,
      editable: false,
    },
    {
      field: "brand",
      headerName: "Brand",
      type: "singleSelect",
      width: 80,
      editable: false,
    },
    {
      field: "model",
      headerName: "Model",
      type: "singleSelect",
      width: 80,
      editable: false,
    },
    {
      field: "f_stop",
      headerName: "F-stop",
      type: "singleSelect",
      width: 80,
      editable: false,
    },
    {
      field: "focal_length",
      headerName: "Focal Length",
      type: "singleSelect",
      width: 80,
      editable: false,
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      type: "singleSelect",
      editable: false,
    },
    {
      field: 'listing_id',
      headerName: 'Listing',
      width: 140,
      type: "text",
      editable: false,
    },
  ];

  return columns;
}

export function ListingsTableColumns() {
  const columns = [
    {
      field: "id",
      headerName: "Listing ID",
      flex: 0,
      minWidth: 170,
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1,
    },
    {
      field: "label_printed",
      headerName: "Printed?",
      flex: 1,
      maxWidth: 80,
    },
    {
      field: 'is_linked',
      headerName: 'Linked?',
      flex: 1,
      maxWidth: 80,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      maxWidth: 120,
    },
  ];

  return columns
}