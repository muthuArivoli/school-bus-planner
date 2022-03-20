import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
//import tableStyle from './tablestyle.css';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import TablePagination from '@mui/material/TablePagination';



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


function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "in_range" : "in_range"};

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
        Header: "Full Name",
        accessor: "name.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/students/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)
      },
      {
        Header: "In Route Range",
        accessor: "in_range",
        Cell: (row) => (<>{ row.row.original.in_range ? <CheckIcon/>:<CloseIcon/> }</>)//show checkbox  
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
                NoRowsOverlay: NoStudentsOverlay,
              }}
            /> 

            {/* <Table columns = {reactColumns} data = {props.rows} setSortModel={setSortModel}/> */}

          </div>
        </div>
      </div>
    </>
  );
}