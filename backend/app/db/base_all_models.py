"""
Import all ORM models here so every declarative class is registered before
any mapper is configured — required both for Alembic's autogenerate (via
Base.metadata) and for any other entrypoint that doesn't transitively import
every model on its own. The FastAPI app doesn't need this import (its
router pulls in every endpoint module, and with it every model), but the
Celery worker entrypoint does — see app/workers/celery_app.py. Standalone
scripts like app/db/seed.py should import only the specific models they use
directly.
"""

from app.db.base import Base  # noqa: F401
from app.models.account_support import ContactMessage, PasswordResetToken  # noqa: F401
from app.models.product import Product, ProductVariant  # noqa: F401
from app.models.saved_look import SavedLook  # noqa: F401
from app.models.sizing import FitFeedback, SizeChart  # noqa: F401
from app.models.store import Store  # noqa: F401
from app.models.stylist import OutfitSuggestionRecord  # noqa: F401
from app.models.tryon_job import TryOnJob  # noqa: F401
from app.models.user import BodyProfile, User  # noqa: F401
from app.models.wardrobe import WardrobeItem  # noqa: F401
