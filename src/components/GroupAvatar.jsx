// Group avatars fall back to initials on the brand gradient, so a group
// without a photo still looks like a group everywhere it appears.
const getInitials = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "#";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const GroupAvatar = ({
  name = "Group",
  src = "",
  className = "w-12 h-12",
  textClassName = "text-base",
}) => (
  <div
    className={`${className} rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
      src ? "bg-brand-100" : "brand-gradient"
    }`}
  >
    {src ? (
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover block"
      />
    ) : (
      <span className={`text-white font-semibold ${textClassName}`}>
        {getInitials(name)}
      </span>
    )}
  </div>
);

export default GroupAvatar;
