export type Id = string

export type Nullable<T> = T | null

export type Timestamped = {
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type ApiResponse<T> = {
  success: boolean
  code: number
  message: string
  data: T
}

export type PageQuery = {
  page?: number
  pageSize?: number
}

export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type SeoMetadata = {
  title: string
  description?: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
}
