import React from 'react'
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import { Icon } from "@material-ui/core";
import ListItemText from '@mui/material/ListItemText';
import { Helmet } from 'react-helmet';

import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';

import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import update from 'immutability-helper';
let api_key = "AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o";


const containerStyle = {
    height: "400px",
    width: "500px",
};

const titleStyle = (size, margin) => {
  return(
    { 
      fontWeight: 'bold', 
      fontSize: size, 
      m: margin, 
    });
  };

  const legendItem = (src, text) => {
    return(
      <ListItem disablePadding>
        <Icon>
          <img src={src} height={25} width={25}/>
        </Icon>
        <ListItemText primary={text} />
      </ListItem>
    );
  };

const CircleOptions = {
  strokeColor: '#d9db58',
  strokeOpacity: 0.50,
  strokeWeight: 1.5,
  fillColor: '#ebed72',
  fillOpacity: 0.30,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
  radius: 482.304,
  zIndex: 1
}

const mapOptions = {
  disableDoubleClickZoom: true
};

const studentColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Name", width: 150},
  { field: 'address', headerName: "Address", width: 400},
];

const routeColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Name", width: 250},
  { field: 'description', headerName: "Description", flex: 1},
  { field: 'complete', headerName: "Is Route Complete?", width: 175,
    renderCell: (params) => (
    <>
    {
      params.value ? 
      <CheckIcon/> : 
      <CloseIcon/>
    }
    </>
  )},
];

const stopColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Stop Name", editable: true, width: 150},
  { field: 'index', headerName: "Order", type: 'number', editable: true, width: 100},
];



function NoStopsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Stops in Current Route</Box>
    </GridOverlay>
  );
}

function NoStudentsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Students in Current Route</Box>
    </GridOverlay>
  );
}

function NoRoutesOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Routes Exist</Box>
    </GridOverlay>
  );
}


function Table({columns,data, setSortModel}){

  const mappingss = {"name": 'name', "pickup": "pickup", "dropoff": "dropoff"};

  const{
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: {sortBy}
  } = useTable({columns, data, initialState: {pageIndex: 0}, manualSortBy: true},  useFilters, useSortBy);

  React.useEffect(()=>{
    console.log(sortBy)
    if(sortBy.length === 0){
      setSortModel([]);
    }
    else{
    setSortModel([{field: mappingss[sortBy[0].id], sort: sortBy[0].desc ? 'desc' : 'asc'}])
    }
  }, [sortBy])


  return (
    <>
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          < tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              < th {...column.getHeaderProps(column.getSortByToggleProps())}                       
              style={{
                borderBottom: 'solid 3px #4169E1',
                color: 'black',
              }}>{column.render('Header')} 
                     <span>
                       {column.canSort ? column.isSorted
                           ? column.isSortedDesc
                               ? <KeyboardArrowDownOutlinedIcon/>
                               : <KeyboardArrowUpOutlinedIcon/>
                           : <UnfoldMoreOutlinedIcon/> : ""}
                    </span>              
              
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {/* rows to page */}
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>
                  {/* <Link component={RouterLink} to={"/schools/" + params.value.id}>{params.value.name}</Link>*/}
                  {cell.render('Cell')}</td> 
              })}
            </tr>
          )
        })}
      </tbody>
    </table>


    </>
  )

}

function ReactStopsTable({ columns, data, setData}) {
  const [records, setRecords] = React.useState(data);

  const getRowId = React.useCallback(row => {return row.id}, []);

  const{
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({columns, data, getRowId,});
 

  //update row index
  const moveRow = (dragIndex, hoverIndex) => {
    const dragRecord = data[dragIndex]
    setData(
      update(data, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRecord],
        ],
      })
    )
  };

  return (
    <>
    <DndProvider backend={HTML5Backend}>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              <th></th>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(
            (row, index) =>
              prepareRow(row) || (
                <ReactStopRow
                  index={index}
                  row={row}
                  moveRow={moveRow}
                  {...row.getRowProps()}
                />
              )
          )}
        </tbody>
      </table>
    </DndProvider>
    </>
  )
};

