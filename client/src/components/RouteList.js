import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, getGridStringOperators } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'Route Name', width: 250,
  filterOperators: getGridStringOperators().filter(
    (operator) => operator.value === 'contains',
  )
  },
  {
    field: 'school',
    headerName: 'School',
    width: 250,
    filterable: false
  },
  {
    field: 'students',
    headerName: 'Number of Students',
    width: 250,
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
          to={"/routes/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View Route
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
  const [buttonStr, setButtonStr] = React.useState("Show all routes");
  let navigate = useNavigate();

  const [showAll, setShowAll] = React.useState(false);

  const handleShowAll = () => {
    if (!showAll){
      setButtonStr("Show less routes");
      setShowAll(true);
      setPage(0);
    }
    else{
      setButtonStr("Show all routes");
      setShowAll(false);
      setPage(0);
    }
  }

  const mappings = {'name': 'name', 'school': 'school_id', 'students': 'student_count'}

  React.useEffect(()=> {
    const fetchData = async() => {
      let params = {}
      params.page = showAll ? null : page + 1;

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
      }


      console.log(params);
      const result = await axios.get(
        'http://localhost:5000/route', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let arr = [];
        let data = result.data.routes
        console.log(data);
        setTotalRows(result.data.records);
        if(showAll){
          setPageSize(result.data.records);
        }
        else{
          setPageSize(10);
        }
        for (let i=0;i<data.length; i++){
          const getRes = await axios.get(
            `http://localhost:5000/school/${data[i].school_id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (getRes.data.success){
            arr = [...arr, {name: data[i].name, id: data[i].id, school: getRes.data.school.name, students: data[i].students.length}]
          }
          else{
            props.setSnackbarMsg(`Routes could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/routes");
          }
        }
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
  }, [page, sortModel, filterModel, showAll])

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
    </div>
  );
}