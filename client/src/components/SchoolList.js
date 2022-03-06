import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';

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


export default function DataTable(props) {

  const [rows, setRows] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterStr, setFilterStr] = React.useState("");

  const [loading , setLoading] = React.useState(true);

  const [filterType, setFilterType] = React.useState(null);
  const filterValues = ['name'];

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
    time = time.match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    if (time.length > 1) { // If time format correct
      time = time.slice(1);  // Remove full string match value
      time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    let newTime = time.join('');
    let front = newTime.slice(0, -5);
    let back = newTime.slice(-2);
    return front+" "+back;
  }

  React.useEffect(()=> {
    const fetchData = async() => {
      setLoading(true);
      let params = {}
      params.page = showAll ? null : page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = sortModel[0].field;
        params.dir = sortModel[0].sort;
      }

      if(filterType == 'name'){
        params.name = filterStr;
      }
      else if(filterStr != "") {
        setFilterStr("");
      }

      console.log(params);
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        setTotalRows(result.data.records);
        let arr = result.data.schools.map((value) => {
          return {name: {name: value.name, id: value.id}, address: value.address, id: value.id, departure_time: tConvert(value.departure_time), arrival_time: tConvert(value.arrival_time)};
        });
        setRows(arr);
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
      />
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
    </>
  );
}