/**
 * Uygulama genelinde kullanılan özel hata sınıfları.
 * Route handler'larda yakalanarak uygun HTTP status code'larına çevrilir.
 */

export class AppError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
  }
}

/** 400 — Geçersiz girdi (Zod validation hataları vb.) */
export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400)
  }
}

/** 401 — Kimlik doğrulama başarısız */
export class AuthenticationError extends AppError {
  constructor(message = "Email or password incorrect") {
    super(message, 401)
  }
}

/** 403 — Yetkisiz erişim (başkasının kaynağına erişim) */
export class AuthorizationError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403)
  }
}

/** 404 — Kaynak bulunamadı */
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404)
  }
}

/** 409 — Çakışma (ör. aynı email ile kayıt, aynı slug) */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409)
  }
}
