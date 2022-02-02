import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid, getGridStringOperators, getGridNumericColumnOperators} from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250, filterOperators: getGridStringOperators().filter(
    (operator) => operator.value === 'contains',
  )},
  { field: 'student_id', headerName: 'Student ID', width: 250, type: 'number',  filterOperators: getGridNumericColumnOperators().filter(
    (operator) => operator.value === '=',
  )},
  { 
    field: 'school',
    headerName: 'School',
    width: 250,
    filterable: false
  },
  {
    field: 'route',
    headerName: 'Route',
    width: 250,
    sortable: false,
    filterable: false
  },
  {
    field: 'id',
    headerName: 'Detailed View',
    sortable: false,
    filterable: false,
    width: 250,
    renderCell: (params) => (
      <>
        <Button
          component={RouterLink}
          to={"/students/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View Student
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
  const [buttonStr, setButtonStr] = React.useState("Show all students");

  const mappings = {"name": "full_name", "student_id": "student_id", "school": "school_id"}

  const [showAll, setShowAll] = React.useState(false);

  const handleShowAll = () => {
    if (!showAll){
      setButtonStr("Show less students");
      setShowAll(true);
      setPage(0);
    }
    else{
      setButtonStr("Show all students");
      setShowAll(false);
      setPage(0);
    }
  }

  React.useEffect(()=> {
    const fetchData = async() => {
      let params = {}
      params.page = showAll ? null : page + 1;

      console.log(sortModel);
      if(sortModel.length > 0) {
        params.sort = mappings[sortModel[0].field];
        params.dir = sortModel[0].sort;
      }

      console.log(filterModel);
      for(let i=0; i<filterModel.items.length; i++){
        if (filterModel.items[i].columnField == 'name'){
          params.name = filterModel.items[i].value;
        }
        if (filterModel.items[i].columnField == 'student_id'){
          params.id = filterModel.items[i].value;
        }
      }

      const result = await axios.get(
        'http://localhost:5000/student', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let arr = [];
        let data = result.data.students
        setTotalRows(result.data.records);
        if(showAll){
          setPageSize(result.data.records);
        }
        else{
          setPageSize(10);
        }
        console.log(data);
        for (let i=0;i<data.length; i++){
          const getRes = await axios.get(
            `http://localhost:5000/school/${data[i].school_id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (getRes.data.success){
            arr = [...arr, {name: data[i].name, student_id: data[i].student_id, school: getRes.data.school.name, route: "", id: data[i].id}]
          }
          else{
            props.setSnackbarMsg(`Students could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }
          if(data[i].route_id != null){
            const getRouteRes = await axios.get(
              `http://localhost:5000/route/${data[i].route_id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            if (getRouteRes.data.success){
              arr[arr.length - 1].route = getRouteRes.data.route.name;
            }
            else{
              props.setSnackbarMsg(`Students could not be loaded`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/students");
            }
          }

        }
        setRows(arr);
      }
      else{
        props.setSnackbarMsg(`Students could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/students");
      }
    };
    fetchData();
  }, [page, sortModel, filterModel, showAll])

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
      to={"/students/create"}
      color="primary"
      variant="outlined"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create Student
      </Button>
      </>
  );
}