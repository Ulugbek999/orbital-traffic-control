



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