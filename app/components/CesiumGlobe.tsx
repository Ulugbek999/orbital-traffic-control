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
    //getImagePixels, //Let's an entity calculate a new position whenever cesium needs to render it
} from "cesium";

//Importing our own orbital calculation functions
import {
    calculateSatellitePosition,
    createSatelliteRecord,
    calculateSatelliteOrbit,
} from "../lib/orbit";

import { SATELLITES } from "../lib/satellites";

import "cesium/Build/Cesium/Widgets/widgets.css";
import { SatRec } from "satellite.js";


// const TLE_DATA_Dictionary = TLE_DATA();

// //The ISS TLE lines from CelesTrak, hardcoded for now.
// const ISS_TLE_LINE_1 = TLE_DATA_Dictionary.ISS_TLE_LINE_1;
// const ISS_TLE_LINE_2 = TLE_DATA_Dictionary.ISS_TLE_LINE_2;

// //Hubble:
// const Hubble_TLE_LINE_1 = TLE_DATA_Dictionary.Hubble_TLE_LINE_1;
// const Hubble_TLE_LINE_2 = TLE_DATA_Dictionary.Hubble_TLE_LINE_2;

// //TIANHE
// const Tianhe_TLE_LINE_1 = TLE_DATA_Dictionary.TIANHE_TLE_LINE_1;
// const Tianhe_TLE_LINE_2 = TLE_DATA_Dictionary.TIANHE_TLE_LINE_2;



// //Creating satellite records:
// const satelliteRecords: Map<string, SatRec> = new Map();

// //creating satellite records for different satellites
// satelliteRecords.set("ISS", createSatelliteRecord(ISS_TLE_LINE_1, ISS_TLE_LINE_2));
// satelliteRecords.set("CSS Tianhe", createSatelliteRecord(Tianhe_TLE_LINE_1, Tianhe_TLE_LINE_2));
// satelliteRecords.set("Hubble", createSatelliteRecord(Hubble_TLE_LINE_1, Hubble_TLE_LINE_2));



//Creating satellite records:
const satelliteRecords: Map<string, SatRec> = new Map();

