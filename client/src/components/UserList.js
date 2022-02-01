import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, getGridStringOperators } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250,
  filterOperators: getGridStringOperators().filter(
    (operator) => operator.value === 'contains',
  )},
  { field: 'email', headerName: 'Email', width: 250, 
  filterOperators: getGridStringOperators().filter(
    (operator) => operator.value === 'contains',
  )},
  { field: 'address', headerName: 'Address', width: 250, sortable: false, filterable: false},
  { 
    field: 'admin',
    headerName: 'Admin',
    width: 250,
    sortable: false,
    filterable: false
  },
  {
    field: 'id',
    sortable: false,
    filterable: false,
    headerName: 'Detailed View',
    width: 250,
    renderCell: (params) => (
      <>
        <Button
          component={RouterLink}
          to={"/users/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View User
        </Button>
      </>
    ),
  },
];

export default function DataTable(props) {

  const [rows, setRows] = React.useState([]);
  let navigate = useNavigate();

  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterModel, setFilterModel] = React.useState({items: []});
  const [buttonStr, setButtonStr] = React.useState("Show all users");

  const handleShowAll = () => {
    if (buttonStr == "Show all users"){
      setButtonStr("Show less users");
      setPage(-1);
    }
    else{
      setButtonStr("Show all users");
      setPage(0);
    }
  }

  const mappings = {"name": "full_name", "email": "email"}

  React.useEffect(()=> {
    const fetchData = async() => {

      let params = {}
      params.page = page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = mappings[sortModel[0].field];
        params.dir = sortModel[0].sort;
      }

      console.log(filterModel)
      for(let i=0; i<filterModel.items.length; i++){
        if (filterModel.items[i].columnField == 'name'){
          params.name = filterModel.items[i].value;
        }
        if (filterModel.items[i].columnField == 'email'){
          params.email = filterModel.items[i].value;
        }
      }
      console.log(params);
      const result = await axios.get(
        'http://localhost:5000/user', {
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
        if(page == -1){
          setPageSize(result.data.records);
        }
        else{
          setPageSize(10);
        }
        let arr = result.data.users.map((value) => {
          console.log({name: value.full_name, id: value.id, address: value.uaddress, email: value.email, admin: value.admin_flag});
          return {name: value.full_name, id: value.id, address: value.uaddress, email: value.email, admin: value.admin_flag};
        });
        setRows(arr);
      }
      else{
        props.setSnackbarMsg(`Users could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }, [page, sortModel, filterModel])

  return (
    <>
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
        pagination
        paginationMode="server"
        rowCount={totalRows}
        page={page}
        onPageChange={(page) => setPage(page)}
        pageSize={pageSize}
        sortingMode="server"
        sortModel={sortModel}
        filterMode="server"
        onFilterModelChange={(filterModel) => setFilterModel(filterModel)}
        onSortModelChange={(sortModel) => setSortModel(sortModel)}
        disableSelectionOnClick
      />
    </div>
    <Button
      onClick={handleShowAll}
      variant="outlined"
      color="primary"
      size="small"
      style={{ marginLeft: 16 }}
      >
        {buttonStr}
      </Button>
    <Button
      component={RouterLink}
      to={"/users/create"}
      color="primary"
      variant="outlined"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create User
      </Button>
      </>
  );
}