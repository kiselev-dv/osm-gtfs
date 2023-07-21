import { getElementLonLat } from "../services/OSMData";
import { lonLatToMerc } from "./MercatorUtil";

export default class OsmStop {
    constructor(stopPosition, platform) {
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
                const [lon, lat] = getElementLonLat(e);
                return {lon, lat};
            }
        }
        catch (err) {
            console.log(this);
            console.error('Failed to get OSM element lon lat', err);
        }
    }
    
}