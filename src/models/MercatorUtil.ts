import L from 'leaflet';

const merc = L.Projection.SphericalMercator;

export function lonLatToMerc(lng: number, lat: number) {
    return merc.project({lat, lng});
}