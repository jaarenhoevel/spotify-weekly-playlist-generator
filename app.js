import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// File path
const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, 'config.json');
const songsFile = join(__dirname, 'songs.json');

// Configure lowdb to write to JSONFile
const configAdapter = new JSONFile(configFile);
const config = new Low(configAdapter);
const songsAdapter = new JSONFile(songsFile);
const songs = new Low(songsAdapter);

// Read data from JSON file, this will set db.data content
await Promise.all([config.read(), songs.read()]);

// If config.json doesn't exist, config.data will be null
// Use the code below to set default data
config.data ||= 
{ 
    spotifyApiCredentials: {
        clientId: null,
        clientSecret: null,
        redirectUri: null
    },
    playlistIds: {
        input: null,
        output: null
    },
    options: {
        songCount: 25
    } 
};

songs.data ||= [];

// Finally write config content to file
await Promise.all([config.write(), songs.write()]);