import * as L from 'leaflet';
declare module 'leaflet' {
  function heatLayer(latlngs: Array<[number, number, number]>, options?: any): any;
  class HeatLayer {
    constructor(latlngs: Array<[number, number, number]>, options?: any);
    addTo(map: L.Map): this;
    remove(): void;
  }
}
