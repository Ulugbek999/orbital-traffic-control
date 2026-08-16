import {useState} from "react";


//These are the values that another component can give to PromptModal to customize how it behaves.
type PromptModalProps = {
    
    //Main title at the top of the popup.
    title: string;

    //Text shown above the input of the popup
    label: string;

    //Light text inside the empty input bar
    placeholder?: string;

    //Text displayed on the submit button
    submitText?: string;

    //The parent decided whether the popup should currently exist
    isOpen: boolean,

    //Function the modal calls when the user closes it.
    onClose: () => void;

    //Function the modal calls when the user submits something
    onSubmit: (value: string) => void;
};


export default function PromptModal({title, label, placeholder = "", submitText = "Submit", isOpen, onClose, onSubmit}: PromptModalProps) {

    //to store whatever the user is currently typing
    const [value, setValue] = useState("");

    //if the parent says the modal is closed, render absolutely nothing
    if(!isOpen){return null;}


    function handleSubmit(){

        //Don't submit an empty input.
        if(value.trim() === ""){
            return;
        }

        //Give the entered value back to the parent component
        onSubmit(value.trim());

        //clear the input afterward.
        setValue("Submitted...");
    }

    return (

        <div className="absolute top-6 right-6 z-50 w-80 rounded-lg border border-cyan-500/40 bg-black/90 p-5 text-white shadow-xl backdrop-blur">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">    
                <h2 className="text-lg font-semibold">
                    {title}
                </h2>
                <button onClick={onClose} className="text-gray-400 hower:text-white">
                    X
                </button>
            </div>
            {/* Input label */}
            <label className="mb-2 block text-sm text-gray-300">
                {label}
            </label>

            {/* User input */}
            <input type="text" value={value} placeholder={placeholder} onChange={(event) => {setValue(event.target.value);}}
                    className="mb-4 w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 outline-none focus:border-cyan-500"
            />

            {/* Submit */}
            <button onClick={handleSubmit} className="w-full rounded bg-cyan-600 px-4 py-2 font-medium hover:bg-cyan-500">
                {submitText}
            </button>
        </div>
    )
}