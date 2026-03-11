import asyncio
import uuid
from backend.core.database import AsyncSessionLocal, engine
from backend.core.security import hash_password
from backend.models.user import User, UserRole

USERS_DATA = [
    # ── Admins ──────────────────────────────────────────────────────────────
    {
        "username": "admin",
        "email": "admin@techlib.io",
        "password": "Admin@1234",
        "role": UserRole.admin,
    },
    {
        "username": "superadmin",
        "email": "superadmin@techlib.io",
        "password": "SuperAdmin@5678",
        "role": UserRole.admin,
    },

    # ── Librarians ───────────────────────────────────────────────────────────
    {
        "username": "librarian_alice",
        "email": "alice@techlib.io",
        "password": "Librarian@001",
        "role": UserRole.librarian,
    },
    {
        "username": "librarian_bob",
        "email": "bob@techlib.io",
        "password": "Librarian@002",
        "role": UserRole.librarian,
    },
    {
        "username": "librarian_carla",
        "email": "carla@techlib.io",
        "password": "Librarian@003",
        "role": UserRole.librarian,
    },

    # ── Readers ──────────────────────────────────────────────────────────────
    {
        "username": "reader_david",
        "email": "david@techlib.io",
        "password": "Reader@001",
        "role": UserRole.reader,
    },
    {
        "username": "reader_emma",
        "email": "emma@techlib.io",
        "password": "Reader@002",
        "role": UserRole.reader,
    },
    {
        "username": "reader_frank",
        "email": "frank@techlib.io",
        "password": "Reader@003",
        "role": UserRole.reader,
    },
    {
        "username": "reader_grace",
        "email": "grace@techlib.io",
        "password": "Reader@004",
        "role": UserRole.reader,
    },
    {
        "username": "reader_henry",
        "email": "henry@techlib.io",
        "password": "Reader@005",
        "role": UserRole.reader,
    },
]


async def seed_users():
    print("Seeding Users...")
    async with AsyncSessionLocal() as session:
        # Check if the seed has already run by looking for the admin user specifically
        result = await session.execute(
            User.__table__.select().where(User.__table__.c.username == "admin").limit(1)
        )
        if result.first():
            print("Users already seeded. Skipping.")
            return

        new_users = []
        for u in USERS_DATA:
            user = User(
                id=str(uuid.uuid4()),
                username=u["username"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
            )
            new_users.append(user)
            session.add(user)

        await session.commit()
        print(f"Successfully inserted {len(new_users)} users:")
        for u in USERS_DATA:
            print(f"  [{u['role'].value:10}]  {u['username']:25}  password: {u['password']}")


async def main():
    try:
        await seed_users()
    except Exception as e:
        print(f"Error during user seeding: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
