import React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@material-ui/core/Button';
import Dropzone, {useDropzone} from 'react-dropzone';
// import FontIcon from '@material-ui/icons/Font';
import {blue} from '@mui/material/colors';
import {ThemeProvider} from '@mui/material/styles';
import FileUploadIcon from '@mui/icons-material/FileUpload';

export default function BulkImport(){
    const maxNum = 3;
    const [filesPreview, setPreview] = React.useState([]);
    const [files, setFiles] = React.useState([]);

    const handleUpload = () => {}


    const onDrop = React.useCallback(acceptedFiles => {
        var allfiles = files;
        if(allfiles.length < maxNum){
            allfiles.push(acceptedFiles);
            var filesPreview=[];
            for(var i in allfiles){
            filesPreview.push(<div>
                {allfiles[i][0].name}
                </div>
            )
            }
            setFiles(allfiles);
            setPreview(filesPreview)
        }
        else{
            alert("Only two files should be uploaded")
        }
        }, [])
        
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
            // return (
            //     <div className="BulkImport">
            //     <div {...getRootProps()}>
            //     <input {...getInputProps()} />
            //     {
            //         isDragActive ?
            //         <p>Drop the files here ...</p> :
            //         <p>Drag 'n' drop some files here, or click to select files</p>
            //     }
            //     </div>
            //     <div>
            //     Files to be uploaded are:
            //     {filesPreview}
            //     </div>
            //     {/* <Button
            //     variant="contained"
            //     component="label"
            //     onClick={handleSubmission}
            //     >
            //     Browse Files
            //     <input
            //     type="file"
            //     accept=".csv"
            //     // onChange={(e) => {onDrop(e.target.files)}}
            //     hidden
            //     />
            //     </Button> */}
            //     </div>
            // )
            return (
                <div className="App">
                  <Dropzone
                    onDrop={onDrop}
                    accept=".csv"
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
                        <li key={fileName}>{fileName}</li>
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
  
