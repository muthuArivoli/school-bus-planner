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

function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "pickup_time" : "pickup_time", "dropoff_time": "dropoff_time"};

  const{
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: {sortBy}
  } = useTable({columns, data, initialState: {pageIndex: 0}, manualSortBy: true},  useFilters, useSortBy);

  React.useEffect(()=>{
    console.log(sortBy)
    if(sortBy.length === 0){
      setSortModel([]);
    }
    else{
    setSortModel([{field: mappingss[sortBy[0].id], sort: sortBy[0].desc ? 'desc' : 'asc'}])
    }
  }, [sortBy])


  return (
    <>
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          < tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              < th {...column.getHeaderProps(column.getSortByToggleProps())}                       
              style={{
                borderBottom: 'solid 3px red',
                color: 'black',
              }}>{column.render('Header')} 
                     <span>
                       {column.canSort ? column.isSorted
                           ? column.isSortedDesc
                               ? <KeyboardArrowDownOutlinedIcon/>
                               : <KeyboardArrowUpOutlinedIcon/>
                           : <UnfoldMoreOutlinedIcon/> : ""}
                    </span>              
              
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {/* rows to page */}
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>
                  {/* <Link component={RouterLink} to={"/schools/" + params.value.id}>{params.value.name}</Link>*/}
                  {cell.render('Cell')}</td> 
              })}
            </tr>
          )
        })}
      </tbody>
    </table>


    </>
  )

}

export default function DataTable(props) {

  const [sortModel, setSortModel] = React.useState([]);
  const reactColumns = React.useMemo(
    () => [
      {
        Header: "Stop",
        accessor: "name"
      },
      {
        Header: "Pick-Up Time",
        accessor: "pickup_time"
      },
      {
        Header: "Drop-Off Time",
        accessor: "dropoff_time"
      }
    ]
  )

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

            {/* <Table columns = {reactColumns} data = {props.rows} setSortModel={setSortModel}/> */}

          </div>
        </div>
      </div>
    </>
  );
}