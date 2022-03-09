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

export default function DataTable(props) {

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
          console.log({name: value.full_name, id: value.id, address: value.uaddress, email: value.email, role: value.role});
          return {name: {name: value.full_name, id: value.id}, id: value.id, address: value.uaddress, email: value.email, role: value.role, phone: value.phone};
        });
        setRows(arr);
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
      <DataGrid
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
      />
    </div>
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
      </>
  );
}