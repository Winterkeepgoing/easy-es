TESTS     = $(shell find test/v3.0.0 -type f -name "*.test.js")
BIN_MOCHA = ./node_modules/.bin/mocha
BIN_NYC   = ./node_modules/.bin/nyc

test:
	NODE_ENV=test $(BIN_MOCHA) -R spec -t 60000 --exit -r ./test/env.js $(TESTS);

cov:
	$(BIN_NYC) --reporter=lcov --reporter=text-summary $(BIN_MOCHA) -R list -t 60000 --exit -r ./test/env.js $(TESTS);

eslint:
	@eslint .

tag:
	@cat package.json | xargs -0 node -p 'JSON.parse(process.argv[1]).version' | xargs git tag
	@git push origin --tags

.PHONY: install test