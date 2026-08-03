PY = python3
PELICAN = pelican
PELICANOPTS =

BASEDIR = $(CURDIR)
INPUTDIR = $(BASEDIR)/content
OUTPUTDIR = $(BASEDIR)/output
CONFFILE = $(BASEDIR)/pelicanconf.py
PUBLISHCONF = $(BASEDIR)/publishconf.py
PORT = 8500

.PHONY: help devserver html publish serve clean

help:
	@echo "make devserver   autoreloading local dev server at :$(PORT)"
	@echo "make html        build the site with pelicanconf.py (dev config)"
	@echo "make publish     build the site with publishconf.py (prod config)"
	@echo "make serve       serve an already-built output/ directory at :$(PORT)"
	@echo "make clean       remove the output/ directory"

html:
	$(PELICAN) $(INPUTDIR) -o $(OUTPUTDIR) -s $(CONFFILE) $(PELICANOPTS)

devserver:
	$(PELICAN) --autoreload --listen --port $(PORT) -r $(INPUTDIR) -o $(OUTPUTDIR) -s $(CONFFILE) $(PELICANOPTS)

publish:
	$(PELICAN) $(INPUTDIR) -o $(OUTPUTDIR) -s $(PUBLISHCONF) $(PELICANOPTS)

serve:
	cd $(OUTPUTDIR) && $(PY) -m http.server $(PORT)

clean:
	rm -rf $(OUTPUTDIR)
