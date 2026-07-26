export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  message: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
