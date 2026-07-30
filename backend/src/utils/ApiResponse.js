export class ApiResponse {
  /**
   * Standard response wrapper for all API endpoints.
   * @param {number} statusCode
   * @param {any} data
   * @param {string} message
   * @param {object|null} pagination
   */
  constructor(statusCode, data, message = 'Success', pagination = null) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (pagination) {
      this.pagination = pagination;
    }
  }

  static success(data, message = 'Operation successful', pagination = null) {
    return new ApiResponse(200, data, message, pagination);
  }

  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(201, data, message);
  }
}

export default ApiResponse;
