# Game Recommendation System

A web application that displays user profiles and games listings, with the ability to track user played games for future machine learning recommendations using TensorFlow.js.

## Project Structure

- `index.html` - Main HTML file for the application
- `index.js` - Entry point for the application
- `view/` - Contains classes for managing the DOM and templates
- `controller/` - Contains controllers to connect views and services
- `service/` - Contains business logic for data handling
- `data/` - Contains JSON files with user and product data

## Setup and Run

1. Install dependencies:

```
npm install
```

2. Start the application:

```
npm start
```

3. Open your browser and navigate to `http://localhost:8080`

## Features

- User profile selection with details display
- Past gaming history display
- Game listing with "Play Now" functionality
- Games played tracking using sessionStorage

## Future Enhancements

- TensorFlow.js-based recommendation engine
- User similarity analysis
- Games recommendation based on purchase history
