import { toast as sonnerToast } from "sonner";

function toast(input, options = {}) {
  if (typeof input === "string") {
    return sonnerToast(input, options);
  }

  if (input && typeof input === "object") {
    const {
      title = "",
      description,
      ...rest
    } = input;

    return sonnerToast(title || "Notification", {
      description,
      ...rest,
      ...options,
    });
  }

  return sonnerToast("Notification", options);
}

export function useToast() {
  return { toast };
}
