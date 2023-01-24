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

    var addedTracks = 0;

    tracks.forEach(track => {
        if (!(track.track.id in songs) && !track.is_local) { // Track is not in song list yet (and not just a local song)
            songs[track.track.id] = {
                addedAt: track.added_at,
                artistId: track.track.album.artists[0].id,
                releaseDate: track.track.album.release_date,
                lastSelected: null
            };

            addedTracks ++;
        }
    });

    console.log(`Added ${addedTracks} tracks to song list.`);
}