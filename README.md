# VTON - Virtual Try-On UI

A React-based Virtual Try-On application interface that matches the provided design specifications.

## Features

- Upload person image with draw tool option
- Upload garment image via drag-and-drop or click
- Masked image output display
- Auto-generated mask option (with 5-second processing time)
- Output display section
- Try-on button
- Responsive design

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage

1. Upload a person image in the left box
2. Upload a garment image in the middle box
3. Toggle the auto-generated mask option if needed
4. View the masked output in the right box
5. Click "Try-on" to process the virtual try-on
6. View the final output in the bottom section

## Technologies Used

- React 18
- CSS3 with modern gradients and effects
- SVG icons
- Responsive design principles

## Build

To create a production build:
```bash
npm run build
```

The build files will be in the `build` folder.
