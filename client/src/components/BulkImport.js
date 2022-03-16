import React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@material-ui/core/Button';
import Dropzone, {useDropzone} from 'react-dropzone';
// import FontIcon from '@material-ui/icons/Font';
import {blue} from '@mui/material/colors';
import {ThemeProvider} from '@mui/material/styles';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Papa from "papaparse";

export default function BulkImport(){
    const maxNum = 2;
    const [filesPreview, setPreview] = React.useState([]);
    const [files, setFiles] = React.useState([]);
    const [parsedFiles, setParsed] = React.useState([]);

    const handleUpload = () => {}

    const onDrop = React.useCallback(acceptedFiles => {
        var allfiles = files;
        var currParsed = parsedFiles;
        bigif: if(allfiles.length < maxNum){

          var fileNames=[];
          var trueNames=[];
          for(var i in files){
            fileNames.push(<div>
                {files[i][0].name}
                </div>
            );
            trueNames.push(files[i][0].name);
          }
          if(trueNames.includes(acceptedFiles[0].name)){
              alert("Cannot upload two files with same name");
              break bigif;
          }
          allfiles.push(acceptedFiles);
          Papa.parse(acceptedFiles[0], {
            complete: function(results) {
              console.log("Finished:", results.data);
              currParsed.push(results.data);
              console.log(currParsed);
          }});
          fileNames.push(<div>{acceptedFiles[0].name}</div> );
          setFiles(allfiles);
          setPreview(fileNames);
          setParsed(currParsed);
        }
        else{
            alert("Only two files should be uploaded")
        }
        }, [])

    const onDropReject = React.useCallback(rejectedFiles => {
            alert("Invalid File")
        }, [])
        
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
        
            return (
                <div className="App">
                  <Dropzone
                    onDropAccepted={onDrop}
                    onDropRejected={onDropReject}
                    accept="text/csv"
                >
                    {({
                      getRootProps,
                      getInputProps,
                      isDragActive,
                      isDragAccept,
                      isDragReject
                    }) => {
                      const additionalClass = isDragAccept
                        ? "accept"
                        : isDragReject
                        ? "reject"
                        : "";
            
                      return (
                        <div
                          {...getRootProps({
                            className: `dropzone ${additionalClass}`
                          })}
                        >
                          <input {...getInputProps()} />
                          {/* <span>📁</span> */}
                          <p>Drag'n'drop files</p>
                          <FileUploadIcon></FileUploadIcon>
                        </div>
                      );
                    }}
                  </Dropzone>
                  <div>
                    <strong>Files:</strong>
                    <ul>
                      {filesPreview.map(fileName => (
                        <li key={fileName.props.children}>{fileName}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Button
                    variant="contained"
                    component="label"
                    onClick={handleUpload}
                    >
                    Upload Files
                    </Button>
                  </div>
                </div>
              );
    }
  
