# Karaoke Player System for TV

A React-based karaoke player system designed specifically for TV displays, optimized for viewing from a distance and controlling with a keyboard or remote.

## Features

- YouTube video player with custom controls optimized for TV screens
- Large, easy-to-read UI elements and text
- Automatic fullscreen mode
- Song search by number
- Reservation system for queuing multiple songs
- Keyboard/remote shortcuts for easy control

## How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## URL Parameters

- Default mode: `http://localhost:5173/`
- To load a specific song immediately: `http://localhost:5173/?song=12345`

## Keyboard Controls

The system is designed to be controlled entirely via keyboard/remote:

- **Numbers (0-9)**: Input song numbers (displays large on screen)
- **Enter**: Immediately search for and play the entered song
- **Space**: Play/pause the current song
- **Escape**: Stop the current song
- **R**: Reserve the current song to play later

## Reserved Numbers System

The system allows you to:
- Reserve multiple songs by typing numbers and waiting for the timeout
- See all reserved songs in a list at the top left
- Play any reserved song by clicking its play button
- Remove songs from the reserved list
- Enable/disable auto-play of reserved songs

## API Connection

This system connects to a song API that serves song data and YouTube URLs. The API should be running on `http://localhost:3000/api/song/{songNumber}`.

## Technologies Used

- React + Vite
- React Player (for YouTube integration)
- Axios (for API requests)
