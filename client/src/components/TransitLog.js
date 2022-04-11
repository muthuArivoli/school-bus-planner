import * as React from 'react';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import Autocomplete from '@mui/material/Autocomplete';
import MauTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination';
import { Helmet } from 'react-helmet';
import { Duration } from 'luxon';

function NoLogsOverlay(){
    return(
        <GridOverlay>
            <Box sx = {{mt: 1}}>No Logs Exist</Box>
        </GridOverlay>
    );
}

//sortable by all columns
//filterable by driver, bus, school, and route

function Table({columns,data, setSortModel}){

    const mappingss = {"user": 'user_id', "school": "school_id", "number": "number", "route": "route_id", "direction": "direction", "start_time": "start_time", "duration": "duration"}; 
  
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
      <MauTable {...getTableProps()}>
        <TableHead>
          {headerGroups.map(headerGroup => (
            < TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                < TableCell {...column.getHeaderProps(column.getSortByToggleProps())}>{column.render('Header')} 
                       <span>
                         {column.canSort ? column.isSorted
                             ? column.isSortedDesc
                                 ? <KeyboardArrowDownOutlinedIcon/>
                                 : <KeyboardArrowUpOutlinedIcon/>
                             : <UnfoldMoreOutlinedIcon/> : ""}
                      </span>              
                
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {/* rows to page */}
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <TableCell {...cell.getCellProps()}>
                    {/* <Link component={RouterLink} to={"/schools/" + params.value.id}>{params.value.name}</Link>*/}
                    {cell.render('Cell')}</TableCell> 
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </MauTable>
  
  
      </>
    )
  
  }
  
  

export default function TransitLog(props){

    const [data, setData] = React.useState([]);
    const reactColumns = React.useMemo(
      () => [
        {
          Header: "Driver",
          accessor: "user",
          Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/users/" + row.row.original.user.id}>{row.row.original.user.full_name}</Link></>)
        },
        {
          Header: "Bus #",
          accessor: "number", 
        },
        {
          Header: "School",
          accessor: "school",
          Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/schools/" + row.row.original.school.id}>{row.row.original.school.name}</Link></>)
  
        },
        {
          Header: "Route",
          accessor: "route",
          Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/routes/" + row.row.original.route.id}>{row.row.original.route.name}</Link></>)
          , 
        },
        {
          Header: "Direction",
          accessor: "direction",
          Cell: (row) => (<>{ row.row.original.direction == 0? "To School" : "From School" }</>), //show checkbox,
        },
        {
          Header: "Start Time",
          accessor: "start_time", 
        },,
        {
          Header: "Duration",
          accessor: "duration", 
          Cell: (row) => (<>{ row.row.original.duration == null? "Ongoing" : Duration.fromMillis(row.row.original.duration * 1000).toFormat("h:mm:ss") }</>)
        },
  
      ]
    )
  

    const [pageSize, setPageSize] = React.useState(10);
    const [totalRows, setTotalRows] = React.useState(0);
    const [page, setPage] = React.useState(0);
    const [sortModel, setSortModel] = React.useState([]);
    const [filterStr, setFilterStr] = React.useState("");
    const [routes, setRoutes] = React.useState([]);
    const [schools, setSchools] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [filterId, setFilterId] = React.useState({id: "", label: ""});
    const [filterType, setFilterType] = React.useState(null);
    const filterValues = ['Driver', 'Bus number', 'School', 'Route'];
  


    const [showAll, setShowAll] = React.useState(false);
    const [loading , setLoading] = React.useState(true);

    let [query, setQuery] = useSearchParams();

  
    let navigate = useNavigate();

    React.useEffect(()=>{
      const fetchData = async() => {
      if(query.get("route") != null && query.get("route").match('^[0-9]+$')){ 
        const result = await axios.get(
          process.env.REACT_APP_BASE_URL+'/route/' + query.get("route"), {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (result.data.success){
          console.log(result.data.route);
          setFilterType("Route");
          setFilterId({id: result.data.route.id, label: result.data.route.name});
        }
        else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/");
        }
      }
      }
      fetchData();
    },[])

    //'name'- driver name

    React.useEffect( () => {
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
            if(filterType == "Bus number"){
              params.number = parseInt(filterStr);
            }
            if(filterType == 'School') {
              params.school_id = filterId.id;
            }
            if(filterType == 'Route') {
              params.route_id = filterId.id;
            }
            if(filterType == 'Driver') {
              params.user_id = filterId.id;
            }

            const result = await axios.get(
                process.env.REACT_APP_BASE_URL+`/log`,{
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    params: params
                }
            );
            if(result.data.success){
                if(active){
                    setData(result.data.logs)
                    setTotalRows(result.data.records);
                }
            }
            else{
                // console.log(result.data)
                props.setSnackbarMsg(`Logs could not be loaded - route`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/routes");
              }
              setLoading(false);
        };
        fetchData();
        return () => {
          active = false;
        };
      }, [page, sortModel, filterStr, filterType, filterId, showAll])


      React.useEffect(()=> {
        const fetchData = async() => {
          const result = await axios.get(
            process.env.REACT_APP_BASE_URL+'/user', {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              params: {sort: "full_name", dir: "asc", role: 3}
            }
          );
          if (result.data.success){
            let arr = result.data.users.map((value) => {
              return {id: value.id, label: value.full_name}
            });
            setUsers(arr);
          }
          else{
            props.setSnackbarMsg(`Users could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }
        };
        fetchData();
      }, []);

      React.useEffect(()=> {
        const fetchData = async() => {
          const result = await axios.get(
            process.env.REACT_APP_BASE_URL+'/school', {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              params: {sort: "name", dir: "asc"}
            }
          );
          if (result.data.success){
            let arr = result.data.schools.map((value) => {
              return {id: value.id, label: value.name}
            });
            setSchools(arr);
          }
          else{
            props.setSnackbarMsg(`School could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        };
        fetchData();
      }, []);

      React.useEffect(()=> {
        const fetchData = async() => {
          const result = await axios.get(
            process.env.REACT_APP_BASE_URL+'/route', {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              params: {sort: "name", dir: "asc"}
            }
          );
          if (result.data.success){
            let arr = result.data.routes.map((value) => {
              return {id: value.id, label: value.name}
            });
            setRoutes(arr);
          }
          else{
            props.setSnackbarMsg(`Routes could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }
        };
        fetchData();
      }, []);

    return (
        <>
        
        <Helmet>
            <title>
                Transit Log
            </title>
        </Helmet>
        <Grid container>
        <Grid item md={3} lg={3}>
        <Autocomplete
          options={filterValues}
          value={filterType}
          autoSelect
          onChange={(e, new_value) => {
            setFilterType(new_value);
            setFilterStr("");
            setFilterId({id: "", label: ""});
          }}
          renderInput={(params) => (
            <TextField {...params} label="Filter By..." />
          )}
        />
        </Grid>
          {
            (filterType == 'Driver' || filterType == 'School' || filterType == 'Route') &&
            <Grid item md={9} lg={9}>
              <Autocomplete
                options={filterType == 'Driver' ? users : filterType == 'School' ? schools : routes}
                value={filterId}
                autoSelect
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(e, new_value) => setFilterId(new_value)}
                renderInput={(params) => (
                  <TextField {...params} label="Search" />
              )}
        />
            </Grid>
          }
          {
            filterType == "Bus number" &&
            <Grid item md={9} lg={9}>
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
          }
        </Grid>
        <div style={{ height: 400, width: '100%' }}> 

        <Table columns = {reactColumns} data = {data} setSortModel={setSortModel}/>
        <TablePagination 
            component = "div"
            count = {totalRows}
            page = {page}
            onPageChange = {(event,page) => setPage(page)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
                let pageSize = event.target.value;
                setShowAll(pageSize != 10);
                setPageSize(pageSize)
                setPage(0);
            }}
            rowsPerPageOptions={[10, {label: 'All', value: totalRows}]}
        
        />
   
        
        </div>

        </>
    );

};