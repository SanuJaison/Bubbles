const PageLoader = () => (
  <div className="auth-shell flex min-h-screen items-center justify-center px-4">
    <div
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffffff] p-2 shadow-soft">
        <img
          src="/bubbles-logo-144.png"
          width="56"
          height="56"
          alt=""
          className="h-full w-full object-contain"
        />
      </span>
      <p className="text-sm text-muted">Loading Bubbles...</p>
    </div>
  </div>
);

export default PageLoader;
