
type SatelliteModal = {

    //title - is for the title of the modal itself
    // title: string;

    // //label - is for the label of the satellite or the name of the satellite
    // label: string;

    // //light text withing the text box before it is edited.
    // placeholder: string;

    // //satelliteInfo - is for the information on your satellite a little piece of text
    // satelliteInfo: string;

    onClose: () => void;
    
    // isOpen : boolean;
};

// for now it's a simple version where things are hardcoded. Later ther will be an ability to click on satellites and have their full information
// we will have hardcoded info for 10 biggest satellites. Like top 10 satellites.



//When you click on the satellite there will be a text box and for certain satellites there will be a picture as well, that will be reshaped into a correct form in the future
// if an add picture functionality added.
export default function SatelliteInfoModal({onClose} : SatelliteModal){

    //so essentially, when we click on the satellite this empty modal pops up open. 
    //there will be room for a picture
    //there will be room for text. 
    //a user can copy and pate text, or edit it



    // if(!isOpen) return;


    return (

        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
            {/* main container */}
            {/* actual modal */}
            <div className="w-[700px] rounded-xl bg-zinc-900 p-6 text-white shadow-2xl">

                {/* title */}
                <h2 className="mb-6 text-2xl font-bold">Satellite title</h2>

                {/* main content area */}
                <div className="flex gap-6">

                    {/* Left side - the visual */}
                    <div className="flex h-64  w-1/2 items-center justfiy-center rounded-lg bg-zinc-800">

                        Visual goes HERE
                    </div>
                    
                    {/* Right side - information */}
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">About</h3>
                        <p className="text-sm leading-relaxed text-zinc-300">
                            The International Space Station...
                        </p>
                    </div>
                </div>


                {/* Close button */}
                <div className="mt-6 flex justify-end">
                    <>
                        <button onClick={() => setIsModalOpen(true)}>
                            Open Modal
                        </button>

                        { && (
                            <SatelliteInfoModal
                                onClose={() => setIsModalOpen(false)}
                            />
                        )}
                    </>
                </div>



            </div>


            


        </div>


    )


}