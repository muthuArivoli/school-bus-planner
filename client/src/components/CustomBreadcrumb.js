import * as React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';

export default function CustomSeparator() {
  const breadcrumbs = [
    <Button href={"#"}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}>
            Route Planner
    </Button>,
    <Button href={"#"}
        color="primary"
        size="small"
        style={{ marginLeft: 16 }}>
        Modify
    </Button>,
    <Button href={"#"}
        color="primary"
        size="small"
        style={{ marginLeft: 16 }}>
        Delete
    </Button>,
  ];

  return (
    <Breadcrumbs separator=" " aria-label="breadcrumb">
        {breadcrumbs}
    </Breadcrumbs>
  );
}
