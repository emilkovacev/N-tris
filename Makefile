all: index.js

index.js: index.ts
	tsc $< --target es6

clean:
	rm -rf index.js
