import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import Box from '@mui/material/Box';

import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import TablePagination from '@mui/material/TablePagination';



function NoStopsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Stops in Route</Box>
    </GridOverlay>
  );
}

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
              autoPageSize
              disableSelectionOnClick
              density="compact"
              components={{
                NoRowsOverlay: NoStopsOverlay,
              }}
            /> 
          </div>
        </div>
      </div>
    </>
  );
}