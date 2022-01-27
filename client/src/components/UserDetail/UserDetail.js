import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from '../DeleteDialog';
import UserDetailMid from './UserDetailMid';
import Typography from '@mui/material/Typography';

export default function UserDetail() {

  const handleDelete = () => {
      console.log("Delete");
  }

  let { id } = useParams();

  return (
    <Grid container alignItems="center" justifyContent="center" pt={5}>
        <Stack spacing={4} sx={{ width: '100%'}}>
          <Stack direction="row" spacing={25} justifyContent="center">
          <Typography variant="h5" align="center">
            Name
          </Typography>
          <Typography variant="h5" align="center">
            Email
          </Typography>
          <Typography variant="h5" align="center">
            Address
          </Typography>
        </Stack>
        
        <UserDetailMid/>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/users/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete User?" dialogDesc="Please confirm you would like to delete this user" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
  );
}