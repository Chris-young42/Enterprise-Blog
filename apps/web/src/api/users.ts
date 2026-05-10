import { httpRequest } from './http'
import type { PublicUserProfile, UserFollowCard, UserProfile } from '@/types/api'

export function fetchUserProfile(id: string) {
  return httpRequest<PublicUserProfile>(`/users/${id}`)
}

export function fetchUserFollowers(id: string) {
  return httpRequest<UserFollowCard[]>(`/users/${id}/followers`)
}

export function fetchUserFollowing(id: string) {
  return httpRequest<UserFollowCard[]>(`/users/${id}/following`)
}

export function followUser(id: string) {
  return httpRequest<PublicUserProfile>(`/users/${id}/follow`, {
    method: 'POST',
  })
}

export function unfollowUser(id: string) {
  return httpRequest<PublicUserProfile>(`/users/${id}/follow`, {
    method: 'DELETE',
  })
}

export function fetchMyProfile() {
  return httpRequest<UserProfile>('/users/me')
}
