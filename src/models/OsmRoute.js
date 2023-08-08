
export class OsmRoute {

    constructor(ref, relations) {
        this.ref = ref;

        this.masterRelation;
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