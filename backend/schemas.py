from marshmallow import Schema, fields, validate


class HealthSchema(Schema):
    status = fields.String(required=True)


class RiskEventSchema(Schema):
    id = fields.Integer(dump_only=True)
    event_type = fields.String(required=True)
    title = fields.String(required=True)
    summary = fields.String(required=True)
    severity = fields.Integer(required=True)
    confidence = fields.Float(allow_none=True)
    source = fields.String(required=True)
    source_url = fields.String(allow_none=True)
    published_at = fields.DateTime(allow_none=True)
    impacted_ports = fields.List(fields.String())
    impacted_countries = fields.List(fields.String())
    impacted_keywords = fields.List(fields.String())
    time_window_start = fields.DateTime(allow_none=True)
    time_window_end = fields.DateTime(allow_none=True)
    dedupe_key = fields.String(required=True)
    metadata_json = fields.Dict()
    created_at = fields.DateTime(dump_only=True)


class EventSummarySchema(Schema):
    total = fields.Integer(required=True)
    by_type = fields.Dict(keys=fields.String(), values=fields.Integer())
    by_severity_bucket = fields.Dict(keys=fields.String(), values=fields.Integer())
    top_ports = fields.List(fields.Dict())
    top_countries = fields.List(fields.Dict())


class ShipmentSchema(Schema):
    id = fields.Integer(dump_only=True)
    sku_id = fields.Integer(required=True)
    origin_port = fields.String(required=True)
    dest_port = fields.String(required=True)
    etd = fields.DateTime(required=True)
    eta = fields.DateTime(required=True)
    carrier_id = fields.Integer(required=True)
    status = fields.String(required=True)
    route_id = fields.Integer(allow_none=True)


class GenerateRecommendationsRequestSchema(Schema):
    profile = fields.String(
        required=True, validate=validate.OneOf(["resilient", "fast", "low_cost"])
    )
    sku_ids = fields.List(fields.Integer(), required=True)
    horizon_days = fields.Integer(required=True, validate=validate.Range(min=1, max=365))


class RecommendationResponseSchema(Schema):
    id = fields.Integer(required=True)
    profile = fields.String(required=True)
    sku_id = fields.Integer(required=True)
    horizon_days = fields.Integer(required=True)
    score = fields.Float(required=True)
    recommendation = fields.Dict(required=True)
    explanation = fields.List(fields.String(), required=True)


class GenerateRecommendationsResponseSchema(Schema):
    recommendations = fields.List(fields.Nested(RecommendationResponseSchema), required=True)
    explanation = fields.List(fields.String(), required=True)
    weights = fields.Dict(keys=fields.String(), values=fields.Float(), required=True)


class PreferenceSchema(Schema):
    id = fields.Integer(dump_only=True)
    profile = fields.String(required=True)
    w_cost = fields.Float(required=True)
    w_speed = fields.Float(required=True)
    w_risk = fields.Float(required=True)
    blocked_ports = fields.List(fields.String(), required=True)
    preferred_carriers = fields.List(fields.Integer(), required=True)


class PreferenceUpdateSchema(Schema):
    profile = fields.String(required=True)
    w_cost = fields.Float(required=True)
    w_speed = fields.Float(required=True)
    w_risk = fields.Float(required=True)
    blocked_ports = fields.List(fields.String(), load_default=list)
    preferred_carriers = fields.List(fields.Integer(), load_default=list)


class FeedbackSchema(Schema):
    accepted = fields.Boolean(required=True)
    reason_code = fields.String(
        required=True,
        validate=validate.OneOf(["too_expensive", "too_slow", "too_risky", "other"]),
    )


class ResearchTaskCreateSchema(Schema):
    event_id = fields.Integer(required=True)
    mode = fields.String(required=True, validate=validate.OneOf(["enrich"]))


class ResearchBulkTaskFilterSchema(Schema):
    event_type = fields.String(
        load_default="NEWS",
        validate=validate.OneOf(["NEWS", "WEATHER"]),
    )
    min_severity = fields.Integer(load_default=0, validate=validate.Range(min=0, max=100))
    limit = fields.Integer(load_default=1000, validate=validate.Range(min=1, max=5000))
    only_unenriched = fields.Boolean(load_default=True)


class ResearchBulkTaskCreateSchema(Schema):
    mode = fields.String(load_default="enrich", validate=validate.OneOf(["enrich"]))
    event_ids = fields.List(fields.Integer(), load_default=list)
    filter = fields.Nested(ResearchBulkTaskFilterSchema, load_default=None, allow_none=True)


