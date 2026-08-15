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
    JulianDate,
    getImagePixels, //Let's an entity calculate a new position whenever cesium needs to render it
} from "cesium";

//Importing our own orbital calculation functions
import {
    calculateSatellitePosition,
    createSatelliteRecord,
    calculateSatelliteOrbit,
} from "../lib/orbit";

import { TLE_DATA } from "../lib/satellites";

import "cesium/Build/Cesium/Widgets/widgets.css";
import { resumePluginState } from "next/dist/build/build-context";
import { off } from "node:process";


const TLE_DATA_Dictionary = TLE_DATA();


//The ISS TLE lines from CelesTrak, hardcoded for now.
const ISS_TLE_LINE_1 = TLE_DATA_Dictionary.ISS_TLE_LINE_1;
const ISS_TLE_LINE_2 = TLE_DATA_Dictionary.ISS_TLE_LINE_2;

//Hubble:
const Hubble_TLE_LINE_1 = TLE_DATA_Dictionary.Hubble_TLE_LINE_1;
const Hubble_TLE_LINE_2 = TLE_DATA_Dictionary.Hubble_TLE_LINE_2;

//TIANHE
const Tianhe_TLE_LINE_1 = TLE_DATA_Dictionary.TIANHE_TLE_LINE_1;
const Tianhe_TLE_LINE_2 = TLE_DATA_Dictionary.TIANHE_TLE_LINE_2;




//Creating satellite records:
const issSatelliteRecord = createSatelliteRecord(ISS_TLE_LINE_1, ISS_TLE_LINE_2);

const hubbleSatelliteRecord = createSatelliteRecord(Hubble_TLE_LINE_1, Hubble_TLE_LINE_2);

