import { redirect } from "next/navigation";

export default function CommandsRedirect() {
  redirect("/admin/devices/commands");
}
