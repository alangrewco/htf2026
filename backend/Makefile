.PHONY: validate-openapi generate-server post-generate deploy-gcp smoke-api

OPENAPI_SPEC := openapi.yaml
GEN_OUT := generated/flask-server

validate-openapi:
	npx @openapitools/openapi-generator-cli validate -i $(OPENAPI_SPEC)

generate-server: validate-openapi
	npx @openapitools/openapi-generator-cli generate -i $(OPENAPI_SPEC) -g python-flask -o $(GEN_OUT)
	$(MAKE) post-generate

post-generate:
	./scripts/post_generate.sh

deploy-gcp:
	./scripts/deploy_cloud_run.sh

smoke-api:
	./scripts/smoke_api.sh
