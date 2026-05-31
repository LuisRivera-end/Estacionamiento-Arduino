from app.db import session as db_session


def test_init_engine_uses_bounded_pool_for_external_database(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_create_async_engine(database_url: str, **kwargs):
        captured["database_url"] = database_url
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(db_session, "engine", None)
    monkeypatch.setattr(db_session, "SessionLocal", None)
    monkeypatch.setattr(db_session, "create_async_engine", fake_create_async_engine)
    monkeypatch.setattr(db_session, "async_sessionmaker", lambda *_args, **_kwargs: object())

    db_session.init_engine("postgresql+asyncpg://postgres:secret@db.example.com/postgres")

    assert captured["pool_size"] == 2
    assert captured["max_overflow"] == 1
    assert captured["pool_timeout"] == 5
    assert captured["pool_recycle"] == 300
