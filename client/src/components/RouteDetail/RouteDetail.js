import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from '../DeleteDialog';
import Typography from '@mui/material/Typography';
import RouteDetailStudentList from './RouteDetailStudentList';

export default function RouteDetail() {

  const handleDelete = () => {
      console.log("Delete");
  }

  let { id } = useParams();

  return (
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack spacing={4} justifyContent="center">
          <Stack direction="row" spacing={4} justifyContent="center">
            <Typography variant="h5" align="center">
              Route Name
            </Typography>
            <Typography variant="h5" align="center">
              School
            </Typography>
          </Stack>
          <Typography variant="h5" align="center">
            Description
          </Typography>
        </Stack>

        <RouteDetailStudentList/>

        //MAP GOES HERE

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/routes/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete Route?" dialogDesc="Please confirm you would like to delete this route" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
  );
}