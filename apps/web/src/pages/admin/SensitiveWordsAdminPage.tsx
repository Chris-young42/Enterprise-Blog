import { useMemo, useState } from 'react'
import {
  createSensitiveWord,
  deleteSensitiveWord,
  fetchSensitiveWords,
  updateSensitiveWord,
} from '@/api/ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function SensitiveWordsAdminPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [level, setLevel] = useState<'BLOCK' | 'REPLACE' | 'REVIEW'>('BLOCK')
  const [replaceWith, setReplaceWith] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'sensitive-words', searchKeyword],
    queryFn: () => fetchSensitiveWords(searchKeyword.trim() ? { keyword: searchKeyword.trim() } : {}),
  })

  const createMutation = useMutation({
    mutationFn: createSensitiveWord,
    onSuccess: () => {
      setKeyword('')
      setReplaceWith('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      updateSensitiveWord(id, { isEnabled }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSensitiveWord,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
    },
  })

  const items = useMemo(() => listQuery.data ?? [], [listQuery.data])

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第11阶段</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">敏感词词库</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>新增敏感词</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input placeholder="关键词" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
            value={level}
            onChange={(event) => setLevel(event.target.value as 'BLOCK' | 'REPLACE' | 'REVIEW')}
          >
            <option value="BLOCK">BLOCK</option>
            <option value="REPLACE">REPLACE</option>
            <option value="REVIEW">REVIEW</option>
          </select>
          <Input
            placeholder="替换词（可选）"
            value={replaceWith}
            onChange={(event) => setReplaceWith(event.target.value)}
          />
          <Button
            onClick={() => {
              const key = keyword.trim()
              if (!key) return
              void createMutation.mutateAsync({
                keyword: key,
                level,
                ...(replaceWith.trim() ? { replaceWith: replaceWith.trim() } : {}),
                isEnabled: true,
              })
            }}
          >
            新增
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>词库列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="关键词搜索" value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} />
            <Button variant="outline" onClick={() => void listQuery.refetch()}>
              刷新
            </Button>
          </div>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <div>
                <p className="font-medium">{item.keyword}</p>
                <p className="text-xs text-slate-500">{item.level} {item.replaceWith ? `| 替换: ${item.replaceWith}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void updateMutation.mutateAsync({ id: item.id, isEnabled: !item.isEnabled })}
                >
                  {item.isEnabled ? '禁用' : '启用'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void deleteMutation.mutateAsync(item.id)}>
                  删除
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}