//functions for orbital propagation




//Satellite.js essentially can read the complex Two-Line Element values like the:

// 2 25544 51.64 123.45 00050 250.0 110.0 15.50...
//         │      │       │      │     │      │
//         │      │       │      │     │      └ orbital motion
//         │      │       │      │     └ position in orbit
//         │      │       │      └ orbit orientation
//         │      │       └ eccentricity
//         │      └ another orientation angle
//         └ inclination

//-> and can turn that data into readable logitude, latitude and altitude.
//Later, using the TLE data together with satellites.js coverted into readable data and knowing the time, so
// TLE + time -> SGP4 (Simplified General Perturbations 4) -> we can get a prediction of where the satellite will be at a given time.


import {
    degreesLat,
    degreesLong, //Coverts radians into normal latitude/longtidue degrees
    eciToGeodetic, //Converts space-centred ECI coordinates into Earth coordinates
    gstime, //Calcualtes Earth's rotation relative to space at that moment
    propagate, //Calculates the satellites position at the specific time
    twoline2satrec, //Converts the two TLE strings into an internal satellite record
} from "satellite.js";


//a custom type (shape) to describe a satellite's position
export type SatellitePosition = {
    longitude: number;
    latitude: number;
    altitudekm: number;
};

//A reusable satellite record from TLE data. Doing this separately because parsing the TLE does not need to happen every animation frame
export function createSatelliteRecord(tleLine1: string, tleLine2: string) {
    return twoline2satrec(tleLine1, tleLine2);
};


//A function to calculate where a satellite is at a particular moment in time
//the first parameter is the already-parsed satellite record, second parameter is the time
export function calculateSatellitePosition(satrec: ReturnType<typeof twoline2satrec>, date: Date): SatellitePosition | null {


    //the propagate function returns the position and velocity objects.
    const result = propagate(satrec, date);

    if (result === null) {
        return null;
    }

    //the results's position in initially in ECI coordinates. ECI is a coordinate system centered on Earth, but oriented relative to space rather than Earth's surface.
    const positionEci = result.position;

    //Earth's rotation underneath the satellites
    const gmst = gstime(date);

    //Converting the space-based ECI position into coordinates attached to Earth. The results will be in radians
    const positionGeodetic = eciToGeodetic(positionEci, gmst);

    //returning human-readable coordinates

    return { 
        longitude : degreesLong(positionGeodetic.longitude),
        latitude: degreesLat(positionGeodetic.latitude),
        altitudekm: positionGeodetic.height
    };
};