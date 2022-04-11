import * as React from 'react';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';

import MauTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination';

import { Helmet } from 'react-helmet';

function NoRoutesOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Routes Exist</Box>
    </GridOverlay>
  );
}


function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "school.name": "school", "students": "students", "complete": "complete"}; //school.name : school

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
    <MauTable {...getTableProps()}>
      <TableHead>
        {headerGroups.map(headerGroup => (
          < TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              < TableCell {...column.getHeaderProps(column.getSortByToggleProps())}>{column.render('Header')} 
                     <span>
                       {column.canSort ? column.isSorted
                           ? column.isSortedDesc
                               ? <KeyboardArrowDownOutlinedIcon/>
                               : <KeyboardArrowUpOutlinedIcon/>
                           : <UnfoldMoreOutlinedIcon/> : ""}
                    </span>              
              
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {/* rows to page */}
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <TableCell {...cell.getCellProps()}>
                  {/* <Link component={RouterLink} to={"/schools/" + params.value.id}>{params.value.name}</Link>*/}
                  {cell.render('Cell')}</TableCell> 
              })}
            </TableRow>
          )
        })}
      </TableBody>
    </MauTable>


    </>
  )

}


export default function DataTable(props) {

  const [data, setData] = React.useState([]);
  const reactColumns = React.useMemo(
    () => [
      {
        Header: "Route Name",
        accessor: "name.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/routes/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)
      },
      {
        Header: "School",
        accessor: "school.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/schools/" + row.row.original.school.id}>{row.row.original.school.name}</Link></>)

      },
      {
        Header: "Number of Students",
        accessor: "students",
      },
      {
        Header: "Is Route Complete?",
        accessor: "complete",
        Cell: (row) => (<>{ row.row.original.complete ? <CheckIcon/>:<CloseIcon/> }</>), //show checkbox,
        disableSortBy: true
      },
      {
        Header: "In Transit?",
        accessor: "in_transit",
        Cell: (row) => (<>{ row.row.original.in_transit ? <CheckIcon/>:<CloseIcon/> }</>), //show checkbox,
        disableSortBy: true
      },
      ,
      {
        Header: "Bus Number",
        accessor: "bus.number",
        disableSortBy: true
      },
      {
        Header: "Driver",
        accessor: "bus.user.full_name",
        disableSortBy: true
      }

    ]
  )

  const [rows, setRows] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterStr, setFilterStr] = React.useState("");

  const [loading , setLoading] = React.useState(true);

  let navigate = useNavigate();

  const [showAll, setShowAll] = React.useState(false);

  const mappings = {'name': 'name', 'school': 'school_id', 'students': 'student_count'}

  React.useEffect(()=> {
    let active = true;
    const fetchData = async() => {
      setLoading(true);
      let params = {}
      params.page = showAll ? null : page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = mappings[sortModel[0].field];
        params.dir = sortModel[0].sort;
      }
      params.name = filterStr;

      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/route', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let newRows = result.data.routes.map((value)=>{
          return {...value, name: {name: value.name, id: value.id}, students: value.students.length}
        })
        if(active){
          setTotalRows(result.data.records);
          setData(newRows)
          setRows(newRows);
        }
      }
      else{
        // console.log(result.data)
        props.setSnackbarMsg(`Routes could not be loaded - route`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [page, sortModel, filterStr, showAll])

  return (
    <>
    <Helmet>
      <title>
        Routes
      </title>
    </Helmet>
 <Grid container>
    <Grid item md={12} lg={12}>
    <TextField
          label="Search"
          name="Search"
          type="search"
          fullWidth
          id="outlined-start-adornment"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
          }}
          value={filterStr}
          onChange={(e)=>setFilterStr(e.target.value)}
        />
        </Grid>
        </Grid>
    <div style={{ height: 400, width: '100%' }}>
{/*       <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
        pagination
        paginationMode={totalRows > 100 && pageSize != 10 ? "client" : "server"}
        rowCount={totalRows}
        page={page}
        onPageChange={(page) => setPage(page)}
        pageSize={pageSize}
        onPageSizeChange={(pageSize) => {setShowAll(pageSize != 10);
          setPageSize(pageSize)
          setPage(0);}}
        rowsPerPageOptions={[10, totalRows > 100 ? 100 : totalRows]}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={(sortModel) => setSortModel(sortModel)}
        disableSelectionOnClick
        loading={loading}
        components={{
          NoRowsOverlay: NoRoutesOverlay,
        }}
      /> */}

      <Table columns = {reactColumns} data = {data} setSortModel={setSortModel}/>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={(event, page) => setPage(page)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          let pageSize = event.target.value;
          setShowAll(pageSize != 10);
          setPageSize(pageSize)
          setPage(0);}}
          rowsPerPageOptions={[10, { label: 'All', value: totalRows }]}
      />
 
    </div>
    </>
  );
}