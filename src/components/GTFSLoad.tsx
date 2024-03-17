import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GTFSData from '../models/GTFSData';

import './gtfsload.css';

// @ts-ignore
import JSZip from 'jszip/dist/jszip.min.js';

type DropzoneProps = {
    onLoad: (file: File) => void;
};
function Dropzone({onLoad}: DropzoneProps) {
    // @ts-ignore
    const onDrop = useCallback(acceptedFiles => {
        onLoad( acceptedFiles[0] );
    }, [onLoad]);

    const cfg = {
        onDrop,
        accept: {
            'application/zip': ['.zip']
        }
    };

    const {getRootProps, getInputProps, isDragActive} = useDropzone(cfg);
  
    return (
      <div className={'dropzone'} {...getRootProps()}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <p>Drag 'n' drop GTFS zip file ( or click to select )</p>
        }
      </div>
    )
}

type fileCB = (f: File) => void

type GTFSLoadProps = {
    gtfsData?: GTFSData
    onDataLoaded: (gtfsData: GTFSData) => void
};
export default function GTFSLoad ({gtfsData, onDataLoaded}: GTFSLoadProps) {

    const [file, setFile] = useState<File>();

    const processZipFile = useCallback<fileCB>(async f => {
        setFile(f);

        const gtfsData = new GTFSData();

        const zipData = await new JSZip().loadAsync(f);
        const stopsZip = zipData.files['stops.txt'];

        if (stopsZip) {
            const stopsCSV = await stopsZip.async('string');
            gtfsData.loadStops(stopsCSV);
        }

        const routes = await zipData.files['routes.txt']?.async('string');
        const trips = await zipData.files['trips.txt']?.async('string');
        const stopTimes = await zipData.files['stop_times.txt']?.async('string');

        if (routes && trips && stopTimes) {
            gtfsData.loadRoutes(routes, trips, stopTimes);
        }

        onDataLoaded(gtfsData);
    }, [onDataLoaded]);

    return <>
        {
        // @ts-ignore
        file ? <div>{file.name}</div> : <Dropzone onLoad={processZipFile}/>
        }
        { gtfsData && <div>Loaded {gtfsData.stops.length} stops</div> }
    </>

}
