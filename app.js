import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import SpotifyWebApi from 'spotify-web-api-node';
import PromptSync from 'prompt-sync';

import { refreshSongList, generateWeeklySongList, replacePlaylistSongs, updatePlaylistDescription } from './modules/PlaylistGenerator.js';

const promptSync = PromptSync();

// File path
const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, 'config.json');
const songsFile = join(__dirname, 'songs.json');

// Configure lowdb to write to JSONFile
const config = new Low(new JSONFile(configFile));
const songs = new Low(new JSONFile(songsFile));

// Read data from JSON file, this will set db.data content
await Promise.all([config.read(), songs.read()]);

// If config.json or songs.json doesn't exist create basic structure
config.data ||= 
{ 
    spotifyApiCredentials: {
        clientId: null,
        clientSecret: null,
        redirectUri: null,
        refreshToken: null
    },
    playlistIds: {
        input: null,
        output: null
    },
    options: {
        songCount: 25,
        maxSongsPerArtist: 2,
        playlistDescriptionTemplate: "Playlist was generated at %d",
        matchWeights: {
            similarReleaseDate: 0.3,
            similarAddedDate: 0.3,
            lastSelected: 0.4,
            recentlyAdded: 0
        }
    },
    dryRun: false
};

songs.data ||= [];

if (config.data.spotifyApiCredentials.clientId === null) {
    await config.write();
    console.log("Please enter your spotify credentials in config.json");
    process.exit();
}

// Handle spotify api
const spotifyApi = new SpotifyWebApi({
    redirectUri: config.data.spotifyApiCredentials.redirectUri,
    clientId: config.data.spotifyApiCredentials.clientId,
    clientSecret: config.data.spotifyApiCredentials.clientSecret
});

// ToDo: Also check if is valid
if (config.data.spotifyApiCredentials.refreshToken === null) {
    // Request auth code
    const scopes = [
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-private",
        "playlist-modify-public",
        "ugc-image-upload"
    ];

    // Create the authorization URL
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    console.log(authorizeURL);

    var authCode = promptSync("Auth code: ");

    spotifyApi.authorizationCodeGrant(authCode).then(
        async function(data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);
        
            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            config.spotifyApiCredentials.refreshToken = data.body['refresh_token'];
            await(config.write());
        },
        function(err) {
            console.log('Something went wrong!', err);
        }
    );

    process.exit();
}

// Get access token
spotifyApi.setRefreshToken(config.data.spotifyApiCredentials.refreshToken);

if (!config.data.dryRun) {
    try {
        var data = await spotifyApi.refreshAccessToken();
        console.log('The access token has been refreshed!');
      
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    } catch (e) {
        console.log('Could not refresh access token', err);
        process.exit();  
    }
}

// Start playlist generator
//if (!config.data.dryRun) await refreshSongList(spotifyApi, config.data.playlistIds.input, songs.data);

// Get weekly songs
var weeklySongs = generateWeeklySongList(songs.data, config.data.options);

// Update output playlist
if (!config.data.dryRun) await replacePlaylistSongs(spotifyApi, config.data.playlistIds.output, weeklySongs);

// Update playlist description
if (!config.data.dryRun) await updatePlaylistDescription(spotifyApi, config.data.playlistIds.output, config.data.options);

// Finally write config content to file
await Promise.all([config.write(), songs.write()]);