# Louder World - Sydney Events Aggregator

A full-stack MERN application that automatically scrapes events from multiple sources for Sydney, Australia and provides a beautiful UI for browsing events with Google OAuth authentication and an admin dashboard.

## Features

### Event Scraping & Auto Updates
- Multi-source event scraping (Eventbrite, Sydney Today, Time Out Sydney)
- Automatic detection of new, updated, and inactive events
- Scheduled scraping via cron jobs
- Configurable scrape intervals and cutoff dates

### Public Website
- Clean, minimalistic UI for browsing events
- Event cards with images, date/time, venue, and descriptions
- Filtering by category, date range, and keyword search
- Email capture on "Get Tickets" click with user consent
- Redirects to original event URLs after email capture

### Admin Dashboard
- Google OAuth authentication
- Table view of all events with key fields
- Preview panel showing full event details
- Filters: City, Keyword search, Date range, Source, Status
- "Import to Platform" action with notes
- Status tags: new, updated, inactive, imported
- Manual scraper trigger

### Data Management
- MongoDB with Mongoose ODM
- Event model with comprehensive fields
- Email lead capture
- User authentication with role-based access

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Passport.js for Google OAuth
- Puppeteer + Cheerio for web scraping
- node-cron for scheduled tasks
- Winston for logging
- JWT for authentication

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Lucide React icons
- Axios for API calls
- date-fns for date formatting

## Project Structure

```
louder-world/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── passport.js        # Passport OAuth config
│   ├── middleware/
│   │   ├── auth.js            # Auth middleware
│   │   ├── error.js           # Error handling
│   │   └── validation.js      # Request validation
│   ├── models/
│   │   ├── Event.js           # Event model
│   │   ├── EmailLead.js       # Email lead model
│   │   └── User.js            # User model
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   ├── events.js          # Events API
│   │   └── admin.js           # Admin routes
│   ├── services/
│   │   ├── scrapers/
│   │   │   ├── BaseScraper.js          # Base scraper class
│   │   │   ├── EventbriteScraper.js    # Eventbrite scraper
│   │   │   ├── SydneyTodayScraper.js   # Sydney Today scraper
│   │   │   ├── TimeOutSydneyScraper.js # Time Out Sydney scraper
│   │   │   └── RSSFeedScraper.js       # RSS feed scraper
│   │   └── scraperRunner.js   # Orchestrates all scrapers
│   ├── utils/
│   │   └── logger.js          # Winston logger
│   ├── app.js                 # Express app
│   ├── server.js              # Server entry point
│   └── .env                   # Environment variables
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── TicketModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── EventsFilter.jsx
│   │   │   └── EventsList.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── cn.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- Google OAuth credentials

### 1. Clone and Install Dependencies

```bash
cd "Louder World"
npm run install:all
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - Development: `http://localhost:5000/api/auth/google/callback`
     - Production: `https://yourdomain.com/api/auth/google/callback`
5. Copy Client ID and Client Secret

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/louder-world-events
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=http://localhost:3000
SCRAPE_INTERVAL_MINUTES=60
EVENT_CUTOFF_DAYS=30
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Start MongoDB

Make sure MongoDB is running:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Run the Application

**Development (both backend and frontend):**
```bash
npm run dev
```

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

**Production:**
```bash
npm run build
npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Events (Public)
- `GET /api/events` - List events with filters
- `GET /api/events/featured` - Get featured events
- `GET /api/events/:id` - Get event details
- `GET /api/events/categories` - Get all categories
- `POST /api/events/leads` - Create email lead

### Events (Admin - Protected)
- `GET /api/events/stats` - Get event statistics
- `POST /api/events/import` - Import event to platform
- `GET /api/events/dashboard/filter` - Filter events for dashboard

### Admin (Protected)
- `GET /api/admin/status` - Get scraper status
- `POST /api/admin/run` - Run scraper (single or all)
- `POST /api/admin/cleanup` - Run cleanup tasks

## Event Status Tags

- **new**: Freshly discovered events
- **updated**: Events changed since last scrape
- **inactive**: Removed from source / expired / not valid anymore
- **imported**: Successfully imported into platform

## Scraping Schedule

- Default scrape interval: Every 60 minutes
- Daily cleanup: Runs at 2:00 AM
- Configurable via environment variables

## Deployment

### Backend (Deploy to Render, Heroku, or similar)

1. Set environment variables in deployment platform
2. Update MongoDB URI to use cloud MongoDB (MongoDB Atlas recommended)
3. Deploy backend code
4. Update `FRONTEND_URL` and `GOOGLE_CALLBACK_URL` to production URLs

### Frontend (Deploy to Vercel, Netlify, or similar)

1. Build the frontend: `npm run build`
2. Deploy the `frontend/build` folder
3. Set `REACT_APP_API_URL` to production backend URL
4. Update Google OAuth redirect URIs

### MongoDB Atlas Setup

1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Update `MONGODB_URI` in backend environment

## Security Notes

- Change all default secrets in production
- Enable HTTPS in production
- Use environment-specific API keys
- Implement rate limiting for production
- Keep dependencies updated
- Enable MongoDB authentication
- Use a secrets manager for sensitive data

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
- Ensure MongoDB is running
- Check MongoDB URI in `.env` file
- Verify MongoDB is accessible on specified port

### Puppeteer Installation Issues
- Some Puppeteer browsers may fail to download
- Install manually or use Puppeteer with system Chrome
- Update Puppeteer version if compatibility issues

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches frontend URL
- Check CORS configuration in `app.js`

### Google OAuth Fails
- Verify Client ID and Secret are correct
- Check redirect URIs match exactly (including http/https)
- Ensure Google+ API is enabled

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
