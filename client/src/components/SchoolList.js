import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { useTable, useSortBy} from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';

import TablePagination from '@mui/material/TablePagination';
import { DateTime } from "luxon";
import { Helmet } from 'react-helmet';
import MauTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CssBaseline from '@mui/material/CssBaseline';
import styled from 'styled-components'

const columns = [
  { field: 'name', headerName: 'School Name', width: 250, filterable: false, 
  renderCell: (params) => (
    <>
    <Link component={RouterLink} to={"/schools/" + params.value.id}>
      {params.value.name}
    </Link>
    </>
  )
  },
  {
    field: 'address',
    headerName: 'Address',
    width: 500,
    sortable: false,
    filterable: false
  },
  {
    field: 'arrival_time',
    headerName: 'Arrival Time',
    width: 150,
    sortable: true, 
    filterable: false
  },
  {
    field: 'departure_time',
    headerName: 'Departure Time',
    width: 150,
    sortable: true,
    filterable: false
  }
];

function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "arrival_time": "arrival_time", "departure_time": "departure_time"};

  const{
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: {sortBy}
  } = useTable({columns, data, initialState: {pageIndex: 0}, manualSortBy: true}, useSortBy);

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
              
              </ TableCell>
            ))}
          </ TableRow>
        ))}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <TableCell {...cell.getCellProps()}>
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
        Header: "School Name",
        accessor: "name.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/schools/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)
      }, 
      {
        Header: "Address",
        accessor: "address",
        disableSortBy: true
      },
      {
        Header: "Arrival Time",
        accessor: "arrival_time"
      },
      {
        Header: "Departure Time",
        accessor: "departure_time"
      }
    ]
  
  );

  const [rows, setRows] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterStr, setFilterStr] = React.useState("");

  const [totalPages, setTotalPages] = React.useState(0);

  const [loading , setLoading] = React.useState(true);

  const [showAll, setShowAll] = React.useState(false);
  let navigate = useNavigate();

  const [role, setRole] = React.useState(0);

  React.useEffect(()=>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if(result.data.success){
        setRole(result.data.user.role);
      }
      else{
        props.setSnackbarMsg(`Current user could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, []);

  function tConvert(time) {
    let date_time = DateTime.fromISO(time);
    return date_time.toLocaleString(DateTime.TIME_SIMPLE);
  }

  React.useEffect(()=> {
    let active = true;
    const fetchData = async() => {
      setLoading(true);
      let params = {}
      params.page = showAll ? null : page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = sortModel[0].field;
        params.dir = sortModel[0].sort;
      }
      params.name = filterStr;

      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let arr = result.data.schools.map((value) => {
          return {name: {name: value.name, id: value.id}, address: value.address, id: value.id, departure_time: tConvert(value.departure_time), arrival_time: tConvert(value.arrival_time)};
        });
        if(active){
          setTotalRows(result.data.records);
          setRows(arr);
          setData(arr);
        }
      }
      else{
        props.setSnackbarMsg(`Schools could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/schools");
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
        Schools
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
    <div style={{ height: 600, width: '100%' }}>
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
          rowsPerPageOptions={[10,  { label: 'All', value: totalRows }]}
      />
      <div style={{height:50}}>
      {
      role == 1 &&
      <Button
      component={RouterLink}
      to={"/schools/create"}
      variant="contained"
      color="primary"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create School
      </Button>
      }
    </div>
    </div>
    </>
  );
}

