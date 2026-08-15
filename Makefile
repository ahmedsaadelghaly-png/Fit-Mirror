# ---------------------------------------------------------------------------
# FitMirror AI — developer workflow commands.
# Run `make help` to list all targets.
# ---------------------------------------------------------------------------
SHELL := /bin/bash
COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: help up down build logs restart test test-backend test-ai test-frontend \
        test-frontend-e2e test-frontend-a11y lint lint-backend lint-ai lint-frontend format \
        format-backend format-ai format-frontend typecheck typecheck-backend \
        typecheck-ai typecheck-frontend migrate seed clean venv-backend venv-ai \
        frontend-install frontend-dev storybook storybook-build \
        analyze-frontend lighthouse-frontend audit-frontend build-frontend-prod

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

## --- Docker lifecycle ------------------------------------------------------

up: ## Start all services (dev compose) in the background
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up -d --build

down: ## Stop and remove all containers
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml down

build: ## Rebuild all Docker images
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml build

logs: ## Tail logs for all services
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml logs -f --tail=200

restart: down up ## Restart all services

## --- Testing & quality -----------------------------------------------------

test: test-backend test-ai test-frontend ## Run all tests (backend + AI service + frontend)

test-backend: ## Run backend tests with coverage
	cd backend && python -m pytest --cov=app --cov-report=term-missing

test-ai: ## Run AI service tests with coverage
	cd ai-service && python -m pytest --cov=app --cov-report=term-missing

test-frontend: ## Run frontend unit tests (Vitest)
	cd frontend && npm run test

test-frontend-e2e: ## Run frontend e2e tests (Playwright — requires `npx playwright install` once)
	cd frontend && npm run test:e2e

test-frontend-a11y: ## Run frontend accessibility scans (axe-core via Playwright)
	cd frontend && npm run test:e2e:a11y

lint: lint-backend lint-ai lint-frontend ## Run linters on all three codebases

lint-backend:
	cd backend && ruff check app tests && black --check app tests && isort --check-only app tests

lint-ai:
	cd ai-service && ruff check app tests && black --check app tests && isort --check-only app tests

lint-frontend: ## Run ESLint + Prettier (check-only) on the frontend
	cd frontend && npm run lint && npm run format:check

format: format-backend format-ai format-frontend ## Auto-format all three codebases

format-backend:
	cd backend && ruff check --fix app tests && isort app tests && black app tests

format-ai:
	cd ai-service && ruff check --fix app tests && isort app tests && black app tests

format-frontend: ## Auto-format the frontend with Prettier + ESLint --fix
	cd frontend && npm run lint:fix && npm run format

typecheck: typecheck-backend typecheck-ai typecheck-frontend ## Run type checkers on all three codebases

typecheck-backend:
	cd backend && mypy --config-file=../pyproject.toml app

typecheck-ai:
	cd ai-service && mypy --config-file=../pyproject.toml app

typecheck-frontend: ## Run tsc --noEmit on the frontend
	cd frontend && npm run typecheck

## --- Database ---------------------------------------------------------------

migrate: ## Apply Alembic migrations (inside the running backend container)
	$(COMPOSE) exec backend alembic upgrade head

seed: ## Load demo/seed data (admin, shopper, brand, store, products, wardrobe)
	$(COMPOSE) exec backend python -m app.db.seed

## --- Housekeeping -------------------------------------------------------------

clean: ## Remove caches, coverage artifacts, and __pycache__ directories
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -name ".coverage" -delete 2>/dev/null || true
	find . -name "htmlcov" -type d -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/.next frontend/coverage frontend/playwright-report frontend/test-results

venv-backend: ## Create a local venv and install backend deps (for non-Docker dev)
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r ../requirements-dev.txt

venv-ai: ## Create a local venv and install AI service deps (for non-Docker dev)
	cd ai-service && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r ../requirements-dev.txt

frontend-install: ## Install frontend deps (for non-Docker dev)
	cd frontend && npm install

frontend-dev: ## Run the frontend dev server directly on the host (no Docker)
	cd frontend && npm run dev

storybook: ## Run Storybook dev server (http://localhost:6006)
	cd frontend && npm run storybook

storybook-build: ## Build static Storybook output (also verifies all stories compile)
	cd frontend && npm run build-storybook

## --- Frontend production/quality gates (Phase 2.6) -------------------------

analyze-frontend: ## Build the frontend with the bundle analyzer (opens an interactive treemap)
	cd frontend && npm run analyze

lighthouse-frontend: ## Build the frontend, then run Lighthouse CI against it (see docs/frontend/PERFORMANCE.md)
	cd frontend && npm run build && npm run lighthouse

audit-frontend: ## Check frontend production dependencies for known vulnerabilities
	cd frontend && npm run audit

build-frontend-prod: ## Build the frontend's production Docker image (runner stage — see frontend/Dockerfile)
	docker build -t fitmirror-frontend:prod --target runner ./frontend
