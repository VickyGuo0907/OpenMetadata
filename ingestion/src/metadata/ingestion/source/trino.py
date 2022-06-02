#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import logging
import sys
from typing import Iterable

import click
from sqlalchemy.inspection import inspect

from metadata.generated.schema.entity.data.database import Database
from metadata.generated.schema.entity.data.databaseSchema import DatabaseSchema
from metadata.generated.schema.entity.services.connections.database.trinoConnection import (
    TrinoConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.models.ometa_table_db import OMetaDatabaseAndTable
from metadata.ingestion.source.sql_source import SQLSource
from metadata.utils.filters import filter_by_schema
from metadata.utils.fqdn_generator import get_fqdn
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class TrinoSource(SQLSource):
    def __init__(self, config, metadata_config):
        self.trino_connection: TrinoConnection = (
            config.serviceConnection.__root__.config
        )
        self.schema_names = None
        self.inspector = None
        try:
            from trino import (
                dbapi,  # pylint: disable=import-outside-toplevel,unused-import
            )
        except ModuleNotFoundError:
            click.secho(
                "Trino source dependencies are missing. Please run\n"
                + "$ pip install --upgrade 'openmetadata-ingestion[trino]'",
                fg="red",
            )
            if logger.isEnabledFor(logging.DEBUG):
                raise
            sys.exit(1)
        super().__init__(config, metadata_config)

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config = WorkflowSource.parse_obj(config_dict)
        connection: TrinoConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, TrinoConnection):
            raise InvalidSourceException(
                f"Expected TrinoConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def _get_database(self, _) -> Database:
        return Database(
            name=self.trino_connection.catalog,
            service=EntityReference(
                id=self.service.id, type=self.service_connection.type.value
            ),
        )

    def prepare(self):
        self.inspector = inspect(self.engine)
        self.schema_names = (
            self.inspector.get_schema_names()
            if not self.service_connection.database
            else [self.service_connection.database]
        )
        return super().prepare()

    def next_record(self) -> Iterable[OMetaDatabaseAndTable]:
        for schema in self.schema_names:
            self.database_source_state.clear()
            if filter_by_schema(
                self.source_config.schemaFilterPattern, schema_name=schema
            ):
                self.status.filter(schema, "Schema pattern not allowed")
                continue

            if self.source_config.includeTables:
                yield from self.fetch_tables(self.inspector, schema)
            if self.source_config.includeViews:
                yield from self.fetch_views(self.inspector, schema)
            if self.source_config.markDeletedTables:
                schema_fqdn = get_fqdn(
                    DatabaseSchema,
                    self.config.serviceName,
                    self.service_connection.catalog,
                    schema,
                )
                yield from self.delete_tables(schema_fqdn)