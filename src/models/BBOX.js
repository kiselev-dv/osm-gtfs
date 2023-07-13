export default class BBOX {
    constructor(x, y) {
        this.minx = x;
        this.maxx = x;
        
        this.miny = y;
        this.maxy = y;
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