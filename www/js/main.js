console.log(window.ARCGIS_API_KEY);
require(["esri/config", "esri/Map", "esri/views/MapView"], function (esriConfig, Map, MapView) {
    esriConfig.apiKey = window.ARCGIS_API_KEY;
    const map = new Map({
        basemap: "dark-gray"
    });

    const view = new MapView({
        container: "map",
        map: map,
        extent: {
            xmin: -90.32,
            ymin: 38.53,
            xmax: -90.15,
            ymax: 38.75,
            spatialReference: { wkid: 4326 }
        }
    });
}); 
