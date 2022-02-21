import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';


const columns = [
  {field: 'name', headerName: 'Stop', width: 200},
  {field: 'pickup_time',headerName: 'Pick-up Time',width: 200},
  {field: 'dropoff_time',headerName: 'Drop-off Time',width: 200},
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
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              density="compact"
            />
          </div>
        </div>
      </div>
    </>
  );
}