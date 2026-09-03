# CropSense AI

CropSense AI is a software-based smart agriculture platform designed to help farmers in Pakistan make better crop-management decisions through accessible digital tools.

The platform uses smartphone images, weather information, and farmer-provided details to provide AI-assisted crop insights, irrigation estimates, environmental disease-risk analysis, and practical farming recommendations.

CropSense AI is designed as a demonstration project. It currently uses demo data and does not rely on paid APIs or live commercial AI services.

## Project Status

This project is currently a functional demonstration and proof of concept.

The application demonstrates the intended user experience, interface, navigation, farm-management workflow, and agricultural decision-support features. Some information displayed by the platform is based on predefined demo data rather than live farm or weather data.

## Features

- AI-assisted crop health assessment interface
- Crop image upload workflow
- Demo crop health analysis
- Weather information using demonstration data
- Irrigation estimation
- Environmental disease-risk analysis
- Crop-management recommendations
- Farm and crop information management
- Weather-based alerts
- Responsive and mobile-friendly interface
- Urdu language support
- Simple Mode for users with limited digital literacy
- Dashboard for viewing farm-related information
- User authentication interface

## Problem

Many farmers lack access to timely and affordable information about crop health, weather conditions, irrigation requirements, disease risks, and suitable crop-management practices.

Existing agricultural monitoring solutions may also require expensive equipment, physical sensors, or access to professional agricultural services.

## Solution

CropSense AI combines agricultural information and artificial intelligence into a simple software-based platform.

Users can enter farm and crop details, upload crop images, and view agricultural insights through an accessible interface. The project is designed to demonstrate how digital tools can support farmers without requiring expensive hardware or physical sensors.

## Intended User Workflow

1. Create or access an account
2. Add farm and crop information
3. Upload a crop image or enter crop details
4. View weather and environmental information
5. Review crop health and disease-risk insights
6. Receive irrigation and crop-management recommendations
7. Monitor information through the dashboard

## Technology

### Frontend

- React
- JavaScript
- HTML
- CSS
- Responsive web design

### Backend

- Node.js
- Server-side API structure
- Authentication workflow
- Data processing and storage structure

### Data and AI

- Demonstration crop images and crop information
- Predefined demo weather data
- AI-assisted analysis interface
- Environmental risk assessment logic
- Farmer-provided information

## API and Data Usage

CropSense AI does not currently use paid APIs.

The current demonstration is based on:

- Predefined demo data
- Sample crop information
- Demonstration weather data
- Simulated or prototype AI responses
- User-provided input within the application

This allows the project to demonstrate its functionality without requiring paid subscriptions or commercial API access.

Future versions may integrate live weather services, real AI image analysis, and other external services. Any such integrations will be documented separately.

## Project Structure

```text
CropSense-AI/
│
├── public/
│   └── images/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   └── App.jsx
│
├── server/
│   ├── routes/
│   ├── services/
│   └── server.js
│
├── package.json
├── README.md
└── .env.example
