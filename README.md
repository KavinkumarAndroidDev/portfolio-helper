# Portfolio Manager

A single-page web application for managing portfolio projects and blogs with Firebase Firestore integration.

## Features

- Add and manage projects with details like title, category, description, features, technologies, etc.
- Add and manage blogs with details like title, author, category, date, etc.
- Firebase Firestore integration for data storage
- Modern and clean UI
- Responsive design
- Form validation
- Success/Error notifications

## Setup Instructions

1. Clone the repository
2. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
3. Enable Firestore in your Firebase project
4. Create a `.env` file in the root directory with your Firebase configuration:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

5. Add `.env` to your `.gitignore` file to keep your Firebase credentials secure
6. Open `index.html` in your browser or serve it using a local server

## Project Structure

```
portfolio/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Styling
├── js/
│   ├── script.js      # Main JavaScript file
│   └── firebase-config.js  # Firebase configuration
├── .env               # Environment variables (not tracked in git)
└── README.md          # This file
```

## Firestore Structure

### Projects Collection
```javascript
/projects (collection)
  - document_id (document)
    - title: string
    - category: string
    - description: string
    - features: array
    - technologies: array
    - github: string
    - status: string
    - image: string
```

### Blogs Collection
```javascript
/blogs (collection)
  - document_id (document)
    - title: string
    - author: string
    - category: string
    - date: string
    - image: string
    - link: string
```

## Security Notes

- Never commit your Firebase credentials to version control
- Use environment variables to store sensitive information
- Set up proper Firebase security rules for your Firestore database

## Contributing

Feel free to submit issues and enhancement requests! 