import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from './DeleteDialog';
import Typography from '@mui/material/Typography';

export default function StudentDetail() {

  const handleDelete = () => {
      console.log("Delete");
  }

  let { id } = useParams();
  
  const schoolid = null;
  const routeid = null;
  
  return (
    <Grid container justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={15} justifyContent="center">
          <Typography variant="h5" align="center">
            Name
          </Typography>
          <Typography variant="h5" align="center">
            Student ID
          </Typography>
        </Stack>

        <Stack direction="row" spacing={20} justifyContent="center">
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              School
            </Typography>
            <Button component={RouterLink}
              to={"/schools/" + schoolid}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View School
            </Button>
          </Stack>
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              Route
            </Typography>
            <Button component={RouterLink}
              to={"/routes/" + routeid}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View Route
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/students/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete Student?" dialogDesc="Please confirm you would like to delete this student" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
  );
}