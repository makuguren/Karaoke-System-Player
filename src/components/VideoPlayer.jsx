import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const CustomReactPlayer = ({ videoUrl, playing, onPlay, onPause, onEnded, onReady }) => {
  const playerRef = useRef(null);

  useEffect(() => {
    if (playerRef.current && onReady) {
      onReady(playerRef.current);
    }
  }, [playerRef.current, onReady]);

  // Add a local handler for the onEnded event to ensure it's triggered
  const handleEnded = () => {
    console.log("CustomReactPlayer: Video ended event triggered"); // Debug log
    if (onEnded) {
      onEnded();
    }
  };

  return (
    <div className="react-player-wrapper">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={false}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={handleEnded}
        onReady={onReady}
        loop={false}
        config={{
          youtube: {
            playerVars: {
              disablekb: 1,        // Disable keyboard controls
              modestbranding: 1,   // Hide YouTube logo
              rel: 0,              // Don't show related videos
              showinfo: 1,         // Hide video info
              fs: 0,               // Disable fullscreen button
              iv_load_policy: 3,   // Hide annotations
              controls: 0,         // Hide controls - we'll use our own
              loop: 0              // Disable looping
            }
          },
          file: {
            attributes: {
              controlsList: 'nodownload',  // Disable download button
              disablePictureInPicture: true, // Disable picture-in-picture
              controls: false      // Hide controls for file playback too
            }
          }
        }}
      />
    </div>
  );
};

