#!/usr/bin/env bash

set -o errexit

flake8
python app/manage.py migrate
coverage run --source=app app/manage.py test server.tests
coverage report

(cd app/server && npm run lint)
