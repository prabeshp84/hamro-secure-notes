# Hamro Secure Notes 🛡️

**Hamro Secure Notes** is a Zero-Knowledge, End-to-End Encrypted (E2EE) digital vault application. It demonstrates the implementation of a secure PKI (Public Key Infrastructure) system using modern Web Cryptography APIs.

## 🚀 Key Features
* **Client-Side Key Wrapping:** Private keys are encrypted with the user's password before storage (Simulated Hardware Security Module).
* **Hybrid Encryption:** AES-GCM for content confidentiality + RSA-PSS for digital signatures.
* **Digital Identity:** Full issuance and validation of X.509-style public key certificates.
* **Tamper-Proof:** Digital signatures ensure data integrity; any database modification triggers a validation failure.

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite, Web Crypto API
* **Backend:** Node.js, Express, MongoDB
* **Security:** RSA-OAEP, AES-GCM, PBKDF2, SHA-256

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/yourusername/hamro-secure-notes.git](https://github.com/yourusername/hamro-secure-notes.git)
    cd hamro-secure-notes
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    # Create a .env file with: MONGO_URI=your_db_url, JWT_SECRET=your_secret, PORT=5000
    npm start
    ```

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 🤝 How to Contribute
We welcome contributions from the open-source community!

1.  **Fork the Project:** Create your own branch (`git checkout -b feature/AmazingFeature`).
2.  **Commit Changes:** Ensure you add clear comments to your cryptographic logic.
3.  **Testing:** Run unit tests before pushing.
    * *Requirement:* Ensure all crypto functions in `utils/crypto.js` have valid test cases.
4.  **Pull Request:** Open a PR and describe your security improvements.

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

## 🔄 CI/CD Pipeline
This project is set up for continuous integration.
* **Build:** Automated builds run on every push to `main`.
* **Security Audit:** `npm audit` runs automatically to check for vulnerable dependencies.