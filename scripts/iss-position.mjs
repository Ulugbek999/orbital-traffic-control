

import {
    twoline2satrec, //takes the two TLE lines and creates a satellite record
    propagate, //calculates where the satellite is at a specific time.
    gstime, //calculates greenwich sidereal time. Need this to convert from space-centered coordinate system into coordinates relative to the rotating Earth
    eciToGeodetic, //converts the satellite's positin into longitude, latitude and altitude
    degreesLong,
    degreesLat, //longitude and latitude from radians and degrees.
} from "satellite.js"



// The actual orbit of the ISS:

const tleLine1 = "1 25544U 98067A   26222.50435993  .00003786  00000+0  75820-4 0  9991";
const tleLine2 = "2 25544  51.6324  31.2750 0007420  32.4605 327.6839 15.49403146580170";


//passing the two constant tle lines to create a satellite record
const satrec = twoline2satrec(tleLine1, tleLine2);


//getting the current date and time
const now = new Date();



//propagating the ISS orbit to the current time. The result will be position and velocity
const positionAndVelocity = propagate(satrec, now);

//propagation can aparently fail, if that happens, satellite.js return null, in which case:
if(positionAndVelocity === null) {
    throw new Error(
        "Could not calculate the ISS position.",
    );
}


const positionEci = positionAndVelocity.position; //only extracting the position

const gmst = gstime(now); //taking the greenwich sideral time for the same moment
// This tells us how far Earth has rotated relative to space.
// We need that rotation information because ECI coordinates
// are relative to space, while latitude and longitude
// are relative to Earth.


//Now converting the ECI position into geodetic Earth coordinates
const positionGeodetic = eciToGeodetic(positionEci, gmst);
//the result will be longt -> radians, latitude -> radians and height -> kilometers

//converting longtitude from radians into normal degrees:
//-110deg => 110 degrees west

const longitude = degreesLong(positionGeodetic.longitude);
const latitude = degreesLat(positionGeodetic.latitude);
const altitude = positionGeodetic.height;


//Printing the time, latitude, longtitude, height:
console.log("TIME: ", now.toISOString());
console.log("Latitude: ", `${latitude.toFixed(4)} deg`);
console.log("Longitude: ", `${longitude.toFixed(4)} deg`);
console.log("Altitude: ", `${altitude.toFixed(4)} km`);