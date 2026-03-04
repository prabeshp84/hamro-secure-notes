🔐 Hamro Secure Notes












A secure encrypted note vault built using modern cryptography, secure authentication, and DevOps practices.

Hamro Secure Notes ensures that user data remains confidential, authenticated, and tamper-proof by performing client-side encryption before storage.

This project demonstrates secure full-stack development combining:

Cryptography

Secure API design

Authentication systems

Containerized deployment

Continuous Integration

📌 Key Features
🔐 End-to-End Encryption

All notes are encrypted in the browser before being sent to the server.

The backend never stores plaintext data.

🧾 Digital Signature Verification

Every note is digitally signed using the user’s private key.

This allows:

integrity verification

tamper detection

🔑 Secure Authentication

The application uses:

bcrypt password hashing

JWT token authentication

secure API authorization

🛡️ Security Hardening

The backend includes multiple defensive layers:

helmet security headers

express-rate-limit

environment validation

protected API routes

🏗️ System Architecture
User Browser
      │
      │ HTTPS
      ▼
Frontend (React + Web Crypto API)
      │
      │ Encrypted Notes
      ▼
Backend API (Node.js + Express)
      │
      ▼
MongoDB Database

Encryption occurs client-side, ensuring that sensitive data never appears in plaintext on the server.

⚙️ Technology Stack
Frontend

React

Vite

Web Crypto API

CSS

Backend

Node.js

Express.js

MongoDB

Mongoose

Security

bcrypt

JSON Web Tokens (JWT)

Web Crypto API

helmet

express-rate-limit

DevOps

Docker

Docker Compose

GitHub Actions CI/CD

📂 Project Structure
hamro-secure-notes
│
├── backend
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend
│   ├── src
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── utils
│   │       └── crypto.js
│   ├── package.json
│   └── Dockerfile
│
├── .github
│   └── workflows
│       └── ci.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
🚀 Quick Start
1️⃣ Clone the Repository
git clone https://github.com/prabeshp84/hamro-secure-notes.git
cd hamro-secure-notes
⚙️ Environment Setup

Create a .env file inside the backend directory.

Example:

MONGO_URI=mongodb://mongo:27017/hamro_vault
JWT_SECRET=supersecretkey
PORT=5000
CORS_ORIGIN=http://localhost:5173
🐳 Run Using Docker

Start the entire system using Docker:

docker compose up --build

Services started:

Service	Port
Frontend	5173
Backend	5000
MongoDB	27017
🧪 Local Development
Backend
cd backend
npm install
npm start
Frontend
cd frontend
npm install
npm run dev

Application will run at:

http://localhost:5173
🔁 Continuous Integration

The project includes a GitHub Actions CI pipeline that automatically:

installs dependencies

builds the frontend

tests backend services

CI workflow location:

.github/workflows/ci.yml

Triggered on:

push
pull_request
🔐 Security Model
Security Layer	Implementation
Client encryption	Web Crypto API
Password hashing	bcrypt
Authentication	JWT
Secure headers	helmet
API protection	express-rate-limit
🧪 API Endpoints
Register
POST /api/register

Creates a new encrypted user identity.

Login
POST /api/login

Authenticates the user and returns a JWT token.

Create Note
POST /api/notes

Stores encrypted note data.

Get Notes
GET /api/notes

Retrieves encrypted notes belonging to the user.

Update Note
PATCH /api/notes/:id

Updates encrypted note content.

Delete Note
DELETE /api/notes/:id

Deletes a stored note.

Health Check
GET /health

Used by monitoring and container health checks.

🧑‍💻 DevOps Practices

This repository demonstrates modern DevOps engineering practices:

containerized application deployment

reproducible infrastructure

CI/CD automation

environment-based configuration

📈 Future Improvements

Planned enhancements include:

Multi-factor authentication

Key rotation mechanisms

Hardware Security Module integration

Kubernetes deployment

secrets management with Vault

👨‍💻 Author

Prabesh Paudel

Cybersecurity Student
Coventry University

🤝 Contributing

Contributions are welcome.

Fork the repository

Create a feature branch

Submit a pull request

📜 License

This project is licensed under the MIT License.