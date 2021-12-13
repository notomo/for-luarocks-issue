install:
	luarocks make --verbose
.PHONY: install

# tmp
luarocks:
	curl \
	-H "Accept: application/vnd.github.v3+json" \
	-L \
	--output luarocks.tar.gz \
	https://api.github.com/repos/luarocks/luarocks/tarball/fix-deploy-on-non-wrapped-scripts
	mkdir -p luarocks
	tar -xf luarocks.tar.gz -C ./luarocks --strip-components=1
