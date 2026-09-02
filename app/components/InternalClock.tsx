

type ClockProp = {
    time: Date;
}



export default function( {time} : ClockProp){


    return(

        <div className="h-8 fixed top-8 left-1/2 -translate-x-1/2 text-white/80 backdrop-blur border-cyan-400 bg-transparent">
            {time.toLocaleString()}
        </div>

    );
}