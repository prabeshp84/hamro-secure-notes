# 🔒 Hamro Secured Notes v2.0

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Docker](https://img.shields.io/badge/docker-containerized-blue)
![Security](https://img.shields.io/badge/security-E2EE%20%7C%20RSA--PSS-red)
![License](https://img.shields.io/badge/license-MIT-green)

**Hamro Secured Notes** is a secure, end-to-end encrypted (E2EE) note-taking application designed to demonstrate military-grade cryptographic principles. It features client-side encryption, digital signatures for integrity, and a fully containerized microservices architecture.

---

## 📋 Requirements Fulfillment Matrix
This project was built to strictly satisfy the following assignment requirements:

| Requirement Category | Implementation Details |
| :--- | :--- |
| **Core Cryptography** | • **Key Management:** Client-side generation of RSA-4096 key pairs.<br>• **Encryption:** AES-GCM (256-bit) for notes; RSA-OAEP for key exchange.<br>• **Digital Signatures:** RSA-PSS used to sign every note for non-repudiation. |
| **Security Best Practices** | • **Secure Key Storage:** Private keys are encrypted (AES-256 via PBKDF2) before storage.<br>• **Attack Mitigation:** Unique IVs prevent replay attacks; Signatures prevent tampering/MITM. |
| **Architecture** | • **Dockerized:** Isolated containers for Frontend, Backend, and MongoDB.<br>• **CI/CD:** GitHub Actions workflow included for automated testing. |
| **Testing** | • **Attack Simulation:** UI actively detects and rejects tampered data from the database. |

---

## 🏗️ Architecture

The system uses a **Microservices Architecture** orchestrated via Docker Compose:

graph TD
    Client[React Frontend] <-->|Encrypted JSON| API[Node.js Backend]
    API <-->|Persistent Volume| DB[(MongoDB)]
    
    subgraph "Docker Network"
        API
        DB
    end

🔐 Security Mechanisms
1. Hybrid Encryption (Confidentiality)
We use a hybrid approach for speed and security:

Data: Encrypted using AES-GCM (Galois/Counter Mode).

Keys: The AES key is generated randomly for each note, then encrypted using the user's RSA Public Key.

2. Digital Signatures (Integrity & Non-Repudiation)
Every note is signed using the user's RSA Private Key (scheme: RSA-PSS).

Verification: When a note is loaded, the frontend verifies the signature against the public key.

Result: If a database admin or hacker modifies the encrypted blob, the signature verification fails, and the app alerts the user.

3. Identity Management
On registration, crypto.subtle generates an RSA Keypair.

The Private Key is encrypted using a key derived from the user's password (PBKDF2 + Salt).

The server only stores the encrypted private key.

🚀 Installation & Setup
Prerequisites
Docker Desktop installed and running.

Git.

Steps
Clone the Repository

Bash

git clone [https://github.com/YOUR_USERNAME/Hamro-Secured-Notes-v2.0.git](https://github.com/YOUR_USERNAME/Hamro-Secured-Notes-v2.0.git)
cd Hamro-Secured-Notes-v2.0
Start the Application Run the following command to build and start all containers:

Bash

docker-compose up --build
Access the App

Frontend: Open http://localhost:5173 in your browser.

Backend API: Running at http://localhost:5000.

Database: Accessible via MongoDB Compass at mongodb://localhost:27018/.

📖 Usage Guide
1. User Registration
Click "Create Account".

Enter an email and password.

Behind the scenes: The app generates keys, encrypts your private key, and sends the public identity to the server.

2. Creating a Secure Note
Login to the dashboard.

Type a title and sensitive content.

Click "Add Note".

The note is encrypted locally and sent to the database.

3. Verifying Security (The "Proof")
You can verify that the server cannot read your data:

Open MongoDB Compass.

Connect to mongodb://localhost:27018/.

Navigate to hamro_vault -> notes.

Observe that the ciphertext field is random gibberish (Base64), not your original text.

⚔️ Attack Simulation (Testing)
To demonstrate the Integrity Check feature:

Create a Note: Create a note saying "Secret Data".

Simulate Attack:

Open MongoDB Compass.

Find the note document.

Manually edit the ciphertext string (change just one character).

Click "Update".

Verify Defense:

Go back to the App and refresh.

Try to view/decrypt that note.

Result: The app will display a "Signature Verification Failed" or "Decryption Error" warning, proving tampering was detected.

🤝 Contributing
Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📄 License
Distributed under the MIT License. See LICENSE for more information.