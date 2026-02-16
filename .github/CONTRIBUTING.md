# Contributing to Video Query

Thanks for your interest in contributing.

## Project Layout

- `backend/`: Flask API, AI pipeline, ChromaDB storage
- `frontend/`: React UI for projects, query, and clip playback

## Local Setup

```bash
make setup
echo "GOOGLE_API_KEY=your_key_here" > backend/.env
make dev
```

## Development Rules

- Keep PRs focused and minimal.
- Match existing style and structure.
- Update `Readme.md` when behavior/API changes.
- Do not commit generated/local artifacts (logs, local DB, build outputs, clips/uploads).

## Verification Before PR

```bash
python -m compileall -q backend
python -m pytest -q backend
cd frontend && npm test -- --watchAll=false && npm run build
```

Integration note:

- `backend/test_backend.py` is integration-oriented and skips by default.
- Run it intentionally with:

```bash
RUN_BACKEND_INTEGRATION=1 python -m pytest -q backend/test_backend.py
```

## Pull Request Checklist

- Clear summary of what changed and why
- Screenshots/GIF for UI changes
- Any API/data model impacts noted
- Verification steps and outcomes included
