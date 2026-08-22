#!/usr/bin/env bash
set -o errexit

pip install pipenv
npm install
npm run build

pipenv install

cd src && pipenv run flask --app app db stamp heads && cd ..
cd src && pipenv run flask --app app db upgrade heads && cd ..