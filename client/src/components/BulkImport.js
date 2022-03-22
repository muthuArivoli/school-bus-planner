import React from 'react';
import Button from '@mui/material/Button';
import Dropzone, {useDropzone} from 'react-dropzone';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Papa from "papaparse";
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import DeleteDialog from './DeleteDialog';

const userColumns = [
  //{ field: 'id', hide: true, width: 30},
  { field: 'email', headerName: "Email", editable: true, flex: 1.5},
  { field: 'name', headerName: "Name", editable: true, flex: 1.5},
  { field: 'address', headerName: "Address", editable: true, flex: 2},
  { field: 'phone', headerName: "Phone #", editable: true, width: 150},
];

const studentColumns = [
  //{ field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Name", editable: true, flex: 1},
  { field: 'parentemail', headerName: "Parent Email", editable: true, flex: 1},
  { field: 'studentid', headerName: "Student ID", type: 'number', editable: true, width: 150},
  { field: 'school', headerName: "School Name", editable: true, flex: 1},
];

export default function BulkImport(props) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const maxNum = 2;
  const [studentFile, setStudentFile] = React.useState({});
  const [userFile, setUserFile] = React.useState({});

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [popoverMessage, setPopoverMessage] = React.useState("");

  const [userRows, setUserRows] = React.useState([]);
  const [errorRows, setErrorRows] = React.useState([]);

  const [studentRows, setStudentRows] = React.useState([]);
  const [studentErrorRows, setStudentErrorRows] = React.useState([]);

  const [includedUsers, setIncludedUsers] = React.useState([]);
  const [includedStudents, setIncludedStudents] = React.useState([]);

  const popoverOpen = Boolean(anchorEl);
  const popoverID = popoverOpen ? 'simple-popover' : undefined;

  let navigate = useNavigate();

  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  const handleDialogOpen = () => {
    setDialogOpen(true);
    console.log(errorRows);
  };

  const sendRecords = () => {
    // will ONLY send records to db (user will click this after validating)

    // these work, console.log to test
    let remainingUsers = userRows.filter(o=> includedUsers.some(i=> i === o.id));
    let remainingStudents = studentRows.filter(o=> includedStudents.some(i=> i === o.id));

    axios.post(process.env.REACT_APP_BASE_URL+`/bulkimport`, {
      'users': remainingUsers,
      'students': remainingStudents
    }, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if (res.data.success){
        if (res.data.valid){
          console.log(res.data.students);
          console.log(res.data.users);
          handleDialogClose();
          props.setSnackbarMsg(`You have successfully imported ${res.data.students} students and ${res.data.users} users`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/users");
        }
        else{

          setSnackbarMsg(`Upload Failed due to errors, see table`);
          setSnackbarOpen(true);
          setSnackbarSeverity("error");

          if (checkUsersPresent()) {
            setUserInfo(res);
          }
  
          if (checkStudentsPresent()) {
            setStudentInfo(res);
          }

          handleDialogOpen()

        }
      }
      else{
        setSnackbarMsg(`Files not successfully updated`);
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
      }
    });
  };

  const validateRecords = () => {
    let remainingUsers = userRows
    let remainingStudents = studentRows

    axios.post(process.env.REACT_APP_BASE_URL+`/validaterecords`, {
      'users': remainingUsers,
      'students': remainingStudents
    }, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if (res.data.success){
        setSnackbarMsg(`Files successfully uploaded`);
        setSnackbarOpen(true);
        setSnackbarSeverity("success");

        if (checkUsersPresent()) {
          setUserInfo(res);
        }

        if (checkStudentsPresent()) {
          setStudentInfo(res);
        }

        handleDialogOpen()
      }
      else{
        setSnackbarMsg(`Files not successfully updated`);
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
      }
    });
    // validate changes through backend (user will click this before upload)
    // **make sure that the error dictionaries are updated correctly**

    console.log(userRows);
    console.log(studentRows);
  };

  const setUserInfo = (res) => {
    console.log(res);
    var usr_rows = res.data.users;

    let rows = [];
    let errors = {};

    console.log(usr_rows);
    for (var i=0; i<usr_rows.length; i++) {      
      let newRow = {id: i, email: usr_rows[i]['row'][0], name: usr_rows[i]['row'][1], address: usr_rows[i]['row'][2], phone: usr_rows[i]['row'][3]};
      rows.push(newRow);
      errors[i] = usr_rows[i]['errors'];
    }

    setUserRows(rows);
    setErrorRows(errors);

    let initial_selectionmodel = [];

    let keys = Object.keys(usr_rows);
    for (var i=0;i<usr_rows.length;i++) {
      let err = usr_rows[i]['errors'];
      if (Object.keys(err).length ===  0) {
        initial_selectionmodel.push(i);
      }
    }
    setIncludedUsers(initial_selectionmodel);
  };

  const setStudentInfo = (res) => {
    var student_rows = res.data.students;

    let rows = [];
    let errors = {};

    for (var i=0; i<student_rows.length; i++) {      
      let newRow = {id: i, name: student_rows[i]['row'][0], parentemail: student_rows[i]['row'][1], studentid: student_rows[i]['row'][2], school: student_rows[i]['row'][3]};
      rows.push(newRow);
      errors[i] = student_rows[i]['errors'];
    }

    setStudentRows(rows);
    setStudentErrorRows(errors);

    let initial_selectionmodel = [];

    let keys = Object.keys(student_rows);
    for (var i=0;i<student_rows.length;i++) {
      let err = student_rows[i]['errors'];
      console.log(student_rows[i]);
      if (Object.keys(err).length ===  0) {
        initial_selectionmodel.push(i);
      }
    }
    setIncludedStudents(initial_selectionmodel);
  };


  const handleUpload = () => {
    var formData = new FormData();

    if(userFile.name != null){
      formData.append("users.csv", userFile, "users.csv")
    }

    if(studentFile.name != null){
      formData.append("students.csv", studentFile, "students.csv")
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

        if (checkUsersPresent()) {
          setUserInfo(res);
        }

        if (checkStudentsPresent()) {
          setStudentInfo(res);
        }

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

      let file = acceptedFiles[0];
      
      Papa.parse(acceptedFiles[0], {
        complete: function(results) {
          console.log("Finished:", results.data);
          console.log(results.data[0])
          if(JSON.stringify(results.data[0]) == JSON.stringify(["name", "parent_email", "student_id", "school_name"])){
            setStudentFile(file);
          }
          else if(JSON.stringify(results.data[0]) == JSON.stringify(["email", "name", "address", "phone_number"])){
            setUserFile(file);
          }
      }});
      
      }, [])

  const onDropReject = React.useCallback(rejectedFiles => {
      props.setSnackbarMsg("Invalid File");
      props.setShowSnackbar(true);
      props.setSnackbarSeverity("error");
      }, [])
      
  const {getRootProps, getInputProps} = useDropzone({onDrop});

  const handleClose = () => {
    setSnackbarOpen(false);
  };

  const handleCellEditStart = (event, i) => {
    if (event.field == "name" && errorRows[event.id]["dup_name"] != undefined) {
      console.log(errorRows[event.id]["dup_name"]);
      let msg = JSON.stringify(errorRows[event.id]["dup_name"])
      setPopoverMessage(msg);
      setAnchorEl(i.currentTarget);
    }

    if (event.field == "email" && errorRows[event.id]["dup_email"] != undefined) {
      console.log(errorRows[event.id]["dup_email"]);
      let msg = JSON.stringify(errorRows[event.id]["dup_email"]);
      setPopoverMessage(msg);
      setAnchorEl(i.currentTarget);
    }

    if (errorRows[event.id][event.field] == undefined) {
      return;
    }
    let msg = errorRows[event.id][event.field];
    setPopoverMessage(msg);
    setAnchorEl(i.currentTarget);
  };

  const handleStudentCellEditStart = (event, i) => {
    if (event.field == "name" && studentErrorRows[event.id]["dup_name"] != undefined) {
      console.log(studentErrorRows[event.id]["dup_name"]);
      let msg = JSON.stringify(studentErrorRows[event.id]["dup_name"])
      setPopoverMessage(msg);
      setAnchorEl(i.currentTarget);
    }

    if (studentErrorRows[event.id][event.field] == undefined) {
      return;
    }
    let msg = studentErrorRows[event.id][event.field];
    setPopoverMessage(msg);
    setAnchorEl(i.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const checkUsersPresent = () => {
    //console.log("user present?:")
    return userFile.name != null;
  };

  const checkStudentsPresent = () => {
    //console.log("student present?:");
    return studentFile.name != null
  };

  const handleCellEditCommit = (row, state) => {
    if (row.field === "name") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["name"] = row.value;
      setUserRows(newRows);
    }
    if (row.field === "email") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["email"] = row.value;
      setUserRows(newRows);
    }
    if (row.field === "address") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["address"] = row.value;
      setUserRows(newRows);
    }
    if (row.field === "phone") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["phone"] = row.value;
      setUserRows(newRows);
    }
  };

  const handleStudentCellEditCommit = (row, state) => {
    if (row.field === "name") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["name"] = row.value;
      setStudentRows(newRows);
    }
    if (row.field === "parentemail") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["parentemail"] = row.value;
      setStudentRows(newRows);
    }
    if (row.field === "studentid") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["studentid"] = row.value;
      setStudentRows(newRows);
    }
    if (row.field === "school") {
      const rowIndex = state.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...state];
      newRows[rowIndex]["school"] = row.value;
      setStudentRows(newRows);
    }
  };

  return (
    <>
    <Helmet>
      <title>
        Bulk Import
      </title>
    </Helmet>
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
          <li>
            <div>
              User File: {userFile.name != null && userFile.name}
            </div>
          </li>
          <li>
            <div>
              Student File: {studentFile.name != null && studentFile.name}
            </div>
          </li>
        </ul>
      </div>
        <Button
        variant="contained"
        disabled={studentFile.name == null && userFile.name == null}
        onClick={handleUpload}
        >
        Upload Files
        </Button>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xl" sx={{ disableScrollLock: true }} scroll={'paper'}>
        <DialogContent dividers={true}>
          <Stack direction="column" spacing={5} alignItems="center">

            {checkUsersPresent() ? <Stack spacing={1} alignItems="center">
              <Typography variant="h5" align="center">
                {userFile.name}
              </Typography>
              <div style={{ height: 350, width: 800 }}>
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
                            if ((params.field in errorDict) || ("dup_name" in errorDict && params.field == "name") || ("dup_email" in errorDict && params.field == "email")) {
                              return 'hot';
                            }
                          }
                        }}
                        onCellEditCommit = {(cell) => handleCellEditCommit(cell, userRows)}
                        onCellEditStart = {handleCellEditStart}
                        checkboxSelection
                        disableSelectionOnClick
                        onSelectionModelChange={(newSelectionModel) => {
                          console.log(newSelectionModel);
                          setIncludedUsers(newSelectionModel);
                        }}
                        selectionModel={includedUsers}
                      />
                    </Box>
                  </div>
                </div>
              </div>
            </Stack> : null}
            
            {checkStudentsPresent() ? <Stack spacing={1} alignItems="center">
              <Typography variant="h5" align="center">
                {studentFile.name}
              </Typography>
              <div style={{ height: 350, width: 800 }}>
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
                        rows={studentRows}
                        columns={studentColumns}
                        getRowId={(row) => row.id}
                        pageSize={100}
                        density="compact"
                        getCellClassName={(params) => {
                          let errorDict = studentErrorRows[params.id];
                          if (errorDict.length == 0) {
                            return '';
                          } else {
                            if ((params.field in errorDict) || ("dup_name" in errorDict && params.field == "name")){
                              return 'hot';
                            }
                          }
                        }}
                        onCellEditCommit = {(cell) => handleStudentCellEditCommit(cell, studentRows)}
                        onCellEditStart = {handleStudentCellEditStart}
                        checkboxSelection
                        disableSelectionOnClick
                        onSelectionModelChange={(newSelectionModel) => {
                          setIncludedStudents(newSelectionModel);
                        }}
                        selectionModel={includedStudents}
                      />
                    </Box>
                  </div>
                </div>
              </div>
            </Stack> : null}
            
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={validateRecords} size="small" variant="outlined" sx={{ mr:1 }}>Validate Changes</Button>
          <DeleteDialog dialogTitle="Confirm Import" dialogDesc="Please confirm you would like to commit the import" buttonDesc="Import" onAccept={sendRecords}/>
          <DeleteDialog dialogTitle="Cancel Import" dialogDesc="Please confirm you would like to cancel the import" buttonDesc="Cancel" onAccept={()=>{navigate("/users")}}/>
        </DialogActions>
      </Dialog>

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
    </>
  );
}