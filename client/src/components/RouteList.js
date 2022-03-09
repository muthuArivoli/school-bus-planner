import * as React from 'react';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';

const columns = [
  { field: 'name', headerName: 'Route Name', width: 350, filterable: false,
  renderCell: (params) => (
    <>
    <Link component={RouterLink} to={"/routes/" + params.value.id}>
      {params.value.name}
    </Link>
    </>
  )
  },
  {
    field: 'school',
    headerName: 'School',
    width: 350,
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
    field: 'students',
    headerName: 'Number of Students',
    width: 200,
    filterable: false
  },
  {
    field: 'complete',
    headerName: 'Is Route Complete?',
    width: 150,
    filterable: false,
    sortable: false,
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

function NoRoutesOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Routes Exist</Box>
    </GridOverlay>
  );
}

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

  let navigate = useNavigate();

  const [showAll, setShowAll] = React.useState(false);

  const mappings = {'name': 'name', 'school': 'school_id', 'students': 'student_count'}

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
      else if(filterStr != "") {
        setFilterStr("");
      }

      console.log(params);
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
        setTotalRows(result.data.records);
        setRows(newRows);
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
        components={{
          NoRowsOverlay: NoRoutesOverlay,
        }}
      />
    </div>
    </>
  );
}