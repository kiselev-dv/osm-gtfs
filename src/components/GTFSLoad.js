import React, {useCallback, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import GTFSData from '../models/GTFSData';

import './gtfsload.css'

const JSZip = require('jszip/dist/jszip.min.js');

function Dropzone({onLoad}) {
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

export default function GTFSLoad ({
    gtfsData, onDataLoaded}) {

    const [file, setFile] = useState();

    const processZipFile = useCallback(async f => {
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
        { file ? <div>{file.name}</div> : <Dropzone onLoad={processZipFile}/> }
        { gtfsData && <div>Loaded {gtfsData.stops.length} stops</div> }
    </>

}
