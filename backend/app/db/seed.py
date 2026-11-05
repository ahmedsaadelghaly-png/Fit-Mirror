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
    - 9 demo products with photos (incl. one girls' and one boys' item) (each with size variants that carry a
      garment image, so catalog try-on works out of the box)
    - 2 demo wardrobe items for the shopper
    - the storage bucket (if missing) and every seed image, uploaded from
      app/db/seed_assets/ (Unsplash License — see docs/frontend/ASSETS.md)
"""

from pathlib import Path

from app.core.logging_config import configure_logging, get_logger
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.product import Product, ProductAudience, ProductVariant
from app.models.store import Store

# Not otherwise referenced here, but User.tryon_jobs is declared as a string
# relationship ("TryOnJob") — SQLAlchemy needs the class registered before
# it configures the User mapper on first query, which happens the moment
# this script runs standalone (the app's own router imports pull this in
# transitively; this script doesn't go through the router at all).
from app.models.tryon_job import TryOnJob  # noqa: F401
from app.models.user import BodyCategory, BodyProfile, User, UserRole
from app.models.wardrobe import WardrobeItem, WardrobeItemSource
from app.services.size_chart_service import SizeChartService, parse_csv
from app.storage.s3_storage import S3ObjectStorage

configure_logging()
logger = get_logger(__name__)

DEMO_PASSWORD = "DemoPass123!"  # noqa: S105 - seed/demo credential only, never used in production

SEED_ASSETS_DIR = Path(__file__).parent / "seed_assets"
PRODUCT_IMAGE_PREFIX = "seed-data/products"
WARDROBE_IMAGE_PREFIX = "seed-data/wardrobe"

# title, category, price, image, color, SKU prefix, description
WOMENS_PRODUCTS = (
    (
        "Yellow Fleece Tracksuit",
        "tops",
        79.00,
        "yellow-fleece-tracksuit.jpg",
        "Yellow",
        "TRACK-YLW",
        "Cropped hoodie and matching joggers in soft brushed fleece.",
    ),
    (
        "Powder Blue Wool Coat",
        "outerwear",
        169.00,
        "powder-blue-wool-coat.jpg",
        "Powder Blue",
        "COAT-BLU",
        "Long tailored wool coat in a soft powder blue.",
    ),
    (
        "Navy Plaid Overcoat",
        "outerwear",
        159.00,
        "navy-plaid-overcoat.jpg",
        "Navy",
        "OVER-NVY",
        "Relaxed knee-length overcoat in a navy and green plaid.",
    ),
    (
        "Pink Polka Dot Ruffle Dress",
        "dresses",
        119.00,
        "pink-polka-dot-ruffle-dress.jpg",
        "Pink",
        "RUFFLE-PNK",
        "Off-the-shoulder ruffled dress in sheer polka dot tulle.",
    ),
    (
        "Striped Wide-Leg Trousers",
        "bottoms",
        69.00,
        "striped-wide-leg-trousers.jpg",
        "Black",
        "STRIPE-BLK",
        "High-waisted wide-leg trousers with a bold white pinstripe.",
    ),
    (
        "Crochet Fringe Poncho",
        "tops",
        54.00,
        "crochet-fringe-poncho.jpg",
        "Cream",
        "PONCHO-CRM",
        "Open-knit cotton crochet poncho with a fringed hem.",
    ),
)


def _upload_seed_images(storage: S3ObjectStorage) -> None:
    """Uploads every seed_assets/*.jpg under both seed prefixes (skipping
    objects that already exist), so product and wardrobe image keys below
    resolve to real photos."""
    storage.ensure_bucket()
    for path in sorted(SEED_ASSETS_DIR.glob("*.jpg")):
        for prefix in (PRODUCT_IMAGE_PREFIX, WARDROBE_IMAGE_PREFIX):
            key = f"{prefix}/{path.name}"
            if not storage.object_exists(key):
                storage.put_object(key, path.read_bytes(), "image/jpeg")
    logger.info("Seed images uploaded from %s", SEED_ASSETS_DIR)


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

    store = Store(
        owner_user_id=owner.id,
        name=name,
        slug=slug,
        is_verified=True,
        category="womenswear",
        description="Everyday essentials and statement pieces, made to last.",
        website_url="https://demo-fashion.example",
        instagram_handle="@demofashionco",
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    logger.info("Created store: %s", slug)
    return store


def _get_or_create_product(
    db,
    *,
    store: Store,
    title: str,
    category: str,
    price: float,
    image: str,
    variants: list[dict],
    description: str | None = None,
    audience: ProductAudience = ProductAudience.UNISEX,
) -> Product:
    image_key = f"{PRODUCT_IMAGE_PREFIX}/{image}"
    product = db.query(Product).filter(Product.store_id == store.id, Product.title == title).first()
    if product:
        if product.audience != audience:
            product.audience = audience
            db.commit()
        # Backfill photos onto rows seeded before images existed.
        if not product.primary_image_key:
            product.primary_image_key = image_key
            for variant in product.variants:
                variant.garment_image_key = variant.garment_image_key or image_key
            db.commit()
            logger.info("Added photos to existing product: %s", title)
        else:
            logger.info("Product already exists, skipping: %s", title)
        return product

    product = Product(
        store_id=store.id,
        title=title,
        description=description or f"Demo product — {title}",
        category=category,
        audience=audience,
        price=price,
        currency="USD",
        is_active=True,
        primary_image_key=image_key,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    for variant in variants:
        db.add(ProductVariant(product_id=product.id, garment_image_key=image_key, **variant))
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
        _upload_seed_images(S3ObjectStorage())

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
                    body_category=BodyCategory.WOMEN,
                    body_shape="rectangle",
                    name="Me",
                    is_primary=True,
                    preferred_fit="regular",
                    favorite_colors=["black", "beige"],
                    style_preferences=["minimalist", "classic"],
                )
            )
            db.commit()
            logger.info("Created body profile for demo shopper")
        if not any(p.name == "Lina" for p in shopper.body_profiles):
            # A family profile, so girls' items can be sized out of the box.
            db.add(
                BodyProfile(
                    user_id=shopper.id,
                    name="Lina",
                    body_category=BodyCategory.GIRLS,
                    body_shape="regular",
                    height_cm=128,
                    weight_kg=26,
                )
            )
            db.commit()
            logger.info("Created family profile 'Lina' for demo shopper")

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
            image="classic-cotton-tshirt.jpg",
            audience=ProductAudience.MEN,
            description="Heavyweight organic cotton crew neck in a clean, boxy fit.",
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
            image="slim-fit-denim-jeans.jpg",
            description="Indigo stretch denim with a slim, tapered leg.",
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
            image="lightweight-bomber-jacket.jpg",
            audience=ProductAudience.MEN,
            description="Water-resistant satin bomber in rust, with a ribbed collar and cuffs.",
            variants=[
                {"size_label": "S", "color": "Rust", "sku": "BOMBER-RST-S", "stock_quantity": 15},
                {"size_label": "M", "color": "Rust", "sku": "BOMBER-RST-M", "stock_quantity": 20},
                {"size_label": "L", "color": "Rust", "sku": "BOMBER-RST-L", "stock_quantity": 12},
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Essential Black Tee",
            category="tops",
            price=19.99,
            image="essential-black-tee.jpg",
            audience=ProductAudience.MEN,
            description="Everyday black cotton tee with a small chest print.",
            variants=[
                {"size_label": "S", "color": "Black", "sku": "TEE-BLK-S", "stock_quantity": 40},
                {"size_label": "M", "color": "Black", "sku": "TEE-BLK-M", "stock_quantity": 60},
                {"size_label": "L", "color": "Black", "sku": "TEE-BLK-L", "stock_quantity": 45},
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Graphic Print Tee",
            category="tops",
            price=29.99,
            image="graphic-print-tee.jpg",
            audience=ProductAudience.MEN,
            description="Sand-colored oversized tee with a bold blue graphic print.",
            variants=[
                {"size_label": "M", "color": "Sand", "sku": "GRAPHIC-SND-M", "stock_quantity": 25},
                {"size_label": "L", "color": "Sand", "sku": "GRAPHIC-SND-L", "stock_quantity": 25},
                {
                    "size_label": "XL",
                    "color": "Sand",
                    "sku": "GRAPHIC-SND-XL",
                    "stock_quantity": 15,
                },
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Leather Biker Jacket",
            category="outerwear",
            price=189.00,
            image="leather-biker-jacket.jpg",
            audience=ProductAudience.MEN,
            description="Black lambskin biker jacket with an asymmetric zip.",
            variants=[
                {"size_label": "S", "color": "Black", "sku": "BIKER-BLK-S", "stock_quantity": 8},
                {"size_label": "M", "color": "Black", "sku": "BIKER-BLK-M", "stock_quantity": 10},
                {"size_label": "L", "color": "Black", "sku": "BIKER-BLK-L", "stock_quantity": 6},
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Red Evening Gown",
            category="dresses",
            price=149.00,
            image="red-evening-gown.jpg",
            audience=ProductAudience.WOMEN,
            description="Long-sleeve red evening gown with a draped train — for weddings and galas.",
            variants=[
                {"size_label": "XS", "color": "Red", "sku": "GOWN-RED-XS", "stock_quantity": 5},
                {"size_label": "S", "color": "Red", "sku": "GOWN-RED-S", "stock_quantity": 8},
                {"size_label": "M", "color": "Red", "sku": "GOWN-RED-M", "stock_quantity": 6},
            ],
        )

        for title, category, price, image, color, sku, description in WOMENS_PRODUCTS:
            _get_or_create_product(
                db,
                store=store,
                title=title,
                category=category,
                price=price,
                image=image,
                audience=ProductAudience.WOMEN,
                description=description,
                variants=[
                    {
                        "size_label": size,
                        "color": color,
                        "sku": f"{sku}-{size}",
                        "stock_quantity": 10,
                    }
                    for size in ("XS", "S", "M", "L")
                ],
            )

        _get_or_create_product(
            db,
            store=store,
            title="Girls' Polka Dot Smock Top",
            category="tops",
            price=22.00,
            image="girls-polka-dot-smock-top.jpg",
            description="Soft cotton smock top with navy polka dots and puff sleeves.",
            audience=ProductAudience.GIRLS,
            variants=[
                {"size_label": "4Y", "color": "Ivory", "sku": "SMOCK-IVR-4Y", "stock_quantity": 12},
                {"size_label": "6Y", "color": "Ivory", "sku": "SMOCK-IVR-6Y", "stock_quantity": 15},
                {"size_label": "8Y", "color": "Ivory", "sku": "SMOCK-IVR-8Y", "stock_quantity": 10},
                {
                    "size_label": "10Y",
                    "color": "Ivory",
                    "sku": "SMOCK-IVR-10Y",
                    "stock_quantity": 8,
                },
            ],
        )
        _get_or_create_product(
            db,
            store=store,
            title="Boys' Cardigan & Bow Tie Set",
            category="tops",
            price=38.00,
            image="boys-cardigan-bow-tie-set.jpg",
            description="Navy knit cardigan with a matching bow tie — for parties and photos.",
            audience=ProductAudience.BOYS,
            variants=[
                {"size_label": "4Y", "color": "Navy", "sku": "CARDI-NVY-4Y", "stock_quantity": 10},
                {"size_label": "6Y", "color": "Navy", "sku": "CARDI-NVY-6Y", "stock_quantity": 12},
                {"size_label": "8Y", "color": "Navy", "sku": "CARDI-NVY-8Y", "stock_quantity": 9},
                {"size_label": "10Y", "color": "Navy", "sku": "CARDI-NVY-10Y", "stock_quantity": 6},
            ],
        )

        _get_or_create_wardrobe_item(
            db,
            user=shopper,
            category="tops",
            label="Favorite grey hoodie",
            image_key=f"{WARDROBE_IMAGE_PREFIX}/grey-hoodie.jpg",
        )
        _get_or_create_wardrobe_item(
            db,
            user=shopper,
            category="footwear",
            label="White sneakers",
            image_key=f"{WARDROBE_IMAGE_PREFIX}/white-sneakers.jpg",
        )

        # Demo Fashion Co. runs slim: its own tops chart sits one size under
        # the standard chart (Phase 4 per-brand size charts).
        if not SizeChartService(db).get(store.id, "tops"):
            SizeChartService(db).upsert(
                store.id,
                "tops",
                parse_csv(
                    "size,chest,waist\n"
                    "XS,78-84,60-66\nS,84-91,66-73\nM,91-98,73-80\n"
                    "L,98-106,80-88\nXL,106-114,88-96\n"
                ),
            )
            logger.info("Created demo size chart for tops")

        logger.info("Seeding complete.")
        logger.info("Demo accounts (password for all: %s):", DEMO_PASSWORD)
        logger.info("  - platform_admin: %s", admin.email)
        logger.info("  - shopper:        %s", shopper.email)
        logger.info("  - brand_admin:    %s", brand_owner.email)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
