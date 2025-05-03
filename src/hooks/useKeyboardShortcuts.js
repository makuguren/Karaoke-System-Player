import { useEffect } from 'react';

/**
 * Custom hook to handle keyboard shortcuts for the video player
 * @param {Object} handlers - Object containing handler functions for each keyboard shortcut
 * @param {Function} handlers.stop - Handler for stop shortcut (Escape, S)
 * @param {Function} handlers.playNext - Handler for playing next song (S)
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