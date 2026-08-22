#!/usr/bin/env bash
set -o errexit

pip install pipenv
npm install
npm run build

pipenv install

# Agrega la columna 'category' directamente en PostgreSQL si no existe
cd src && pipenv run python -c "from app import app, db; db.session.execute(db.text('ALTER TABLE project ADD COLUMN IF NOT EXISTS category VARCHAR(100);')); db.session.commit()" && cd ..

cd src && pipenv run flask --app app db stamp heads && cd ..