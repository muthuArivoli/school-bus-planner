import React from 'react';
import Button from '@material-ui/core/Button';
import Dropzone, {useDropzone} from 'react-dropzone';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Papa from "papaparse";
import axios from 'axios';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';

const userColumns = [
  //{ field: 'id', hide: true, width: 30},
  { field: 'email', headerName: "Email", editable: true, flex: 1.5},
  { field: 'name', headerName: "Name", editable: true, flex: 1.5},
  { field: 'address', headerName: "Address", editable: true, flex: 2},
  { field: 'phone', headerName: "Phone #", editable: true, width: 150},
];

export default function BulkImport() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const maxNum = 2;
  const [filesPreview, setPreview] = React.useState([]);
  const [files, setFiles] = React.useState([]);
  const [parsedFiles, setParsed] = React.useState([]);

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [popoverMessage, setPopoverMessage] = React.useState("");

  const [users, setUsers] = React.useState([]);
  const [userRows, setUserRows] = React.useState([]);
  const [errorRows, setErrorRows] = React.useState([]);

  //const [studentRows, setStudentRows] = React.useState([]);

  const popoverOpen = Boolean(anchorEl);
  const popoverID = popoverOpen ? 'simple-popover' : undefined;

  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const sendRecords = () => {
    // will ONLY send records to db (user will click this after validating)
  };

  const validateRecords = () => {
    // validate changes through backend (user will click this before upload)
    // **make sure that the error dictionaries are updated correctly**
  };


  const handleUpload = () => {
    var formData = new FormData();

    for(var file in files) {
      formData.append(files[file][0].name, files[file][0]);
    }

    axios.post(process.env.REACT_APP_BASE_URL+`/fileValidation`, formData, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
      }
    }).then((res) => {
      if (res.data.success){
        setSnackbarMsg(`Files successfully uploaded`);
        setSnackbarOpen(true);
        setSnackbarSeverity("success");

        var usr_rows = res.data[Object.keys(res.data)[0]];

        let rows = [];
        let errors = {};

        for (var i=0; i<usr_rows.length; i++) {      
          let newRow = {id: i, email: usr_rows[i]['row'][0], name: usr_rows[i]['row'][1], address: usr_rows[i]['row'][2], phone: usr_rows[i]['row'][3]};
          rows.push(newRow);
          errors[i] = usr_rows[i]['errors'];
        }

        console.log(usr_rows);
        console.log(rows);
        console.log(errors);

        setUsers(usr_rows);
        setUserRows(rows);
        setErrorRows(errors);

        handleDialogOpen()
      }
      else{
        setSnackbarMsg(`Files not successfully updated`);
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
      }
    });
  }

  const onDrop = React.useCallback(acceptedFiles => {
      var allfiles = files;
      var currParsed = parsedFiles;
      bigif: if(allfiles.length < maxNum){

        var fileNames=[];
        var trueNames=[];
        for(var i in files){
          fileNames.push(<div>
              {files[i][0].name}
              </div>
          );
          trueNames.push(files[i][0].name);
        }
        if(trueNames.includes(acceptedFiles[0].name)){
            alert("Cannot upload two files with same name");
            break bigif;
        }
        allfiles.push(acceptedFiles);
        console.log(allfiles);
        Papa.parse(acceptedFiles[0], {
          complete: function(results) {
            console.log("Finished:", results.data);
            currParsed.push(results.data);
        }});
        fileNames.push(<div>{acceptedFiles[0].name}</div> );
        setFiles(allfiles);
        setPreview(fileNames);
        setParsed(currParsed);
      }
      else{
          alert("Only two files should be uploaded")
      }
      }, [])

  const onDropReject = React.useCallback(rejectedFiles => {
          alert("Invalid File")
      }, [])
      
  const {getRootProps, getInputProps} = useDropzone({onDrop})

  //const theme = createTheme();

  const handleClose = (event, reason) => {
    // if (reason === 'clickaway') {
    //   return;
    // }
    setSnackbarOpen(false);
  };

  const handleCellEditStart = (event, i) => {
    let msg = errorRows[event.id][event.field];
    setPopoverMessage(msg);
    setAnchorEl(i.currentTarget);
  };

  const handleCellEditCommit = (row) => {
    console.log(row);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  return (
      <div className="App">
        <Dropzone
          onDropAccepted={onDrop}
          onDropRejected={onDropReject}
          accept="text/csv,.csv"
        >
          {({
            getRootProps,
            getInputProps,
            isDragAccept,
            isDragReject
          }) => {
            const additionalClass = isDragAccept
              ? "accept"
              : isDragReject
              ? "reject"
              : "";

            return (
              <div
                {...getRootProps({
                  className: `dropzone ${additionalClass}`
                })}
              >
                <input {...getInputProps()} />
                <p>Drag'n'drop files</p>
                <FileUploadIcon></FileUploadIcon>
              </div>
            );
          }}
        </Dropzone>
        <div>
          <strong>Files:</strong>
          <ul>
            {filesPreview.map(fileName => (
              <li key={fileName.props.children}>{fileName}</li>
            ))}
          </ul>
        </div>
        <div>
          <Button
          variant="contained"
          component="label"
          onClick={handleUpload}
          >
          Upload Files
          </Button>
        </div>

      {/* <ThemeProvider theme={theme}> */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xl" sx={{ disableScrollLock: true }} scroll={'paper'}>
          <DialogContent dividers={true}>
            <div style={{ height: 500, width: 1200 }}>
              <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ flexGrow: 1 }}>
                  <Box sx={{
                    height: 300,
                    width: 1,
                    '& .hot': {
                      backgroundColor: '#FF8E8E',
                    },}}
                    >
                    <DataGrid
                      rows={userRows}
                      columns={userColumns}
                      getRowId={(row) => row.id}
                      pageSize={100}
                      density="compact"
                      getCellClassName={(params) => {
                        let errorDict = errorRows[params.id];
                        if (errorDict.length == 0) {
                          return '';
                        } else {
                          if (params.field in errorDict) {
                            return 'hot';
                          }
                        }
                      }}
                      onCellEditCommit = {(cell) => handleCellEditCommit(cell.row)}
                      onCellEditStart = {handleCellEditStart}
                    />
                  </Box>
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={validateRecords} variant="contained" align="left" sx={{ maxWidth: '200px' }}>Validate Changes</Button>
            <Button onClick={sendRecords} variant="contained" sx={{ maxWidth: '200px' }}>Upload Records</Button>
          </DialogActions>
        </Dialog>
      {/* </ThemeProvider> */}

      <Snackbar open={snackbarOpen} onClose={handleClose} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}} sx={{ width: 600 }}>
        <Alert onClose={handleClose} severity={snackbarSeverity}>
          {snackbarMsg}
        </Alert>
      </Snackbar>

      <Popover
        id={popoverID}
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        disableAutoFocus={true}
        disableEnforceFocus={true}
        >
          <Typography sx={{ p: 2 }}>{popoverMessage}</Typography>
      </Popover>

      </div>
    );
  }

  // <TableContainer>
  //   <Table>
  //     <TableHead>
  //       <TableRow>
  //         <TableCell width="30%">Email</TableCell>
  //         <TableCell width="20%">Name</TableCell>
  //         <TableCell width="40%">Address</TableCell>
  //         <TableCell width="10%">Phone Number</TableCell>
  //       </TableRow>
  //     </TableHead>
  //     <TableBody>
  //       {userRows.map((user) => (
  //         <TableRow
  //           key={user['row'][0]}
  //           sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
  //         >
  //         <TableCell sx={{ color: user['errors']['email'] ? 'theme.palette.red' : 'theme.palette.black' }} width="30%">{user['row'][0]}</TableCell>
  //         <TableCell width="20%">{user['row'][1]}</TableCell>
  //         <TableCell width="40%">{user['row'][2]}</TableCell>
  //         <TableCell width="10%">{user['row'][3]}</TableCell>
  //         </TableRow>
  //       ))}
  //     </TableBody>
  //   </Table>
  // </TableContainer>
  
