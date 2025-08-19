FROM python:3-trixie

# Install operating system dependencies.
RUN apt-get update -y && \
    apt-get install -y apt-transport-https rsync gettext libgettextpo-dev && \
    curl -sL https://sentry.io/get-cli/ | bash && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements.
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code.
COPY . .

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=django_tailwind_app.settings \
    PORT=8000 \
    WEB_CONCURRENCY=3 \
    GUNICORN_CMD_ARGS="--max-requests 1200 --access-logfile -"

EXPOSE 8000

# Install assets
RUN SECRET_KEY=none DJANGO_DEBUG=0 django-admin collectstatic -v 2 --noinput --clear

# Run application
CMD gunicorn django_tailwind_app.wsgi:application
