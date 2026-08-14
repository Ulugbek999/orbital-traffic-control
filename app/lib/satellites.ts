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


