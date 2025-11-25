export default function ManagementLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}