"use client";

import { useEffect, useRef, useState } from "react";
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

import "cesium/Build/Cesium/Widgets/widgets.css";

import { getSatellites } from "../lib/satellites";
import { SatRec } from "satellite.js";
import PromptModal from "./PromptModal";
import InternalClock from "./InternalClock";




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
// const satelliteRecords: Map<string, SatRec> = new Map();

// const satellites = getSatellites();

// for(const satellite of await satellites){

//     //creating an individual satellite record
//     const satelliteRecord = createSatelliteRecord(satellite.tleLine1, satellite.tleLine2);

//     //storing a key -> value for a satellite name + record.
//     satelliteRecords.set(satellite.name, satelliteRecord);
// }


export default function CesiumGlobe() { 


    // HOOKS:

    const cesiumContainer = useRef<HTMLDivElement>(null);
    
    // //for the viewer to notice simulation time chagne
    const viewerRef = useRef<Viewer | null>(null);

    //useStates
    const [isAddSatelliteOpen, setIsAddSatelliteOpen] = useState(false);
    const [simulationTime, setSimulationTime] = useState(1);
    const [clockTime, setClockTime] = useState<Date>(new Date());

    //let simulationSpeed = simulationTime;


    // function changeSimulationTimeFaster(value: number){

    //     viewer.clock.multiplier += value;


    // }


    useEffect(() => {

        if(!cesiumContainer.current) return;

        async function initializeCesium() {
            //Getting the actual satellite array from the API:
            const satellites = await getSatellites();

            //Creating the satellite.js records;
            const satelliteRecords: Map<string, SatRec> = new Map();

            for (const satellite of satellites){
                const satelliteRecord = createSatelliteRecord(satellite.tleLine1, satellite.tleLine2);
                
                satelliteRecords.set(satellite.name, satelliteRecord);
            }

            console.log("SATELLITES: ", satellites);
            console.log("SATELLITE RECORDS: ", satelliteRecords);


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


            for (const satellite of satellites){

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
            

            
    
            //viewer.flyTo(issEntity);

            //Maybe I can do something here to make the orbit appear only when we click on the satellite

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

        }

        //Internal clock
        const interval = setInterval(() => {
            const currentClockTime = viewer.clock.currentTime;
            const date = JulianDate.toDate(currentClockTime);
            setClockTime(date);
        }, 1000);



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
        //viewer.clock.multiplier *= simulationTime;
        viewerRef.current = viewer;

        //Adding a trail for the satellites
        const trailCenterTime = JulianDate.toDate(viewer.clock.currentTime);


        const trailPositionsDictionary: Map<string, Cartesian3[]> = new Map();

        initializeCesium();


        return() => {
            viewer.destroy();
            //viewerRef.current = null

        };
        
        clearInterval(interval);

    }, []);

    //return <div ref={cesiumContainer} className="h-screen w-screen" />



    return (
        <div className="relative h-screen w-screen">

            {/* Cesium still fills the entire screen */}

            <div
                ref={cesiumContainer}
                className="h-full w-full"
            />

            {/* This is where the internal clock component will go, but for now I'll hard code the clock */}

            <InternalClock time={clockTime}/>

            {/* A container for the buttons on the left side of the screen */}
            <div className="absolute top-6 left-6 z-40">

                <button
                    onClick={() => setIsAddSatelliteOpen(true)}
                    className="rounded border border-cyan-500/50 bg-black/80 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-cyan-950"
                >
                    + Add Satellite
                </button>

                <div>

                    <button onClick={() => {
                        setSimulationTime(simulationTime + 10);
                        if(simulationTime >= 100){
                            setSimulationTime(100);
                        }

                        if(viewerRef.current != null){
                            viewerRef.current.clock.multiplier = simulationTime;
                        }

                    }}
                    className="rounded border border-cyan-500/50 bg-black/80 px-4 py-1 text-sm font-medium text-white backdrop-blur hover:bg-cyan-950 mt-2"
                    
                    >Faster</button>

                    <button onClick={() => {

                        setSimulationTime(simulationTime - 10);
                        if(simulationTime <= 1){
                            setSimulationTime(1);
                        }

                        if(viewerRef.current != null){
                            viewerRef.current.clock.multiplier = simulationTime;
                        }

                    }}

                    className="rounded border border-cyan-500/50 bg-black/80 px-4 py-1 text-sm font-medium text-white backdrop-blur hover:bg-cyan-950 ml-2"
                    
                    >Slower</button>

                    <button onClick={() => {
                        if(viewerRef.current != null){
                            viewerRef.current.clock.currentTime = JulianDate.now();
                        }
                    }}
                    
                    className="rounded border border-cyan-500/50 bg-black/80 px-4 py-1 text-sm font-medium text-white backdrop-blur hover:bg-cyan-950 ml-2"
                    >

                        Reset
                    </button>

                    <p className="text-sm text-white mt-2">Simulation time: {simulationTime % 10 != 0 ? simulationTime - 1 : simulationTime}</p>

                </div>

            </div>



            <PromptModal
                title="Add Satellite"
                label="NORAD Catalog Number"
                placeholder="Example: 20580"
                submitText="Add Satellite"
                isOpen={isAddSatelliteOpen}
                onClose={() => {
                    setIsAddSatelliteOpen(false);
                }}
                onSubmit={async (value) => {

                    const response = await fetch("/api/satellites", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({noradId: value})});
                    
                    const data = await response.json();


                    console.log("Server response: ", data);

                    
                    //by this time the new satellite record should be saved in the database so trigger a reloard, so that we re-read the local database and add the
                    //new satellite record.

                    //JUST TRIGGER A RELOAD HERE
                    window.location.reload();

                }}
            />
        </div>
    )
}