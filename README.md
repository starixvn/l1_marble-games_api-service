# Marble Football API Service

A NestJS-based API service for the Marble Football application. This service provides authentication and scheduling functionality.

## Features

- **Authentication**: JWT-based authentication system
- **Schedule Management**: API endpoints for retrieving event schedules and details

## Project Structure

```
src/
├── auth/                  # Authentication module
│   ├── auth.controller.ts # Authentication endpoints
│   ├── auth.module.ts     # Authentication module configuration
│   ├── auth.service.ts    # Authentication business logic
│   ├── jwt.strategy.ts    # JWT strategy for Passport
│   └── user.schema.ts     # Mongoose schema for users
├── common/                # Shared functionality
│   └── guards/            # Authentication guards
│       └── jwt.auth.guard.ts # JWT authentication guard
├── schedule/              # Schedule module
│   ├── schedule.controller.ts # Schedule endpoints
│   ├── schedule.module.ts     # Schedule module configuration
│   └── schedule.service.ts    # Schedule business logic
├── app.controller.ts      # Main application controller
├── app.module.ts          # Main application module
├── app.service.ts         # Main application service
└── main.ts                # Application entry point
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Schedule

- `GET /api/schedule` - Get all scheduled events
- `GET /api/event/:id` - Get details for a specific event

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/my_db)
- `JWT_SECRET` - Secret key for JWT tokens (default: MY_SUPER_SECRET_KEY)
- `PORT` - Port to run the server on (default: 3000)

## License

This project is [MIT licensed](LICENSE).
