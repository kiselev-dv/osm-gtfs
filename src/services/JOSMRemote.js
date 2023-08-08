import xml from "xml";

/**
 * Interface to call JOSM Remote commands
 * 
 * https://josm.openstreetmap.de/wiki/Help/RemoteControlCommands
 */


const BASE = 'http://localhost:8111'

/**
 * https://josm.openstreetmap.de/wiki/Help/RemoteControlCommands#load_object
*/
export function loadInJOSM(osmElements, loadReferers = false) {
    const ids = osmElements?.map(e => `${e.type[0]}${e.id}`);

    const urlArgs = {
        objects: ids.join(),
        new_layer: true,
        referrers: loadReferers
    }

    const url = new URL('load_object', BASE);
    Object.entries(urlArgs).forEach(([k, v]) => url.searchParams.append(k, v));

    console.log('Call josm remote', url);
    fetch(url).catch(e => {alert('failed to open JOSM remote')});
}

export function createOSMXml(osmData) {
    
}