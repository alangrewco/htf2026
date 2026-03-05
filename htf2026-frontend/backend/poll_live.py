from __future__ import annotations

import argparse
import sys
import time
from datetime import datetime
from uuid import uuid4

from app import create_app
from models import RiskEvent, db
from jobs import poll_weather_job, run_gdelt_cycle


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Trigger live ingestion jobs immediately (without waiting for APScheduler intervals)."
    )
    parser.add_argument(
        "--source",
        choices=["weather", "news", "both"],
        default="both",
        help="Which ingestion job(s) to run.",
    )
    parser.add_argument(
        "--no-demo-fallback",
        action="store_true",
        help="Do not insert a local demo event when live polling returns 0 new rows.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    app = create_app({"ENABLE_SCHEDULER": False, "BOOTSTRAP_LIVE_ON_START": False})
    start = time.time()

    with app.app_context():
        weather_created = 0
        news_created = 0

        if args.source in ("weather", "both"):
            print("Running weather poll...")
            try:
                weather_created = poll_weather_job()
                print(f"weather_created={weather_created}")
            except Exception as exc:
                print(f"weather_error={exc}")

        if args.source in ("news", "both"):
            print("Running news poll...")
            try:
                news_created = run_gdelt_cycle(startup=False)["total_created"]
                print(f"news_created={news_created}")
            except Exception as exc:
                print(f"news_error={exc}")

        total_created = weather_created + news_created
        duration = round(time.time() - start, 2)
        print(f"total_created={total_created} duration_s={duration}")

        latest = RiskEvent.query.order_by(RiskEvent.id.desc()).limit(3).all()
        if latest:
            print("latest_events:")
            for event in latest:
                print(
                    f"- id={event.id} type={event.event_type} severity={event.severity} title={event.title[:80]}"
                )
        else:
            print("latest_events: none")

        if total_created == 0 and not args.no_demo_fallback:
            now = datetime.utcnow()
            demo_event = RiskEvent(
                event_type="NEWS",
                title="Demo fallback event (local)",
                summary="No live events were created right now. This local fallback verifies SSE rendering.",
                severity=55,
                confidence=0.8,
                source="local-demo",
                source_url=None,
                published_at=now,
                impacted_ports=["USLAX"],
                impacted_countries=["US"],
                impacted_keywords=["demo", "fallback"],
                dedupe_key=f"local-demo:{uuid4()}",
                metadata_json={"reason": "live_poll_returned_zero"},
            )
            db.session.add(demo_event)
            db.session.commit()
            print(f"demo_fallback_created=1 event_id={demo_event.id}")
            total_created = 1

        if total_created == 0:
            print(
                "No new rows were created. This is normal if there were no hazards/news hits or data was deduped."
            )

    return 0


if __name__ == "__main__":
    sys.exit(main())
