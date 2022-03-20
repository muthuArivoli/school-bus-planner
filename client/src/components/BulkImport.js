import React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@material-ui/core/Button';
import Dropzone, {useDropzone} from 'react-dropzone';
// import FontIcon from '@material-ui/icons/Font';
import {blue} from '@mui/material/colors';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Papa from "papaparse";
import axios from 'axios';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import { Box, createTheme } from '@mui/system';



export default function BulkImport(props){

    const [dialogOpen, setDialogOpen] = React.useState(false);

    const maxNum = 2;
    const [filesPreview, setPreview] = React.useState([]);
    const [files, setFiles] = React.useState([]);
    const [parsedFiles, setParsed] = React.useState([]);

    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMsg, setSnackbarMsg] = React.useState("");
    const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

    const [userRows, setUserRows] = React.useState([])
    const [studentRows, setStudentRows] = React.useState([])


    const handleDialogClose = () => {
      setDialogOpen(false);
    };
    const handleDialogOpen = () => {
      setDialogOpen(true);
    };

    const sendRecords = () => {
      // will re-validate and send records to db
    };

    const handleUpload = () => {
      // var body = {}
      var formData = new FormData();

      for(var file in files){
        formData.append(files[file][0].name, files[file][0]);
        // Papa.parse(files[file][0], {
        //   complete: function(results) {
        //     body[JSON.stringify(files[file][0].name)] = JSON.stringify(results.data);
        //     console.log(JSON.stringify(results.data));
        // }});
      }

      axios.post(process.env.REACT_APP_BASE_URL+`/fileValidation`, formData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
        }
      }).then((res) => {
        if (res.data.success){
          props.setSnackbarMsg(`Files successfully uploaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          console.log(res.data);
          var usr_rows = res.data['users.csv']
          setUserRows(usr_rows);
          handleDialogOpen()
          // navigate("/schools");
        }
        else{
          props.setSnackbarMsg(`Files not successfully updated`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          // navigate("/schools");
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
              console.log(currParsed);
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
        
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    const theme = createTheme();
        
            return (
                <div className="App">
                  <Dropzone
                    onDropAccepted={onDrop}
                    onDropRejected={onDropReject}
                    accept="text/csv"
                >
                    {({
                      getRootProps,
                      getInputProps,
                      isDragActive,
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
                          {/* <span>📁</span> */}
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
                <ThemeProvider theme={theme}>
                <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xl" sx={{ disableScrollLock: true }} scroll={'paper'}>
                <DialogContent dividers={true}>
                    {/* <Stack spacing={10} alignItems="center" sx={{ p: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Typography variant="h3" align="center">Route Name: {data.name}</Typography>
                        <Typography variant="h5" align="center">School: {school}</Typography>
                      </Stack> */}
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell width="30%">Email</TableCell>
                              <TableCell width="20%">Name</TableCell>
                              <TableCell width="40%">Address</TableCell>
                              <TableCell width="10%">Phone Number</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {userRows.map((user) => (
                              <TableRow
                                key={user['row'][0]}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                              >
                              <TableCell sx={{ color: user['errors']['email'] ? 'theme.palette.red' : 'theme.palette.black' }} width="30%">{user['row'][0]}</TableCell>
                              <TableCell width="20%">{user['row'][1]}</TableCell>
                              <TableCell width="40%">{user['row'][2]}</TableCell>
                              <TableCell width="10%">{user['row'][3]}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={sendRecords} variant="contained" sx={{ maxWidth: '200px' }}>Upload Records</Button>
                  </DialogActions>
                </Dialog>
                </ThemeProvider>
                </div>
              );
    }
  
