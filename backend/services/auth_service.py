"""
Auth service — verifies login credentials.

MetroVigil is an SIH hackathon demo, so instead of a full user-management
system this ships with three fixed demo accounts (one per role) with
bcrypt-hashed passwords. These are the exact credentials shown in the
frontend's "SIH Demo Credentials" box, so the login screen keeps working
out of the box — the difference is the password is now actually checked
server-side instead of being accepted unconditionally.

Uses the `bcrypt` library directly rather than passlib's CryptContext:
newer bcrypt releases (4.1+) dropped an internal attribute that older
passlib versions probe for, which breaks passlib's backend detection.
Calling bcrypt directly sidesteps that fragile compatibility shim.
"""

import bcrypt

# username -> {role, password_hash}
# Passwords: admin123 / officer123 / retailer123 (matches LoginPage.tsx demo box)
DEMO_USERS = {
    "admin": {
        "role": "admin",
        "password_hash": bcrypt.hashpw(b"admin123", bcrypt.gensalt()),
    },
    "officer": {
        "role": "officer",
        "password_hash": bcrypt.hashpw(b"officer123", bcrypt.gensalt()),
    },
    "retailer": {
        "role": "retailer",
        "password_hash": bcrypt.hashpw(b"retailer123", bcrypt.gensalt()),
    },
}

# A valid bcrypt hash used to run a dummy verification when the username
# doesn't exist, so login timing doesn't reveal whether an account exists.
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt())


def authenticate(username: str, password: str) -> str | None:
    """Return the user's role if username/password are valid, else None.

    Note: the role is looked up from DEMO_USERS, not taken from client
    input — a client cannot claim a different role than the one tied to
    its verified credentials.
    """
    user = DEMO_USERS.get((username or "").strip().lower())
    password_bytes = (password or "").encode("utf-8")[:72]  # bcrypt's own limit

    if not user:
        bcrypt.checkpw(password_bytes, _DUMMY_HASH)
        return None

    if not bcrypt.checkpw(password_bytes, user["password_hash"]):
        return None

    return user["role"]
