
const q1 = `
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

const endpoint = 'https://overpass-api.de/api/interpreter';

export async function queryOverpas(bbox) {

    // min_lat, min_lon, max_lat, max_lon
    const bboxString = `${bbox.miny},${bbox.minx},${bbox.maxy},${bbox.maxx}`;
    const query = q1.replaceAll('{{bbox}}', bboxString);

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
    else if (e.type === 'way') {
        // TODO
    }
    else if (e.type === 'relation') {
        // TODO
    }
}

export default class OSMData {
    constructor() {
        this.newIdCounter = -1;
        this.changes = [];

        this.elements = [];
        this.idMap = new Map();
    }

    static parseOverpassData(overpassData) {
        const instance = new OSMData();
        
        overpassData.elements.forEach(e => {
            instance.updateElement(e);
        });

        return instance;
    }

    calculateTagStatistics() {
        const stats = new Map();   
        this.elements.forEach(element => {
            element.tags && Object.keys(element.tags).forEach(key => {
                const occurances = stats.has(key) ? stats.get(key) + 1 : 0;
                stats.set(key, occurances); 
            });
        });
        return stats;
    }

    updateElement(element) {
        const {id: osmid, type} = element;
        const id = `${type}${osmid}`;

        if (this.idMap.has(id)) {
            // TBD
        }
        else {
            this.addElement(element);
        }

    }

    createNewNode({lat, lng}, tags) {
        
        const element = {
            id: this.newIdCounter--,
            type: 'node',
            lon: lng,
            lat: lat,
            tags
        };

        this.addElement(element);

        this.changes.push(
            { 'element': element, action: 'create' }
        );

        return element;
    }

    updateNodeLatLng(latlng, osmElement) {
        this.changes.push(
            { 'element': osmElement, action: 'update_position' }
        );
        
        const {lat, lng} = latlng;

        console.log('update osmElement lat lon', osmElement, lat, lng);

        osmElement.lat = lat;
        osmElement.lon = lng;
    }
    
    addElement(element) {
        const {id: osmid, type} = element;
        const id = `${type}${osmid}`;
        
        this.elements.push(element);
        this.idMap.set(id, element);
    }

    getNodeById(id) {
        this.getByTypeAndId('node', id);
    }
    
    getWayById(id) {
        this.getByTypeAndId('way', id);
    }
    
    getRelationById(id) {
        this.getByTypeAndId('relation', id);
    }

    getByTypeAndId(type, id) {
        return this.idMap.get(`${type}${id}`);
    }

}