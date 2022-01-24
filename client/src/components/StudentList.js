import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import DeleteDialog from './DeleteDialog'

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250},
  { field: 'student_id', headerName: 'Student ID', width: 250},
  { 
    field: 'school',
    headerName: 'School',
    width: 250,
  },
  {
    field: 'route',
    headerName: 'Route',
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
          to={"/students/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View Student
        </Button>
      </>
    ),
  },
];

// static at the moment
const rows = [
  { name: 'A B', student_id: "ab@gmail.com", school: "1 Main St." , route: "abc", id: "1"},
  { name: 'D e', student_id: "bc@gmail.com", school: "2 Main St.", route: "efg", id:"2"},
  { name: 'School 3',student_id: "ab@gmail.com", school: "3 Main St." , route: "hi",id:"3"},
  { name: 'School 4', student_id: "ab@gmail.com",school: "4 Main St." , route: "jk",id:"4"},
  { name: 'School 5', student_id: "ab@gmail.com",school: "5 Main St." , route: "ef",id:"5"},
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
      to={"/signup"}
      color="primary"
      variant="outlined"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Add User
      </Button>
      </>
  );
}