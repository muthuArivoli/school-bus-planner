import * as React from 'react';
import Typography from '@mui/material/Typography';
import UserDetailStudentList from './UserDetailStudentList';
import Stack from '@mui/material/Stack';

export default function SchoolDetMid(props) {
  return (<Stack direction="row" spacing={3} sx={{ width: '100%'}}>
  <Stack spacing={1} sx={{ width: '100%'}}>
    <Typography variant="body1" align="center">
      Students
    </Typography>
    <UserDetailStudentList rows={props.rows}/>
  </Stack>
</Stack>
  );
}