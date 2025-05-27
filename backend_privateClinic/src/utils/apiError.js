/**
 * Tạo các custom errors cho API
 */

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class DatabaseError extends Error {
  constructor(message, detail = null, hint = null) {
    super(message);
    this.name = 'DatabaseError';
    this.detail = detail;
    this.hint = hint;
  }
}

module.exports = {
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  DatabaseError
};
