import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function SchoolDeleteDialog(props) {
  const [open, setOpen] = React.useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = () => {
      console.log("Delete school" + props.schoolName);
      setOpen(false);
  }

  const checkDialog = (e) => {
    setButtonDisabled(e.target.value !== props.schoolName);
  }

  return (
    <div>
      <Button variant="outlined" 
              size="small"
              style={{ marginLeft: 16 }}
              onClick={handleClickOpen}>
        Delete School
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete School {props.schoolName}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please confirm school name.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="school"
            label="School"
            fullWidth
            variant="standard"
            onChange={checkDialog}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button disabled={buttonDisabled} onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}