for(const satellite of SATELLITES){

    //creating an individual satellite record
    const satelliteRecord = createSatelliteRecord(satellite.tleLine1, satellite.tleLine2);

    //storing a key -> value for a satellite name + record.
    satelliteRecords.set(satellite.name, satelliteRecord);
}


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

        //helper to bypass the "undefined error for the SatRec"
        function getSatelliteRecord(name: string): SatRec {
            const record = satelliteRecords.get(name);

            if(record === undefined){
                throw new Error("Satellite record does not exist.");
            }

            return record;
        }


        //Adding a trail for the satellites
        const trailCenterTime = JulianDate.toDate(viewer.clock.currentTime);


        const trailPositionsDictionary: Map<string, Cartesian3[]> = new Map();

        
        // //adding a list for the ISS
        // trailPositionsDictionary.set("ISS", calculateSatelliteOrbit(getSatelliteRecord("ISS"), trailCenterTime));

        // //Adding a list for the Hubble:
        // trailPositionsDictionary.set("Hubble", calculateSatelliteOrbit(getSatelliteRecord("Hubble"), trailCenterTime));

        // //Adding a list for the CSS Tianhe
        // trailPositionsDictionary.set("CSS Tianhe", calculateSatelliteOrbit(getSatelliteRecord("CSS Tianhe"), trailCenterTime));

        for(const [satelliteName, satelliteRecord] of satelliteRecords.entries()){
            const trailPositions = calculateSatelliteOrbit(satelliteRecord, trailCenterTime);
            trailPositionsDictionary.set(satelliteName, trailPositions);
        }



        //Dynamic Satellie Positions
        const dynamicSatellitePositions: Map<string, CallbackPositionProperty> = new Map();

        for (const [key, value] of satelliteRecords.entries()){

            dynamicSatellitePositions.set(key, 

                //we need to use the CallbackPositonProperty to create dynamic positions for our satellites
                new CallbackPositionProperty(
                    (time, result) => {

                        const currentTime = time ?? JulianDate.now();

                        const date = JulianDate.toDate(currentTime);

                        const position = calculateSatellitePosition(value, date);

                        if(position === null) {
                            return undefined;
                        }

                        const altitudeMeteres = position.altitudekm * 1000;

                        return Cartesian3.fromDegrees(position.longitude, position.latitude, altitudeMeteres, undefined, result);
                    },
                    false, //tells the callback that the position changes over time.
                )
            )
        }


        // //now converting the normal earth coordinates into cesium's internal 3D cartesian system
        // const issPosition = Cartesian3.fromDegrees(issLongitude, issLatitude, issAltitudeMeters);



        for (const satellite of SATELLITES){

            const dynamicPosition = dynamicSatellitePositions.get(satellite.name);

            if(dynamicPosition === undefined){
                throw new Error(`Dynamic position does not exist for ${satellite.name}`);
            }

            viewer.entities.add({
                name: satellite.name,
                position: dynamicPosition,
                point: {
                    pixelSize: 12,
                    color: Color.WHITE,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                },
                label: {
                    text: satellite.name,
                    verticalOrigin: VerticalOrigin.BOTTOM,
                    pixelOffset: new Cartesian2(0, -10),

                    fillColor: Color.WHITE,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                }
            })
        }




        // //adding a new entity to the Cesium's scene
        // const issEntity = viewer.entities.add({
        //     name: "ISS (ZARYA)",
        //     position: dynamicSatellitePositions.get("ISS"),
        //     point: {
        //         // Marker diameter in pixels.
        //         pixelSize: 12,

        //         // Make the ISS marker bright white.
        //         color: Color.WHITE,

        //         // Add a darker outline around it so it remains visible
        //         // over both bright and dark parts of Earth.
        //         outlineColor: Color.BLACK,

        //         // Width of the marker outline.
        //         outlineWidth: 2,
        //     },

        //     // Add text next to the point.
        //     label: {

        //         // Text shown beside the satellite.
        //         text: "ISS",

        //         // Move the text slightly above the marker
        //         // instead of centering it directly over the dot.
        //         verticalOrigin: VerticalOrigin.BOTTOM,

        //         // Add some space between the marker and text.
        //         pixelOffset: new Cartesian2(0, -10),

        //         // Make the text white.
        //         fillColor: Color.WHITE,

        //         // Give the text a black outline for readability.
        //         outlineColor: Color.BLACK,

        //         // Width of the text outline.
        //         outlineWidth: 2,
        //     },

        // });


        // //adding a viewer for the hubble:
        // const hubbleEntity = viewer.entities.add({
        //     name: "Hubble",
        //     position: dynamicSatellitePositions.get("Hubble"),
        //     point: {
        //         // Marker diameter in pixels.
        //         pixelSize: 12,

        //         // Make the ISS marker bright white.
        //         color: Color.WHITE,

        //         // Add a darker outline around it so it remains visible
        //         // over both bright and dark parts of Earth.
        //         outlineColor: Color.BLACK,

        //         // Width of the marker outline.
        //         outlineWidth: 2,
        //     },

        //     // Add text next to the point.
        //     label: {

        //         // Text shown beside the satellite.
        //         text: "Hubble",

        //         // Move the text slightly above the marker
        //         // instead of centering it directly over the dot.
        //         verticalOrigin: VerticalOrigin.BOTTOM,

        //         // Add some space between the marker and text.
        //         pixelOffset: new Cartesian2(0, -10),

        //         // Make the text white.
        //         fillColor: Color.ALICEBLUE,

        //         // Give the text a black outline for readability.
        //         outlineColor: Color.BLACK,

        //         // Width of the text outline.
        //         outlineWidth: 2,
        //     },
 
        // })

        // //a viewer for the Tianhe
        // const tianheEntity = viewer.entities.add({
        //     name: "CSS (TIANHE)",
        //     position: dynamicSatellitePositions.get("CSS Tianhe"),
        //     point: {
        //         // Marker diameter in pixels.
        //         pixelSize: 12,

        //         // Make the ISS marker bright white.
        //         color: Color.WHITE,

        //         // Add a darker outline around it so it remains visible
        //         // over both bright and dark parts of Earth.
        //         outlineColor: Color.BLACK,

        //         // Width of the marker outline.
        //         outlineWidth: 2,
        //     },

        //     // Add text next to the point.
        //     label: {

        //         // Text shown beside the satellite.
        //         text: "CSS Tianhe",

        //         // Move the text slightly above the marker
        //         // instead of centering it directly over the dot.
        //         verticalOrigin: VerticalOrigin.BOTTOM,

        //         // Add some space between the marker and text.
        //         pixelOffset: new Cartesian2(0, -10),

        //         // Make the text white.
        //         fillColor: Color.ALICEBLUE,

        //         // Give the text a black outline for readability.
        //         outlineColor: Color.BLACK,

        //         // Width of the text outline.
        //         outlineWidth: 2,
        //     },
        // })



//--------------------------------------------------ORBITS------------------------------------------------------------------------//


        //viewer.flyTo(issEntity);

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