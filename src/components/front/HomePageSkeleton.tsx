// src/components/front/HomePageSkeleton.tsx
export default function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Trending Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50/50 py-12 md:py-16 lg:py-20">
        <div style={{ paddingLeft: '150px', paddingRight: '150px' }}>
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
          <div className="flex gap-5 md:gap-6 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 bg-white rounded-xl p-5 border border-gray-100" style={{ width: '480px' }}>
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-200 rounded-lg" style={{ width: '150px', height: '200px' }}></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="bg-gradient-to-b from-amber-50/50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[2/3] bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="bg-white">
        <div className="container mx-auto px-4 max-w-7xl py-16 space-y-20">
          {[...Array(3)].map((_, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-8">
                <div className="h-8 bg-gray-200 rounded-lg w-48"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[2/3] bg-gray-200 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}