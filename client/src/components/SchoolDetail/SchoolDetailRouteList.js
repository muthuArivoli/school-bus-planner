import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const columns = [
  { field: 'name', headerName: 'Route Name', width: 200},
  {
    field: 'complete', headerName: "Route Complete", width: 150,
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
  {
    field: 'id',
    headerName: 'Detailed View',
    width: 200,
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

export default function DataTable(props) {
  return (
    <div style={{ height: 400, width: '100%' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              rows={props.rows}
              columns={columns}
              getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              density="compact"
            />
          </div>
        </div>
      </div>
  );
}