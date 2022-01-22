import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';

const columns = [
  { field: 'name', headerName: 'Route Name', width: 250,
  },
  {
    field: 'school',
    headerName: 'School',
    width: 250,
  },
  {
    field: 'students',
    headerName: 'Number of Students',
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
          to={"/routes/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View Route
        </Button>
      </>
    ),
  }
];

// static at the moment
const rows = [
  { name: 'School 1', school: "1 Main St." , students: "3", id: "1"},
  { name: 'School 2', school: "2 Main St.", students: "3", id:"2"},
  { name: 'School 3', school: "3 Main St.", students: "3" ,id:"3"},
  { name: 'School 4', school: "4 Main St.", students: "3" ,id:"4"},
  { name: 'School 5', school: "5 Main St.", students: "3" ,id:"5"},
  { name: 'School 6', school: "6 Main St.", students: "3",id:"6" },
  { name: 'School 7', school: "7 Main St.", students: "3",id:"7" },
  { name: 'School 8', school: "8 Main St.", students: "3",id:"8" },
  { name: 'School 9', school: "9 Main St.", students: "3",id:"9" },
  { name: 'School 10', school: "10 Main St.", students: "3",id:"10" },
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