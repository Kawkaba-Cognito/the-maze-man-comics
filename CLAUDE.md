# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Maze Man** is a single-file educational web application (`maze-man-v6.html`) that combines interactive psychology-themed comics, video lessons, and a 3D maze game. Everything — HTML structure, CSS, and JavaScript — lives in one file (~1,400 lines).

## Running the Project

Open `maze-man-v6.html` directly in any modern browser. No build step, no package manager, no server required.

**Requirements:**
- Internet connection (loads Babylon.js from CDN and Google Fonts)
- Modern browser with WebGL, Canvas 2D, Web Audio API, and Web Speech API support

## Architecture

The entire app is a monolithic single-file design with clearly commented sections. All state is in-memory; there is no backend or database.

### Major Sections

**2D UI Shell**
- Navigation tabs: Home, Comics, Videos, Profile
- Language toggle: English / Arabic (RTL support)
- XP pill tracker in the header

**Home Screen**
- Animated "Maze Man" CSS character
- Three comic book cover cards (Social Psychology, About The Page, Cognitive Psychology)
- "Enter Maze" button to launch the 3D game

**Comics Screen**
- Page-by-page comic reader with multi-language content

**Videos Screen**
- Custom Canvas 2D video player (not an HTML5 `<video>` element)
- Web Speech API drives narration playback
- Episodic psychology lessons

**3D Maze Game (Babylon.js)**
- Procedural maze via recursive backtracker algorithm
- Stick-figure player with walk animation
- Controls: WASD/arrow keys, on-screen joystick, click-to-walk
- Collectible fragments, boss encounter, XP rewards, particle effects

### External Dependencies (CDN only)
- **Babylon.js** — 3D engine for the maze game
- **Google Fonts** — Bangers, Comic Neue, Outfit, Cairo, DM Mono

### Audio
Synthesized via Web Audio API (no audio files). Narration uses Web Speech API text-to-speech.
