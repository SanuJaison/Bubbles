import { AVATAR_GRADIENTS } from "../../constants/avatars";

const Avatar = ({
  initials,
  gradient = AVATAR_GRADIENTS[0],
  size = "h-8 w-8",
  text = "text-[10px]",
  online = false,
}) => (
  <div
    className={`relative flex ${size} shrink-0 items-center justify-center rounded-full bg-linear-to-br ${gradient} ${text} font-semibold text-white shadow-sm`}
  >
    {initials}

    {online ? (
      <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-50 bg-emerald-400" />
    ) : null}
  </div>
);

export default Avatar;
