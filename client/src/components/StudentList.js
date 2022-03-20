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
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';

import TablePagination from '@mui/material/TablePagination';
import MauTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { Helmet } from 'react-helmet';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 200, filterable: false,
  renderCell: (params) => (
    <>
    <Link component={RouterLink} to={"/students/" + params.value.id}>
      {params.value.name}
    </Link>
    </>
  )
  },
  { field: 'student_id', headerName: 'Student ID', width: 125, filterable: false},
  { 
    field: 'school',
    headerName: 'School',
    width: 175,
    filterable: false,
    renderCell: (params) => (
      <>
      <Link component={RouterLink} to={"/schools/" + params.value.id}>
        {params.value.name}
      </Link>
      </>
    )
  },
  {
    field: 'route',
    headerName: 'Route',
    width: 175,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
        params.value == null ? 
        <CloseIcon /> : 
        <Link component={RouterLink} to={"/routes/" + params.value.id}>
          {params.value.name}
        </Link>
      ),
  },
  {
    field: 'in_range',
    headerName: 'Has a Stop?',
    width: 125,
    sortable: false,
    filterable: false,
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
    field: 'parent_name',
    headerName: "Parent Name",
    width: 175,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <>
      <Link component={RouterLink} to={"/users/" + params.value.id}>
        {params.value.name}
      </Link>
      </>
    ),
  },
  {
    field: 'parent_phone',
    headerName: "Parent Phone",
    width: 150,
    sortable: false,
    filterable: false
  }
];


function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "student_id": "student_id", "school": "school", "route.name": "route", "in_range":"in_range"};

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
              < TableCell {...column.getHeaderProps(column.getSortByToggleProps())}                       
              >{column.render('Header')} 
                     <span>
                       {column.canSort ? column.isSorted
                           ? column.isSortedDesc
                               ? <KeyboardArrowDownOutlinedIcon/>
                               : <KeyboardArrowUpOutlinedIcon/>
                           : <UnfoldMoreOutlinedIcon/> : ""}
                    </span>              
              
              </TableCell>
            ))}
          </ TableRow>
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
        Header: "Full Name",
        accessor: "name.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/students/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)

      },
      {
        Header: "Student ID",
        accessor: "student_id"
      },
      {
        Header: "School",
        accessor: "school",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/schools/" + row.row.original.school_id}>{row.row.original.school.name}</Link></>)

      },{
        Header: "Route",
        accessor: "route",
        Cell: (row) => (<>{console.log(row)}{row.row.original.route_id != null && <Link component={RouterLink} to={"/routes/" + row.row.original.route_id}>{row.row.original.route.name}</Link>}</>),
        disableSortBy: true
      },
      {
        Header: "Has a Stop?",
        accessor: "in_range",
        Cell: (row) => (<>{ row.row.original.in_range ? <CheckIcon/>:<CloseIcon/> }</>),//show checkbox        
        disableSortBy: true
      },
      {
        Header: "Parent Name",
        accessor: "parent_name",
        Cell: (row) => (<>{console.log(row)}{<Link component={RouterLink} to={"/users/" + row.row.original.parent_name.id}>{row.row.original.parent_name.name}</Link>}</>),
        disableSortBy: true
      },
      {
        Header: "Parent Phone",
        accessor: "parent_phone",
        disableSortBy: true
      },
    ]
  )

  const [rows, setRows] = React.useState([]);
  let navigate = useNavigate();

  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterStr, setFilterStr] = React.useState("");
  const [loading , setLoading] = React.useState(true);
  const mappings = {"name": "name", "student_id": "student_id", "school": "school_id"} 

  const [showAll, setShowAll] = React.useState(false);

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
  }, []) 

  React.useEffect(()=> {
    let active = true;
    const fetchData = async() => {
      setLoading(true);
      let params = {}
      params.page = showAll ? null : page + 1;

      if(sortModel.length > 0) {
        params.sort = mappings[sortModel[0].field];
        params.dir = sortModel[0].sort;
      }
      params.name = filterStr;
      params.id = parseInt(filterStr);

      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/student', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let rows = result.data.students.map((value)=>{
          return {...value, name: {name: value.name, id: value.id}, parent_name: {name: value.user.full_name, id: value.user.id}, parent_phone: value.user.phone}
        })
        if(active){
          setTotalRows(result.data.records);
          setRows(rows);
          setData(rows)
        }
      }
      else{
        props.setSnackbarMsg(`Students could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/students");
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [page, sortModel, filterStr, showAll])

  const handleRowClick = (row) => {
    console.log(row);
  };

  return (
    <>
    <Helmet>
      <title>
        Students
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
        onRowClick={(row) => handleRowClick(row)}
        getRowId={(row) => row.id}
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
          rowsPerPageOptions={[10,{ label: 'All', value: totalRows }]}
      />
    <div style={{height:50}}>
    {
    (role == 1 || role == 2) &&
    <Button
      component={RouterLink}
      to={"/students/create"}
      color="primary"
      variant="contained"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create Student
      </Button>
    }
    </div>
    </div>
      </>
  );
}