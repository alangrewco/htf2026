from sqlalchemy import select

from app.db import Base, get_engine, session_scope
from app.models import PortRecord, RouteRecord

DEFAULT_PORTS = [
    {"id": "port_lax", "name": "Los Angeles"},
    {"id": "port_shg", "name": "Shanghai"},
    {"id": "port_sin", "name": "Singapore"},
]

DEFAULT_ROUTES = [
    {"id": "route_pacific_1", "name": "Pacific Route 1"},
    {"id": "route_asia_us_1", "name": "Asia-US Route 1"},
]


def initialize_database():
    Base.metadata.create_all(get_engine())
    with session_scope() as session:
        has_ports = session.execute(select(PortRecord.id).limit(1)).first() is not None
        if not has_ports:
            session.add_all([PortRecord(**row) for row in DEFAULT_PORTS])

        has_routes = session.execute(select(RouteRecord.id).limit(1)).first() is not None
        if not has_routes:
            session.add_all([RouteRecord(**row) for row in DEFAULT_ROUTES])
