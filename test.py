import os
import json
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import hashlib
import base64


class PKISystem:
    def __init__(self):
        self.users_file = "users.json"
        self.documents_file = "documents.json"
        self.ca_private_key = None
        self.ca_certificate = None
        self.current_user = None
        self.load_or_create_ca()
        
    def load_or_create_ca(self):
        """Initialize Certificate Authority"""
        if os.path.exists("ca_key.pem") and os.path.exists("ca_cert.pem"):
            # Load existing CA
            with open("ca_key.pem", "rb") as f:
                self.ca_private_key = serialization.load_pem_private_key(
                    f.read(), password=None, backend=default_backend()
                )
            with open("ca_cert.pem", "rb") as f:
                self.ca_certificate = x509.load_pem_x509_certificate(
                    f.read(), backend=default_backend()
                )
            print("[✓] Certificate Authority loaded successfully!")
        else:
            # Create new CA
            self.ca_private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"California"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"PKI CA Authority"),
                x509.NameAttribute(NameOID.COMMON_NAME, u"PKI Root CA"),
            ])
            
            self.ca_certificate = x509.CertificateBuilder().subject_name(
                subject
            ).issuer_name(
                issuer
            ).public_key(
                self.ca_private_key.public_key()
            ).serial_number(
                x509.random_serial_number()
            ).not_valid_before(
                datetime.utcnow()
            ).not_valid_after(
                datetime.utcnow() + timedelta(days=3650)
            ).add_extension(
                x509.BasicConstraints(ca=True, path_length=None), critical=True
            ).sign(self.ca_private_key, hashes.SHA256(), default_backend())
            
            # Save CA certificate and key
            with open("ca_key.pem", "wb") as f:
                f.write(self.ca_private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))
            
            with open("ca_cert.pem", "wb") as f:
                f.write(self.ca_certificate.public_bytes(
                    serialization.Encoding.PEM
                ))
            
            print("[✓] Certificate Authority created successfully!")
    
    def generate_key_pair(self):
        """Generate RSA key pair"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        return private_key
    
    def issue_certificate(self, username, email, public_key):
        """Issue a digital certificate signed by CA"""
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"California"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"PKI Users"),
            x509.NameAttribute(NameOID.COMMON_NAME, username),
            x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
        ])
        
        certificate = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            self.ca_certificate.subject
        ).public_key(
            public_key
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)
        ).sign(self.ca_private_key, hashes.SHA256(), default_backend())
        
        return certificate
    
    def register_user(self, username, email, password):
        """Register a new user"""
        print("\n" + "="*60)
        print("USER REGISTRATION")
        print("="*60)
        
        if not username or not email or not password:
            print("[✗] All fields are required!")
            return False
        
        # Check if user exists
        users = self.load_users()
        if username in users:
            print("[✗] Username already exists!")
            return False
        
        # Generate key pair
        print("\n[...] Generating RSA key pair (2048 bits)...")
        private_key = self.generate_key_pair()
        public_key = private_key.public_key()
        
        # Issue certificate
        print("[...] Issuing digital certificate from CA...")
        certificate = self.issue_certificate(username, email, public_key)
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Serialize keys and certificate
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode()
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()
        
        cert_pem = certificate.public_bytes(serialization.Encoding.PEM).decode()
        
        # Save user data
        users[username] = {
            "email": email,
            "password_hash": password_hash,
            "private_key": private_pem,
            "public_key": public_pem,
            "certificate": cert_pem,
            "cert_serial": certificate.serial_number,
            "registered": datetime.now().isoformat()
        }
        
        self.save_users(users)
        
        # Save certificate to file
        cert_filename = f"{username}_certificate.pem"
        with open(cert_filename, "w") as f:
            f.write(cert_pem)
        
        print(f"\n[✓] Registration successful!")
        print(f"[✓] Certificate issued: Serial Number {certificate.serial_number}")
        print(f"[✓] Certificate saved to: {cert_filename}")
        print(f"[✓] Valid until: {certificate.not_valid_after}")
        return True
    
    def login_user(self, username, password):
        """Authenticate user with certificate verification"""
        print("\n" + "="*60)
        print("USER LOGIN")
        print("="*60)
        
        users = self.load_users()
        
        if username not in users:
            print("[✗] User not found!")
            return False
        
        user = users[username]
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if user["password_hash"] != password_hash:
            print("[✗] Invalid password!")
            return False
        
        # Verify certificate
        print("\n[...] Verifying digital certificate...")
        cert_bytes = user["certificate"].encode()
        certificate = x509.load_pem_x509_certificate(cert_bytes, default_backend())
        
        # Check certificate validity
        now = datetime.utcnow()
        if now < certificate.not_valid_before or now > certificate.not_valid_after:
            print("[✗] Certificate expired or not yet valid!")
            return False
        
        # Verify certificate signature with CA
        try:
            self.ca_certificate.public_key().verify(
                certificate.signature,
                certificate.tbs_certificate_bytes,
                padding.PKCS1v15(),
                certificate.signature_hash_algorithm
            )
            print("[✓] Certificate verified by CA!")
        except Exception as e:
            print(f"[✗] Certificate verification failed: {e}")
            return False
        
        self.current_user = username
        print(f"[✓] Login successful! Welcome {username}")
        print(f"[✓] Certificate Serial: {certificate.serial_number}")
        
        return True
    
    def sign_document(self, doc_title, doc_content):
        """Sign a document with user's private key"""
        print("\n" + "="*60)
        print("DOCUMENT SIGNING")
        print("="*60)
        
        if not self.current_user:
            print("[✗] Please login first!")
            return False
        
        users = self.load_users()
        user = users[self.current_user]
        
        if not doc_title or not doc_content:
            print("[✗] Document title and content are required!")
            return False
        
        # Load private key
        private_key = serialization.load_pem_private_key(
            user["private_key"].encode(),
            password=None,
            backend=default_backend()
        )
        
        # Create document hash
        print("\n[...] Computing document hash (SHA-256)...")
        doc_hash = hashlib.sha256(doc_content.encode()).digest()
        
        # Sign the hash
        print("[...] Signing document with private key...")
        signature = private_key.sign(
            doc_hash,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        # Encrypt document content
        print("[...] Encrypting document content...")
        public_key = serialization.load_pem_public_key(
            user["public_key"].encode(),
            backend=default_backend()
        )
        
        # For large content, use hybrid encryption (AES + RSA)
        aes_key = os.urandom(32)
        iv = os.urandom(16)
        cipher = Cipher(algorithms.AES(aes_key), modes.CFB(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        encrypted_content = encryptor.update(doc_content.encode()) + encryptor.finalize()
        
        # Encrypt AES key with RSA
        encrypted_aes_key = public_key.encrypt(
            aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Save document
        documents = self.load_documents()
        doc_id = f"DOC_{len(documents) + 1}_{int(datetime.now().timestamp())}"
        
        documents[doc_id] = {
            "title": doc_title,
            "content": doc_content,
            "encrypted_content": base64.b64encode(encrypted_content).decode(),
            "encrypted_aes_key": base64.b64encode(encrypted_aes_key).decode(),
            "iv": base64.b64encode(iv).decode(),
            "signature": base64.b64encode(signature).decode(),
            "hash": doc_hash.hex(),
            "signed_by": self.current_user,
            "cert_serial": user["cert_serial"],
            "timestamp": datetime.now().isoformat()
        }
        
        self.save_documents(documents)
        
        print(f"\n[✓] Document signed successfully!")
        print(f"[✓] Document ID: {doc_id}")
        print(f"[✓] Signature: {base64.b64encode(signature).decode()[:50]}...")
        print(f"[✓] Document hash: {doc_hash.hex()}")
        return doc_id
    
    def verify_document(self, doc_id):
        """Verify document signature"""
        print("\n" + "="*60)
        print("DOCUMENT VERIFICATION")
        print("="*60)
        
        documents = self.load_documents()
        
        if doc_id not in documents:
            print("[✗] Document not found!")
            return False
        
        doc = documents[doc_id]
        users = self.load_users()
        
        if doc["signed_by"] not in users:
            print("[✗] Signer not found!")
            return False
        
        signer = users[doc["signed_by"]]
        
        # Load public key
        public_key = serialization.load_pem_public_key(
            signer["public_key"].encode(),
            backend=default_backend()
        )
        
        # Verify signature
        print("\n[...] Verifying signature...")
        doc_hash = hashlib.sha256(doc["content"].encode()).digest()
        signature = base64.b64decode(doc["signature"])
        
        try:
            public_key.verify(
                signature,
                doc_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            print("[✓] Signature is VALID!")
        except Exception as e:
            print(f"[✗] Signature is INVALID! {e}")
            return False
        
        # Verify hash
        print("[...] Verifying document integrity...")
        if doc_hash.hex() == doc["hash"]:
            print("[✓] Document integrity verified - No tampering detected!")
        else:
            print("[✗] Document has been tampered with!")
            return False
        
        print(f"\n[✓] Document Details:")
        print(f"    Title: {doc['title']}")
        print(f"    Signed by: {doc['signed_by']}")
        print(f"    Timestamp: {doc['timestamp']}")
        print(f"    Certificate Serial: {doc['cert_serial']}")
        return True
    
    def list_users(self):
        """List all registered users"""
        print("\n" + "="*60)
        print("REGISTERED USERS")
        print("="*60)
        
        users = self.load_users()
        
        if not users:
            print("No users registered yet.")
            return
        
        for username, user in users.items():
            cert_bytes = user["certificate"].encode()
            certificate = x509.load_pem_x509_certificate(cert_bytes, default_backend())
            
            print(f"\n👤 Username: {username}")
            print(f"   Email: {user['email']}")
            print(f"   Certificate Serial: {user['cert_serial']}")
            print(f"   Valid Until: {certificate.not_valid_after}")
            print(f"   Registered: {user['registered']}")
    
    def list_documents(self):
        """List all signed documents"""
        print("\n" + "="*60)
        print("SIGNED DOCUMENTS")
        print("="*60)
        
        documents = self.load_documents()
        
        if not documents:
            print("No documents signed yet.")
            return []
        
        doc_list = []
        for doc_id, doc in documents.items():
            print(f"\n📄 Document ID: {doc_id}")
            print(f"   Title: {doc['title']}")
            print(f"   Signed by: {doc['signed_by']}")
            print(f"   Timestamp: {doc['timestamp']}")
            print(f"   Hash: {doc['hash'][:40]}...")
            doc_list.append(doc_id)
        
        return doc_list
    
    def logout(self):
        """Logout current user"""
        if self.current_user:
            print(f"[✓] {self.current_user} logged out successfully!")
            self.current_user = None
        else:
            print("[!] No user is currently logged in.")
    
    def get_current_user(self):
        """Get currently logged in user"""
        return self.current_user
    
    def load_users(self):
        """Load users from JSON file"""
        if os.path.exists(self.users_file):
            with open(self.users_file, "r") as f:
                return json.load(f)
        return {}
    
    def save_users(self, users):
        """Save users to JSON file"""
        with open(self.users_file, "w") as f:
            json.dump(users, f, indent=2)
    
    def load_documents(self):
        """Load documents from JSON file"""
        if os.path.exists(self.documents_file):
            with open(self.documents_file, "r") as f:
                return json.load(f)
        return {}
    
    def save_documents(self, documents):
        """Save documents to JSON file"""
        with open(self.documents_file, "w") as f:
            json.dump(documents, f, indent=2)

if __name__ == "__main__":
    pki = PKISystem()
    
    # 1. Register a user
    pki.register_user("civic_leader", "leader@example.org", "SecurePass123")
    
    # 2. Login
    if pki.login_user("civic_leader", "SecurePass123"):
        
        # 3. Sign a document (e.g., a policy proposal)
        doc_id = pki.sign_document(
            "Transparency Report 2026", 
            "This document outlines the findings of the youth leadership initiative."
        )
        
        # 4. Verify the document
        pki.verify_document(doc_id)
        
        # 5. List everything
        pki.list_users()
        pki.list_documents()
        
        pki.logout()