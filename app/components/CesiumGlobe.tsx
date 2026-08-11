"use client";

import { useEffect, useRef } from "react";
import {
    GeographicTilingScheme,
    ImageryLayer,
    UrlTemplateImageryProvider,
    VerticalOrigin,// to control where the label sits
    Color, //lets us control the marker and label colors
    Cartesian3, //converts longitude/latitude/altitude into Cesium's internal 3D coordinate system
    Cartesian2,
    Viewer,
} from "cesium"

import "cesium/Build/Cesium/Widgets/widgets.css";

export default function CesiumGlobe() { 

    const cesiumContainer = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if(!cesiumContainer.current) return;

        //Telling Cesium where we copied its Workers/Assets/etc.
        window.CESIUM_BASE_URL = "/cesium/";

        const imageryProvider = new UrlTemplateImageryProvider({
            url: "/cesium/Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg",
            tilingScheme: new GeographicTilingScheme(),
            maximumLevel: 5,
        });

        const viewer = new Viewer(cesiumContainer.current, {
            baseLayer: new ImageryLayer(imageryProvider),
            animation: false,
            timeline: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            fullscreenButton: false,
        });


        //addidng the coordinates now:
        //temporarily hardcoding the coordinates:
        const issLongitude = -169.4569;
        const issLatitude = 21.1821;
        const issAltitudeKm = 421.2229;

        const issAltitudeMeters = issAltitudeKm * 1000;


        //now converting the normal earth coordinates into cesium's internal 3D cartesian system
        const issPosition = Cartesian3.fromDegrees(issLongitude, issLatitude, issAltitudeMeters);

        //adding a new entity to the Cesium's scene
        const issEntity = viewer.entities.add({
            name: "ISS (ZARYA)",
            position: issPosition,
            point: {
                // Marker diameter in pixels.
                pixelSize: 12,

                // Make the ISS marker bright white.
                color: Color.WHITE,

                // Add a darker outline around it so it remains visible
                // over both bright and dark parts of Earth.
                outlineColor: Color.BLACK,

                // Width of the marker outline.
                outlineWidth: 2,
            },

            // Add text next to the point.
            label: {

                // Text shown beside the satellite.
                text: "ISS",

                // Move the text slightly above the marker
                // instead of centering it directly over the dot.
                verticalOrigin: VerticalOrigin.BOTTOM,

                // Add some space between the marker and text.
                pixelOffset: new Cartesian2(0, -10),

                // Make the text white.
                fillColor: Color.WHITE,

                // Give the text a black outline for readability.
                outlineColor: Color.BLACK,

                // Width of the text outline.
                outlineWidth: 2,
            },

        });

        //viewer.flyTo(issEntity);




        return() => {
            viewer.destroy();
        };


    }, []);

    return <div ref={cesiumContainer} className="h-screen w-screen" />

}