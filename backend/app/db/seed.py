"""
Seed script: populates the database with demo data for local development
and manual QA. Safe to re-run — it upserts by unique key (email/slug/sku)
instead of blindly inserting duplicates.

Usage:
    python -m app.db.seed                  # via venv
    docker compose exec backend python -m app.db.seed   # via Docker

Creates:
    - 1 platform admin
    - 1 demo shopper (with a body profile)
    - 1 demo brand/store owner + their store
    - 3 demo products (each with 2 size variants)
    - 2 demo wardrobe items for the shopper
"""

from app.core.logging_config import configure_logging, get_logger
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.product import Product, ProductVariant
from app.models.store import Store

# Not otherwise referenced here, but User.tryon_jobs is declared as a string
# relationship ("TryOnJob") — SQLAlchemy needs the class registered before
# it configures the User mapper on first query, which happens the moment
# this script runs standalone (the app's own router imports pull this in
# transitively; this script doesn't go through the router at all).
from app.models.tryon_job import TryOnJob  # noqa: F401
from app.models.user import BodyProfile, User, UserRole
from app.models.wardrobe import WardrobeItem, WardrobeItemSource

configure_logging()
logger = get_logger(__name__)

DEMO_PASSWORD = "DemoPass123!"  # noqa: S105 - seed/demo credential only, never used in production


def _get_or_create_user(db, *, email: str, role: UserRole, full_name: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        logger.info("User already exists, skipping: %s", email)
        return user

    user = User(
        email=email,
        hashed_password=hash_password(DEMO_PASSWORD),
        full_name=full_name,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Created user: %s (%s)", email, role.value)
    return user


def _get_or_create_store(db, *, owner: User, name: str, slug: str) -> Store:
    store = db.query(Store).filter(Store.slug == slug).first()
    if store:
        logger.info("Store already exists, skipping: %s", slug)
        return store

    store = Store(owner_user_id=owner.id, name=name, slug=slug, is_verified=True)
    db.add(store)
    db.commit()
    db.refresh(store)
    logger.info("Created store: %s", slug)
    return store


def _get_or_create_product(
    db, *, store: Store, title: str, category: str, price: float, variants: list[dict]
) -> Product:
    product = db.query(Product).filter(Product.store_id == store.id, Product.title == title).first()
    if product:
        logger.info("Product already exists, skipping: %s", title)
        return product

    product = Product(
        store_id=store.id,
        title=title,
        description=f"Demo product — {title}",
        category=category,
        price=price,
        currency="USD",
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    for variant in variants:
        db.add(ProductVariant(product_id=product.id, **variant))
    db.commit()

    logger.info("Created product: %s (%d variants)", title, len(variants))
    return product


def _get_or_create_wardrobe_item(
    db, *, user: User, category: str, label: str, image_key: str
) -> None:
    existing = (
        db.query(WardrobeItem)
        .filter(WardrobeItem.user_id == user.id, WardrobeItem.label == label)
        .first()
    )
    if existing:
        logger.info("Wardrobe item already exists, skipping: %s", label)
        return

    db.add(
        WardrobeItem(
            user_id=user.id,
            source=WardrobeItemSource.UPLOADED,
            category=category,
            label=label,
            image_key=image_key,
        )
    )
    db.commit()
    logger.info("Created wardrobe item: %s", label)


def seed() -> None:
    db = SessionLocal()
    try:
        logger.info("Seeding FitMirror AI demo data...")

        admin = _get_or_create_user(
            db, email="admin@fitmirror.ai", role=UserRole.PLATFORM_ADMIN, full_name="Platform Admin"
        )

        shopper = _get_or_create_user(
            db, email="shopper@fitmirror.ai", role=UserRole.SHOPPER, full_name="Demo Shopper"
        )
        if not shopper.body_profile:
            db.add(
                BodyProfile(
                    user_id=shopper.id,
                    height_cm=170,
                    weight_kg=65,
                    chest_cm=92,
                    waist_cm=76,
                    hip_cm=98,
                    body_shape="rectangle",
                )
            )
            db.commit()
            logger.info("Created body profile for demo shopper")

        brand_owner = _get_or_create_user(
            db, email="brand@fitmirror.ai", role=UserRole.BRAND_ADMIN, full_name="Demo Brand Owner"
        )
        store = _get_or_create_store(
            db, owner=brand_owner, name="Demo Fashion Co.", slug="demo-fashion-co"
        )

        _get_or_create_product(
            db,
            store=store,
            title="Classic Cotton T-Shirt",
            category="tops",
            price=24.99,
            variants=[
                {"size_label": "M", "color": "White", "sku": "TSHIRT-WHT-M", "stock_quantity": 50},
                {"size_label": "L", "color": "White", "sku": "TSHIRT-WHT-L", "stock_quantity": 40},
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Slim Fit Denim Jeans",
            category="bottoms",
            price=59.99,
            variants=[
                {
                    "size_label": "32",
                    "color": "Indigo",
                    "sku": "JEANS-IND-32",
                    "stock_quantity": 30,
                },
                {
                    "size_label": "34",
                    "color": "Indigo",
                    "sku": "JEANS-IND-34",
                    "stock_quantity": 25,
                },
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Lightweight Bomber Jacket",
            category="outerwear",
            price=89.99,
            variants=[
                {"size_label": "S", "color": "Black", "sku": "BOMBER-BLK-S", "stock_quantity": 15},
                {"size_label": "M", "color": "Black", "sku": "BOMBER-BLK-M", "stock_quantity": 20},
            ],
        )

        _get_or_create_wardrobe_item(
            db,
            user=shopper,
            category="tops",
            label="Favorite blue hoodie",
            image_key="seed-data/wardrobe/blue-hoodie.jpg",
        )
        _get_or_create_wardrobe_item(
            db,
            user=shopper,
            category="footwear",
            label="White sneakers",
            image_key="seed-data/wardrobe/white-sneakers.jpg",
        )

        logger.info("Seeding complete.")
        logger.info("Demo accounts (password for all: %s):", DEMO_PASSWORD)
        logger.info("  - platform_admin: %s", admin.email)
        logger.info("  - shopper:        %s", shopper.email)
        logger.info("  - brand_admin:    %s", brand_owner.email)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
