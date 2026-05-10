import { httpRequest } from './http'
import type { CategoryItem, RoleListItem, SeriesItem, TagAggregateItem, TagItem } from '@/types/api'

export function fetchRoles() {
  return httpRequest<RoleListItem[]>('/roles')
}

export function fetchCategories() {
  return httpRequest<CategoryItem[]>('/categories')
}

export function fetchTags() {
  return httpRequest<TagItem[]>('/tags')
}

export function fetchTagAggregate() {
  return httpRequest<TagAggregateItem[]>('/tags/aggregate')
}

export function fetchSeries() {
  return httpRequest<SeriesItem[]>('/series')
}
