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
	docker run --rm \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(HOME)/.cache/trivy:/root/.cache/trivy \
	  aquasec/trivy:latest \
	  image --severity HIGH,CRITICAL --exit-code 1 $(IMAGE_NAME):$(GIT_COMMIT)
	docker run --rm \
	  -v $(PWD):/workspace \
	  -v $(HOME)/.cache/trivy:/root/.cache/trivy \
	  aquasec/trivy:latest \
	  config --severity HIGH,CRITICAL --exit-code 1 /workspace/Dockerfile

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
