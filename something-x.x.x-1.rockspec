package = "something"
version = "x.x.x-1"
source = {url = "git+https://github.com/notomo/for-luarocks-issue.git"}
build = {type = "builtin", modules = {}, install = {bin = {"bin/something.bat", "bin/something"}}}
