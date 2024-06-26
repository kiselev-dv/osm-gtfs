import { useCallback } from "react";
import xml from "xml";

import OSMData, { OSMDataChange } from "../services/OSMData";
import "./Changes.css";

type ChangesProps = {
    osmData?: OSMData
};
export function Changes({osmData}: ChangesProps) {
    const downloadHandler = useCallback(() => {
        if (osmData && osmData.changes) {
            const data = encodeChanges(osmData.changes);
            
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
            <span className={'change-action'}>{asArray(ch.action).join(', ')}</span>
        </div>)}
        <button onClick={downloadHandler}>Download as OSM file</button>
    </>
}

function encodeChanges(changes: OSMDataChange[]) {
    const xmlNodes = changes.map(({element}) => {
        const tagElements = Object.entries(element.tags)
            .map(([k, v]) => ({tag: {_attr: {k, v}}}));
        
        const {type, tags, ...attr} = element;

        // @ts-ignore
        attr['action'] = 'modify';
        
        return {
            [element.type]: [{_attr: attr}, ...tagElements]
        }
    });

    return xml({osm: [{_attr: {version: "0.6", generator: "osm-gtfs"}}, ...xmlNodes]}, { declaration: true });
}

function asArray(arg: any) {
    return Array.isArray(arg) ? arg : [arg];
}

function download(path: string, filename: string) {
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.download = filename;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);
}
