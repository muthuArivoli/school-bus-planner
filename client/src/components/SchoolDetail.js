import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CustomBreadcrumb from './CustomBreadcrumb'


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function DirectionStack() {
  return (
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={3}>
          <Item>School Name</Item>
          <Item>Address</Item>
        </Stack>
        <Stack direction="row" spacing={3}>
          <Item>Bus Routes</Item>
          <Item>Students</Item>
          <Item>Students without Busroutes</Item>
        </Stack>
        <CustomBreadcrumb />
      </Stack>
    </Grid>
  );
}