const VideoPlayer = ({ videoUrl, currentSongNumber, onPlayReservedSong }) => {
  const [playing, setPlaying] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typedNumbers, setTypedNumbers] = useState('');
  const [showTypedNumbers, setShowTypedNumbers] = useState(false);
  const [typedNumbersTimeout, setTypedNumbersTimeout] = useState(null);
  const [reservedNumbers, setReservedNumbers] = useState([]);
  const [autoplayReserved, setAutoplayReserved] = useState(true); // Autoplay by default
  const [validationMessage, setValidationMessage] = useState(null); // New state for validation message
  const [validationMessageType, setValidationMessageType] = useState('success'); // success or error
  const [showNextSong, setShowNextSong] = useState(false); // Show next song info
  const [nextSongTitle, setNextSongTitle] = useState(''); // Title of next song
  const [recentlyShowedValidation, setRecentlyShowedValidation] = useState(false); // Track if validation was recently shown
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const nextSongIntervalRef = useRef(null); // Ref for interval to avoid recreation

  // Automatically enter fullscreen mode when component mounts
  useEffect(() => {
    if (containerRef.current) {
      try {
        // Use a small delay to ensure the browser is ready for fullscreen
        const fullscreenTimer = setTimeout(() => {
          containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
          setIsFullscreen(true);
        }, 1000);
        
        return () => clearTimeout(fullscreenTimer);
      } catch (error) {
        console.error("Could not enter fullscreen mode:", error);
      }
    }
  }, [videoUrl]);

  // Auto-play when a video is loaded
  useEffect(() => {
    if (videoUrl && !playing && !reserved) {
      setPlaying(true);
    }
  }, [videoUrl, playing, reserved]);

  // Debug message to check if key events are being captured
  useEffect(() => {
    console.log("Current typed numbers:", typedNumbers);
  }, [typedNumbers]);

  // Play the next reserved song
  const playNextReservedSong = async () => {
    console.log("playNextReservedSong called, reserved songs:", reservedNumbers); // Debug log

    if (reservedNumbers.length > 0) {
      const nextSongNumber = reservedNumbers[0];
      console.log("Playing next reserved song:", nextSongNumber); // Debug log
      
      // Remove the song from the reserved list
      setReservedNumbers(prev => prev.slice(1));
      
      // Use the callback from parent to fetch and play the song
      try {
        if (onPlayReservedSong) {
          console.log("Calling onPlayReservedSong with:", nextSongNumber); // Debug log
          const result = await onPlayReservedSong(nextSongNumber);
          console.log("Result from onPlayReservedSong:", result); // Debug log
          
          if (result.success) {
            setPlaying(true);
            setReserved(false);
            console.log("Successfully started playing next song"); // Debug log
          } else {
            console.error("Failed to play next song:", result.error || "Unknown error");
            // Show error validation if song couldn't be played
            showValidationMessage(`Could not play next song (${nextSongNumber})`, 'error');
            
            // If there are more songs in the queue, try the next one
            if (reservedNumbers.length > 1) {
              console.log("Trying to play the next song in queue"); // Debug log
              // Use setTimeout to avoid potential infinite loop if multiple songs fail
              setTimeout(() => playNextReservedSong(), 1000);
            }
          }
        } else {
          console.error("onPlayReservedSong callback is not available");
        }
      } catch (error) {
        console.error("Error playing next song:", error);
        showValidationMessage(`Error playing next song: ${error.message}`, 'error');
      }
    } else {
      console.log("No reserved songs to play next"); // Debug log
    }
  };

  const handleReady = (player) => {
    playerRef.current = player;
  };

  const handlePlay = () => {
    if (reserved) return;
    setPlaying(!playing);
  };

  const handlePause = () => {
    if (reserved) return;
    if (playing) {
      console.log("Video playback paused via P key");
      setPlaying(false);
    }
  };

  const handleStop = () => {
    setPlaying(false);
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };

  const handleReserve = () => {
    setReserved(!reserved);
    // When reserving, we also pause the video
    setPlaying(false);
  };

  const handleProgress = (state) => {
    if (!playerRef.current) return;
    
    // Don't update progress if not playing
    if (!playing) return;
    
    setProgress(state.played);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  // Handle song ending - play next reserved song if autoplay is enabled
  const handleVideoEnded = () => {
    console.log("Video ended event triggered"); // Debug log
    console.log("Autoplay enabled:", autoplayReserved); // Debug log
    console.log("Reserved songs count:", reservedNumbers.length); // Debug log
    
    // If autoplay is enabled and there are reserved songs, play the next one
    if (autoplayReserved && reservedNumbers.length > 0) {
      console.log("Conditions met to play next song automatically"); // Debug log
      // Use setTimeout to ensure the current video has fully completed
      setTimeout(() => playNextReservedSong(), 500);
    } else {
      console.log("No autoplay or no reserved songs, returning to start screen"); // Debug log
      // No reserved songs or autoplay disabled
      // First stop the playback
      setPlaying(false);
      
      // Go back to the start screen by clearing the video URL
      // This is a drastic approach but will ensure the video stops completely
      if (onPlayReservedSong) {
        console.log("Sending STOP command to clear video URL"); // Debug log
        onPlayReservedSong('STOP');
      }
    }
  };

  // Toggle autoplay reserved songs feature
  const toggleAutoplayReserved = () => {
    setAutoplayReserved(!autoplayReserved);
  };

  // Helper function to show and clear validation messages
  const showValidationMessage = (message, type = 'success', duration = 5000) => {
    // Hide next song notification if it's showing
    setShowNextSong(false);
    
    // Set the recently showed flag to true
    setRecentlyShowedValidation(true);
    
    setValidationMessage(message);
    setValidationMessageType(type);
    
    // Store timeouts in refs so they can be cleared if interrupted
    if (window.validationTimeoutRef) {
      clearTimeout(window.validationTimeoutRef);
    }
    
    if (window.recentlyShowedTimeoutRef) {
      clearTimeout(window.recentlyShowedTimeoutRef);
    }
    
    // Use longer duration for error messages to ensure they're seen
    const finalDuration = type === 'error' ? Math.max(duration, 6000) : duration;
    
    // Clear the message after the specified duration
    window.validationTimeoutRef = setTimeout(() => {
      setValidationMessage(null);
      
      // Keep the "recently showed" flag active for an additional 15 seconds
      // This prevents the next song notification from appearing immediately
      window.recentlyShowedTimeoutRef = setTimeout(() => {
        setRecentlyShowedValidation(false);
        console.log("Recently showed validation flag cleared"); // Debug log
      }, 15000);
    }, finalDuration);
    
    // We don't need to manage the interval here, the main effect will handle it
  };

  // Play a specific reserved song
  const playReservedSong = async (index) => {
    if (index >= reservedNumbers.length) return;
    
    const songNumber = reservedNumbers[index];
    
    // Show validation message that we're playing this song
    showValidationMessage(`Playing song ${songNumber} now`, 'success', 3000);
    
    // Remove songs up to and including the selected one
    setReservedNumbers(prev => prev.slice(index + 1));
    
    // Use the callback from parent to fetch and play the song
    if (onPlayReservedSong) {
      try {
        const result = await onPlayReservedSong(songNumber);
        if (result.success) {
          setPlaying(true);
          setReserved(false);
        } else {
          // Show error message if song couldn't be played
          showValidationMessage(`Could not play song ${songNumber}`, 'error', 5000);
        }
      } catch (error) {
        console.error("Error playing reserved song:", error);
        showValidationMessage(`Error playing song: ${error.message}`, 'error', 5000);
      }
    }
  };

  // Handle exiting fullscreen with Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle key presses for number input - Fixed implementation
  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log("Key pressed:", event.key); // Debug log to check key detection
      
      // Skip if user is typing in an input
      if (
        event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Check if key is a number (0-9)
      if (/^\d$/.test(event.key)) {
        // Update typed numbers, but limit to 5 digits
        if (typedNumbers.length < 5) {
          const updatedNumbers = typedNumbers + event.key;
          console.log("Updated numbers:", updatedNumbers); // Debug log
          
          // Clear any validation messages that are currently showing
          // so typing can immediately interrupt notifications
          if (validationMessage) {
            console.log(`Clearing ${validationMessageType} validation message due to typing`); // Debug log
            setValidationMessage(null);
            
            // Clear the validation message timeouts
            if (window.validationTimeoutRef) {
              clearTimeout(window.validationTimeoutRef);
            }
            
            if (window.recentlyShowedTimeoutRef) {
              clearTimeout(window.recentlyShowedTimeoutRef);
            }
            
            // Reset the recently showed flag so next song notification
            // doesn't show immediately after typing is done
            setRecentlyShowedValidation(false);
          }
          
          setTypedNumbers(updatedNumbers);
          setShowTypedNumbers(true);
          
          // Hide next song notification when typing
          setShowNextSong(false);
          
          // Clear previous timeout
          if (typedNumbersTimeout) {
            clearTimeout(typedNumbersTimeout);
          }
          
          // Set timeout to hide numbers only, don't try to play or reserve
          const timeoutId = setTimeout(() => {
            console.log("Timeout triggered for:", updatedNumbers); // Debug log
            setShowTypedNumbers(false);
            setTypedNumbers('');
            
            // Set recently showed validation to true to prevent next song notification
            // from appearing immediately after timeout
            setRecentlyShowedValidation(true);
            
            // Clear the flag after some time to allow notifications again
            setTimeout(() => {
              setRecentlyShowedValidation(false);
            }, 30000); // 30 seconds delay before allowing next song notification
          }, 3000); // Longer timeout for user to decide
          
          setTypedNumbersTimeout(timeoutId);
        }
      }
      
      // Enter key to dynamically play or reserve the song
      if (event.key === 'Enter' && typedNumbers.length > 0) {
        // Clear timeout if it exists
        if (typedNumbersTimeout) {
          clearTimeout(typedNumbersTimeout);
        }
        
        // Log current state for debugging
        console.log("Enter key pressed with song number:", typedNumbers);
        console.log("Current reserved list count:", reservedNumbers.length);
        console.log("Current reserved list:", reservedNumbers);
        
        // If no video is currently playing, play immediately
        if (!videoUrl) {
          console.log("No video currently playing, playing immediately:", typedNumbers);
          
          // Play the song directly
          if (onPlayReservedSong) {
            onPlayReservedSong(typedNumbers)
              .then(result => {
                if (result.success) {
                  setPlaying(true);
                  setReserved(false);
                  console.log("Song playback started successfully");
                } else {
                  console.error("Could not play song:", result.error);
                  // Show error message but allow it to be interrupted
                  showValidationMessage(`Could not find song ${typedNumbers}`, 'error');
                }
              })
              .catch(error => {
                console.error("Error playing song on Enter:", error);
                // Show error message but allow it to be interrupted
                showValidationMessage(`Error: ${error.message}`, 'error');
              });
          }
        } else {
          // A video is already playing, first check if the song exists
          if (onPlayReservedSong) {
            // Use the special CHECK parameter to verify song exists without playing it
            onPlayReservedSong(`CHECK:${typedNumbers}`)
              .then(result => {
                if (result.success) {
                  // Song exists, add it to the reservation list
          // Clone the current list and add the new number
          const updatedList = [...reservedNumbers, typedNumbers];
          
                  // Check if we need to remove the oldest song (limit to 30)
                  const finalList = updatedList.length > 30 ? updatedList.slice(-30) : updatedList;
          
          // Add to the reserved list
          setReservedNumbers(finalList);
          
                  // Show confirmation message in the reserved-numbers-display
                  showValidationMessage(`Song ${typedNumbers} added to reserved list`);
                  
                  // Hide next song notification when reserving a song
                  setShowNextSong(false);
          
          console.log("Song reserved, new list:", finalList);
                } else {
                  // Song doesn't exist, show error message in the reserved-numbers-display
                  showValidationMessage(`Song ${typedNumbers} not found`, 'error');
                  
                  console.error("Song not found:", result.error);
                }
              })
              .catch(error => {
                // Show error message in the reserved-numbers-display
                showValidationMessage(`Error checking song: ${error.message}`, 'error');
                
                console.error("Error checking song on Enter:", error);
              });
          }
        }
        
        // Clear the input regardless of what action was taken
        setShowTypedNumbers(false);
        setTypedNumbers('');
      }
    };

    // Add the keydown event listener
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      
      // Clear timeout on unmount
      if (typedNumbersTimeout) {
        clearTimeout(typedNumbersTimeout);
      }
    };
  }, [
    typedNumbers, 
    typedNumbersTimeout, 
    onPlayReservedSong, 
    reservedNumbers, 
    setReservedNumbers,
    setPlaying,
    setReserved,
    setTypedNumbers,
    setShowTypedNumbers,
    videoUrl,
    validationMessage,
    validationMessageType,
    showValidationMessage
  ]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    stop: handleStop,
    playNext: () => {
      // Return true if there's a next song to play and we successfully start playing it
      if (reservedNumbers.length > 0) {
        console.log("Playing next reserved song via S key");
        playNextReservedSong();
        return true;
      }
      console.log("No reserved songs to play next via S key");
      // If no song is currently playing, return false to trigger stop
      if (videoUrl) {
        // Clear the video URL to stop current song
        if (onPlayReservedSong) {
          console.log("Sending STOP command via S key with no reserved songs");
          onPlayReservedSong('STOP');
        }
      }
      return false;
    }
  });

  // Fetch next song title for display
  const fetchNextSongTitle = async () => {
    console.log("Attempting to fetch next song title"); // Debug log
    console.log("Validation message:", validationMessage); // Debug log
    console.log("Recently showed validation:", recentlyShowedValidation); // Debug log
    console.log("Show typed numbers:", showTypedNumbers); // Debug log
    
    // Don't show next song notification if:
    // 1. A validation message is already showing
    // 2. User is currently typing a number
    // 3. Recently showed a validation message
    if (validationMessage || showTypedNumbers || recentlyShowedValidation) {
      console.log("Conditions not met for showing next song notification"); // Debug log
      return;
    }
    
    if (reservedNumbers.length > 0) {
      const nextSongNumber = reservedNumbers[0];
      console.log("Next song number to display:", nextSongNumber); // Debug log
      
      // Only show if we're playing a video and have reserved songs
      if (videoUrl && nextSongNumber) {
        try {
          // Use CHECK prefix to just check if song exists and get info without playing
          console.log("Checking song info for:", nextSongNumber); // Debug log
          const result = await onPlayReservedSong(`CHECK:${nextSongNumber}`);
          if (result.success && result.exists) {
            // Display next song information with title if available
            const displayTitle = result.title || `Song #${nextSongNumber}`;
            setNextSongTitle(`Coming Next: ${displayTitle}`);
            setShowNextSong(true);
            console.log("Next song notification showed:", displayTitle); // Debug log
            
            // Hide after 8 seconds
            setTimeout(() => {
              setShowNextSong(false);
              console.log("Next song notification hidden after timeout"); // Debug log
            }, 8000);
          }
        } catch (error) {
          console.error("Error fetching next song info:", error);
        }
      }
    } else {
      console.log("No reserved songs to show"); // Debug log
    }
  };

  // Set up interval to periodically show next song information
  useEffect(() => {
    console.log("Setting up next song notification interval"); // Debug log
    console.log("videoUrl:", !!videoUrl); // Debug log
    console.log("reservedNumbers length:", reservedNumbers.length); // Debug log
    
    // Only set up the interval if we have a video playing and reserved songs
    if (videoUrl && reservedNumbers.length > 0) {
      // Clear any existing interval first
      if (nextSongIntervalRef.current) {
        clearInterval(nextSongIntervalRef.current);
        console.log("Cleared existing interval"); // Debug log
      }
      
      // Set first display right away, but only if conditions are met
      if (!validationMessage && !recentlyShowedValidation && !showTypedNumbers) {
        console.log("Initial fetch of next song title"); // Debug log
        fetchNextSongTitle();
      } else {
        console.log("Initial fetch skipped, conditions not met"); // Debug log
      }
      
      // Then set up the regular interval every 30 seconds
      nextSongIntervalRef.current = setInterval(() => {
        console.log("30-second interval triggered"); // Debug log
        // Only fetch if conditions are met
        if (!validationMessage && !recentlyShowedValidation && !showTypedNumbers) {
          console.log("Fetching next song title from interval"); // Debug log
          fetchNextSongTitle();
        } else {
          console.log("Interval fetch skipped, conditions not met"); // Debug log
          console.log("validationMessage:", !!validationMessage);
          console.log("recentlyShowedValidation:", recentlyShowedValidation);
          console.log("showTypedNumbers:", showTypedNumbers);
        }
      }, 30000); // Show every 30 seconds
      
      console.log("Interval created:", nextSongIntervalRef.current); // Debug log
      
      return () => {
        if (nextSongIntervalRef.current) {
          clearInterval(nextSongIntervalRef.current);
          console.log("Interval cleaned up in effect cleanup"); // Debug log
        }
      };
    } else {
      // Clear interval when no video or no reserved songs
      if (nextSongIntervalRef.current) {
        clearInterval(nextSongIntervalRef.current);
        nextSongIntervalRef.current = null;
        console.log("Interval cleared - no video or no reserved songs"); // Debug log
      }
    }
  }, [videoUrl, reservedNumbers.length, validationMessage, recentlyShowedValidation, showTypedNumbers]);

  // Also listen for validation message clearing to trigger next song notification
  useEffect(() => {
    // Don't add a timeout to show next song notification - it will be handled
    // by the showValidationMessage function and the main interval
    
    // Instead, just clear next song notification if validation message appears
    if (validationMessage && showNextSong) {
      setShowNextSong(false);
    }
  }, [validationMessage, showNextSong]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (nextSongIntervalRef.current) {
        clearInterval(nextSongIntervalRef.current);
      }
    };
  }, []);

  if (!videoUrl) {
    return (
      <div className="video-container tv-mode" ref={containerRef}>
        <div className="video-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {/* Title with icon */}
          <div className="karaoke-title-wrapper">
            <h1 className="karaoke-title">
              <svg fill="#ffffff" width="115px" height="115px" viewBox="-102.4 -102.4 1228.80 1228.80" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="8.192"><g id="SVGRepo_bgCarrier" stroke-width="0"><rect x="-102.4" y="-102.4" width="1228.80" height="1228.80" rx="245.76" fill="#0d6efd" strokewidth="0"></rect></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M263.975 450.167L128.15 705.299c-3.159 5.476-1.288 12.46 4.174 15.613l112.821 65.145c5.461 3.152 12.454 1.277 15.606-4.184l1.145-1.767 168.987-233.574-166.908-96.365zm-39.309 371.364l-112.821-65.145c-25.054-14.461-33.632-46.49-19.514-70.942L237.78 412.21c5.445-10.228 18.283-13.906 28.318-8.113L471.021 522.41c10.515 6.071 13.469 19.904 6.353 29.741L295.625 803.365c-14.732 24.268-46.243 32.431-70.958 18.166z"></path><path d="M156.995 771.178L74.522 910.831c-5.752 9.739-2.519 22.297 7.22 28.049s22.297 2.519 28.049-7.22l82.473-139.653c5.752-9.739 2.519-22.297-7.22-28.049s-22.297-2.519-28.049 7.22zm328.233-311.781c33.4-10.543 61.897-33.05 79.85-64.151 39.062-67.659 15.878-154.176-51.783-193.249-67.659-39.062-154.175-15.878-193.24 51.785-18.064 31.28-23.259 67.45-15.497 101.824l180.67 103.791zm-218.051-84.706c-13.501-47.223-7.643-98.014 17.407-141.391 50.374-87.251 161.941-117.149 249.193-66.775 87.25 50.385 117.147 161.951 66.775 249.199-24.907 43.147-65.656 73.527-112.984 85.578a20.48 20.48 0 01-15.256-2.088L276.667 386.82a20.473 20.473 0 01-9.489-12.129z"></path><path d="M292.077 261.278l279.091 161.137c9.795 5.655 22.321 2.299 27.976-7.496s2.299-22.321-7.496-27.976L312.557 225.806c-9.795-5.655-22.321-2.299-27.976 7.496s-2.299 22.321 7.496 27.976zm288.809 584.944l124.252-213.34c5.692-9.774 2.384-22.312-7.39-28.004s-22.312-2.384-28.004 7.39l-124.252 213.34c-5.692 9.774-2.384 22.312 7.39 28.004s22.312 2.384 28.004-7.39zm282.789-547.034L738.235 81.916c-5.655-9.795-18.181-13.152-27.976-7.496s-13.152 18.181-7.496 27.976l125.44 217.272c5.655 9.795 18.181 13.152 27.976 7.496s13.152-18.181 7.496-27.976zm-41.45 602.58l116.869-203.069c5.642-9.803 2.268-22.324-7.535-27.966s-22.324-2.268-27.966 7.535L786.724 881.337c-5.642 9.803-2.268 22.324 7.535 27.966s22.324 2.268 27.966-7.535z"></path><path d="M682.008 642.316l234.691 64.553c10.906 3 22.178-3.409 25.178-14.315s-3.409-22.178-14.315-25.178l-234.691-64.553c-10.906-3-22.178 3.409-25.178 14.315s3.409 22.178 14.315 25.178zM833.651 340.51c0-23.331-18.909-42.24-42.24-42.24s-42.24 18.909-42.24 42.24c0 23.331 18.909 42.24 42.24 42.24s42.24-18.909 42.24-42.24zm40.96 0c0 45.953-37.247 83.2-83.2 83.2s-83.2-37.247-83.2-83.2 37.247-83.2 83.2-83.2 83.2 37.247 83.2 83.2zm-87.236 528.811c0-23.331-18.909-42.24-42.24-42.24s-42.24 18.909-42.24 42.24c0 23.331 18.909 42.24 42.24 42.24s42.24-18.909 42.24-42.24zm40.96 0c0 45.953-37.247 83.2-83.2 83.2s-83.2-37.247-83.2-83.2 37.247-83.2 83.2-83.2 83.2 37.247 83.2 83.2zm-279.689-60.416c0-23.331-18.909-42.24-42.24-42.24s-42.24 18.909-42.24 42.24c0 23.331 18.909 42.24 42.24 42.24s42.24-18.909 42.24-42.24zm40.96 0c0 45.953-37.247 83.2-83.2 83.2s-83.2-37.247-83.2-83.2 37.247-83.2 83.2-83.2 83.2 37.247 83.2 83.2z"></path></g></svg> Karaoke System
            </h1>
          </div>
          
          <p>Enter a song number to start</p>

          <div style={{ marginTop: '20px', fontSize: '1.2rem', textAlign: 'center' }}>
            <p>Press <strong>Enter</strong> to:</p>
            <ul style={{ listStyle: 'none', padding: '0' }}>
              <li>Play a song immediately on startup</li>
              <li>Reserve a song when a video is playing</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', fontSize: '1.2rem', textAlign: 'center' }}>
            <p>Keyboard Controls:</p>
            <ul style={{ listStyle: 'none', padding: '0' }}>
              <li><kbd>S</kbd> - Play next song or Stop if none</li>
              <li><kbd>Esc</kbd> - Stop</li>
            </ul>
          </div>
        
          
          {/* Copyright notice */}
          <div className="copyright-notice">
            <p>Made with ❤️ <span>Dcoderz Philippines</span> © 2025</p>
          </div>
        </div>
        
        {/* Reserved numbers display with typed numbers for initial screen */}
        {showTypedNumbers && (
          <div className="reserved-numbers-display">
            <h3 data-count={reservedNumbers.length}>RES</h3>
            <div className="typed-numbers">{typedNumbers}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`video-container ${showTypedNumbers ? 'typing-active' : ''} ${videoUrl ? 'video-playing' : ''} tv-mode`} ref={containerRef}>
      <div className="video-wrapper">
        <CustomReactPlayer
          videoUrl={videoUrl}
          playing={playing && !reserved}
          onPlay={() => {
            console.log("Video playback started");
            setPlaying(true);
          }}
          onPause={() => {
            console.log("Video playback paused");
            setPlaying(false);
          }}
          onEnded={handleVideoEnded}
          onReady={(player) => {
            console.log("Video player ready");
            handleReady(player);
          }}
          onProgress={handleProgress}
          onDuration={handleDuration}
        />
        
        {/* Reserved overlay when song is reserved */}
        {reserved && (
          <div className="video-reserved-overlay">
            <div>RESERVED</div>
          </div>
        )}
        
        {/* Reserved numbers display - now contains typed numbers when active */}
        <div className="reserved-numbers-display">
          <h3 data-count={reservedNumbers.length}>RES</h3>
          
          {/* Show next song notification, validation message, or typed numbers */}
          {showNextSong ? (
            <div className="next-song-notification">
              {nextSongTitle}
            </div>
          ) : validationMessage ? (
            <div className={`validation-message ${validationMessageType}`}>
              {validationMessage}
            </div>
          ) : showTypedNumbers ? (
            <div className="typed-numbers">{typedNumbers}</div>
          ) : (
            <ul className="reserved-numbers-list">
              {reservedNumbers.length > 0 ? (
                reservedNumbers.map((number, index) => (
                  <li key={index} className="reserved-number-item">
                    <button 
                      className="play-reserved-btn" 
                      title="Play this song next"
                      onClick={() => playReservedSong(index)}
                    >
                      ▶
                    </button>
                    <span>{number}</span>
                  </li>
                ))
              ) : (
                <li className="empty-reserved">No reserved numbers</li>
              )}
            </ul>
          )}
          
          {/* Autoplay toggle - only show when not typing, no validation message, and not showing next song */}
          {!showTypedNumbers && !validationMessage && !showNextSong && (
            <div className="autoplay-toggle">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoplayReserved} 
                  onChange={toggleAutoplayReserved}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Auto</span>
            </div>
          )}
        </div>
        
        {/* Current playing song indicator */}
        {currentSongNumber && (
          <div className="current-song-indicator">
            Now Playing: {currentSongNumber}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer; 