# 📝 Hamro Secure Notes

> A full-stack secure notes application with end-to-end encryption, built for privacy-first personal note management.

![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20MongoDB-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 🔐 **End-to-End Encrypted Notes** — Your notes are encrypted before storage, ensuring only you can read them
- 🔑 **User Authentication** — Secure sign-up and login with JWT-based session management
- 📋 **Full CRUD Support** — Create, read, update, and delete notes with ease
- 🏷️ **Tags & Categories** — Organize your notes using custom tags and categories for quick retrieval

---

## 🛠️ Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Frontend   | React                  |
| Backend    | Node.js, Express.js    |
| Database   | MongoDB                |
| Auth       | JWT (JSON Web Tokens)  |

---

## 🚀 Getting Started

You can run Hamro Secure Notes using **Docker** (recommended) or manually.

---

### 🐳 Docker Setup (Recommended)

#### Prerequisites
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/prabeshp84/hamro-secure-notes.git
   cd hamro-secure-notes
   ```

2. **Create a `.env` file** in the root directory:
   ```env
   JWT_SECRET=your_jwt_secret_key
   MONGO_URI=mongodb://mongo:27017/hamro_vault   # optional, this is the default
   PORT=5000                                      # optional, this is the default
   ```

3. **Build and start all services**
   ```bash
   docker compose up --build
   ```

   This will spin up three services:
   | Service   | Container     | Port             |
   |-----------|---------------|------------------|
   | MongoDB   | `hamro_db`    | `27018` → `27017`|
   | Backend   | —             | `5000`           |
   | Frontend  | —             | `5173`           |

4. **Open the app**
   ```
   http://localhost:5173
   ```

> ℹ️ Docker handles startup order automatically — the backend waits for MongoDB to be healthy, and the frontend waits for the backend.

To stop all services:
```bash
docker compose down
```

---

### 🛠️ Manual Setup

#### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/prabeshp84/hamro-secure-notes.git
   cd hamro-secure-notes
   ```

2. **Install backend dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `Backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

5. **Run the development servers**

   In one terminal (backend):
   ```bash
   cd Backend
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open the app**
   ```
   http://localhost:5173
   ```

---

## 📁 Project Structure

```
hamro-secure-notes/
├── frontend/            # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── Backend/             # Node.js + Express backend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── index.js
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security

- Notes are encrypted using strong encryption before being stored in the database
- Passwords are hashed and never stored in plain text
- Authentication is handled via signed JWT tokens
- Environment variables are used for all sensitive configuration

---

## 🛣️ Roadmap

- [x] User authentication (login/register)
- [x] Create, edit, and delete notes
- [x] Note encryption
- [x] Tags and categories
- [ ] Search functionality
- [ ] Dark mode
- [ ] Mobile responsive UI
- [ ] Export notes as PDF

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Prabesh**  
GitHub: [@prabeshp84](https://github.com/prabeshp84)