class ResearchBulkTaskCreateResponseSchema(Schema):
    requested_count = fields.Integer(required=True)
    candidate_count = fields.Integer(required=True)
    created_count = fields.Integer(required=True)
    skipped_already_enriched = fields.Integer(required=True)
    skipped_duplicate_task = fields.Integer(required=True)
    invalid_event_ids = fields.List(fields.Integer(), required=True)
    created_task_ids = fields.List(fields.Integer(), required=True)


class ResearchTaskSchema(Schema):
    id = fields.Integer(dump_only=True)
    event_id = fields.Integer(required=True)
    mode = fields.String(required=True)
    status = fields.String(required=True)
    error = fields.String(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ResearchFindingSchema(Schema):
    id = fields.Integer(dump_only=True)
    task_id = fields.Integer(required=True)
    event_id = fields.Integer(required=True)
    finding_json = fields.Dict(required=True)
    created_at = fields.DateTime(dump_only=True)


class ResearchTaskTraceSchema(Schema):
    task_id = fields.Integer(required=True)
    event_id = fields.Integer(required=True)
    status = fields.String(required=True)
    error = fields.String(allow_none=True)
    finding_id = fields.Integer(allow_none=True)
    enrichment_source = fields.String(allow_none=True)
    model = fields.String(allow_none=True)
    agent_path = fields.String(allow_none=True)
    stage_status = fields.Dict(keys=fields.String(), values=fields.String(), allow_none=True)
    latency_ms_total = fields.Integer(allow_none=True)
    latency_ms_by_agent = fields.Dict(
        keys=fields.String(), values=fields.Integer(), allow_none=True
    )
    stage_outputs = fields.Dict(allow_none=True)
    relevance = fields.Dict(allow_none=True)
    finding = fields.Dict(allow_none=True)


class ResearchFailureSchema(Schema):
    task_id = fields.Integer(required=True)
    error = fields.String(allow_none=True)
    updated_at = fields.DateTime(allow_none=True)


class ResearchWorkerConfigSchema(Schema):
    max_workers = fields.Integer(required=True)
    batch_size = fields.Integer(required=True)


class ResearchProgressSchema(Schema):
    queued = fields.Integer(required=True)
    running = fields.Integer(required=True)
    done = fields.Integer(required=True)
    failed = fields.Integer(required=True)
    total = fields.Integer(required=True)
    last_processed_at = fields.DateTime(allow_none=True)
    recent_failures = fields.List(fields.Nested(ResearchFailureSchema), required=True)
    worker_config = fields.Nested(ResearchWorkerConfigSchema, required=True)


class AdminIngestionPollSchema(Schema):
    weather = fields.Boolean(load_default=True)
    news = fields.Boolean(load_default=True)
    news_target_count = fields.Integer(load_default=5, validate=validate.Range(min=1, max=20))
    gdelt_max_records = fields.Integer(load_default=None, allow_none=True)
    include_followup = fields.Boolean(load_default=False)


class AdminIngestionPollResponseSchema(Schema):
    weather_created = fields.Integer(required=True)
    news_created = fields.Integer(required=True)
    total_created = fields.Integer(required=True)
    source = fields.String(required=True)
    details = fields.Dict(required=True)


class MockNewsArticleSchema(Schema):
    title = fields.String(required=True)
    summary = fields.String(required=True)
    source_url = fields.String(required=True)
    published_at = fields.DateTime(allow_none=True, load_default=None)
    severity = fields.Integer(load_default=50, validate=validate.Range(min=0, max=100))
    confidence = fields.Float(load_default=0.7, validate=validate.Range(min=0.0, max=1.0))
    impacted_ports = fields.List(fields.String(), load_default=list)
    impacted_countries = fields.List(fields.String(), load_default=list)
    impacted_keywords = fields.List(fields.String(), load_default=list)


class AdminMockNewsCreateSchema(Schema):
    articles = fields.List(fields.Nested(MockNewsArticleSchema), required=True)
    source = fields.String(load_default="mock")
    pack_name = fields.String(load_default="custom")


class AdminMockNewsCreateResponseSchema(Schema):
    created_count = fields.Integer(required=True)
    skipped_duplicates = fields.Integer(required=True)
    created_event_ids = fields.List(fields.Integer(), required=True)


class AdminMockNewsDefaultRequestSchema(Schema):
    pack_name = fields.String(load_default="asia_us_disruptions_v1")


class AdminMockNewsDefaultResponseSchema(Schema):
    pack_name = fields.String(required=True)
    created_count = fields.Integer(required=True)
    skipped_duplicates = fields.Integer(required=True)
    created_event_ids = fields.List(fields.Integer(), required=True)
