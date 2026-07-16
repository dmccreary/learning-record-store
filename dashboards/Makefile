# LRS analytics dashboards (spec §7, §9). Mirrors the root Makefile's style — one
# target per action, `make help` lists them — but lives here because this venv and
# these dependencies are deliberately separate from the `lrs` image (see requirements.txt).

.PHONY: help install synth clear-synth admin teacher author

help:           ## Show this help
	@grep -E '^[a-z-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install:        ## Create/refresh the dashboards venv
	uv venv --python 3.12 .venv
	VIRTUAL_ENV=.venv uv pip install -r requirements.txt

synth:          ## Write MicroSimEngagement + Experiment data (idempotent) — run once after `make seed` in the main repo
	PYTHONPATH=. .venv/bin/python -m lrsdash.synth

clear-synth:    ## Remove everything `make synth` wrote, leaving the base seed untouched
	PYTHONPATH=. .venv/bin/python -c "from lrsdash.synth import clear; print(clear(), 'nodes/edges removed')"

admin:          ## Run the School Administrator dashboard — http://127.0.0.1:8051
	PYTHONPATH=. .venv/bin/python admin_app.py

teacher:        ## Run the Teacher dashboard (My Classes / Student Detail) — http://127.0.0.1:8052
	PYTHONPATH=. .venv/bin/python teacher_app.py

author:         ## Run the Textbook Author dashboard (Content Insights / Experiments) — http://127.0.0.1:8053
	PYTHONPATH=. .venv/bin/python author_app.py
