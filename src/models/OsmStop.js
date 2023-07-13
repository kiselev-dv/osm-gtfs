import { getElementLonLat } from "../services/OSMData";
import { lonLatToMerc } from "./misc";

export default class OsmStop {
    constructor(stopPosition, platform) {
        this._platform = platform;
        this._stopPosition = stopPosition;
        
        this.relation = null;

        this.lon = null;
        this.lat = null;
        this.position = null;

        this._updatePosition();
    }
    
    set platform(platform) {
        this._platform = platform;
        this._updatePosition();
    }

    get platform() {
        return this._platform;
    }
    
    set stopPosition(stopPosition) {
        this._stopPosition = stopPosition;
        this._updatePosition();
    }

    get stopPosition() {
        return this._stopPosition;
    }

    getName() {
        const e = this.stopPosition || this.platform;
        return e?.tags?.name;
    }
    
    getId() {
        const e = this.stopPosition || this.platform;
        return `${e?.type}${e?.id}`;
    }

    _updatePosition() {
        const e = this.stopPosition || this.platform;

        if (e) {
            const [lon, lat] = getElementLonLat(e);
            
            this.lon = lon;
            this.lat = lat;
            
            this.position = lonLatToMerc(lon, lat);
        }
    }
    
}