import { useEffect } from 'react';

/**
 * Custom hook to handle keyboard shortcuts for the video player
 * @param {Object} handlers - Object containing handler functions for each keyboard shortcut
 * @param {Function} handlers.stop - Handler for stop shortcut (Escape, S)
 * @param {Function} handlers.playNext - Handler for playing next song (S)
 * @param {Function} handlers.playPause - Handler for play/pause toggle
 * @param {Function} handlers.seekForward - Handler for seeking forward
 * @param {Function} handlers.seekBackward - Handler for seeking backward
 * @param {Function} handlers.showControls - Handler for showing controls
 * @param {Function} handlers.navigationUp - Handler for navigation up
 * @param {Function} handlers.navigationDown - Handler for navigation down
 * @param {Function} handlers.navigationLeft - Handler for navigation left
 * @param {Function} handlers.navigationRight - Handler for navigation right
 * @param {Function} handlers.activateControl - Handler for activating focused control
 */
const useKeyboardShortcuts = (handlers) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent handling if user is typing in an input
      if (
        event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.code) {
        case 'KeyS': // S key for stop and play next
          event.preventDefault();
          // If playNext handler exists and returns true (meaning there is a next song), use it
          // Otherwise fallback to stop handler
          if (handlers.playNext) {
            const hasNextSong = handlers.playNext();
            if (!hasNextSong && handlers.stop) {
              handlers.stop();
            }
          } else if (handlers.stop) {
            handlers.stop();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handlers.stop?.();
          break;
        case 'Space':
          event.preventDefault();
          handlers.playPause?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          // If navigation mode is active, navigate between controls
          if (handlers.navigationRight) {
            handlers.navigationRight();
          } else if (handlers.seekForward) {
            // Otherwise use for seeking
            handlers.seekForward?.();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          // If navigation mode is active, navigate between controls
          if (handlers.navigationLeft) {
            handlers.navigationLeft();
          } else if (handlers.seekBackward) {
            // Otherwise use for seeking
            handlers.seekBackward?.();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          // Show controls
          if (handlers.showControls) {
            handlers.showControls();
          }
          // Navigate up if supported
          if (handlers.navigationUp) {
            handlers.navigationUp();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Navigate down if supported
          if (handlers.navigationDown) {
            handlers.navigationDown();
          }
          break;
        case 'Enter':
          // If in navigation mode, activate the currently focused control
          if (handlers.activateControl) {
            event.preventDefault();
            handlers.activateControl();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
};

export default useKeyboardShortcuts; 