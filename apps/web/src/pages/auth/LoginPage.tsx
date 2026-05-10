import { FormEvent, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchLoginCaptcha, login } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setTokenAndUser = useAuthStore((state) => state.setTokenAndUser)
  const setProfile = useAuthStore((state) => state.setProfile)

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from ?? '/admin'
  }, [location.state])

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin@123456')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const captchaQuery = useQuery({
    queryKey: ['auth', 'captcha'],
    queryFn: fetchLoginCaptcha,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSubmitting(true)
    try {
      if (!captchaQuery.data?.token) {
        throw new Error('验证码未加载完成')
      }
      const data = await login({
        username,
        password,
        captchaToken: captchaQuery.data.token,
        captchaAnswer,
      })
      setTokenAndUser(data.accessToken, data.user)
      setProfile(null)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请检查账号密码')
      await captchaQuery.refetch()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-md items-center">
      <Card className="w-full border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader className="space-y-3">
          <Badge className="w-fit">后台登录</Badge>
          <CardTitle>登录管理后台</CardTitle>
          <CardDescription>默认管理员：admin / Admin@123456（建议初始化后修改）</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">账号</label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">验证码</label>
              <div className="flex gap-2">
                <Input
                  value={captchaAnswer}
                  onChange={(event) => setCaptchaAnswer(event.target.value)}
                  placeholder={captchaQuery.data?.question ?? '加载验证码中...'}
                  required
                />
                <Button type="button" variant="outline" onClick={() => void captchaQuery.refetch()}>
                  刷新
                </Button>
              </div>
            </div>
            {errorMessage ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                {errorMessage}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
