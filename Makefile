# Video Query - Orchestration Makefile

.PHONY: setup dev build clean

# 1. Setup both Backend and Frontend
setup:
	@echo "--- Setting up Backend ---"
	@cd backend && chmod +x setup_env.sh && ./setup_env.sh
	@echo "--- Setting up Frontend ---"
	@cd frontend && npm install

# 2. Run both servers in parallel
# Uses a trap to ensure both processes are killed on Ctrl+C (SIGINT)
dev:
	@echo "--- Launching Video Query (Local) ---"
	@trap 'kill 0' INT; \
	(cd backend && . .venv/bin/activate && python app.py) & \
	(cd frontend && npm start)

# 3. Production Build
build:
	@echo "--- Building Frontend ---"
	@cd frontend && npm run build

# 4. Cleanup temporary files
clean:
	@echo "--- Cleaning logs and temp files ---"
	@rm -f *.log
	@cd backend && python -c "from services.video_processor import VideoProcessor; VideoProcessor().clear_temp_folders()"
