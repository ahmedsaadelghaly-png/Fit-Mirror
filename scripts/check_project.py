#!/usr/bin/env python3
"""
Validates that the repository has the folder/file structure expected by
FitMirror AI's Phase 1 / Phase 1.5 setup. Intended as a quick sanity check
after cloning, pulling, or refactoring — NOT a substitute for the real test
suite (`make test`) or lint/type checks (`make lint`, `make typecheck`).

Usage:
    python scripts/check_project.py
    python scripts/check_project.py --verbose

Exit code 0 if everything required is present, 1 otherwise.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# Paths are relative to REPO_ROOT. Directories are checked for existence
# only; files are checked for existence and non-zero size.
REQUIRED_DIRS: list[str] = [
    "backend/app/core",
    "backend/app/db",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/api/v1/endpoints",
    "backend/app/services",
    "backend/app/repositories",
    "backend/app/storage",
    "backend/app/workers/tasks",
    "backend/alembic/versions",
    "backend/tests/unit",
    "backend/tests/integration",
    "ai-service/app/core",
    "ai-service/app/api/v1/endpoints",
    "ai-service/app/schemas",
    "ai-service/app/pipelines",
    "ai-service/app/models",
    "ai-service/app/storage",
    "ai-service/tests/unit",
    "ai-service/tests/integration",
    ".github/workflows",
    ".vscode",
    "docs",
    "frontend/app",
    "frontend/features",
    "frontend/shared/components",
    "frontend/components/ui",
    "frontend/hooks",
    "frontend/lib",
    "frontend/api",
    "frontend/types",
    "frontend/config",
    "frontend/providers",
    "frontend/layouts",
    "frontend/middleware",
    "frontend/tests/unit",
    "frontend/tests/e2e",
    "docs/frontend",
    "frontend/config/tokens",
    "frontend/features/auth/hooks",
    "frontend/features/auth/components",
    "frontend/features/contact/hooks",
    "frontend/features/contact/components",
    "frontend/lib/stores",
    "frontend/.storybook",
]

REQUIRED_FILES: list[str] = [
    # --- Backend core ---
    "backend/app/main.py",
    "backend/app/core/config.py",
    "backend/app/core/security.py",
    "backend/app/core/logging_config.py",
    "backend/app/core/middleware.py",
    "backend/app/core/exceptions.py",
    "backend/app/core/dependencies.py",
    "backend/app/db/base.py",
    "backend/app/db/session.py",
    "backend/app/db/base_all_models.py",
    "backend/app/db/seed.py",
    "backend/app/workers/celery_app.py",
    "backend/app/workers/tasks/tryon_tasks.py",
    "backend/app/storage/base.py",
    "backend/app/storage/s3_storage.py",
    "backend/alembic.ini",
    "backend/alembic/env.py",
    "backend/requirements.txt",
    "backend/Dockerfile",
    "backend/pyproject.toml",
    "backend/tests/conftest.py",
    # --- AI service core ---
    "ai-service/app/main.py",
    "ai-service/app/core/config.py",
    "ai-service/app/pipelines/base_pipeline.py",
    "ai-service/app/pipelines/placeholder_tryon_pipeline.py",
    "ai-service/app/models/model_registry.py",
    "ai-service/app/storage/s3_client.py",
    "ai-service/requirements.txt",
    "ai-service/Dockerfile",
    "ai-service/pyproject.toml",
    "ai-service/tests/conftest.py",
    # --- Root: tooling & orchestration ---
    "pyproject.toml",
    "requirements-dev.txt",
    ".pre-commit-config.yaml",
    "Makefile",
    "docker-compose.yml",
    "docker-compose.dev.yml",
    "docker-compose.prod.yml",
    ".github/workflows/ci.yml",
    # --- Root: environment templates ---
    ".env.example",
    ".env.dev.example",
    ".env.test.example",
    ".env.production.example",
    # --- Root: documentation ---
    "README.md",
    "ARCHITECTURE.md",
    "ROADMAP.md",
    "CONTRIBUTING.md",
    "DEVELOPMENT.md",
    "TESTING.md",
    "DEPLOYMENT.md",
    "API_CONTRACTS.md",
    # --- Root: editor setup ---
    ".vscode/settings.json",
    ".vscode/extensions.json",
    # --- docs/: Phase 1.75 system design & technical contracts ---
    "docs/ERD.md",
    "docs/API_CONTRACTS.md",
    "docs/SEQUENCE_DIAGRAMS.md",
    "docs/USER_FLOWS.md",
    "docs/RBAC.md",
    "docs/MULTI_TENANCY.md",
    "docs/STORAGE.md",
    "docs/AI_INTERFACES.md",
    "docs/QUEUE_ARCHITECTURE.md",
    "docs/API_VERSIONING.md",
    "docs/FEATURE_FLAGS.md",
    "docs/AUDIT_LOGGING.md",
    "docs/NOTIFICATIONS.md",
    "docs/SECURITY.md",
    "docs/NAMING_CONVENTIONS.md",
    "docs/ERROR_CODES.md",
    "docs/RESPONSE_STANDARDS.md",
    # --- Frontend: Phase 2.1 foundation ---
    "frontend/package.json",
    "frontend/tsconfig.json",
    "frontend/next.config.mjs",
    "frontend/tailwind.config.ts",
    "frontend/components.json",
    "frontend/eslint.config.mjs",
    "frontend/.prettierrc.json",
    "frontend/vitest.config.ts",
    "frontend/playwright.config.ts",
    "frontend/Dockerfile",
    "frontend/middleware.ts",
    "frontend/app/layout.tsx",
    "frontend/app/globals.css",
    "frontend/app/(public)/page.tsx",
    "frontend/app/(auth)/login/page.tsx",
    "frontend/app/(auth)/register/page.tsx",
    "frontend/app/(shopper)/shopper/page.tsx",
    "frontend/app/(brand)/brand/page.tsx",
    "frontend/app/(admin)/admin/page.tsx",
    "frontend/layouts/public-layout.tsx",
    "frontend/layouts/auth-layout.tsx",
    "frontend/layouts/shopper-dashboard-layout.tsx",
    "frontend/layouts/brand-dashboard-layout.tsx",
    "frontend/layouts/admin-dashboard-layout.tsx",
    "docs/frontend/FRONTEND_ARCHITECTURE.md",
    "docs/frontend/DESIGN_SYSTEM.md",
    "docs/frontend/COMPONENT_GUIDELINES.md",
    "docs/frontend/WEB_ROUTES.md",
    # --- Frontend: Phase 2.2 auth, API integration, public pages ---
    "frontend/.storybook/main.ts",
    "frontend/.storybook/preview.tsx",
    "frontend/lib/cookies.ts",
    "frontend/lib/auth-token.ts",
    "frontend/lib/auth-constants.ts",
    "frontend/lib/jwt.ts",
    "frontend/lib/stores/auth-store.ts",
    "frontend/middleware/auth-guard.ts",
    "frontend/api/client.ts",
    "frontend/types/api.ts",
    "frontend/config/tokens/colors.ts",
    "frontend/config/tokens/typography.ts",
    "frontend/config/tokens/spacing.ts",
    "frontend/config/tokens/radius.ts",
    "frontend/config/tokens/shadows.ts",
    "frontend/config/tokens/motion.ts",
    "frontend/config/tokens/breakpoints.ts",
    "frontend/features/auth/components/login-form.tsx",
    "frontend/features/auth/components/register-form.tsx",
    "frontend/features/auth/components/forgot-password-form.tsx",
    "frontend/features/contact/components/contact-form.tsx",
    "frontend/app/(auth)/forgot-password/page.tsx",
    "frontend/app/(auth)/session-expired/page.tsx",
    "frontend/app/(auth)/unauthorized/page.tsx",
    "frontend/app/(public)/features/page.tsx",
    "frontend/app/(public)/pricing/page.tsx",
    "frontend/app/(public)/about/page.tsx",
    "frontend/app/(public)/contact/page.tsx",
    "frontend/app/(public)/privacy/page.tsx",
    "frontend/app/(public)/terms/page.tsx",
    "frontend/app/not-found.tsx",
    "frontend/app/error.tsx",
    "frontend/app/global-error.tsx",
    "frontend/components/ui/button.stories.tsx",
    "frontend/components/ui/card.stories.tsx",
    "frontend/components/ui/input.stories.tsx",
    "frontend/components/ui/dialog.stories.tsx",
    "frontend/components/ui/badge.stories.tsx",
    "frontend/components/ui/empty-state.stories.tsx",
    "frontend/components/ui/error-state.stories.tsx",
    "frontend/components/ui/loading-state.stories.tsx",
    "frontend/components/ui/file-dropzone.stories.tsx",
    "frontend/components/ui/status-chip.stories.tsx",
    "docs/frontend/AUTHENTICATION.md",
    "docs/frontend/API_CLIENT.md",
    "docs/frontend/THEME_SYSTEM.md",
    "docs/frontend/STORYBOOK.md",
    "docs/frontend/PUBLIC_PAGES.md",
    "frontend/README.md",
]

# At least one test file must exist matching these globs — catches the case
# where the directory exists but is empty (e.g. only __init__.py).
REQUIRED_TEST_GLOBS: list[str] = [
    "backend/tests/unit/test_*.py",
    "backend/tests/integration/test_*.py",
    "ai-service/tests/unit/test_*.py",
    "ai-service/tests/integration/test_*.py",
]


def check_dirs(verbose: bool) -> list[str]:
    problems = []
    for rel_path in REQUIRED_DIRS:
        path = REPO_ROOT / rel_path
        if not path.is_dir():
            problems.append(f"MISSING DIRECTORY: {rel_path}")
        elif verbose:
            print(f"  ok  dir   {rel_path}")
    return problems


def check_files(verbose: bool) -> list[str]:
    problems = []
    for rel_path in REQUIRED_FILES:
        path = REPO_ROOT / rel_path
        if not path.is_file():
            problems.append(f"MISSING FILE: {rel_path}")
        elif path.stat().st_size == 0:
            problems.append(f"EMPTY FILE: {rel_path}")
        elif verbose:
            print(f"  ok  file  {rel_path}")
    return problems


def check_test_globs(verbose: bool) -> list[str]:
    problems = []
    for pattern in REQUIRED_TEST_GLOBS:
        matches = list(REPO_ROOT.glob(pattern))
        if not matches:
            problems.append(f"NO TEST FILES MATCHING: {pattern}")
        elif verbose:
            print(f"  ok  tests {pattern} ({len(matches)} file(s))")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="print every check, not just failures"
    )
    args = parser.parse_args()

    print(f"Validating FitMirror AI project structure at: {REPO_ROOT}\n")

    problems: list[str] = []
    problems += check_dirs(args.verbose)
    problems += check_files(args.verbose)
    problems += check_test_globs(args.verbose)

    print()
    if problems:
        print(f"FAILED — {len(problems)} problem(s) found:\n")
        for problem in problems:
            print(f"  ✗ {problem}")
        print("\nSee ARCHITECTURE.md for the expected repository layout.")
        return 1

    total_checked = len(REQUIRED_DIRS) + len(REQUIRED_FILES) + len(REQUIRED_TEST_GLOBS)
    print(f"OK — all {total_checked} checks passed. Project structure looks complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
