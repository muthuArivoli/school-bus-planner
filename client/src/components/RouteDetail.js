import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from './DeleteDialog';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function RouteDetail() {

  const handleDelete = () => {
      console.log("Delete");
  }

  let { id } = useParams();

  return (
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={3}>
          <Item>Name</Item>
          <Item>School</Item>
        </Stack>
        <Stack direction="row" spacing={3}>
        <Item>Description</Item>
        </Stack>
        <Stack direction="row" spacing={3}>
          <Item>Students</Item>
        </Stack>
        <Breadcrumbs separator=" " aria-label="breadcrumb">
    <Button component={RouterLink}
        to={"/routes/" + id +"/update"}
        color="primary"
        variant="outlined"
        size="small"
        style={{ marginLeft: 16 }}>
        Modify
    </Button>
    <DeleteDialog dialogTitle="Delete User?" dialogDesc="Please confirm you would like to delete this route" onAccept={handleDelete}/>
        </Breadcrumbs>
      </Stack>
    </Grid>
  );
}