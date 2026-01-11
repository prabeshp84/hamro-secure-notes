# 🛡️ HAMRO SECURE NOTES

> **Zero-Knowledge, End-to-End Encrypted (E2EE) Digital Vault** > *System Architect: Prabesh Paudel*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![CI Status](https://img.shields.io/github/actions/workflow/status/prabeshp84/hamro-secure-notes/ci.yml?branch=main)
![Security](https://img.shields.io/badge/security-RSA--2048%20%2B%20AES--256-green)
![Tech](https://img.shields.io/badge/stack-MERN%20%2B%20Docker-blueviolet)

---

## 📖 Overview
**Hamro Secure Notes** is a Zero-Knowledge, End-to-End Encrypted (E2EE) digital vault application. It demonstrates the implementation of a secure PKI (Public Key Infrastructure) system using modern Web Cryptography APIs.

Unlike traditional apps where the server holds the keys, this application performs all cryptographic operations (Key Generation, Encryption, Signing) in the **Client Browser**. The Private Key is encrypted (wrapped) with the user's password before ever leaving the device, ensuring that even the database administrator cannot access the user's identity or data.

## 🚀 Key Features
* **🔐 Client-Side Key Wrapping:** Simulates an HSM (Hardware Security Module) by encrypting the RSA Private Key with the user's password before storage.
* **✍️ Digital Signatures:** Uses **RSA-PSS** to sign every note. Any tampering with the database results in a "Signature Invalid" warning.
* **🛡️ Hybrid Encryption:** Combines **AES-GCM** (speed) for content with **RSA** (identity) for security.
* **☁️ Cloud-Native Database:** Fully integrated with **MongoDB Atlas** for secure, distributed storage.
* **⚡ DevOps Ready:** Fully containerized with **Docker** and automated testing via **GitHub Actions**.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Handles UI and Web Crypto API logic. |
| **Backend** | Node.js + Express | REST API handling storage and authentication. |
| **Database** | MongoDB Atlas (Cloud) | Secure cloud cluster storing encrypted ciphertext and wrapped keys. |
| **DevOps** | Docker & GitHub Actions | Containerization and CI/CD pipelines. |
| **Crypto** | Web Crypto API | Native browser implementation of RSA-OAEP, AES-GCM, PBKDF2. |

---

## 🐳 Installation (The DevOps Way)
The easiest way to run the application is using **Docker**. This spins up the Frontend and Backend services automatically.

### Prerequisites
* Docker Desktop installed on your machine.
* A **MongoDB Atlas** Connection String.

### Steps
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/prabeshp84/hamro-secure-notes
    cd hamro-secure-notes
    ```

2.  **Configure Environment**
    Open `docker-compose.yml` and replace the `MONGO_URI` with your Cloud Database string:
    ```yaml
    environment:
      - MONGO_URI=mongodb+srv://<your_username>:<your_password>@cluster.mongodb.net/hamro_vault
    ```

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```

4.  **Access the App**
    * **Frontend:** Open `http://localhost:5173` in your browser.
    * **Backend API:** Running at `http://localhost:5000`.

---

## 💻 Installation (Manual Method)
If you prefer running it without Docker:

## 🔄 CI/CD Pipeline
This project is set up for continuous integration.
* **Build:** Automated builds run on every push to `main`.
* **Security Audit:** `npm audit` runs automatically to check for vulnerable dependencies.
