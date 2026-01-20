# WebWaka POS UI

## Overview
WebWaka Suite Module for Point of Sale UI. This is a frontend module designed to be part of the WebWaka Suite system.

## Project Structure
```
├── server.js          # Simple HTTP server for static files
├── public/
│   ├── index.html     # Main HTML page
│   └── styles.css     # Stylesheet
├── package.json       # Node.js configuration
├── module.manifest.json # WebWaka module metadata
└── module.contract.md   # Module contract documentation
```

## Running the Application
- **Development**: The app runs on port 5000 using `node server.js`
- **Command**: `npm start` or `node server.js`

## Dependencies
- Node.js 20
- No external npm packages required (uses built-in http, fs, path modules)

## Module Information
- **Module ID**: webwaka_suite_pos_ui
- **Class**: suite
- **Dependencies**: webwaka_suite_pos_control
