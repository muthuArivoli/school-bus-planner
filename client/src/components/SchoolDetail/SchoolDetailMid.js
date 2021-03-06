import * as React from 'react';
import SchoolDetailStudentList from './SchoolDetailStudentList';
import Typography from '@mui/material/Typography';
import SchoolDetailRouteList from "./SchoolDetailRouteList";
import Stack from '@mui/material/Stack';

export default function SchoolDetMid(props) {
  return (<Stack direction="row" spacing={3} sx={{ width: '100%'}}>
  <Stack spacing={1} sx={{ width: '100%'}}>
    <Typography variant="body1" align="center">
      Bus Routes
    </Typography>
    <SchoolDetailRouteList rows={props.routes} loading={props.loading}/>
  </Stack>
  <Stack spacing={1} sx={{ width: '100%'}}>
    <Typography variant="body1" align="center">
      Students
    </Typography>
    <SchoolDetailStudentList rows={props.students} loading={props.loading}/>
  </Stack>
</Stack>
  );
}