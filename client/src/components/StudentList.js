import * as React from 'react';
import Button from '@mui/material/Button';
import CheckBoxOutlineBlankTwoToneIcon from '@mui/icons-material/CheckBoxOutlineBlankTwoTone';
import { DataGrid, getGridStringOperators, getGridNumericColumnOperators, getGridBooleanOperators} from '@mui/x-data-grid';
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
    <Link component={RouterLink} to={"/students/" + params.value.id}>
      {params.value.name}
    </Link>
    </>
  )
  },
  { field: 'student_id', headerName: 'Student ID', width: 150, filterable: false},
  { 
    field: 'school',
    headerName: 'School',
    width: 250,
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
    field: 'route',
    headerName: 'Route',
    width: 250,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
        params.value == null ? 
        <CloseIcon /> : 
        <Link component={RouterLink} to={"/routes/" + params.value.id}>
          {params.value.name}
        </Link>
      ),
  },
  {
    field: 'in_range',
    headerName: 'Has a Stop?',
    width: 150,
    renderCell: (params) => (
      <>
      {
        params.value ? 
        <CheckIcon/> : 
        <CloseIcon/>
      }
      </>
    )
  },
];


function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "student_id": "student_id", "school": "school", "route.name": "route", "in_range":"in_range"};

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
                borderBottom: 'solid 3px red',
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
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/students/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)

      },
      {
        Header: "Student ID",
        accessor: "student_id"
      },
      {
        Header: "School",
        accessor: "school",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/schools/" + row.row.original.school_id}>{row.row.original.school.name}</Link></>)

      },{
        Header: "Route",
        accessor: "route",
        Cell: (row) => (<>{console.log(row)}{row.row.original.route_id != null && <Link component={RouterLink} to={"/routes/" + row.row.original.route_id}>{row.row.original.route.name}</Link>}</>),
        disableSortBy: true
      },
      {
        Header: "Has a Stop?",
        accessor: "in_range",
        Cell: (row) => (<>{ row.row.original.in_range ? <CheckIcon/>:<CloseIcon/> }</>),//show checkbox        
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

  const [loading , setLoading] = React.useState(true);

  const [filterType, setFilterType] = React.useState(null);
  const filterValues = ['name', 'id'];

  const mappings = {"name": "name", "student_id": "student_id", "school": "school_id"} 

  const [showAll, setShowAll] = React.useState(false);


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
      else if(filterType == 'id'){
        params.id = parseInt(filterStr);
      }
      else if(filterStr != "") {
        setFilterStr("");
      }

      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/student', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        let rows = result.data.students.map((value)=>{
          return {...value, name: {name: value.name, id: value.id}}
        })
        console.log(rows)
        setTotalRows(result.data.records);
        setRows(rows);
        setData(rows);

        /*for (let i=0;i<data.length; i++){
          const getRes = await axios.get(
            process.env.REACT_APP_BASE_URL+`/school/${data[i].school_id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (getRes.data.success){
            arr = [...arr, {name: {name: data[i].name, id: data[i].id}, student_id: data[i].student_id, school: getRes.data.school.name, route: null, id: data[i].id, in_range: data[i].in_range}]
          }
          else{
            props.setSnackbarMsg(`Students could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }
          if(data[i].route_id != null){
            const getRouteRes = await axios.get(
              process.env.REACT_APP_BASE_URL+`/route/${data[i].route_id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            if (getRouteRes.data.success){
              arr[arr.length - 1].route = {name: getRouteRes.data.route.name, id: data[i].route_id};
            }
            else{
              props.setSnackbarMsg(`Students could not be loaded`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/students");
            }
          }

        }
        setRows(arr);*/
      }
      else{
        props.setSnackbarMsg(`Students could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/students");
      }
      setLoading(false);
    };
    fetchData();
  }, [page, sortModel, filterType, filterStr, showAll])

  const handleRowClick = (row) => {
    console.log(row);
  };

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
        onRowClick={(row) => handleRowClick(row)}
        getRowId={(row) => row.id}
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
      to={"/students/create"}
      color="primary"
      variant="contained"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create Student
      </Button>
       
    </div>

      </>
  );
}