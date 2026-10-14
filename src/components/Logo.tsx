export default function Logo({
  size = "default",
  variant = "dark",
}: {
  size?: "sm" | "default" | "lg";
  variant?: "dark" | "light";
}) {
  const heights = { sm: "h-7", default: "h-9", lg: "h-12" };
  return (
    <img
      src={variant === "light" ? "/logo-white.svg" : "/logo.svg"}
      alt="GT Shopping"
      className={`${heights[size]} w-auto`}
    />
  );
}
