import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid , getGridStringOperators} from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'School Name', width: 250,
  filterOperators: getGridStringOperators().filter(
    (operator) => operator.value === 'contains',
  )
  },
  {
    field: 'address',
    headerName: 'Address',
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
          to={"/schools/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View School
        </Button>
      </>
    ),
  }
];


export default function DataTable(props) {

  const [rows, setRows] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterModel, setFilterModel] = React.useState({items: []});
  const [buttonStr, setButtonStr] = React.useState("Show all schools");

  let navigate = useNavigate();

  const handleShowAll = () => {
    if (buttonStr == "Show all schools"){
      setButtonStr("Show less schools");
      setPage(-1);
    }
    else{
      setButtonStr("Show all schools");
      setPage(0);
    }
  }

  React.useEffect(()=> {
    const fetchData = async() => {
      let params = {}
      params.page = page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = sortModel[0].field;
        params.dir = sortModel[0].sort;
      }

      console.log(filterModel)
      for(let i=0; i<filterModel.items.length; i++){
        if (filterModel.items[i].columnField == 'name'){
          params.name = filterModel.items[i].value;
        }
      }


      console.log(params);
      const result = await axios.get(
        'http://localhost:5000/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        console.log(result.data);
        setTotalRows(result.data.records);
        if(page == -1){
          setPageSize(result.data.records);
        }
        else{
          setPageSize(10);
        }
        let arr = result.data.schools.map((value) => {
          console.log({name: value.name, id: value.id, address: value.address});
          return {name: value.name, id: value.id, address: value.address};
        });
        setRows(arr);
      }
      else{
        props.setSnackbarMsg(`Routes could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }
    };
    fetchData();
  }, [page, sortModel, filterModel])

  return (
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
      to={"/schools/create"}
      variant="outlined"
      color="primary"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create School
      </Button>
    </div>
  );
}