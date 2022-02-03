import * as React from 'react';
import Typography from '@mui/material/Typography';
import UserDetailStudentList from './UserDetailStudentList';
import UserDetailStudentListNoRoutes from './UserDetailStudentListNoRoutes';
import Stack from '@mui/material/Stack';

export default function SchoolDetMid(props) {
  return (<Stack direction="row" spacing={3} sx={{ width: '100%'}}>
  <Stack spacing={1} sx={{ width: '100%'}}>
    <Typography variant="body1" align="center">
      Students
    </Typography>
    <UserDetailStudentList rows={props.rows.filter(value => value.route_id != null)}/>
  </Stack>
  <Stack spacing={1} sx={{ width: '100%'}}>
    <Typography variant="body1" align="center">
      Students without Bus Routes
    </Typography>
    <UserDetailStudentListNoRoutes rows={props.rows.filter(value => value.route_id == null)}/>
  </Stack>
</Stack>
  );
}