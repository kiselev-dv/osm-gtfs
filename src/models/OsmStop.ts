import { getElementLonLat } from "../services/OSMData";
import { LonLat, OSMElement, OSMRelation } from "../services/OSMData.types";
import { lonLatToMerc } from "./MercatorUtil";

export default class OsmStop {
    stopPosition?: OSMElement
    platform?: OSMElement
    relation: OSMRelation | null

    constructor(stopPosition?: OSMElement, platform?: OSMElement) {
        this.platform = platform;
        this.stopPosition = stopPosition;
        
        this.relation = null;
    }
    
    getName() {
        const e = this.stopPosition || this.platform;
        return e?.tags?.name;
    }
    
    getId() {
        const e = this.stopPosition || this.platform;
        return `${e?.type}${e?.id}`;
    }

    getPosition3857() {
        try {
            const e = this.stopPosition || this.platform;
            if (e) {
                // @ts-ignore
                const [lon, lat] = getElementLonLat(e);
                return lonLatToMerc(lon, lat);
            }
        }
        catch (err) {
            console.log(this);
            console.error('Failed to get OSM element position', err);
        }
    }

    getLonLat() {
        try {
            const e = this.stopPosition || this.platform;
            if (e) {
                const llTuple = getElementLonLat(e);
                if (llTuple) {
                    const [lon, lat] = llTuple;
                    return {lon, lat} as LonLat;
                }
            }
        }
        catch (err) {
            console.log(this);
            console.error('Failed to get OSM element lon lat', err);
        }
    }
    
}