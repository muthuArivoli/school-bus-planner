import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from './DeleteDialog';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import tableStyle from './tablestyle.css';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import TablePagination from '@mui/material/TablePagination';
import Link from '@mui/material/Link';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250},
  {
    field: 'id',
    headerName: 'Detailed View',
    width: 250,
    renderCell: (params) => (
      <>
        <Button
          component={RouterLink}
          to={"/students/" + params.value +"/view"}
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

function NoStudentsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Students for Current User</Box>
    </GridOverlay>
  );
}



function Table({columns,data, setSortModel}){

  const mappingss = {"name.name": "name", "name.id": "name.id"};

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

export default function ParentView() {

  const [reactData, setReactData] = React.useState([]);
  const reactColumns = React.useMemo(
    () => [
      {
        Header: "Full Name",
        accessor: "full_name",
        disableSortBy: true
      },
      {
        Header: "Detailed View",
        accessor: "children",  //id
        Cell: (row) => (<>{console.log(row)}<Link component={RouterLink} to={"/students/" + row.row.original.name.id + "/view"}>{row.row.original.name.name}</Link></>),
        disableSortBy: true
      }
    ]
  )

  const [rows, setRows] = React.useState([]);
  const [data, setData] = React.useState({children: []});
  
  const [sortModel, setSortModel] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);

  const [error, setError] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [password, setPassword] = React.useState("");
  const [conPassword, setConPassword] = React.useState("");

  React.useEffect(() =>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.user);
        setReactData(result.data.user);
        console.log(result.data.user);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("PATCH current user");
    axios.patch(process.env.REACT_APP_BASE_URL+`/current_user`, {
      password: password,
    }, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if (res.data.success){
        setSnackbarMsg(`Password successfully updated`);
        setError(true);
        setSnackbarSeverity("success");
      }
      else{
        setSnackbarMsg(`Password not successfully updated`);
        setError(true);
        setSnackbarSeverity("error");
      }
      setPassword("");
      setConPassword("");
    }).catch((err) => {
      setSnackbarMsg(`Password not successfully updated`);
      setError(true);
      setSnackbarSeverity("error");
      setPassword("");
      setConPassword("");
    });
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  return (
    <>
    <Snackbar open={error} onClose={handleClose}>
    <Alert onClose={handleClose} severity={snackbarSeverity}>
      {snackbarMsg}
    </Alert>
    </Snackbar>
    <Grid container alignItems="center" justifyContent="center" pt={5}>
        <Stack spacing={4} sx={{ width: '100%'}}>
          <Stack direction="row" spacing={25} justifyContent="center">
          <Typography variant="h5" align="center">
            Name: {data.full_name}
          </Typography>
          <Typography variant="h5" align="center">
            Email: {data.email}
          </Typography>
          <Typography variant="h5" align="center">
            Address: {data.uaddress}
          </Typography>
          </Stack>
        </Stack>

        <Stack spacing={1} justifyContent="center" alignItems="center" sx={{ width: '100%'}}>
          <div style={{ height: 400, width: '100%' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flexGrow: 1 }}>
                <DataGrid
                  components={{
                    NoRowsOverlay: NoStudentsOverlay,
                  }}
                  rows={data.children}
                  columns={columns}
                  getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
                  autoPageSize
                  disableSelectionOnClick
                  density="compact"
                />
 
                {/* <Table columns = {reactColumns} data = {reactData} setSortModel={setSortModel}/>  */}
{/*                 <TablePagination
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
                /> */}

              </div>
            </div>
          </div>

          <Typography variant="h5" align="left">
            Change Password:
          </Typography>

          <TextField
            fullWidth
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
          />
          <TextField
            onChange={(e) => setConPassword(e.target.value)}
            value={conPassword}
            error={password != conPassword}
            helperText={password != conPassword ? "Passwords do not match" : ""}
            fullWidth
            name="confirm-password"
            label="Confirm Password"
            type="password"
            id="confirm-password"
          />
            <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={password == "" || password != conPassword}
            >
              Submit
          </Button>
        </Stack>

      </Grid>
      </>
  );
}