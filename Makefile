GIT_COMMIT := $(shell git rev-parse --short HEAD)
export GIT_COMMIT

IMAGE_NAME := subooru

.PHONY: build
build:
	docker compose build --pull
	docker tag $(IMAGE_NAME):$(GIT_COMMIT) $(IMAGE_NAME):latest
	@echo "Built and tagged:"
	@echo "  $(IMAGE_NAME):$(GIT_COMMIT)"
	@echo "  $(IMAGE_NAME):latest"

.PHONY: up
up:
	docker compose up -d

.PHONY: rebuild
rebuild: build up

.PHONY: down
down:
	docker compose down

.PHONY: restart
restart: down up

.PHONY: logs
logs:
	docker compose logs -f

.PHONY: pull
pull:
	docker compose pull

.PHONY: ps
ps:
	docker compose ps
