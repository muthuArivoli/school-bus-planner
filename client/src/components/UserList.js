import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, getGridStringOperators } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import tableStyle from './tablestyle.css';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import TablePagination from '@mui/material/TablePagination';


const columns = [
  { field: 'name', headerName: 'Full Name', width: 250, filterable: false,
  renderCell: (params) => (
    <>
    <Link component={RouterLink} to={"/users/" + params.value.id}>
      {params.value.name}
    </Link>
    </>
  )},
  { field: 'email', headerName: 'Email', width: 250, filterable: false},
  { field: 'address', headerName: 'Address', width: 400, sortable: false, filterable: false},
  { 
    field: 'admin',
    headerName: 'Admin',
    width: 200,
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


  const [filterType, setFilterType] = React.useState(null);
  const filterValues = ['name', 'email'];

  const mappings = {"name": "full_name", "email": "email"}

  React.useEffect(()=> {
    const fetchData = async() => {

      setLoading(true);
      let params = {}
      params.page = showAll ? null : page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = mappings[sortModel[0].field];
        params.dir = sortModel[0].sort;
      }

      if(filterType == 'name'){
        params.name = filterStr;
      }
      else if(filterType == 'email'){
        params.email = filterStr;
      }
      else if(filterStr != "") {
        setFilterStr("");
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
        console.log(result.data.users);
        console.log(result.data);
        setTotalRows(result.data.records);
        let arr = result.data.users.map((value) => {
          console.log({name: value.full_name, id: value.id, address: value.uaddress, email: value.email, admin: value.admin_flag});
          return {name: {name: value.full_name, id: value.id}, id: value.id, address: value.uaddress, email: value.email, admin: value.admin_flag};
        });
        setRows(arr);
        setData(arr);
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
  }, [page, sortModel, filterStr, filterType, showAll])

  return (
    <>
    <Grid container>
      <Grid item md={3} lg={3}>
    <Autocomplete
      options={filterValues}
      value={filterType}
      autoSelect
      onChange={(e, new_value) => setFilterType(new_value)}
      renderInput={(params) => (
        <TextField {...params} label="Filter By..." />
      )}
    />
    </Grid>
    <Grid item md={9} lg={9}>
    <TextField
          label="Search"
          name="Search"
          type="search"
          fullWidth
          id="outlined-start-adornment"
          disabled={filterType == null}
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
    </div>

      </>
  );
}