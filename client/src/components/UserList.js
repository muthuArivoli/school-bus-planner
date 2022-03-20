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
import tableStyle from './tablestyle.css';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import TablePagination from '@mui/material/TablePagination';

import { Helmet } from 'react-helmet';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

const roles = ["Parent", "Admin", "School Staff", "Driver"]

const columns = [
  { field: 'name', headerName: 'Full Name', width: 200, filterable: false,
  renderCell: (params) => (
    <>
    <Link component={RouterLink} to={"/users/" + params.value.id}>
      {params.value.name}
    </Link>
    </>
  )},
  { field: 'email', headerName: 'Email', width: 300, filterable: false},
  { field: 'address', headerName: 'Address', width: 350, sortable: false, filterable: false},
  { field: 'phone', headerName: 'Phone Number', width: 150, sortable: false, filterable: false},
  { 
    field: 'role',
    headerName: 'Role',
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <>
      {
        roles[params.value] 
      }
      </>
    )
  }
];


function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "email": "email", "admin": "admin"};

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
                borderBottom: 'solid 3px #4169E1',
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
  const [data, setData] = React.useState([]);

  const reactColumns = React.useMemo(
    () => [
      {
        Header: "Full Name",
        accessor: "name.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/users/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)

      },
      {
        Header: "Email",
        accessor: "email",
      
      },
      {
        Header: "Admin",
        accessor: "admin",
        Cell: (row) => (<>{ row.row.original.admin ? <CheckIcon/>:<CloseIcon/> }</>),//show checkbox  
        disableSortBy: true
      }
    ]
  )

  const [rows, setRows] = React.useState([]);
  let navigate = useNavigate();

  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterStr, setFilterStr] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [loading , setLoading] = React.useState(true);

  const [filterRole, setFilterRole] = React.useState(4);

  const mappings = {"name": "full_name", "email": "email"}

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

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = mappings[sortModel[0].field];
        params.dir = sortModel[0].sort;
      }
      params.name = filterStr;
      params.email = filterStr;
      
      if (filterRole != 4){
        params.role = filterRole;
      }

      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/user', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let arr = result.data.users.map((value) => {
          return {name: {name: value.full_name, id: value.id}, id: value.id, address: value.uaddress, email: value.email, role: value.role, phone: value.phone};
        });
        if(active){
          setTotalRows(result.data.records);
          setRows(arr);
          setData(arr);
        }
      }
      else{
        props.setSnackbarMsg(`Users could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [page, sortModel, filterStr, showAll, filterRole])

  return (
    <>
    <Helmet>
      <title>
        Users
      </title>
    </Helmet>
    <Grid container spacing={2}>
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
      <Grid item md={12} lg={12}>
      <FormControl>
                <FormLabel id="role-group-label">Filter by Role</FormLabel>
                <RadioGroup
                  aria-labelledby="role-group-label"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  name="role-group"
                  row
                >
                  <FormControlLabel value={4} control={<Radio />} label="All" />                  
                  <FormControlLabel value={0} control={<Radio />} label="Unprivileged" />
                  <FormControlLabel value={1} control={<Radio />} label="Admin" />
                  <FormControlLabel value={2} control={<Radio />} label="School Staff" />
                  <FormControlLabel value={3} control={<Radio />} label="Driver" />
                </RadioGroup>
                </FormControl>
      </Grid>
        </Grid>
    <div style={{ height: 400, width: '100%' }}>
{/*       <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
        pagination
        rowCount={totalRows}
        paginationMode={totalRows > 100 && pageSize != 10 ? "client" : "server"}
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
          rowsPerPageOptions={[10, totalRows]}
      />
    {
    (role == 1 || role == 2) &&
    <Button
      component={RouterLink}
      to={"/users/create"}
      color="primary"
      variant="contained"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create User
      </Button>
      }
      </div>
      </>
  );
}