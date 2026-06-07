export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="h-44 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-16" />
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 p-4 border-b border-gray-100 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-1/3" />
        <div className="h-2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-1/2 mb-2" />
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-2/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 h-64">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded w-1/4 mb-4" />
        <div className="h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default SkeletonCard;
