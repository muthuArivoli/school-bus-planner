import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250},
  { field: 'email', headerName: 'Email', width: 250},
  { field: 'address', headerName: 'Address', width: 250},
  { 
    field: 'admin',
    headerName: 'Admin',
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
          to={"/users/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View User
        </Button>
      </>
    ),
  },
];

// static at the moment
const rows = [
  { name: 'A B', email: "ab@gmail.com", address: "1 Main St." , admin: true, id: "1"},
  { name: 'D e', email: "bc@gmail.com", address: "2 Main St.", admin: false, id:"2"},
  { name: 'School 3',email: "ab@gmail.com", address: "3 Main St." , admin: false,id:"3"},
  { name: 'School 4', email: "ab@gmail.com",address: "4 Main St." , admin: false,id:"4"},
  { name: 'School 5', email: "ab@gmail.com",address: "5 Main St." , admin: false,id:"5"},
];

export default function DataTable() {
  return (
    <>
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
    <Button
      component={RouterLink}
      to={"/users/create"}
      color="primary"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create User
      </Button>
      </>
  );
}