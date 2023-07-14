import React, { useCallback } from "react";
import xml from "xml";

import "./Changes.css";

export function Changes({osmData}) {
    const downloadHandler = useCallback(() => {
        if (osmData && osmData.changes) {
            
            const xmlNodes = osmData.changes.map(({action, element}) => {
                const tagElements = Object.entries(element.tags)
                    .map(([k, v]) => ({tag: {_attr: {k, v}}}));
                
                const {type, tags, ...attr} = element;
                attr['action'] = 'modify';
                
                return {
                    [element.type]: [{_attr: attr}, ...tagElements]
                }
            });

            const data = xml({osm: [{_attr: {version: "0.6", generator: "osm-gtfs"}}, ...xmlNodes]}, { declaration: true });

            const blob = new Blob([data], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);

            download(url, 'gtfs-changes.osm');

            URL.revokeObjectURL(url);
        }
    }, [osmData]);

    return <>
        <h4>Changes</h4>
        {osmData && osmData.changes.map(ch => <div>
            <span className={'change-element-type'}>{ch.element.type}</span>
            <span className={'change-element-id'}>{ch.element.id}</span>
            <span className={'change-action'}>{ch.action}</span>
        </div>)}
        <button onClick={downloadHandler}>Download as OSM file</button>
    </>
}

function download(path, filename) {
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.download = filename;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);
}
