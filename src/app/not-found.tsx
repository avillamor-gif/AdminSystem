export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center p-8">
        <h2 className="text-4xl font-bold text-white mb-4">404</h2>
        <p className="text-gray-400 mb-6">Page not found</p>
        <a
          href="/"
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
