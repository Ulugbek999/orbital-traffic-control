
import fs from "fs";
import path from "path";


const dbPath = path.join(process.cwd(), "app", "lib", "local", "db.json");



export async function POST(request: Request){

    try {

        // //Pull the NORAD ID out of the request body
        // const noradId = body.noradId;

        //pull the body object from the response and turn it into a json object
        const body = await request.json();

        //Pull the noradId out of the body
        const noradId = body.noradId;
        
        //Basic validation
        if(!noradId){
            return Response.json(
                {
                    error: "NORAD ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        //building the CelesTrak URL using the Norad number for the satellite
        const celesTrackUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`;

        const celesTrakResponse = await fetch(celesTrackUrl);;

        //Check to make sure we got a response from CelesTrak
        if(!celesTrakResponse.ok){
            return Response.json(
                {error: "Failed to contact CelesTrak.",},
                {status: 500}
            );
        }


        //CelesTrak gives us plain text, NOT JSON
        const tleText = await celesTrakResponse.text();

        console.log("Raw TLE response: ", tleText);

        // Return the raw CelesTrak response to the browser for now.

        const tleList = tleText.split(/\r?\n/).filter(line => line.length > 0);

        const satelliteObject = {
            name: tleList[0].trim(),
            noradId: noradId,
            tleLine1: tleList[1],
            tleLine2: tleList[2],
        }

        // Saving the new satellite record into the local database file:
        try{

            //Reading db.json
            const dbText = fs.readFileSync(dbPath, "utf-8");

            //Turning JSON text into a JavaScript object
            const db = JSON.parse(dbText);

            //Next id of the db record
            // const nextId = Object.keys(db).length + 1;
            //Just using the NORAD id as a key for each record(value);
            //Adding the new satellite record:
            db[noradId] = satelliteObject;

            //Writing back the new data:
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

            console.log("New satellite record saved in the local database.")

        }catch (error){
            console.log("Could not save the satellite record: ", error)
        }

        console.log("THE SATELLITE OBJECT HERE: ", satelliteObject);


        // return Response.json({
        //     message: "NORAD ID received successfully.",
        //     noradId: noradId,
        //     tle: tleText,
        // });


        return Response.json(satelliteObject);



    }catch (error) {
        console.log("Satellite API error: ", error);

        return Response.json(
            {
                error: "Unable to retrieve satellite data."
            },
            {
                status: 500,
            },
        );
    }
}



//An API to GET from the database:
export async function GET() {


    try{

        const dbText = fs.readFileSync(dbPath, "utf-8");
        const db = JSON.parse(dbText);

        const satellites = Object.values(db);
        console.log("Read the database file successfully.");

        return Response.json(satellites);

    }catch(error){

        console.log(`Failed to read the database: ${error}`);
        
    }


}