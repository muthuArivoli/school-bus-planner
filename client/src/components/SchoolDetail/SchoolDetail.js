import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams} from 'react-router-dom';
import SchoolDeleteDialog from './SchoolDeleteDialog';
import SchoolDetailMid from './SchoolDetailMid'
import Typography from '@mui/material/Typography';

export default function SchoolDetail() {

  let { id } = useParams();

  return (
    <Grid container justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={50} justifyContent="center">
        <Typography variant="h5" align="center">
          School Name
        </Typography>
        <Typography variant="h5" align="center">
          Address
        </Typography>
        </Stack>

        <SchoolDetailMid/>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
                to={"/schools/" + id + "/planner"}
                color="primary"
                variant="outlined"
                size="small"
                style={{  }}>
                  Route Planner
          </Button>
          <Button component={RouterLink}
              to={"/schools/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{  }}>
              Modify
          </Button>
          <SchoolDeleteDialog schoolName="abc"/>
        </Stack>
      </Stack>
    </Grid>
  );
}