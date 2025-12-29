import { Waitlist } from "@clerk/nextjs";

//TODO: Make it more beautiful and aligned with theme of the site.
export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Waitlist />
    </div>
  );
}
