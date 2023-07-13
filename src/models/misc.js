import L from 'leaflet';

const merc = L.Projection.SphericalMercator;

export function lonLatToMerc(lng, lat) {
    return merc.project({lat, lng});
}