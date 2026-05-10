export const siteConfig = {
  name: 'Enterprise Blog',
  description: '企业级个人全功能博客系统',
  nav: [
    { label: '首页', href: '/' },
    { label: '标签聚合', href: '/tags' },
    { label: '独立页面', href: '/pages' },
    { label: '时光轴', href: '/timeline' },
    { label: '随笔动态', href: '/moments' },
    { label: '留言板', href: '/message-board' },
    { label: '友情链接', href: '/friend-links' },
    { label: '下载中心', href: '/downloads' },
    { label: '多媒体', href: '/media' },
    { label: '我的主页', href: '/admin/users' },
    { label: '后台', href: '/admin' },
    { label: '登录', href: '/auth/login' },
  ],
} as const
