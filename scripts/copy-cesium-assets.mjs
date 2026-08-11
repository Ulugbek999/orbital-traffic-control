
//importing node's built-in file system functions.

//cpSync() -> copies files/directories
//existsSync() -> checks whether a path exists.
//mkdirSync() -> creates directories
//rmSync() -> deletes files/directories


import{
    cpSync,
    existsSync,
    mkdirSync,
    rmSync
} from "node:fs";

//Importing helpers for working with filesystem paths

//dirname() -> gets the directory containing a file
//join() -> safely combines path pieces

//We use join() instead of manually writing "/" so this script
//Works correctly acros Linux,macOs and Windows

import {
    dirname,
    join,
} from "node:path";


// import.meta.url gives us the URL of THIS JavaScript file.
//
// fileURLToPath() converts that URL into a normal filesystem path.
import { fileURLToPath } from "node:url";


const currentFile = fileURLToPath(import.meta.url);

const scriptsDirectory = dirname(currentFile);

const projectRoot = join(scriptsDirectory, "..");

const cesiumSource = join(
    projectRoot,
    "node_modules",
    "cesium",
    "Build",
    "Cesium",
);

const cesiumDestination = join(
    projectRoot,
    "public",
    "cesium",
);

const directoriesToCopy = [
  "Workers",
  "ThirdParty",
  "Assets",
  "Widgets",
];


if(!existsSync(cesiumSource)) {
    throw new Error(
        "Cesium was not found in node_modules. Run  'npm install' first",
    );
}

if (existsSync(cesiumDestination)) {
  rmSync(cesiumDestination, {
    recursive: true,
    force: true,
  });
}

mkdirSync(cesiumDestination, {
  recursive: true,
});



for (const directory of directoriesToCopy) {
    const source = join(
        cesiumSource, directory,
    );
    
    const destination = join(
    cesiumDestination,
    directory,
    );

    cpSync(
        source,
        destination,
        {
        recursive: true,
        },
    );
}


// Print a success message so whoever runs the script knows
// that everything completed correctly.
console.log("Cesium runtime assets copied successfully.");