//drag/drop for row in react-table
//const to function
function ReactStopRow({ row, index, moveRow }) {
  const dropRef = React.useRef(null)
  const dragRef = React.useRef(null)

  const [, drop] = useDrop({
    accept: 'row',
    hover(item, monitor) {
      if (!dropRef.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }
      // Determine rectangle on screen
      const hoverBoundingRect = dropRef.current.getBoundingClientRect()
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      moveRow(dragIndex, hoverIndex)

      item.index = hoverIndex
    },
  })
  const [{ isDragging }, drag, preview] = useDrag({
    type: "row",
    item: { index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1

  preview(drop(dropRef))
  drag(dragRef)

  return (
    <tr ref={dropRef} style={{ opacity }}>
      <td ref={dragRef}>move</td>
      {row.cells.map(cell => {
        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
      })}
    </tr>
  )
};

export default function RoutePlanner(props) {
  const [studentRows, setStudentRows] = React.useState([]);
  const [routeRows, setRouteRows] = React.useState([]); 
  const [routeInfo, setRouteInfo] = React.useState({"name": "", "description": ""}); 

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [selectionModel, setSelectionModel] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [resetRoute, setResetRoute] = React.useState(false);

  const [schoolLocation, setSchoolLocation] = React.useState({lat: 0, lng:0});

  const [stopRows, setStopRows] = React.useState([]);
  const [schoolTitle, setSchoolTitle] = React.useState("");

  const [completeness, setCompleteness] = React.useState("No Route");

  const [data, setData] = React.useState([]);
  const reactStopColumns = React.useMemo(
    () => [
     {
       Header: "Stop Name",
       accessor: "name"
     },
     {
       Header: "Order",
       accessor: "index"
     }
   ]
  );

  const [sortModel, setSortModel] = React.useState([]);
  const reactStudentColumns = React.useMemo(
    () => [
      //name,address
      {
        Header: "Name",
        accessor: "name"
      },
      {
        Header: "Address",
        accessor: "address"
      }
    ]
  )



  const [map, setMap] = React.useState(null);


  let { id } = useParams();
  let navigate = useNavigate();

  let [query, setQuery] = useSearchParams();

  React.useEffect(()=>{
    if(query.get("route") != null && query.get("route").match('^[0-9]+$')){
      setSelectionModel([parseInt(query.get("route"))]);
    }
  }, []);

  // load info into page on load
  React.useEffect(()=>{
  const fetchData = async() => {
      const result = await axios.get(
          process.env.REACT_APP_BASE_URL+`/school/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      if(result.data.success) {
          setRouteRows(result.data.school.routes);
          setSchoolLocation({lat: result.data.school.latitude, lng: result.data.school.longitude});
          setSchoolTitle(result.data.school.name);
          //setCompleteness("No Route");
          let newRows = result.data.school.students.map((value)=>{
            return {...value, address: value.user.uaddress, location: {lat: value.user.latitude, lng: value.user.longitude}}
          });
          setStudents(newRows); 
      }
      else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
      }
  };
  fetchData();
  }, [resetRoute]);

  // load route info on route edit
  React.useEffect(() => {
    const fetchStudents = async() => {
        if(selectionModel.length == 0){
            setStopRows([]);
            setData([]);
            setRouteInfo({"name": "", "description": ""});
            setStudentRows([]);
            return;
        }
        console.log(selectionModel[0]);
        let response = await axios.get(
            process.env.REACT_APP_BASE_URL+`/route/${selectionModel[0]}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        if(response.data.success){
          setRouteInfo({"name": response.data.route.name, "description": response.data.route.description});
          let newStudentRows = response.data.route.students.map((value)=>{
            return {...value, address: value.user.uaddress}
          })
          let newStopRows = response.data.route.stops.map((value)=>{
            return {...value, location: {lat: value.latitude, lng: value.longitude}}
          });
          console.log("STOP ROWS")
          console.log(newStopRows);
          setStudentRows(newStudentRows);
          setStopRows(newStopRows);
          setData(newStopRows);
        }
        else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
        }
    }

    fetchStudents();
  }, [selectionModel])

  // update map view/zoom when students/school is changed
  React.useEffect(()=>{
    if(map){
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < students.length; i++) {
        bounds.extend(students[i].location);
      }
      bounds.extend(schoolLocation);
      map.fitBounds(bounds);
    }
  }, [students, schoolLocation, map]);

  // update route completeness on a change
  React.useEffect(()=>{
    let active = true;
    const fetchData = async() => {
      if (selectionModel.length != 0 || routeInfo["name"] != "" ) {
        const result = await axios.post(process.env.REACT_APP_BASE_URL+`/check_complete`, {
          students: studentRows.map((value)=>{return value.id}),
          stops: stopRows.map((value)=>{return { name: value.name, index: value.index, latitude: value.location.lat, longitude: value.location.lng}})
          }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        if(result.data.success){
          let isComplete = result.data.completion;
          if (isComplete && active) {
            setCompleteness("Complete");
          }
          else if(active){
            setCompleteness("Incomplete");
          }
        }
        else{
          console.log("Completeness check failed.")
        }
      }
      else if (active){
        setCompleteness("No Route");
      }
    }
    fetchData(); 

    return () => {
      active = false;
    };
  }, [selectionModel, stopRows, studentRows, students, routeInfo]);

  // function on snackbar close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // function when address is clicked (add address to route)
  const handleAddressClick = (student) => {
      let addresses = studentRows.map((value)=>{return value.address});
      if(addresses.includes(student.address)){
          let newStudentRows = studentRows.filter(value=> value.address != student.address)
          setStudentRows(newStudentRows)
      }
      else{
          let allStudents = students.filter(value => value.address == student.address)
          let newStudentRows = [...studentRows, ...allStudents];
          setStudentRows(newStudentRows);
      }
  };

  // function when map is double clicked (add stop to map)
  const handleMapClick = (value) => {
      let loc = {
        lat: value.lat(),
        lng: value.lng(),
      };

      // update stopRows
      let exp = "^Stop [0-9]+$";
      let max = stopRows.length+1;
      for (let i=0;i<stopRows.length;i++) {
        let stringmatch = stopRows[i].name.match(exp);
        if (stringmatch != null) {
          let num = stopRows[i].name.split(' ')[1];
          max = Math.max(max, parseInt(num)+1);
        }
      }

      let stopindex = stopRows.length+1;
      let newStopRow = {id: value.lat() + value.lng(), index: stopindex, name: `Stop ${max}`, location: loc};
      let newStopRows = [...stopRows, newStopRow];
      console.log(newStopRow);
      setStopRows(newStopRows);
      setData(newStopRows);
  }

  // function when stop icon is clicked on
  const handleStopClick = (stop) => {
    let newStopRows = stopRows.filter(value => value.id != stop.id);
    for (let i=0;i<newStopRows.length;i++) {
      if (newStopRows[i]["index"] > stop.index) {
        newStopRows[i]["index"] = newStopRows[i]["index"]-1;
      }
    }
    setStopRows(newStopRows);
    setData(newStopRows);
  };

  // function to check stop indices (will become deprecated)
  const validateStops = (allRows) => {
    const errors = [];
    console.log(allRows)
    let rowsWithIndex = [];
    for (let i=0;i<allRows.length;i++) {
      let cur_row = allRows[i];
      rowsWithIndex.push(cur_row["index"]);
      if ((cur_row["index"]>(allRows.length))) {
        errors.push("Stop indexes must not be skipped. Index: \""+cur_row["index"]+"\" is too large.");
        return errors;
      }
    }
    console.log(rowsWithIndex)
    var set = new Set(rowsWithIndex)
    if (set.size !== rowsWithIndex.length) {
      errors.push("Multiple stops cannot have the same index!");
    } 
    return errors;
  };

  // function when add/update route button is clicked
  const handleSubmit = (event) => {
    const errors = validateStops(stopRows);
    if (errors.length > 0) {
      console.log('ERROR')
      setSnackbarOpen(true);
      setSnackbarSeverity('error');
      setSnackbarMsg(errors[0]);
    }
    else {
      if(selectionModel.length == 0){
        console.log("new stops: ");
        console.log(stopRows);
        axios.post(process.env.REACT_APP_BASE_URL+`/route`, {
            school_id: parseInt(id),
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id}),
            stops: stopRows.map((value)=>{return { name: value.name, index: value.index, latitude: value.location.lat, longitude: value.location.lng}})
        }, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then((res)=>{
            if(res.data.success){
                setRouteInfo({"name": "", "description": ""});
                setStudentRows([]);
                setStopRows([]);
                setData([]);
                setSnackbarOpen(true);
                setSnackbarSeverity('success');
                setSnackbarMsg('Route successfully created');
                setSelectionModel([]);
                setCompleteness("No Route");
                setResetRoute(!resetRoute);
            }
            else {
                setSnackbarOpen(true);
                setSnackbarSeverity('error');
                setSnackbarMsg('Failed to create route');
            }
          }
        );
      }
      else{
          console.log("patch stops: ");
          console.log(stopRows);
          axios.patch(process.env.REACT_APP_BASE_URL+`/route/${selectionModel[0]}`, {
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id}),
            stops: stopRows.map((value)=>{return { name: value.name, index: value.index, latitude: value.location.lat, longitude: value.location.lng}})
        }, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then((res)=>{
            if(res.data.success){
                setRouteInfo({"name": "", "description": ""});
                setStudentRows([]);
                setStopRows([]);
                setData([]);
                setSnackbarOpen(true);
                setSnackbarSeverity('success');
                setSnackbarMsg('Route successfully updated');
                setSelectionModel([]);
                setCompleteness("No Route");
                setResetRoute(!resetRoute);
            }
            else{
                setSnackbarOpen(true);
                setSnackbarSeverity('error');
                setSnackbarMsg('Failed to update route');
            }
          }
        );
      }
    }
  }

  // function when user types in textfields
  const handleInfoChange = (fieldindicator, new_value) => {
    let newInfo = JSON.parse(JSON.stringify(routeInfo));
    if (fieldindicator == "name") {
      newInfo["name"] = new_value;
      setRouteInfo(newInfo);
    }
    else if (fieldindicator == "description") {
      newInfo["description"] = new_value;
      setRouteInfo(newInfo);
    }
  };

  // function when user stops editing stop cell (will become deprecated?)
  const handleStopCellEdit = (row, allRows) => {
    let oldStopRows = JSON.parse(JSON.stringify(allRows));
    if (row.field === "name") {
      const rowIndex = allRows.findIndex(row_to_edit => row_to_edit.id === row.id);
      const newRows = [...allRows];
      newRows[rowIndex]["name"] = row.value;
      setStopRows(newRows);
    }
    if (row.field === "index") {
      if (typeof(row.value) != "number") {
        setSnackbarOpen(true);
        setSnackbarSeverity('error');
        setSnackbarMsg('Index must be a number!');
        setStopRows(oldStopRows);
      }
      else if ((parseInt(row.value) < 1)) {
        setSnackbarOpen(true);
        setSnackbarSeverity('error');
        setSnackbarMsg('Stops indexes must be 1 or greater!');
        setStopRows(oldStopRows);
      }
      else {
        const rowIndex = allRows.findIndex(row_to_edit => row_to_edit.id === row.id);
        const newRows = [...allRows];
        newRows[rowIndex]["index"] = parseInt(row.value);
        setStopRows(newRows);
      }
    }
  };

  // function on map load-in
  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, [])

  return (
    <>
    <Helmet>
      <title>
        {schoolTitle + " - Route Planner"}
      </title>
    </Helmet>
    <Stack id="container-stack" spacing={5} justifyContent="center" alignItems="center">
      <Typography variant="h2" align="center" sx={titleStyle(36, 1)}>
        {schoolTitle}
      </Typography>

      <Divider id="divider" variant="fullWidth" style={{width:'100%'}}/>

      <Stack id="top-stack" spacing={0} justifyContent="center">
        <Typography variant="h2" align="center" sx={titleStyle(28, 1)}>
          Route List
        </Typography>
        <Typography variant="subtitle2" align="left">
          (Click on a route to start editing it)
        </Typography>
        <div style={{ height: 400, width: 1200 }}>
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ flexGrow: 1 }}>
              <DataGrid
                components={{
                  NoRowsOverlay: NoRoutesOverlay,
                }}
                rows={routeRows}
                columns={routeColumns}
                selectionModel={selectionModel}
                onSelectionModelChange={(selectionModel) => setSelectionModel(selectionModel)}
                getRowId={(row) => row.id}
                autoPageSize
                density="compact"
              />


            </div>
          </div>
        </div>
      </Stack>

      <Divider id="divider" variant="fullWidth" style={{width:'100%'}}/>

      <Stack id="bottom-stack" spacing={3} justifyContent="center" alignItems="center">
        <Typography variant="h2" align="center" sx={titleStyle(28, 1)}>
          Route Editor
        </Typography>
        <Stack id="bottom-middle-stack" direction="row" spacing={10} justifyContent="center" alignItems="center" sx={{ width: 1200 }}>
          <Stack id="route-info-stack" spacing={2} justifyContent="center" alignItems="center">
            <Stack id="indicator-and-check-stack" direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography variant="h5" align="left" sx={{ width: 300, fontWeight: 'bold', fontSize: 28 }}>
                Current Route: {routeInfo["name"].length==0 ? "None" : routeInfo["name"]}
              </Typography>

              {completeness=="No Route" ? <Typography variant="h5" align="right" sx={{ width: 300, fontSize: 22 }}>
                {"Completeness: "+completeness}
              </Typography> : (completeness=="Incomplete" ? <Typography variant="h5" align="right" sx={{ width: 300, fontSize: 22, color: '#ff0000' }}>
                {"Completeness: "+completeness}
              </Typography> : <Typography variant="h5" align="right" sx={{ width: 300, fontSize: 22, color: '#00ff00' }}>
                {"Completeness: "+completeness}
              </Typography>)}

            </Stack>
            <TextField label="Route Name" 
            variant="outlined" 
            value={routeInfo["name"]} 
            onChange={(e) => handleInfoChange("name", e.target.value)} 
            fullWidth />
            <TextField label="Route Description" 
            variant="outlined"
            multiline 
            rows={10} 
            value={routeInfo["description"]} 
            onChange={(e) => handleInfoChange("description", e.target.value)} 
            fullWidth />
          </Stack>
          <Stack id="map-stack" spacing={0} justifyContent="center" alignItems="center" sx={{ p: 2, border: 2, borderRadius: '16px', borderColor: '#dcdcdc'}}>
            <Stack id="legend-stack" direction="row" spacing={4} alignItems="center" justifyContent="center">
              <List>
                {legendItem("http://maps.google.com/mapfiles/kml/paddle/ltblu-blank.png", "= School")}
                {legendItem("http://maps.google.com/mapfiles/kml/paddle/red-circle.png", "= Student Without a Route")}
                
              </List>
              <List>
                {legendItem("http://maps.google.com/mapfiles/kml/paddle/blu-circle.png", "= Student on a Different Route")}
                {legendItem("http://maps.google.com/mapfiles/kml/paddle/grn-circle.png", "= Student on the Current Route")}
              </List>
            </Stack>
            
            <LoadScript googleMapsApiKey={api_key}>
              <GoogleMap mapContainerStyle={containerStyle} onLoad={onLoad} options={mapOptions} onDblClick={(value) => handleMapClick(value.latLng)}>
                <Marker title="School" position={schoolLocation} icon="http://maps.google.com/mapfiles/kml/paddle/ltblu-blank.png"/>
                {students.map((student, index) => (
                  <Marker key={index} title={student.name} position={student.location} onClick={() => handleAddressClick(student)}
                  icon={{url: studentRows.find(element => student.id == element.id) ? "http://maps.google.com/mapfiles/kml/paddle/grn-circle.png"
                  : (student.route == null ? "http://maps.google.com/mapfiles/kml/paddle/red-circle.png"
                  : "http://maps.google.com/mapfiles/kml/paddle/blu-circle.png") }}/> ))}
                {stopRows.map((stop, index) => (
                  <Marker key={index} title={stop.name} position={stop.location} onClick={() => handleStopClick(stop)} 
                  icon={{url: "http://maps.google.com/mapfiles/kml/paddle/red-square-lv.png"}}/>))} 
                {stopRows.map((stop, index) => (
                  <Circle key={index} center={stop.location} options={CircleOptions} />))} 
              </GoogleMap>
            </LoadScript>
            <Typography variant="subtitle2" align="left" sx={{ fontSize: 12, mt: 1 }}>Click on an student to add it to the route! Click on that student again to remove it.</Typography>
            <Typography variant="subtitle2" align="left" sx={{ fontSize: 12 }}>Double click anywhere to add a stop! Click on that stop again to remove it.</Typography>
          </Stack>
        </Stack>

        <Stack id="bottom-tables-stack" direction="row" spacing={5} alignItems="center" justifyContent="center">
          <Stack id="student-table-stack" spacing={0} justifyContent="center">
            <Typography variant="h5" align="left" sx={titleStyle(28, 1)}>
              Current Students in Route:
            </Typography>
            <div style={{ height: 350, width: 600 }}>
              <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ flexGrow: 1 }}>
                  <DataGrid
                    components={{
                      NoRowsOverlay: NoStudentsOverlay,
                    }}
                    rows={studentRows}
                    columns={studentColumns}
                    getRowId={(row) => row.id}
                    autoPageSize
                    density="compact"
                  />
                </div>
              </div>
            </div>
          </Stack>
          <Stack id="stop-stable-stack" spacing={0} justifyContent="center">
            <Typography variant="h5" align="left" sx={titleStyle(28, 0)}>
              Current Stops in Route: 
            </Typography>
            <Typography variant="subtitle2" align="left">
              (Click on a stop name or ordering to start editing it)
            </Typography>
            <div style={{ height: 350, width: 600 }}>
              <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ flexGrow: 1 }}>
                  {/*<DataGrid
                    components={{
                      NoRowsOverlay: NoStopsOverlay,
                    }}
                    rows={stopRows}
                    columns={stopColumns}
                    getRowId={(row) => row.id}
                    autoPageSize
                    density="compact"
                    onCellEditCommit = {(row) => handleStopCellEdit(row, stopRows)}
                  />*/}
                  <ReactStopsTable columns = {reactStopColumns} data = {stopRows} setData={setStopRows}/>   
                </div>
              </div>
            </div>
          </Stack>
        </Stack>

        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={routeInfo["name"] == ""}>
          {selectionModel.length == 0 ? "Save Route" : "Update Route"}
        </Button>
      </Stack>

      <Snackbar open={snackbarOpen} onClose={handleClose} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}} sx={{ width: 600 }}>
        <Alert onClose={handleClose} severity={snackbarSeverity}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Stack>
    </>
  )
} 