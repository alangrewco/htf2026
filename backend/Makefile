.PHONY: validate-openapi generate-server

OPENAPI_SPEC := openapi.yaml
GEN_OUT := generated/flask-server

validate-openapi:
	npx openapi-generator-cli validate -i $(OPENAPI_SPEC)

generate-server: validate-openapi
	npx openapi-generator-cli generate -i $(OPENAPI_SPEC) -g python-flask -o $(GEN_OUT)
