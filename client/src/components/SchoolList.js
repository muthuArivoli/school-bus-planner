import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';

const columns = [
  { field: 'name', headerName: 'School Name', width: 400,
    renderCell: (params) => (
      <>
        {params.value}
        <Button
          href={params.value.replace(/\s+/g, '')}        // Button goes to name of school without spaces
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View School
        </Button>
      </>
    ),
  },
  {
    field: 'address',
    headerName: 'Address',
    width: 100,
  },
];

// static at the moment
const rows = [
  { name: 'School 1', address: "1 Main St." },
  { name: 'Schoolio 2', address: "2 Main St." },
  { name: 'School 3', address: "3 Main St." },
  { name: 'School 4', address: "4 Main St." },
  { name: 'School 5', address: "5 Main St." },
  { name: 'School 6', address: "6 Main St." },
  { name: 'Schoolio 7', address: "7 Main St." },
  { name: 'School 8', address: "8 Main St." },
  { name: 'School 9', address: "9 Main St." },
  { name: 'School 10', address: "10 Main St." },
];

export default function DataTable() {
  return (
    <div style={{ height: 400, width: '75%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.name} //set what is used as ID ******MUST BE UNIQUE***********
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
      />
    </div>
  );
}