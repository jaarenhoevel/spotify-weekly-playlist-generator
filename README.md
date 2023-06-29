# spotify-weekly-playlist-generator
Creates a weekly subset playlist from a supplied playlist. Keeps track of how many times each track has been selected.

### Preperation

#### Spotify Developers
- Login to [Spotify for Developers](https://developer.spotify.com/dashboard) with your Spotify account
- Create new app
- Use `http://localhost/` as endpoint
- Note client id and secret

#### Configuration
- Install dependencies with npm: `npm install`
- Run to create config files: `node ./app.js`
- Edit config file and enter playlist IDs and Spotify API credentials
- Run again and open supplied authorization link in a web browser
- Grab authorization code from redirect url and enter in prompt

### Basic usage
Run `node ./app.js`
