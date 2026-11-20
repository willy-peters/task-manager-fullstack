export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low py-space-lg mt-auto pb-24 md:pb-space-lg">
      <div className="max-w-7xl mx-auto px-margin-sm sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-on-surface-variant text-body-sm gap-space-sm">
        <span>© {new Date().getFullYear()} Task Manager. Built for modern task management.</span>
        <div className="flex items-center gap-space-md">
          <a
            href="https://task-api-yhl4.onrender.com/api-docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-on-surface transition-colors"
          >
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
