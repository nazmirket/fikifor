# Fikifor 🎮

<div align="center">
  <img src="./public/brand.svg" alt="Fikifor Logo" width="200" />
  
  **A Real-time Multiplayer Quiz Tournament Game**
  
  [🎮 Live Demo](https://fikifor.mirket.dev) | [📖 Documentation](#documentation) | [🚀 Quick Start](#quick-start)
</div>

---

## 📋 Table of Contents

- [About the Game](#about-the-game)
- [Game Mechanics](#game-mechanics)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🎯 About the Game

Fikifor is an exciting real-time multiplayer quiz tournament game where players compete in elimination-style matches. Players vote on pairs of items from curated catalogs, with winners advancing through multiple rounds until a final champion emerges.

**🎮 [Try it live at fikifor.mirket.dev](https://fikifor.mirket.dev)**

### Key Features

- 🔥 **Real-time multiplayer gameplay** using WebSockets
- 🏆 **Tournament-style elimination** brackets
- 📚 **Customizable quiz catalogs** with 32, 64, or 128 items
- 🎨 **Rich visual content** support with image uploads
- 👥 **Live participant tracking** and voting
- 📱 **Responsive design** for all devices
- 🔐 **User authentication** and session management

## 🎮 Game Mechanics

### Tournament Structure

1. **Catalog Creation**: Quiz creators build catalogs with 32, 64, or 128 items
2. **Session Setup**: Admins create game sessions with unique room codes
3. **Player Joining**: Participants join using room codes
4. **Bracket Generation**: Items are randomly paired into elimination brackets
5. **Voting Rounds**: Players vote on item pairs in real-time
6. **Elimination**: Losing items are eliminated, winners advance
7. **Final Winner**: The tournament continues until one item remains

### Round Progression Example (32 items):

```
Round 1: 32 items → 16 pairs → 16 winners
Round 2: 16 items → 8 pairs → 8 winners
Round 3: 8 items → 4 pairs → 4 winners
Round 4: 4 items → 2 pairs → 2 winners
Round 5: 2 items → 1 pair → 1 CHAMPION! 🏆
```

## 📸 Screenshots

<div align="center">
  <img src="./public/ss1.png" alt="Game Session Screenshot 1" width="45%" />
  <img src="./public/ss2.png" alt="Game Session Screenshot 2" width="45%" />
</div>

## 🛠 Tech Stack

### Frontend (Nuxt.js App)

- **Framework**: Nuxt 3 (Vue.js)
- **UI Library**: Nuxt UI (Tailwind CSS)
- **State Management**: Pinia with persistence
- **Real-time**: Socket.io-client
- **TypeScript**: Full type safety

### Backend (Node.js API)

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.io
- **File Upload**: Multer with Sharp (image processing)
- **Process Management**: PM2

### Infrastructure

- **Package Manager**: pnpm
- **Code Quality**: ESLint + Prettier
- **Database Migrations**: Prisma Migrate
- **Environment**: Docker-ready configuration

## 📁 Project Structure

```
fikifor/
├── api/                    # Backend API server
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── prisma/            # Database schema & migrations
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic layer
│   ├── utils/             # Utility functions
│   └── ws/                # WebSocket server
├── app/                   # Frontend Nuxt.js application
│   ├── components/        # Vue components
│   ├── composables/       # Vue composables
│   ├── layouts/           # Page layouts
│   ├── middleware/        # Nuxt middleware
│   ├── pages/             # Application pages
│   ├── store/             # Pinia stores
│   └── types/             # TypeScript definitions
└── public/                # Static assets
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **PostgreSQL** 14+

### 1. Clone the Repository

```bash
git clone https://github.com/nazmirket/fikifor.git
cd fikifor
```

### 2. Install Dependencies

```bash
# Install API dependencies
cd api
pnpm install

# Install App dependencies
cd ../app
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment files
cp api/.env.example api/.env
cp app/.env.example app/.env
```

Edit the `.env` files with your configuration:

**api/.env:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/fikifor"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
```

### 4. Database Setup

```bash
cd api
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed
```

### 5. Start Development Servers

**Terminal 1 - API Server:**

```bash
cd api
pnpm dev
```

**Terminal 2 - WebSocket Server:**

```bash
cd api
pnpm dev:ws
```

**Terminal 3 - Frontend App:**

```bash
cd app
pnpm dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **WebSocket**: http://localhost:3002

## 🔧 Development

### Available Scripts

#### API Scripts

```bash
pnpm dev          # Start development server
pnpm dev:ws       # Start WebSocket server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm db:build     # Rebuild database schema
pnpm lint         # Run ESLint
```

#### App Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm generate     # Generate static site
pnpm lint         # Run ESLint
```

### Database Management

```bash
# View data in Prisma Studio
pnpm prisma studio

# Reset database
pnpm prisma migrate reset

# Deploy migrations
pnpm prisma migrate deploy
```

## 📡 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/logout` - User logout

### Quiz Management

- `GET /api/v1/quizes` - List user's quizzes
- `POST /api/v1/quizes` - Create new quiz
- `PUT /api/v1/quizes/:id` - Update quiz
- `DELETE /api/v1/quizes/:id` - Delete quiz

### Session Management

- `POST /api/v1/sessions` - Create game session
- `GET /api/v1/sessions/:code` - Join session by code
- `POST /api/v1/sessions/:id/start` - Start game session

### File Upload

- `POST /api/v1/files/upload` - Upload images for quiz items

### WebSocket Events

- `join-session` - Join a game session
- `vote` - Submit vote for current match
- `session-update` - Real-time session state updates
- `match-result` - Match results broadcast

## 🚀 Production Deployment

### Build for Production

```bash
# Build API
cd api
pnpm build

# Build App
cd ../app
pnpm build
```

### Start Production Servers

```bash
# Start API with PM2
cd api
pnpm start

# Start App
cd ../app
pnpm preview
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👨‍💻 Author

**Nazmi Yilmaz** - [@nazmirket](https://github.com/nazmirket)

---

<div align="center">
  Made with ❤️ for quiz game enthusiasts
  
  [🎮 Play Now](https://fikifor.mirket.dev) | [⭐ Star on GitHub](https://github.com/nazmirket/fikifor)
</div>
