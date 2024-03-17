import { OSMRelation } from "../services/OSMData.types";

export class OsmRoute {

    ref: string
    name: string

    tripRelations: OSMRelation[]
    masterRelation?: OSMRelation

    constructor(ref: string, relations: OSMRelation[]) {
        this.ref = ref;

        this.tripRelations = [];

        relations.forEach(r => {
            if (r.tags.type === 'route_master') {
                if (this.masterRelation) {
                    console.warn('Multiple master relations', this.masterRelation, r);
                }

                this.masterRelation = r;
            }
            else {
                this.tripRelations.push(r);
            }
        });

        this.name = this.masterRelation?.tags?.name || this.tripRelations[0]?.tags?.name;
    }
    
}