// src/app/novels/[slug]/loading.tsx
// ⚡ 骨架屏 - 立即显示页面结构（< 100ms）
export default function NovelDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* 详情页骨架 - Logo 蓝色系 */}
        <section className="relative py-12 md:py-20 bg-gradient-to-b from-blue-50 via-blue-50/30 to-white">
          {/* 微妙的光效层 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] via-transparent to-blue-500/[0.02]"></div>

          <div className="container mx-auto px-4 relative">
            <div className="max-w-7xl mx-auto">
              <div className="glass-effect-strong rounded-3xl card-shadow-xl overflow-hidden">
                <div className="grid lg:grid-cols-[380px_1fr] gap-8 p-8 md:p-12">

                  {/* Cover Skeleton */}
                  <div className="flex justify-center lg:justify-start">
                    <div className="w-[280px] h-[400px] rounded-2xl bg-gray-200 animate-pulse shadow-xl border-4 border-white"></div>
                  </div>

                  {/* Info Skeleton */}
                  <div className="flex flex-col gap-6">
                    {/* Title */}
                    <div>
                      <div className="h-12 bg-gray-200 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                      <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-3">
                      <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6">
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* Blurb */}
                    <div className="flex-1">
                      <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-4 bg-gray-100 rounded animate-pulse"
                            style={{ width: i === 4 ? '85%' : '100%' }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-2">
                      <div className="h-14 w-48 bg-gradient-to-r from-blue-200/50 to-blue-300/50 rounded-xl animate-pulse shadow-lg"></div>
                      <div className="h-14 w-36 bg-blue-100/50 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 柔和的蓝色渐变衔接层 - 加长加深，创造呼吸感 */}
        <div className="relative h-32">
          {/* 主渐变层 - 从白到浅蓝 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/40 via-blue-50/60 to-blue-100/50"></div>
          {/* 深度层 - 增强蓝色 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-200/8 to-blue-200/15"></div>
          {/* 中心光晕 - 径向扩散 */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,_var(--tw-gradient-stops))] from-blue-400/8 via-blue-300/4 to-transparent"></div>
        </div>

        {/* First Chapter Skeleton */}
        <section className="pt-6 pb-12 md:pb-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Chapter Header */}
              <div className="text-center border-b border-gray-200 pb-8">
                <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
              </div>

              {/* Chapter Content */}
              <div className="space-y-3">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="h-5 bg-gray-100 rounded animate-pulse"
                    style={{
                      width: i % 4 === 3 ? '85%' : '100%',
                      animationDelay: `${i * 50}ms`
                    }}
                  ></div>
                ))}
              </div>

              {/* Continue Button Skeleton */}
              <div className="border-t border-gray-200 pt-10 text-center">
                <div className="h-14 w-56 bg-gradient-to-r from-blue-200/50 to-blue-300/50 rounded-lg mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}