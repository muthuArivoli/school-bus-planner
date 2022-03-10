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
import { DateTime } from "luxon";

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