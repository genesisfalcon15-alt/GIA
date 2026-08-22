#!/usr/bin/env bash
set -o errexit

pip install pipenv
npm install
npm run build

pipenv install

cd src && pipenv run python -c "
from app import app
from api.models import db
with app.app_context():
    try:
        db.session.execute(db.text('DELETE FROM alembic_version'))
        db.session.commit()
        print('alembic_version limpiada')
    except Exception as e:
        print(f'no se pudo limpiar: {e}')
" && cd ..

cd src && pipenv run flask --app app db upgrade heads && cd ..