const tianheSatelliteRecord = createSatelliteRecord(Tianhe_TLE_LINE_1, Tianhe_TLE_LINE_2);








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
        //viewer.clock.multiplier = 100;


        //Adding a trail for the ISS
        const trailCenterTime = JulianDate.toDate(viewer.clock.currentTime);

        //An array to hold all of the positions for the ISS's trail.

        // const trailPositions: Cartesian3[] = [];
        // const trailPositionsDictionary: Cartesian3 = {};

        let trailPositionsDictionary: Map<string, Cartesian3[]> = new Map();
        
        //adding a list for the ISS
        trailPositionsDictionary.set("ISS", []);

        //Adding a list for the Hubble:
        trailPositionsDictionary.set("Hubble", []);

        //Adding a list for the CSS Tianhe
        trailPositionsDictionary.set("CSS Tianhe", []);

        trailPositionsDictionary = calculateSatelliteOrbit(trailPositionsDictionary, "ISS", issSatelliteRecord, trailCenterTime);
        trailPositionsDictionary = calculateSatelliteOrbit(trailPositionsDictionary, "Hubble", hubbleSatelliteRecord, trailCenterTime);
        trailPositionsDictionary = calculateSatelliteOrbit(trailPositionsDictionary, "CSS Tianhe", tianheSatelliteRecord, trailCenterTime);

        // for(let offsetMinutes = -45; offsetMinutes <= 45; offsetMinutes += 5){

        //     const sampleTime = new Date(trailCenterTime.getTime() + offsetMinutes * 60 * 1000);
        //    // console.log("HERE:  ", offsetMinutes, sampleTime);
        //     const samplePosition = calculateSatellitePosition(issSatelliteRecord, sampleTime);

        //     if(samplePosition !== null){
        //         const altitudeMeters = samplePosition.altitudekm * 1000;
        //         const cartesianPosition = Cartesian3.fromDegrees(samplePosition.longitude, samplePosition.latitude, altitudeMeters);
        //         trailPositionsDictionary.get("ISS")?.push(cartesianPosition);
        //     }
        // }

        // //Hubble's position:
        // for(let offsetMinutes = -45; offsetMinutes <= 45; offsetMinutes+=5){

        //     const hubbleTime = new Date(trailCenterTime.getTime() + offsetMinutes * 60 * 1000);
        //     const hubblePosition = calculateSatellitePosition(hubbleSatelliteRecord, hubbleTime);



        //     if(hubblePosition != null){
        //         const hubbleAltitudeMeters = hubblePosition.altitudekm * 1000;
        //         const hubbleCartesianPosition = Cartesian3.fromDegrees(hubblePosition.longitude, hubblePosition.latitude, hubbleAltitudeMeters);
        //         trailPositionsDictionary.get("Hubble")?.push(hubbleCartesianPosition);
        //     }


        // }

        // //CSS trail
        // for(let offsetMinutes = -45; offsetMinutes <= 45; offsetMinutes += 5){
        //     const CSSTime = new Date(trailCenterTime.getTime() + offsetMinutes * 60 * 1000);
        //     const CSSPositions = calculateSatellitePosition(tianheSatelliteRecord, CSSTime);

        //     if(CSSPositions != null){
        //         const CSSAltitudeMeters = CSSPositions.altitudekm * 1000;
        //         const CSSCartesianPosition = Cartesian3.fromDegrees(CSSPositions.longitude, CSSPositions.latitude, CSSAltitudeMeters);
        //         trailPositionsDictionary.get("CSS Tianhe")?.push(CSSCartesianPosition);
        //     }
        // }



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


        const TianhePosition = new CallbackPositionProperty(
            (time, result) => {
                const currentTime = time ?? JulianDate.now();
                const date = JulianDate.toDate(currentTime);
                const position = calculateSatellitePosition(tianheSatelliteRecord, date);
                if(position === null){
                    return undefined;
                }

                const altitudeMeters = position.altitudekm * 1000;
                return Cartesian3.fromDegrees(position.longitude, position.latitude, altitudeMeters);
            },
            false
        )


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
                text: "Hubble",

                // Move the text slightly above the marker
                // instead of centering it directly over the dot.
                verticalOrigin: VerticalOrigin.BOTTOM,

                // Add some space between the marker and text.
                pixelOffset: new Cartesian2(0, -10),

                // Make the text white.
                fillColor: Color.ALICEBLUE,

                // Give the text a black outline for readability.
                outlineColor: Color.BLACK,

                // Width of the text outline.
                outlineWidth: 2,
            },
 
        })

        //a viewer for the Tianhe
        const tianheEntity = viewer.entities.add({
            name: "CSS (TIANHE)",
            position: TianhePosition,
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
                text: "CSS Tianhe",

                // Move the text slightly above the marker
                // instead of centering it directly over the dot.
                verticalOrigin: VerticalOrigin.BOTTOM,

                // Add some space between the marker and text.
                pixelOffset: new Cartesian2(0, -10),

                // Make the text white.
                fillColor: Color.ALICEBLUE,

                // Give the text a black outline for readability.
                outlineColor: Color.BLACK,

                // Width of the text outline.
                outlineWidth: 2,
            },
        })



//--------------------------------------------------ORBITS------------------------------------------------------------------------//


        //viewer.flyTo(issEntity);

        // //A trail for the ISS
        // viewer.entities.add({
        //     name: "ISS Orbit Trail",
        //     polyline: {
        //         positions: trailPositionsDictionary.get("ISS"),
        //         width: 2,
        //         material: Color.CYAN,
        //     },
        // });
        
        // //Hubble
        // viewer.entities.add({
        //     name: "Hubble Orbit Trail",
        //     polyline: {
        //         positions: trailPositionsDictionary.get("Hubble"),
        //         width: 2,
        //         material: Color.AQUA,
        //     }
        // });


        // //CSS Tianhe
        // viewer.entities.add({
        //     name: "CSS Tianhe Orbit",
        //     polyline: {
        //         positions: trailPositionsDictionary.get("CSS Tianhe"),
        //         width: 2,
        //         material: Color.BLUEVIOLET,
        //     }
        // })

        for(const [key, value] of trailPositionsDictionary.entries()){

            viewer.entities.add({
                name: key + " Orbit",
                polyline: {
                    positions: value,
                    width: 2,
                    material: Color.CYAN,
                }
            })


        }


//----------------------------------------------------------------------------------------------------------------------------------//

        return() => {
            viewer.destroy();
        };


    }, []);

    return <div ref={cesiumContainer} className="h-screen w-screen" />

}