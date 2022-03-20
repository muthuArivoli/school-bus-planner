import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid , getGridStringOperators} from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import tableStyle from './tablestyle.css';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import {QueryClient, QueryClientProvider, useQuery} from 'react-query';
//import {Table as rTable} from './ReactTable'; 
import {Rtable as rTable} from './ReactTable';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';

import TablePagination from '@mui/material/TablePagination';

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

 

function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": 'name', "arrival_time": "arrival_time", "departure_time": "departure_time"};

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


//custom react table pagination 
const Pagination = ({ pageIndex, totalRows, rowsPerPage}) => { 

  const numPages = Math.ceil(totalRows/rowsPerPage);
  const pageArr = [...new Array(numPages)]; //array holding number of pages

  const [page, setPage] = React.useState(0);
  const [canGoPrev, setCanGoPrev] = React.useState(false);
  const [canGoNext, setCanGoNext] = React.useState(true);

  const [pageFirstEntry, setPageFirstEntry] = React.useState(1);
  const [pageLastEntry, setPageLastEntry] = React.useState(rowsPerPage);

  const onNext = () => setPage(page + 1);
  const onPrev = () => setPage(page -1);
  const onSelect = (pageNum) => setPage(pageNum);


  React.useEffect(() => {
    if (numPages === page) { setCanGoNext(false)};
    if (page > 1) {setCanGoPrev(true)}
  }, [numPages, page]);

  React.useEffect( () => {
    //pageChanger(page)
    const rowPageSkip = (page ) * rowsPerPage; //(page-1)
    setPageFirstEntry(rowPageSkip + 1);
  }, [page]);

  React.useEffect( () => {
    const pageCounter = pageFirstEntry + rowsPerPage;
    setPageLastEntry (pageCounter > totalRows ? totalRows : pageCounter - 1);
  }, [pageFirstEntry,rowsPerPage, totalRows]
  );

  return(
    <>
      {
        numPages > 1 ? (
          <div className = {tableStyle.pagination}>
            <div className = {tableStyle.pageInfo}>
              {pageFirstEntry} - {pageLastEntry} of {totalRows}
            </div>
            <div className = {tableStyle.pagebuttons}>
              <button
                className = {tableStyle.pageBtn}
                onClick = {onPrev}
                disabled = {!canGoPrev}
              >
                {'<'}
              </button>
               {pageArr.map((num,index) => (
                <button
                  onClick = {() => onSelect(index+1)}
                  className = {`${tableStyle.pageBtn}  ${index + 1 === page ? tableStyle.activeBtn : ""}`}
                >
                  {index+1}
                </button>
              ))} 
              <button
                className = {tableStyle.pageBtn}
                onClick = {onNext}
                disabled = {!canGoNext}
                >
                {'>'}
              </button>
            </div>
          </div>
        ) : null}
    </>
    );
  }


export default function DataTable(props) {

  const [data, setData] = React.useState([]);

  const reactColumns = React.useMemo(
    () => [
       {
        Header: "School Name",
        accessor: "name.name",
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/schools/" + row.row.original.name.id}>{row.row.original.name.name}</Link></>)
      }, 
      {
        Header: "Address",
        accessor: "address",
        disableSortBy: true
      },
      {
        Header: "Arrival Time",
        accessor: "arrival_time"
      },
      {
        Header: "Departure Time",
        accessor: "departure_time"
      }
    ]
  
  );

  const [rows, setRows] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [sortModel, setSortModel] = React.useState([]);
  const [filterStr, setFilterStr] = React.useState("");

  const [totalPages, setTotalPages] = React.useState(0);

  const [loading , setLoading] = React.useState(true);

  const [filterType, setFilterType] = React.useState(null);
  const filterValues = ['name'];

  const [showAll, setShowAll] = React.useState(false);
  let navigate = useNavigate();

  

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
      //axios get returns 10 results 
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: params
        }
      );
      if (result.data.success){
        console.log(result.data);
        setTotalRows(result.data.records);
 
        let arr = result.data.schools.map((value) => {
          console.log({name: value.name, id: value.id, address: value.address});
          return {name: {name: value.name, id: value.id}, address: value.address, id: value.id, departure_time: value.departure_time, arrival_time: value.arrival_time};
        });

        //
        setData(arr);
        console.log(arr);
        //
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
    <div style={{ height: 600, width: '100%' }}>
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
      to={"/schools/create"}
      variant="contained"
      color="primary"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create School
      </Button>
    </div>
    </>
  );
}

