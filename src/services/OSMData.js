import { ROUTE_TYPES } from "./Matcher";

const stopsQ = `
[out:json][timeout:900];
(
  node["public_transport"="platform"]({{bbox}});
  way["public_transport"="platform"]({{bbox}});
  
  node["public_transport"="stop_position"]({{bbox}});
  
  node["highway"="bus_stop"]({{bbox}});
  node["highway"="platform"]({{bbox}});

  node["amenity"="bus_station"]({{bbox}});
  way["amenity"="bus_station"]({{bbox}});
  
  node["railway"="tram_stop"]({{bbox}});
  node["railway"="platform"]({{bbox}});
  way["railway"="platform"]({{bbox}});
);
out meta;
>;
out meta qt;
`;

const routesQ = `
[out:json][timeout:900];
(
  relation["route"~"^(${ ROUTE_TYPES.join('|') })$"]({{bbox}});
  relation["type"="route_master"]({{bbox}});
);
out meta;
>;
out meta qt;
`;

const endpoint = 'https://overpass-api.de/api/interpreter';

export async function queryStops(bbox) {
    const bboxString = getBBOXString(bbox);
    const query = stopsQ.replaceAll('{{bbox}}', bboxString);

    return queryOverpass(query);
}

export async function queryRoutes(bbox) {
    const bboxString = getBBOXString(bbox);
    const query = routesQ.replaceAll('{{bbox}}', bboxString);
    
    return queryOverpass(query);
}

function getBBOXString(bbox) {
    // min_lat, min_lon, max_lat, max_lon
    return `${bbox.miny},${bbox.minx},${bbox.maxy},${bbox.maxx}`;
}

async function queryOverpass(query) {
    const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `data=${encodeURIComponent(query)}`
    });
    
    return await response.json();
}

/**
 * @typedef {Object} OSMElement
 * @property {string} id
 * @property {string} type
 * @property {{string: string}} tags
 */

export function getElementLonLat(e) {
    if (e.type === 'node') {
        return [e.lon, e.lat];
    }
    
    if (e.type === 'way') {
        const nodes = e.nodes
            .map(nid => instance.getNodeById(nid))
            .filter(n => n !== undefined);

        if (nodes.length === 0) {
            console.log('Failed to load nodes for way', e);
            return undefined;
        }

        try {
            const llngs = nodes.map(({lat, lon}) => ({lat, lng: lon}));
            const center = new L.LatLngBounds(llngs).getCenter();

            return [center.lng, center.lat];
        }
        catch (err) {
            console.log('Failed to get geometry for way', e, nodes);
            console.error('Failed to get geometry for way', err);
        }
    }
    
    if (e.type === 'relation') {
        // TODO
    }
}

export function lonLatToLatLng(lonLat) {
    if (!lonLat) {
        return undefined;
    }

    const [lng, lat] = lonLat;

    return {lng, lat};
}   

export default class OSMData {
    constructor() {
        this.newIdCounter = -1;
        this.changes = [];

        this.elements = [];
        this.idMap = new Map();
    }

    static getInstance() {
        return instance;
    }

    calculateTagStatistics(filter) {
        const stats = new Map(); 

        const elements = filter ? this.elements.filter(filter) : this.elements;

        elements.forEach(element => {
            element.tags && Object.keys(element.tags).forEach(key => {
                const occurances = stats.has(key) ? stats.get(key) + 1 : 1;
                stats.set(key, occurances); 
            });
        });
        
        return stats;
    }

    updateOverpassData(overpassData) {
        overpassData.elements.forEach(e => {
            this.updateElement(e);
        });
    }

    updateElement(element) {
        const {id, type} = element;
        const key = `${type}${id}`;

        if (this.idMap.has(key)) {
            // TBD, check for edits
        }
        else {
            this.addElement(element);
        }

    }

    createNewNode({lat, lng}, tags) {
        
        const element = {
            // In OSM data files negative IDs are used for newly created elements
            id: this.newIdCounter--,
            type: 'node',
            lon: lng,
            lat: lat,
            tags
        };

        this.addElement(element);

        this.changes.push(
            { 'element': element, action: ['create'] }
        );

        return element;
    }

    setNodeLatLng(latlng, osmElement) {
        this.commitAction({ 'element': osmElement, action: 'update_position' });
        
        const {lat, lng} = latlng;

        osmElement.lat = lat;
        osmElement.lon = lng;
    }

    setWayLatLng(latlng, osmElement) {
        console.warn('setWayLatLng not implemented');
    }

    setElementTags(tags, osmElement) {
        this.commitAction({ 'element': osmElement, action: 'change_tags' });
        
        const validTags = Object.entries(tags)
            .filter(([k, v]) => !isBlank(k) && !isBlank(v));

        osmElement.tags = Object.fromEntries(validTags);
    }
    
    addElement(element) {
        const {id, type} = element;
        const key = `${type}${id}`;
        
        this.elements.push(element);
        this.idMap.set(key, element);
    }

    commitAction({element, action}) {
        const existing = this.changes.find(change => 
            change.element.id === element.id &&
            change.element.type === element.type
        );

        if (existing) {
            !existing.action.includes(action) && existing.action.push(action);
        }
        else {
            this.changes.push({
                element,
                original: {...element}, 
                action: [action]
            });
        }
    }

    getNodeById(id) {
        return this.getByTypeAndId('node', id);
    }
    
    getWayById(id) {
        return this.getByTypeAndId('way', id);
    }
    
    getRelationById(id) {
        return this.getByTypeAndId('relation', id);
    }

    getByTypeAndId(type, id) {
        const key = `${type}${id}`;
        return this.idMap.get(key);
    }

}

function isBlank(str) {
    return str === undefined || str === null || /^\s*$/.test(str);
}

// OSM Data is a Singleton
const instance = new OSMData();
