import { Link } from "react-router-dom";

const PublicFooter = () => (
  <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted">
    <Link to="/privacy" className="hover:text-brand-600">
      Privacy
    </Link>
    <span>·</span>
    <Link to="/terms" className="hover:text-brand-600">
      Terms
    </Link>
  </div>
);

export default PublicFooter;
