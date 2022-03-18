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

 

function Table({columns,data, manualPagination = false, totalRows, rowsPerPage}){

const{
  getTableProps,
  getTableBodyProps,
  headerGroups,
  rows,
  prepareRow,
  page,
  canPreviousPage,
  canNextPage,
  pageOptions,
  pageCount,
  gotoPage,
  nextPage,
  previousPage,
  setPageSize,
  state: {pageIndex, pageSize},
} = useTable({columns, data, initialState: {pageIndex: 0}},  useFilters, useSortBy, usePagination,manualPagination);


const [currentPage, setCurrentPage] = React.useState(0);

//   const {
//     isLoading,
//     isError,
//     error,
//     data,
//     isFetching,
//    isPreviousData,
//   } = useQuery(,{keepPreviousData: true})

//const pageCount = Math.ceil(totalRows/rowsPerPage);

 return (
   <>
   <table {...getTableProps()}>
     <thead>
       {headerGroups.map(headerGroup => (
         < tr {...headerGroup.getHeaderGroupProps()}>
           {headerGroup.headers.map(column => (
             < th {...column.getHeaderProps()}>{column.render('Header')} </th>
           ))}
         </tr>
       ))}
     </thead>
     <tbody {...getTableBodyProps()}>
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

    <div className="pagination">
    <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
      {'<<'}
    </button>{' '}
    <button onClick={() => previousPage()} disabled={!canPreviousPage}>
      {'<'}
    </button>{' '}
    <button onClick={() => nextPage()} disabled={!canNextPage}>
      {'>'}
    </button>{' '}
    <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
      {'>>'}
    </button>{' '}
    <span>
      Page{' '}
      <strong>
        {pageIndex + 1} of {pageOptions.length}
      </strong>{' '}
    </span>
    <span>
      | Go to page:{' '}
      <input
        type="number"
        defaultValue={pageIndex + 1}
        onChange={e => {
          const page = e.target.value ? Number(e.target.value) - 1 : 0
          gotoPage(page)
        }}
        style={{ width: '100px' }}
      />
    </span>{' '}
    <select
      value={pageSize}
      onChange={e => {
        setPageSize(Number(e.target.value))
      }}
    >
      {[10, 20, 30, 40, 50].map(pageSize => (
        <option key={pageSize} value={pageSize}>
          Show {pageSize}
        </option>
      ))}
    </select>
    </div>
  </>
 )

}


//custom react table pagination 
const Pagination = ({ pageIndex, totalRows, rowsPerPage}) => { 

  const numPages = Math.ceil(totalRows/rowsPerPage);
  const pageArr = [...new Array(numPages)];

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





/*
return (

  <>
  {isLoading ? }
  </div>

)
*/

export default function DataTable(props) {

  const [data, setData] = React.useState([]);

  const reactColumns = React.useMemo(
    () => [
       {
        Header: "School Name",
        accessor: "name.name",
        //Cell: ({name}) => (<Link component={RouterLink} to={"/schools/" + name.id}>{name.name}</Link>)
      }, 
      {
        Header: "Address",
        accessor: "address"
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
        console.log("data" + arr);
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

      <Table columns = {reactColumns} data = {data} totalRows = {totalRows} rowsPerPage = {10}/>

       <Pagination
        totalRows={totalRows}
        pageIndex={page} 
        rowsPerPage={25}
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

/* 
200
      <ReactTable 
        reactColumns = {columns}
        data = {rows}
      />

*/