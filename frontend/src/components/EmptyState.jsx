import { Link } from 'react-router-dom';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  variant = 'default',
  className = '',
}) {
  const variants = {
    default: 'from-gray-50 to-blue-50 border-gray-100',
    courses: 'from-blue-50 to-indigo-50 border-blue-100',
    payments: 'from-green-50 to-emerald-50 border-green-100',
    students: 'from-purple-50 to-pink-50 border-purple-100',
    error: 'from-red-50 to-orange-50 border-red-100',
    success: 'from-emerald-50 to-green-50 border-emerald-100',
  };

  return (
    <div className={`bg-gradient-to-br ${variants[variant]} border rounded-2xl p-8 md:p-12 text-center ${className}`}>
      {Icon && (
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/60 backdrop-blur flex items-center justify-center">
          <Icon className="text-3xl text-gray-400" />
        </div>
      )}
      {title && <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>}
      {actionLabel && (actionTo || onAction) && (
        actionTo ? (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

export function InlineEmpty({ message, className = '' }) {
  return (
    <div className={`py-8 text-center text-sm text-gray-500 ${className}`}>
      {message}
    </div>
  );
}

export default EmptyState;
