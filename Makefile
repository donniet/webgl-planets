BABEL=node_modules/.bin/babel
SRC=$(shell find src -not -type d)
OBJ=$(SRC:src/%=public/%)

.PHONY: all clean

all: $(OBJ)

clean:
	rm -f $(OBJ)

public/lib/%: src/lib/% .babelrc
	mkdir -p $(@D)
	$(BABEL) $< -o $@

public/css/%.css: src/css/%.css
	mkdir -p $(@D)
	cp -f $< $@

public/img/%: src/img/%
	mkdir -p $(@D)
	cp -f $< $@
