import * as React from 'react';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

function NoStudentsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Students in Route</Box>
    </GridOverlay>
  );
}

const columns = [
  { field: 'name', headerName: 'Full Name', width: 200,
  renderCell: (params) => (
    <Link component={RouterLink} to={"/students/" + params.value.id}>
      {params.value.name}
    </Link>)},
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
  }
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
              disableSelectionOnClick
              density="compact"
              components={{
                NoRowsOverlay: NoStudentsOverlay,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}