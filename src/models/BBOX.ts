export default class BBOX {
    minx: number
    miny: number
    maxx: number
    maxy: number

    constructor(minx: number, miny: number, maxx: number, maxy: number) {
        this.minx = minx;
        this.maxx = maxx ?? minx;
        
        this.miny = miny;
        this.maxy = maxy ?? miny;
    }

    extend(x: number, y: number) {
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

export function expandBBOX(bbox: BBOX, delta: number) {
    const minx = bbox.minx - delta;
    const miny = bbox.miny - delta;
    
    const maxx = bbox.maxx + delta;
    const maxy = bbox.maxy + delta;

    return new BBOX(minx, miny, maxx, maxy);
}