import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Link from '@mui/material/Link';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 200,
    renderCell: (params) => (
    <Link component={RouterLink} to={"/students/" + params.value.id}>
      {params.value.name}
    </Link>)},
    {
      field: 'route', headerName: 'Route', width: 200,
      renderCell:(params) => (
      params.value == null ? 
      <CloseIcon/> : 
       <Link component={RouterLink} to={"/routes/" + params.value.id}>
       {params.value.name}
       </Link>
      )
    },
  {
    field: 'in_range',
    headerName: 'In Route Range',
    width: 150,
    renderCell: (params) => (
      <>
      {
        params.value ? 
        <CheckIcon/> : 
        <CloseIcon/>
      }
      </>
    )
  },
];

export default function DataTable(props) {
  return (
    <>
      <div style={{ height: 400, width: '100%' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              rows={props.rows}
              columns={columns}
              getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
              autoPageSize
              loading={props.loading}
              disableSelectionOnClick
              density="compact"
            />
          </div>
        </div>
      </div>
    </>
  );
}