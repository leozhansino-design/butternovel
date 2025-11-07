// src/app/novels/[slug]/loading.tsx
export default function NovelDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-white animate-pulse">
      <div className="h-16 bg-white border-b"></div>
      <main className="flex-1">
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-gray-100 rounded-2xl p-12">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="w-80 aspect-[2/3] bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    <div className="flex gap-3">
                      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                    </div>
                    <div className="space-y-2 pt-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                    <div className="h-14 bg-gray-200 rounded-xl w-48"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}