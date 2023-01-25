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
        if (songs.find(s => {return s.id === track.track.id}) === undefined && !track.is_local) { // Track is not in song list yet (and not just a local song)
            songs.push({
                id: track.track.id,
                addedAt: track.added_at,
                artistId: track.track.album.artists[0].id,
                releaseDate: track.track.album.release_date,
                lastSelected: null
            });

            addedTracks ++;
        }
    });

    console.log(`Added ${addedTracks} tracks to song list.`);
}

export function generateWeeklySongList(songs, options) {
    const { songCount, matchWeights } = options;

    var weeklySongs = [...songs]; // copy song array

    if (weeklySongs.length === 0) return [];

    // Determine base song
    weeklySongs.sort((a, b) => { // sort by lastSelected and if equal by added date
        const lastSelectedDiff = new Date(a.lastSelected) - new Date(b.lastSelected);
        if (lastSelectedDiff !== 0) return lastSelectedDiff;

        return new Date(a.addedAt) - new Date(b.addedAt);
    });

    // Select base song and remove it from array
    const baseSong = weeklySongs.splice((weeklySongs.length > 10) ? Math.floor(Math.random() * 10) : 0, 1)[0];

    // Sort songs by match score
    weeklySongs.sort((a, b) => {
        return calculateMatchScore(baseSong, b, matchWeights) - calculateMatchScore(baseSong, a, matchWeights);
    });

    weeklySongs = weeklySongs.slice(0, songCount - 1);
    weeklySongs.push(baseSong);
    return weeklySongs;
}

function calculateMatchScore(baseSong, song, weights) {
    const { similarReleaseDate, differentArtist, lastSelected, recentlyAdded } = weights;

    var score = 0;

    const releaseDateDiff = Math.abs(new Date(baseSong.releaseDate) - new Date(song.releaseDate));
    const similarReleaseDateScore = Math.max(0, 1 - (releaseDateDiff / 1000 / 60 / 60 / 24 / 365 / 50)); // > 25 years -> 0 score
    score += similarReleaseDateScore * similarReleaseDate;

    score += differentArtist * (baseSong.artistId !== song.artistId);

    if (song.lastSelected !== null) {
        const timeSinceLastSelected = Date.now() - new Date(song.lastSelected);
        const timeSinceLastSelectedScore = Math.min(1, (timeSinceLastSelected / 1000 / 60 / 60 / 24 / 365)); // > 1 year -> 1 score
        score += timeSinceLastSelectedScore * lastSelected;
    } else {
        score += lastSelected;
    }

    const timeSinceAdded = Date.now() - new Date(song.addedAt);
    const timeSinceAddedScore = Math.max(0, 1 - (timeSinceAdded / 1000 / 60 / 60 / 24 / 31)); // > 31 days -> 0 score
    score += timeSinceAddedScore * recentlyAdded;

    return score;
}