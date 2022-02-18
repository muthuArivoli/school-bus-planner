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
    setOpen(false);
    props.handleDelete();
  }

  const checkDialog = (e) => {
    setButtonDisabled(e.target.value !== props.schoolName);
  }

  return (
    <div>
      <Button variant="outlined" 
              size="small"
              style={{  }}
              onClick={handleClickOpen}>
        Delete School
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete School?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter <b>{props.schoolName}</b> to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="school"
            label="School"
            placeholder={props.schoolName}
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