export default class BBOX {
    constructor(minx, miny, maxx, maxy) {
        this.minx = minx;
        this.maxx = maxx ?? minx;
        
        this.miny = miny;
        this.maxy = maxy ?? miny;
    }

    extend(x, y) {
        this.minx = Math.min(this.minx, x);
        this.maxx = Math.max(this.maxx, x);

        this.miny = Math.min(this.miny, y);
        this.maxy = Math.max(this.maxy, y);
    }

    getCenter() {
        return {
            x: (this.maxx + this.miny) / 2.0,
            y: (this.maxy + this.miny) / 2.0,
        };
    }
}

export function expandBBOX(bbox, delta) {
    const minx = bbox.minx - delta;
    const miny = bbox.miny - delta;
    
    const maxx = bbox.maxx + delta;
    const maxy = bbox.maxy + delta;

    return new BBOX(minx, miny, maxx, maxy);
}