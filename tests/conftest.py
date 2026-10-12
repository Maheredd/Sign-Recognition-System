import pytest
from backend import create_app
from backend.config import Config

class TestConfig(Config):
    TESTING = True
    DEBUG = False

@pytest.fixture(scope="session")
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()
