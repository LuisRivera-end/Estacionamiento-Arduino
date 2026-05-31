from app.db.migrate import LEGACY_BASELINE_REVISION, MigrationState, choose_stamp_revision


def test_fresh_database_runs_full_migration_history_without_stamping() -> None:
    state = MigrationState(
        has_version_table=False,
        has_core_tables=False,
        has_discount_amount=False,
    )

    assert choose_stamp_revision(state) is None


def test_versioned_database_runs_upgrade_without_stamping() -> None:
    state = MigrationState(
        has_version_table=True,
        has_core_tables=True,
        has_discount_amount=False,
    )

    assert choose_stamp_revision(state) is None


def test_legacy_database_without_discount_columns_stamps_baseline() -> None:
    state = MigrationState(
        has_version_table=False,
        has_core_tables=True,
        has_discount_amount=False,
    )

    assert choose_stamp_revision(state) == LEGACY_BASELINE_REVISION


def test_legacy_database_already_at_current_schema_stamps_head() -> None:
    state = MigrationState(
        has_version_table=False,
        has_core_tables=True,
        has_discount_amount=True,
    )

    assert choose_stamp_revision(state) == "head"
