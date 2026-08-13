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
    CallbackPositionProperty,
    JulianDate, //Let's an entity calculate a new position whenever cesium needs to render it
} from "cesium";

//Importing our own orbital calculation functions
import {
    calculateSatellitePosition,
    createSatelliteRecord,
} from "../lib/orbit";

import "cesium/Build/Cesium/Widgets/widgets.css";
import { resumePluginState } from "next/dist/build/build-context";


//The ISS TLE lines from CelesTrak, hardcoded for now.
const ISS_TLE_LINE_1 = "1 25544U 98067A   26222.50435993  .00003786  00000+0  75820-4 0  9991";
const ISS_TLE_LINE_2 = "2 25544  51.6324  31.2750 0007420  32.4605 327.6839 15.49403146580170";

//Hubble:
const Hubble_TLE_LINE_1 = "1 20580U 90037B   26224.59154121  .00003205  00000+0  95532-4 0  9995";
const Hubble_TLE_LINE_2 = "2 20580  28.4727  54.8959 0002463  53.8814 306.2010 15.31324458797226";


const issSatelliteRecord = createSatelliteRecord(ISS_TLE_LINE_1, ISS_TLE_LINE_2);

const hubbleSatelliteRecord = createSatelliteRecord(Hubble_TLE_LINE_1, Hubble_TLE_LINE_2);








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





        //setting the simulation clock time to real-world time
        viewer.clock.currentTime = JulianDate.now();
        
        viewer.clock.shouldAnimate = true;
        
        //to speed up the simulation(100x);
        viewer.clock.multiplier = 100;


        //Adding a trail for the ISS
        const trailCenterTime = JulianDate.toDate(viewer.clock.currentTime);

        const tenMinutesBefore = new Date(trailCenterTime.getTime() - 10 * 60 * 1000);
        console.log("Center: ", trailCenterTime);
        console.log("10 minutes before: ", tenMinutesBefore);


        const tenMinutesBeforePosition = calculateSatellitePosition(issSatelliteRecord, tenMinutesBefore);
        console.log("ISS position 10 miutes before:", tenMinutesBeforePosition);


        if(tenMinutesBeforePosition !== null){
            const altitudeMeteresTenMinutesBefore = tenMinutesBeforePosition.altitudekm * 1000;
            const tenMinutesBeforeCartesian = Cartesian3.fromDegrees(tenMinutesBeforePosition.longitude, tenMinutesBeforePosition.latitude,altitudeMeteresTenMinutesBefore);

            console.log("here:    ", tenMinutesBeforeCartesian);
        }





        //we need to use the CallbackPositonProperty to create dynamic positions for our satellites
        const issPosition = new CallbackPositionProperty(
            (time, result) => {

                const currentTime = time ?? JulianDate.now();

                const date = JulianDate.toDate(currentTime);

                const position = calculateSatellitePosition(issSatelliteRecord, date);

                if(position === null) {
                    return undefined;
                }

                const altitudeMeteres = position.altitudekm * 1000;

                return Cartesian3.fromDegrees(position.longitude, position.latitude, altitudeMeteres, undefined, result);
            },
            false, //tells the callback that the position changes over time.
        );

        const hubblePosition = new CallbackPositionProperty(
            (time, result) => {
                const currentTime = time ?? JulianDate.now();
                const date = JulianDate.toDate(currentTime);
                const position = calculateSatellitePosition(hubbleSatelliteRecord, date);
                if(position === null){
                    return undefined;
                }

                const altitudeMeters = position.altitudekm * 1000;
                return Cartesian3.fromDegrees(position.longitude, position.latitude, altitudeMeters);
            },
            false,
        );


        //addidng the coordinates now:
        //temporarily hardcoding the coordinates:
        // const issLongitude = -169.4569;
        // const issLatitude = 21.1821;
        // const issAltitudeKm = 421.2229;

        // const issAltitudeMeters = issAltitudeKm * 1000;


        // //now converting the normal earth coordinates into cesium's internal 3D cartesian system
        // const issPosition = Cartesian3.fromDegrees(issLongitude, issLatitude, issAltitudeMeters);

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


        //adding a viewer for the hubble:
        const hubbleEntity = viewer.entities.add({
            name: "Hubble",
            position: hubblePosition,
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
 
        })

        //viewer.flyTo(issEntity);




        return() => {
            viewer.destroy();
        };


    }, []);

    return <div ref={cesiumContainer} className="h-screen w-screen" />

}