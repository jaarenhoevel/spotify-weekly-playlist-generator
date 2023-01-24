export async function refreshSongList(spotifyApi, playlistId, songs) {
    var tracks = [];
    var offset = 0;

    // Get playlist tracks
    do {
        console.log(`Requesting playlist tracks with offset ${offset}`);

        var response = await spotifyApi.getPlaylistTracks(playlistId, {limit: 25, offset: offset});
        tracks.push(... response.body.items);

        offset += 25;
    } while (response.body.next !== null);

    console.log(tracks);
}