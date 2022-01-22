import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import SchoolDeleteDialog from './SchoolDeleteDialog'

const columns = [
  { field: 'name', headerName: 'School Name', width: 250,
  },
  {
    field: 'address',
    headerName: 'Address',
    width: 250,
  },
  {
    field: 'id',
    headerName: 'Detailed View',
    width: 250,
    renderCell: (params) => (
      <>
        <Button
          component={RouterLink}
          to={"/schools/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View School
        </Button>
      </>
    ),
  }
];

// static at the moment
const rows = [
  { name: 'School 1', address: "1 Main St." , id: "1"},
  { name: 'School 2', address: "2 Main St.", id:"2"},
  { name: 'School 3', address: "3 Main St." ,id:"3"},
  { name: 'School 4', address: "4 Main St." ,id:"4"},
  { name: 'School 5', address: "5 Main St." ,id:"5"},
  { name: 'School 6', address: "6 Main St.",id:"6" },
  { name: 'School 7', address: "7 Main St.",id:"7" },
  { name: 'School 8', address: "8 Main St.",id:"8" },
  { name: 'School 9', address: "9 Main St.",id:"9" },
  { name: 'School 10', address: "10 Main St.",id:"10" },
];

export default function DataTable() {
  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
      />
    </div>
  );
}