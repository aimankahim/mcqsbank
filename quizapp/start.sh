#!/bin/bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn quizapp.wsgi:application --bind 0.0.0.0:$PORT
