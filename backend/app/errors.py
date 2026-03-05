class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class BadRequestError(AppError):
    def __init__(self, message: str, details=None):
        super().__init__("BAD_REQUEST", message, 400, details)


class NotFoundError(AppError):
    def __init__(self, message: str, details=None):
        super().__init__("NOT_FOUND", message, 404, details)


class ConflictError(AppError):
    def __init__(self, message: str, details=None):
        super().__init__("CONFLICT", message, 409, details)


class ValidationError(AppError):
    def __init__(self, message: str, details=None):
        super().__init__("VALIDATION_ERROR", message, 422, details)


class ConfigError(AppError):
    def __init__(self, message: str, details=None):
        super().__init__("CONFIG_ERROR", message, 500, details)
