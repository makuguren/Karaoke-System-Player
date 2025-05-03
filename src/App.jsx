import { useState, useEffect } from 'react'
import './App.css'
import VideoPlayer from './components/VideoPlayer'
import { getSongByNumber } from './services/songService'

function App() {
  const [song, setSong] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentSongNumber, setCurrentSongNumber] = useState("")

  // Check URL for parameters on mount
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const songParam = urlParams.get('song');
    
    // If song number provided in URL, automatically load that song
    if (songParam) {
      console.log("Loading song from URL parameter:", songParam);
      handleSearch(songParam);
    }
  }, []);

  const handleSearch = async (songNumber) => {
    if (!songNumber || songNumber.trim() === '') {
      setError('Please enter a valid song number');
      return;
    }
    
    console.log("Searching for song number:", songNumber);
    setIsLoading(true);
    setError(null);
    
    try {
      const songData = await getSongByNumber(songNumber);
      console.log("Song data received:", songData);
      setSong(songData);
      setCurrentSongNumber(songNumber);
    } catch (err) {
      console.error("Error fetching song:", err);
      setError('Could not find song. Please check the song number and try again.');
      setSong(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Handler for when a reserved song should be played
  const handlePlayReservedSong = async (songNumber) => {
    // Special case for STOP command to clear the current song
    if (songNumber === 'STOP') {
      console.log("Stopping current song and returning to start screen");
      setSong(null);
      setCurrentSongNumber("");
      return { success: true };
    }
    
    // Special case for CHECK command to verify if a song exists
    if (songNumber.startsWith('CHECK:')) {
      const numberToCheck = songNumber.replace('CHECK:', '');
      console.log("Checking if song exists:", numberToCheck);
      
      if (!numberToCheck || numberToCheck.trim() === '') {
        return { success: false, error: 'Invalid song number' };
      }
      
      try {
        // Only fetch the song data to check if it exists, don't set it as current song
        const songData = await getSongByNumber(numberToCheck);
        // Return the song title if available
        const songTitle = songData.title || `Song #${numberToCheck}`;
        return { 
          success: true, 
          exists: true,
          title: songTitle 
        };
      } catch (err) {
        console.error("Song check failed - song doesn't exist:", numberToCheck);
        return { success: false, error: err, exists: false };
      }
    }
    
    if (!songNumber || songNumber.trim() === '') {
      return { success: false, error: 'Invalid song number' };
    }
    
    console.log("Playing reserved song:", songNumber);
    setIsLoading(true);
    setError(null);
    
    try {
      const songData = await getSongByNumber(songNumber);
      console.log("Reserved song data received:", songData);
      setSong(songData);
      setCurrentSongNumber(songNumber);
      return { success: true, songData };
    } catch (err) {
      console.error("Error fetching reserved song:", err);
      setError(`Could not load song #${songNumber}. Try another song.`);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="karaoke-app tv-mode">
      {isLoading && <div className="loading">Loading song...</div>}
      {error && (
        <div className="error-message">
          {error}
          <div className="error-caption">Try entering another song number</div>
      </div>
      )}
      
      <div className="player-container">
        <VideoPlayer 
          videoUrl={song?.url} 
          currentSongNumber={currentSongNumber}
          onPlayReservedSong={handlePlayReservedSong}
        />
      </div>
    </div>
  )
}

export default App
