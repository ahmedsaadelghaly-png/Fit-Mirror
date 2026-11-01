"""
Fixtures for API-level unit tests that need a database but not a live
Postgres: an in-memory SQLite engine shared across one test's requests
(StaticPool), wired into the app via a get_db dependency override.

SQLite is close enough for routing/RBAC/query-shape tests; anything
Postgres-specific (enum types, migrations) stays in tests/integration.
"""

import uuid
from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import TokenType, create_token
from app.db.base_all_models import Base
from app.main import app
from app.models.product import Product, ProductAudience, ProductVariant
from app.models.store import Store
from app.models.user import BodyProfile, User, UserRole


@pytest.fixture
def sqlite_sessionmaker():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autoflush=False)
    yield factory
    engine.dispose()


@pytest.fixture
def db(sqlite_sessionmaker) -> Session:
    session = sqlite_sessionmaker()
    yield session
    session.close()


@pytest.fixture
def api(sqlite_sessionmaker) -> TestClient:
    def _override_get_db():
        session = sqlite_sessionmaker()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def make_user(db) -> Callable[..., User]:
    def _make(role: UserRole = UserRole.SHOPPER, email: str | None = None, **fields) -> User:
        user = User(
            email=email or f"{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=fields.pop("hashed_password", "not-used"),
            role=role,
            is_active=fields.pop("is_active", True),
            **fields,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _make


@pytest.fixture
def auth_headers() -> Callable[[User], dict[str, str]]:
    def _headers(user: User) -> dict[str, str]:
        token = create_token(str(user.id), TokenType.ACCESS, {"role": user.role.value})
        return {"Authorization": f"Bearer {token}"}

    return _headers


@pytest.fixture
def make_store(db) -> Callable[..., Store]:
    def _make(owner: User, slug: str | None = None) -> Store:
        store = Store(owner_user_id=owner.id, name="Test Store", slug=slug or uuid.uuid4().hex[:8])
        db.add(store)
        db.commit()
        db.refresh(store)
        return store

    return _make


@pytest.fixture
def make_product(db) -> Callable[..., Product]:
    def _make(
        store: Store,
        *,
        title: str = "Classic Tee",
        category: str = "tops",
        price: float = 25,
        sizes: tuple[str, ...] = ("S", "M", "L"),
        color: str | None = "White",
        is_active: bool = True,
        description: str | None = None,
        audience: ProductAudience = ProductAudience.UNISEX,
    ) -> Product:
        product = Product(
            store_id=store.id,
            title=title,
            category=category,
            price=price,
            currency="USD",
            is_active=is_active,
            description=description,
            audience=audience,
        )
        db.add(product)
        db.flush()
        for size in sizes:
            db.add(
                ProductVariant(
                    product_id=product.id,
                    size_label=size,
                    color=color,
                    sku=f"{uuid.uuid4().hex[:10]}-{size}",
                    stock_quantity=5,
                )
            )
        db.commit()
        db.refresh(product)
        return product

    return _make


@pytest.fixture
def set_body_profile(db) -> Callable[..., BodyProfile]:
    def _set(user: User, **measurements) -> BodyProfile:
        measurements.setdefault("is_primary", True)
        profile = BodyProfile(user_id=user.id, **measurements)
        db.add(profile)
        db.commit()
        return profile

    return _set
