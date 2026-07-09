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
	$(MAKE) trivy-scan

.PHONY: trivy-scan
trivy-scan:
	@if ! command -v trivy &> /dev/null; then \
		echo "Installing trivy..."; \
		curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin; \
	fi
	trivy image --severity HIGH,CRITICAL --exit-code 1 $(IMAGE_NAME):$(GIT_COMMIT)

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
