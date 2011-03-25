DIRS=\
submodules/jtblatt/duderino\
submodules/joyent/node\
submodules/libunwind\
submodules/jtblatt/perftools

all: 
	@for d in $(DIRS); do \
		echo; \
		cd $(CURDIR)/$$d && $(MAKE) || exit 1; \
		echo; \
	done

clean:
	@for d in $(DIRS); do \
		cd $(CURDIR)/$$d && $(MAKE) clean || exit 1; \
	done

bootstrap:
	git submodule init
	git submodule update
	cd submodules/libunwind && autoreconf -i || exit 1
	cd submodules/libunwind && env CFLAGS=-U_FORTIFY_SOURCE ./configure || exit 1
	cd submodules/libunwind && make || exit 1
	cd submodules/jtblatt/perftools && env LDFLAGS=-L../../libunwind/src/.libs CFLAGS=-I../../libunwind/include/ CXXFLAGS=-I../../libunwind/include/ ./configure || exit 1
	cd submodules/joyent/node && ./configure || exit 1


update_duderino:
	cd submodules/jtblatt/duderino && (git checkout master || exit 1) && (git pull || exit 1)

update_perftools:
	cd submodules/jtblatt/perftools && (git checkout master || exit 1) && (git pull || exit 1)

update_node:
	cd submodules/joyent/node/ && (git checkout master || exit 1) && (git pull || exit 1)

update_nodejs-yui3:
	cd submodules/yui/nodejs-yui3 && (git checkout master || exit 1) && (git pull || exit 1)

update: update_duderino update_perftools update_node update_nodejs-yui3

remake: clean all

nodeps:
	@find . -name '.depends' -exec rm -rf {} \;
