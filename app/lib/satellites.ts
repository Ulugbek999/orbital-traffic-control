// import fs from "fs";
import path from "path";




//A file where I will have all of the satellite TLEs.

//Can use the following rout: https://celestrak.org/NORAD/elements/gp.php?CATNR=20580&FORMAT=TLE
//substitue the numbers after CATNR= with the number of the satellite.



export function TLE_DATA(){


    return {
            
        //ISS (International space station)
        "ISS_TLE_LINE_1" : "1 25544U 98067A   26222.50435993  .00003786  00000+0  75820-4 0  9991",
        "ISS_TLE_LINE_2" : "2 25544  51.6324  31.2750 0007420  32.4605 327.6839 15.49403146580170",

        //Hubble
        "Hubble_TLE_LINE_1" : "1 20580U 90037B   26224.59154121  .00003205  00000+0  95532-4 0  9995",
        "Hubble_TLE_LINE_2" : "2 20580  28.4727  54.8959 0002463  53.8814 306.2010 15.31324458797226",

        //Tiangong Space Station
        //CSS (TIANHE)            
        "TIANHE_TLE_LINE_1" : "1 48274U 21035A   26224.98627525  .00000101  00000+0  54127-5 0  9991",
        "TIANHE_TLE_LINE_2" : "2 48274  41.4709 337.2096 0001079 250.4973 109.5748 15.58975796302033",
    }
}


export type SatelliteTLE = {
    name: string;
    noradId: string;
    tleLine1: string;
    tleLine2: string;
};




export async function getSatellites(): Promise<SatelliteTLE[]> {
    const response = await fetch("/api/satellites");

    const satellites: SatelliteTLE[] = await response.json();
    return satellites;
}







//CAN'T GIVE ACCESS TO "FS" file system to the browser.
// // //a function that reads the local database:
// export const SATELLITES = () : SatelliteTLE[] => {

//     const dbPath = path.join(process.cwd(), "app", "lib", "loca", "db.json");

//     const result: SatelliteTLE[] = [];

//     try{

//         //read the local database;
        

//         const dbText = fs.readFileSync(dbPath, "utf-8");

//         const db = JSON.parse(dbText);

        
//         const result = Object.values(db) as SatelliteTLE[];

//         return result;

//     }catch(error){
//         console.log(`Could not read the local database: ${error}`);
//     }

//     return result;

// };



// export const SATELLITES: SatelliteTLE[] = [

//     {
//         name: "ISS",
//         noradId: "25544",
//         tleLine1: "1 25544U 98067A   26222.50435993  .00003786  00000+0  75820-4 0  9991",
//         tleLine2: "2 25544  51.6324  31.2750 0007420  32.4605 327.6839 15.49403146580170",
//     },

//     {
//         name: "Hubble",
//         noradId: "20580",
//         tleLine1: "1 20580U 90037B   26224.59154121  .00003205  00000+0  95532-4 0  9995",
//         tleLine2: "2 20580  28.4727  54.8959 0002463  53.8814 306.2010 15.31324458797226",
//     },

//     {
//         name: "CSS Tianhe",
//         noradId: "48274",
//         tleLine1: "1 48274U 21035A   26224.98627525  .00000101  00000+0  54127-5 0  9991",
//         tleLine2: "2 48274  41.4709 337.2096 0001079 250.4973 109.5748 15.58975796302033",
//     }, 
    
// ];


// // This will eventually become the main source of satellite data
// // for the entire application.
// export const SATELLITES: SatelliteTLE[] = [

//     {
//         name: "ISS",
//         noradId: "25544",
//         tleLine1: "1 25544U 98067A   26222.50435993  .00003786  00000+0  75820-4 0  9991",
//         tleLine2: "2 25544  51.6324  31.2750 0007420  32.4605 327.6839 15.49403146580170",
//     },

//     {
//         name: "Hubble",
//         noradId: "20580",
//         tleLine1: "1 20580U 90037B   26224.59154121  .00003205  00000+0  95532-4 0  9995",
//         tleLine2: "2 20580  28.4727  54.8959 0002463  53.8814 306.2010 15.31324458797226",
//     },

//     {
//         name: "CSS Tianhe",
//         noradId: "48274",
//         tleLine1: "1 48274U 21035A   26224.98627525  .00000101  00000+0  54127-5 0  9991",
//         tleLine2: "2 48274  41.4709 337.2096 0001079 250.4973 109.5748 15.58975796302033",
//     },

// ];


